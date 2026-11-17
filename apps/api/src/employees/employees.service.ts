import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { MembershipsService } from '../memberships/memberships.service';
import { RolesService } from '../roles/roles.service';
import { DepartmentsService } from '../organization-setup/departments/departments.service';
import { DesignationsService } from '../organization-setup/designations/designations.service';
import { LocationsService } from '../organization-setup/locations/locations.service';
import { GradesService } from '../organization-setup/grades/grades.service';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ChangeEmployeeStatusInput,
  ChangeReportingManagerInput,
  ChangeDepartmentInput,
  ChangeDesignationInput,
  ChangeLocationInput,
  ChangeEmploymentTypeInput,
  EmployeeQueryFilterInput,
  EmployeeDto,
  EmployeeBasicDto,
  EmployeeProfileDto,
  EmploymentHistoryDto,
  EmployeeTimelineItemDto,
  ReportingStructureDto,
  AuditAction,
  RoleCode,
  EmployeeStatus,
  EmploymentEventType,
  RecordStatus,
} from '@zentra/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly rolesService: RolesService,
    private readonly departmentsService: DepartmentsService,
    private readonly designationsService: DesignationsService,
    private readonly locationsService: LocationsService,
    private readonly gradesService: GradesService,
    private readonly orgsRepository: OrganizationsRepository,
  ) {}

  async createEmployee(
    organizationId: string,
    input: CreateEmployeeInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Prevent duplicate work email within active organization
    const existingEmail = await this.employeesRepo.findByWorkEmail(
      input.workEmail,
      organizationId,
    );
    if (existingEmail) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'workEmail',
            message: 'Work email is already used by another employee in this organization',
          },
        ],
      });
    }

    // 2. Resolve employee code (unique check or auto-generation)
    let employeeCode = input.employeeCode?.trim().toUpperCase();
    if (employeeCode) {
      const existingCode = await this.employeesRepo.findByCode(
        employeeCode,
        organizationId,
      );
      if (existingCode) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: [
            {
              field: 'employeeCode',
              message: `Employee code "${employeeCode}" is already in use`,
            },
          ],
        });
      }
    } else {
      employeeCode = await this.employeesRepo.getNextEmployeeCode(organizationId);
    }

    // 3. Validate Department existence & active status
    const dept = await this.departmentsService.getDepartmentById(
      input.departmentId,
      organizationId,
    );
    if (!dept || dept.status !== RecordStatus.ACTIVE) {
      throw new BadRequestException('Selected department does not exist or is inactive');
    }

    // 4. Validate Designation existence & active status
    const designation = await this.designationsService.getDesignationById(
      input.designationId,
      organizationId,
    );
    if (!designation || designation.status !== RecordStatus.ACTIVE) {
      throw new BadRequestException('Selected designation does not exist or is inactive');
    }

    // 5. Validate Location existence & active status
    const location = await this.locationsService.getLocationById(
      input.locationId,
      organizationId,
    );
    if (!location || location.status !== RecordStatus.ACTIVE) {
      throw new BadRequestException('Selected location does not exist or is inactive');
    }

    // 6. Validate Grade (if provided)
    if (input.gradeId) {
      const grade = await this.gradesService.getGradeById(input.gradeId, organizationId);
      if (!grade || grade.status !== RecordStatus.ACTIVE) {
        throw new BadRequestException('Selected grade does not exist or is inactive');
      }
    }

    // 7. Validate Reporting Manager (if provided)
    if (input.reportingManagerId) {
      const manager = await this.employeesRepo.findById(
        input.reportingManagerId,
        organizationId,
      );
      if (!manager) {
        throw new BadRequestException('Reporting manager does not exist');
      }
      const invalidStatuses = [
        EmployeeStatus.INACTIVE,
        EmployeeStatus.EXITED,
        EmployeeStatus.RESIGNED,
        EmployeeStatus.TERMINATED,
      ];
      if (invalidStatuses.includes(manager.status as EmployeeStatus)) {
        throw new BadRequestException(
          'An inactive, resigned, or exited employee cannot be assigned as a reporting manager',
        );
      }
    }

    // 8. Handle User Account and Invitation (if requested)
    let linkedUserId: string | null = null;
    let invitationCreated = false;

    if (input.sendInvitation) {
      // Find or create global user identity
      const { user } = await this.usersService.getOrCreateForInvitation(
        input.workEmail,
        input.firstName,
        input.lastName,
      );
      linkedUserId = user.id;

      // Create or reactivate organization membership
      const membership = await this.membershipsService.createOrReactivateMembership(
        user.id,
        organizationId,
        'INVITED',
        actorUserId,
      );

      // Assign EMPLOYEE role to membership
      const roles = await this.rolesService.getAvailableRoles(organizationId);
      const employeeRole =
        roles.find((r: any) => r.code === RoleCode.EMPLOYEE) || roles[0];
      if (employeeRole) {
        await this.rolesService.assignRoleToMembership(
          membership.id,
          employeeRole.id,
          organizationId,
          actorUserId,
        );
      }

      // Generate invitation token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await this.orgsRepository.createInvitation({
        organizationId,
        email: user.email,
        roleId: employeeRole.id,
        invitedByUserId: actorUserId || user.id,
        tokenHash,
        expiresAt,
      });

      // Dispatch invitation email
      await this.emailService.sendInvitationEmail(
        user.email,
        rawToken,
        'Zentra Organization',
        employeeRole.name,
        'Your Organization Admin',
      );

      invitationCreated = true;
    }

    // 9. Create Employee & initial JOINED EmploymentHistory record in transaction
    const dateOfJoining = new Date(input.dateOfJoining);
    const dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    const probationEndDate = input.probationEndDate ? new Date(input.probationEndDate) : null;

    const initialStatus = input.status || (input.sendInvitation ? EmployeeStatus.INVITED : EmployeeStatus.ACTIVE);

    const { employee, history } = await this.employeesRepo.createEmployee(
      {
        organizationId,
        userId: linkedUserId,
        employeeCode,
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        workEmail: input.workEmail.toLowerCase().trim(),
        personalEmail: input.personalEmail?.toLowerCase().trim() || null,
        phone: input.phone.trim(),
        dateOfBirth,
        gender: input.gender || null,
        maritalStatus: input.maritalStatus || null,
        bloodGroup: input.bloodGroup || null,
        nationality: input.nationality?.trim() || null,
        currentAddress: input.currentAddress?.trim() || null,
        permanentAddress: input.permanentAddress?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        country: input.country?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        emergencyContactName: input.emergencyContactName?.trim() || null,
        emergencyContactPhone: input.emergencyContactPhone?.trim() || null,
        emergencyContactRel: input.emergencyContactRel?.trim() || null,
        profilePhotoUrl: input.profilePhotoUrl || null,
        dateOfJoining,
        probationEndDate,
        employmentType: input.employmentType,
        status: initialStatus,
        locationId: input.locationId,
        departmentId: input.departmentId,
        designationId: input.designationId,
        gradeId: input.gradeId || null,
        reportingManagerId: input.reportingManagerId || null,
        workLocationId: input.workLocationId || null,
        customFields: (input.customFields as any) || {},
      },
      {
        organizationId,
        employeeId: '', // populated inside repo transaction
        eventType: EmploymentEventType.JOINED,
        effectiveFrom: dateOfJoining,
        locationId: input.locationId,
        departmentId: input.departmentId,
        designationId: input.designationId,
        gradeId: input.gradeId || null,
        reportingManagerId: input.reportingManagerId || null,
        employmentType: input.employmentType,
        employeeStatus: initialStatus,
        remarks: 'Employee record created',
        changedByUserId: actorUserId,
      },
    );

    // 10. Audit log actions
    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_CREATE,
      entityType: 'Employee',
      entityId: employee.id,
      newValues: {
        employeeCode,
        fullName: `${employee.firstName} ${employee.lastName}`,
        workEmail: employee.workEmail,
        department: dept.name,
        designation: designation.name,
        hasUserAccount: Boolean(linkedUserId),
        sendInvitation: input.sendInvitation,
      },
      ipAddress,
      userAgent,
    });

    if (invitationCreated) {
      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.EMPLOYEE_INVITE,
        entityType: 'Employee',
        entityId: employee.id,
        newValues: {
          email: employee.workEmail,
          employeeCode,
        },
        ipAddress,
        userAgent,
      });
    }

    return this.mapToEmployeeDto(employee);
  }

  async getEmployees(
    organizationId: string,
    filter: EmployeeQueryFilterInput,
    userRoles: string[],
    currentUserId?: string,
  ) {
    const result = await this.employeesRepo.listEmployees(organizationId, filter);
    const isHrOrAdmin =
      userRoles.includes(RoleCode.SUPER_ADMIN) ||
      userRoles.includes(RoleCode.HR_ADMIN);

    const mappedData = result.data.map((emp) => {
      const basic = this.mapToBasicDto(emp);
      if (isHrOrAdmin) {
        return this.mapToEmployeeDto(emp);
      }
      return basic;
    });

    return {
      ...result,
      data: mappedData,
    };
  }

  async getEmployeeById(
    id: string,
    organizationId: string,
    userRoles: string[] = [],
    currentUserId?: string,
  ): Promise<EmployeeDto | EmployeeBasicDto> {
    const employee = await this.employeesRepo.findById(id, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const isHrOrAdmin =
      userRoles.includes(RoleCode.SUPER_ADMIN) ||
      userRoles.includes(RoleCode.HR_ADMIN);

    const isSelf = currentUserId && employee.userId === currentUserId;
    const isManagerOfEmployee =
      currentUserId &&
      employee.reportingManager &&
      (employee.reportingManager as any).userId === currentUserId;

    if (isHrOrAdmin || isSelf || isManagerOfEmployee) {
      return this.mapToEmployeeDto(employee);
    }

    // Mask sensitive details for regular colleagues
    return this.mapToBasicDto(employee);
  }

  async getEmployeeProfile(
    id: string,
    organizationId: string,
    userRoles: string[] = [],
    currentUserId?: string,
  ): Promise<EmployeeProfileDto> {
    const employee = await this.employeesRepo.findById(id, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const reportees = await this.employeesRepo.getDirectReportees(id, organizationId);

    // Build reporting hierarchy upwards (employee -> manager -> skip-level manager -> ...)
    const reportingHierarchy: {
      id: string;
      name: string;
      employeeCode: string;
      designation: string;
    }[] = [];

    let currentManagerId = employee.reportingManagerId;
    const visited = new Set<string>();

    while (currentManagerId && !visited.has(currentManagerId)) {
      visited.add(currentManagerId);
      const mgr = await this.employeesRepo.findById(currentManagerId, organizationId);
      if (!mgr) break;

      reportingHierarchy.push({
        id: mgr.id,
        name: `${mgr.firstName} ${mgr.lastName}`,
        employeeCode: mgr.employeeCode,
        designation: (mgr.designation as any)?.name || 'Designation',
      });

      currentManagerId = mgr.reportingManagerId;
    }

    const departmentHead = employee.department?.departmentHeadUser
      ? {
          id: employee.department.departmentHeadUser.id,
          name: `${employee.department.departmentHeadUser.firstName || ''} ${
            employee.department.departmentHeadUser.lastName || ''
          }`.trim() || employee.department.departmentHeadUser.email,
        }
      : null;

    const fullDto = this.mapToEmployeeDto(employee);

    return {
      employee: fullDto,
      directReporteesCount: reportees.length,
      departmentHead,
      reportingHierarchy,
    };
  }

  async updateEmployee(
    id: string,
    organizationId: string,
    input: UpdateEmployeeInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Validate grade if being changed
    if (input.gradeId) {
      const grade = await this.gradesService.getGradeById(input.gradeId, organizationId);
      if (!grade || grade.status !== RecordStatus.ACTIVE) {
        throw new BadRequestException('Selected grade is inactive or does not exist');
      }
    }

    const updateData: any = {};
    if (input.firstName !== undefined) updateData.firstName = input.firstName.trim();
    if (input.middleName !== undefined) updateData.middleName = input.middleName?.trim() || null;
    if (input.lastName !== undefined) updateData.lastName = input.lastName.trim();
    if (input.personalEmail !== undefined) updateData.personalEmail = input.personalEmail?.trim() || null;
    if (input.phone !== undefined) updateData.phone = input.phone.trim();
    if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.maritalStatus !== undefined) updateData.maritalStatus = input.maritalStatus;
    if (input.bloodGroup !== undefined) updateData.bloodGroup = input.bloodGroup;
    if (input.nationality !== undefined) updateData.nationality = input.nationality?.trim() || null;
    if (input.currentAddress !== undefined) updateData.currentAddress = input.currentAddress?.trim() || null;
    if (input.permanentAddress !== undefined) updateData.permanentAddress = input.permanentAddress?.trim() || null;
    if (input.city !== undefined) updateData.city = input.city?.trim() || null;
    if (input.state !== undefined) updateData.state = input.state?.trim() || null;
    if (input.country !== undefined) updateData.country = input.country?.trim() || null;
    if (input.postalCode !== undefined) updateData.postalCode = input.postalCode?.trim() || null;
    if (input.emergencyContactName !== undefined) updateData.emergencyContactName = input.emergencyContactName?.trim() || null;
    if (input.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = input.emergencyContactPhone?.trim() || null;
    if (input.emergencyContactRel !== undefined) updateData.emergencyContactRel = input.emergencyContactRel?.trim() || null;
    if (input.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = input.profilePhotoUrl || null;
    if (input.gradeId !== undefined) updateData.gradeId = input.gradeId || null;
    if (input.workLocationId !== undefined) updateData.workLocationId = input.workLocationId || null;
    if (input.customFields !== undefined) updateData.customFields = input.customFields || {};
    if (input.probationEndDate !== undefined) updateData.probationEndDate = input.probationEndDate ? new Date(input.probationEndDate) : null;

    const { employee } = await this.employeesRepo.updateEmployee(
      id,
      organizationId,
      updateData,
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_UPDATE,
      entityType: 'Employee',
      entityId: id,
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        phone: existing.phone,
      },
      newValues: updateData,
      ipAddress,
      userAgent,
    });

    return this.mapToEmployeeDto(employee);
  }

  async deleteEmployee(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    await this.employeesRepo.softDeleteEmployee(id, organizationId, actorUserId);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_DELETE,
      entityType: 'Employee',
      entityId: id,
      newValues: {
        employeeCode: existing.employeeCode,
        workEmail: existing.workEmail,
        status: 'INACTIVE',
      },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Employee deactivated successfully' };
  }

  async changeStatus(
    id: string,
    organizationId: string,
    input: ChangeEmployeeStatusInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const effectiveDate = new Date(input.effectiveDate);
    const isExitStatus = [
      EmployeeStatus.RESIGNED,
      EmployeeStatus.TERMINATED,
      EmployeeStatus.EXITED,
    ].includes(input.status);

    const updateData: any = {
      status: input.status,
    };

    if (isExitStatus) {
      updateData.dateOfExit = effectiveDate;
      if (input.exitReason) updateData.exitReason = input.exitReason;
    } else if (existing.status !== input.status && existing.dateOfExit) {
      updateData.dateOfExit = null;
      updateData.exitReason = null;
    }

    let eventType: EmploymentEventType = EmploymentEventType.STATUS_CHANGED;
    if (input.status === EmployeeStatus.RESIGNED) eventType = EmploymentEventType.RESIGNED;
    else if (input.status === EmployeeStatus.TERMINATED) eventType = EmploymentEventType.TERMINATED;
    else if (input.status === EmployeeStatus.EXITED) eventType = EmploymentEventType.EXITED;
    else if (input.status === EmployeeStatus.ACTIVE && existing.status === EmployeeStatus.ON_PROBATION) {
      eventType = EmploymentEventType.PROBATION_COMPLETED;
    }

    const { employee } = await this.employeesRepo.updateEmployee(
      id,
      organizationId,
      updateData,
      {
        organizationId,
        employeeId: id,
        eventType,
        effectiveFrom: effectiveDate,
        employeeStatus: input.status,
        remarks: input.remarks || `Status changed from ${existing.status} to ${input.status}`,
        previousValues: { status: existing.status },
        newValues: { status: input.status, exitReason: input.exitReason },
        changedByUserId: actorUserId,
      },
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_STATUS_CHANGE,
      entityType: 'Employee',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: input.status, remarks: input.remarks },
      ipAddress,
      userAgent,
    });

    return this.mapToEmployeeDto(employee);
  }

  async changeReportingManager(
    id: string,
    organizationId: string,
    input: ChangeReportingManagerInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (input.reportingManagerId) {
      if (input.reportingManagerId === id) {
        throw new BadRequestException('An employee cannot be assigned as their own reporting manager');
      }

      const manager = await this.employeesRepo.findById(input.reportingManagerId, organizationId);
      if (!manager) {
        throw new BadRequestException('Candidate reporting manager does not exist');
      }

      const invalidStatuses = [
        EmployeeStatus.INACTIVE,
        EmployeeStatus.EXITED,
        EmployeeStatus.RESIGNED,
        EmployeeStatus.TERMINATED,
      ];
      if (invalidStatuses.includes(manager.status as EmployeeStatus)) {
        throw new BadRequestException('Inactive, resigned, or exited employees cannot be assigned as reporting managers');
      }

      // Circular reporting prevention check:
      // Walk upward starting from candidate new manager.
      // If current employee `id` is an ancestor of `input.reportingManagerId`, a cycle would be created!
      let currentCheckId: string | null = manager.reportingManagerId;
      const visited = new Set<string>();

      while (currentCheckId) {
        if (currentCheckId === id) {
          throw new BadRequestException(
            'Circular reporting-manager relationship detected: you cannot report to an employee who is already in your downstream reporting line.',
          );
        }
        if (visited.has(currentCheckId)) break;
        visited.add(currentCheckId);

        const ancestor = await this.employeesRepo.findById(currentCheckId, organizationId);
        currentCheckId = ancestor ? ancestor.reportingManagerId : null;
      }
    }

    const effectiveDate = new Date(input.effectiveDate);

    const { employee } = await this.employeesRepo.updateEmployee(
      id,
      organizationId,
      { reportingManagerId: input.reportingManagerId || null },
      {
        organizationId,
        employeeId: id,
        eventType: EmploymentEventType.REPORTING_MANAGER_CHANGED,
        effectiveFrom: effectiveDate,
        reportingManagerId: input.reportingManagerId || null,
        remarks: input.remarks || 'Reporting manager updated',
        previousValues: { reportingManagerId: existing.reportingManagerId },
        newValues: { reportingManagerId: input.reportingManagerId },
        changedByUserId: actorUserId,
      },
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_REPORTING_MANAGER_CHANGE,
      entityType: 'Employee',
      entityId: id,
      oldValues: { reportingManagerId: existing.reportingManagerId },
      newValues: { reportingManagerId: input.reportingManagerId },
      ipAddress,
      userAgent,
    });

    return this.mapToEmployeeDto(employee);
  }

  async changeDepartment(
    id: string,
    organizationId: string,
    input: ChangeDepartmentInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const dept = await this.departmentsService.getDepartmentById(input.departmentId, organizationId);
    if (!dept || dept.status !== RecordStatus.ACTIVE) {
      throw new BadRequestException('Selected department is inactive or does not exist');
    }

    const effectiveDate = new Date(input.effectiveDate);

    const { employee } = await this.employeesRepo.updateEmployee(
      id,
      organizationId,
      { departmentId: input.departmentId },
      {
        organizationId,
        employeeId: id,
        eventType: EmploymentEventType.TRANSFERRED,
        effectiveFrom: effectiveDate,
        departmentId: input.departmentId,
        remarks: input.remarks || `Transferred to department: ${dept.name}`,
        previousValues: { departmentId: existing.departmentId },
        newValues: { departmentId: input.departmentId, departmentName: dept.name },
        changedByUserId: actorUserId,
      },
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_DEPARTMENT_CHANGE,
      entityType: 'Employee',
      entityId: id,
      oldValues: { departmentId: existing.departmentId },
      newValues: { departmentId: input.departmentId, departmentName: dept.name },
      ipAddress,
      userAgent,
    });

    return this.mapToEmployeeDto(employee);
  }

  async changeDesignation(
    id: string,
    organizationId: string,
    input: ChangeDesignationInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const des = await this.designationsService.getDesignationById(input.designationId, organizationId);
    if (!des || des.status !== RecordStatus.ACTIVE) {
      throw new BadRequestException('Selected designation is inactive or does not exist');
    }

    const effectiveDate = new Date(input.effectiveDate);

    const { employee } = await this.employeesRepo.updateEmployee(
      id,
      organizationId,
      { designationId: input.designationId },
      {
        organizationId,
        employeeId: id,
        eventType: EmploymentEventType.DESIGNATION_CHANGED,
        effectiveFrom: effectiveDate,
        designationId: input.designationId,
        remarks: input.remarks || `Designation changed to: ${des.name}`,
        previousValues: { designationId: existing.designationId },
        newValues: { designationId: input.designationId, designationName: des.name },
        changedByUserId: actorUserId,
      },
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_DESIGNATION_CHANGE,
      entityType: 'Employee',
      entityId: id,
      oldValues: { designationId: existing.designationId },
      newValues: { designationId: input.designationId, designationName: des.name },
      ipAddress,
      userAgent,
    });

    return this.mapToEmployeeDto(employee);
  }

  async changeLocation(
    id: string,
    organizationId: string,
    input: ChangeLocationInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const loc = await this.locationsService.getLocationById(input.locationId, organizationId);
    if (!loc || loc.status !== RecordStatus.ACTIVE) {
      throw new BadRequestException('Selected location is inactive or does not exist');
    }

    const effectiveDate = new Date(input.effectiveDate);

    const { employee } = await this.employeesRepo.updateEmployee(
      id,
      organizationId,
      { locationId: input.locationId },
      {
        organizationId,
        employeeId: id,
        eventType: EmploymentEventType.LOCATION_CHANGED,
        effectiveFrom: effectiveDate,
        locationId: input.locationId,
        remarks: input.remarks || `Location transferred to: ${loc.name}`,
        previousValues: { locationId: existing.locationId },
        newValues: { locationId: input.locationId, locationName: loc.name },
        changedByUserId: actorUserId,
      },
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_LOCATION_CHANGE,
      entityType: 'Employee',
      entityId: id,
      oldValues: { locationId: existing.locationId },
      newValues: { locationId: input.locationId, locationName: loc.name },
      ipAddress,
      userAgent,
    });

    return this.mapToEmployeeDto(employee);
  }

  async changeEmploymentType(
    id: string,
    organizationId: string,
    input: ChangeEmploymentTypeInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.employeesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const effectiveDate = new Date(input.effectiveDate);

    const { employee } = await this.employeesRepo.updateEmployee(
      id,
      organizationId,
      { employmentType: input.employmentType },
      {
        organizationId,
        employeeId: id,
        eventType: EmploymentEventType.EMPLOYMENT_TYPE_CHANGED,
        effectiveFrom: effectiveDate,
        employmentType: input.employmentType,
        remarks: input.remarks || `Employment type changed to: ${input.employmentType}`,
        previousValues: { employmentType: existing.employmentType },
        newValues: { employmentType: input.employmentType },
        changedByUserId: actorUserId,
      },
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_EMPLOYMENT_TYPE_CHANGE,
      entityType: 'Employee',
      entityId: id,
      oldValues: { employmentType: existing.employmentType },
      newValues: { employmentType: input.employmentType },
      ipAddress,
      userAgent,
    });

    return this.mapToEmployeeDto(employee);
  }

  async getTimeline(id: string, organizationId: string): Promise<EmployeeTimelineItemDto[]> {
    const history = await this.employeesRepo.getEmploymentHistory(id, organizationId);

    return history.map((item) => ({
      id: item.id,
      date: item.effectiveFrom.toISOString().split('T')[0],
      title: this.formatEventTypeTitle(item.eventType as EmploymentEventType),
      eventType: item.eventType as EmploymentEventType,
      description: item.remarks || 'Employment record updated',
      changedByName: item.changedByUserId ? 'HR Administrator' : 'System',
      metadata: {
        department: (item.department as any)?.name,
        designation: (item.designation as any)?.name,
        location: (item.location as any)?.name,
        status: item.employeeStatus,
        previousValues: item.previousValues,
        newValues: item.newValues,
      },
    }));
  }

  async getEmploymentHistory(id: string, organizationId: string): Promise<EmploymentHistoryDto[]> {
    const records = await this.employeesRepo.getEmploymentHistory(id, organizationId);

    return records.map((h) => ({
      id: h.id,
      organizationId: h.organizationId,
      employeeId: h.employeeId,
      eventType: h.eventType as EmploymentEventType,
      effectiveFrom: h.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: h.effectiveTo ? h.effectiveTo.toISOString().split('T')[0] : null,
      locationId: h.locationId,
      locationName: (h.location as any)?.name || null,
      departmentId: h.departmentId,
      departmentName: (h.department as any)?.name || null,
      designationId: h.designationId,
      designationName: (h.designation as any)?.name || null,
      gradeId: h.gradeId,
      gradeName: (h.grade as any)?.name || null,
      reportingManagerId: h.reportingManagerId,
      reportingManagerName: null,
      employmentType: (h.employmentType as any) || null,
      employeeStatus: (h.employeeStatus as any) || null,
      remarks: h.remarks,
      previousValues: (h.previousValues as any) || null,
      newValues: (h.newValues as any) || null,
      changedByUserId: h.changedByUserId,
      changedByName: h.changedByUserId ? 'HR Admin' : 'System',
      createdAt: h.createdAt.toISOString(),
    }));
  }

  async getReportees(id: string, organizationId: string): Promise<EmployeeBasicDto[]> {
    const reportees = await this.employeesRepo.getDirectReportees(id, organizationId);
    return reportees.map((r) => this.mapToBasicDto(r));
  }

  async getReportingStructure(id: string, organizationId: string): Promise<ReportingStructureDto> {
    const employee = await this.employeesRepo.findById(id, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const reportees = await this.employeesRepo.getDirectReportees(id, organizationId);

    let manager: EmployeeBasicDto | null = null;
    let skipLevelManager: EmployeeBasicDto | null = null;

    if (employee.reportingManagerId) {
      const mgr = await this.employeesRepo.findById(employee.reportingManagerId, organizationId);
      if (mgr) {
        manager = this.mapToBasicDto(mgr);
        if (mgr.reportingManagerId) {
          const skipMgr = await this.employeesRepo.findById(mgr.reportingManagerId, organizationId);
          if (skipMgr) {
            skipLevelManager = this.mapToBasicDto(skipMgr);
          }
        }
      }
    }

    const departmentHead = employee.department?.departmentHeadUser
      ? ({
          id: employee.department.departmentHeadUser.id,
          fullName: `${employee.department.departmentHeadUser.firstName || ''} ${
            employee.department.departmentHeadUser.lastName || ''
          }`.trim(),
          workEmail: employee.department.departmentHeadUser.email,
        } as any)
      : null;

    return {
      employee: this.mapToBasicDto(employee),
      manager,
      skipLevelManager,
      departmentHead,
      reportees: reportees.map((r) => this.mapToBasicDto(r)),
    };
  }

  async getNextEmployeeCode(organizationId: string) {
    const code = await this.employeesRepo.getNextEmployeeCode(organizationId);
    return { code };
  }

  async getEmployeeByUserId(userId: string, organizationId: string) {
    const emp = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!emp) return null;
    return this.mapToEmployeeDto(emp);
  }

  // Helper Mappers
  private mapToBasicDto(emp: any): EmployeeBasicDto {
    return {
      id: emp.id,
      organizationId: emp.organizationId,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      middleName: emp.middleName,
      lastName: emp.lastName,
      fullName: `${emp.firstName} ${emp.lastName}`.trim(),
      workEmail: emp.workEmail,
      phone: emp.phone,
      profilePhotoUrl: emp.profilePhotoUrl,
      departmentId: emp.departmentId,
      departmentName: emp.department?.name || 'Department',
      designationId: emp.designationId,
      designationName: emp.designation?.name || 'Designation',
      locationId: emp.locationId,
      locationName: emp.location?.name || 'Office',
      status: emp.status as EmployeeStatus,
      employmentType: emp.employmentType as any,
      dateOfJoining: emp.dateOfJoining.toISOString().split('T')[0],
      reportingManagerId: emp.reportingManagerId,
      reportingManagerName: emp.reportingManager
        ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`.trim()
        : null,
    };
  }

  private mapToEmployeeDto(emp: any): EmployeeDto {
    const basic = this.mapToBasicDto(emp);
    return {
      ...basic,
      userId: emp.userId,
      personalEmail: emp.personalEmail,
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.toISOString().split('T')[0] : null,
      gender: emp.gender,
      maritalStatus: emp.maritalStatus,
      bloodGroup: emp.bloodGroup,
      nationality: emp.nationality,
      currentAddress: emp.currentAddress,
      permanentAddress: emp.permanentAddress,
      city: emp.city,
      state: emp.state,
      country: emp.country,
      postalCode: emp.postalCode,
      emergencyContactName: emp.emergencyContactName,
      emergencyContactPhone: emp.emergencyContactPhone,
      emergencyContactRel: emp.emergencyContactRel,
      probationEndDate: emp.probationEndDate ? emp.probationEndDate.toISOString().split('T')[0] : null,
      gradeId: emp.gradeId,
      gradeName: emp.grade?.name || null,
      gradeLevel: emp.grade?.level || null,
      workLocationId: emp.workLocationId,
      dateOfExit: emp.dateOfExit ? emp.dateOfExit.toISOString().split('T')[0] : null,
      exitReason: emp.exitReason,
      customFields: emp.customFields || {},
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
    };
  }

  private formatEventTypeTitle(eventType: EmploymentEventType): string {
    switch (eventType) {
      case EmploymentEventType.JOINED:
        return 'Joined Organization';
      case EmploymentEventType.TRANSFERRED:
        return 'Transferred Department';
      case EmploymentEventType.PROMOTED:
        return 'Promoted';
      case EmploymentEventType.DESIGNATION_CHANGED:
        return 'Designation Updated';
      case EmploymentEventType.REPORTING_MANAGER_CHANGED:
        return 'Reporting Manager Reassigned';
      case EmploymentEventType.LOCATION_CHANGED:
        return 'Work Location Transferred';
      case EmploymentEventType.EMPLOYMENT_TYPE_CHANGED:
        return 'Employment Type Changed';
      case EmploymentEventType.STATUS_CHANGED:
        return 'Status Changed';
      case EmploymentEventType.PROBATION_COMPLETED:
        return 'Probation Successfully Completed';
      case EmploymentEventType.PROBATION_EXTENDED:
        return 'Probation Extended';
      case EmploymentEventType.RESIGNED:
        return 'Resignation Submitted';
      case EmploymentEventType.TERMINATED:
        return 'Employment Terminated';
      case EmploymentEventType.REINSTATED:
        return 'Reinstated';
      case EmploymentEventType.EXITED:
        return 'Official Exit Finalized';
      default:
        return 'Employment Event';
    }
  }
}
