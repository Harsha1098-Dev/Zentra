import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EmployeeSalaryRepository } from './employee-salary.repository';
import { SalaryStructuresRepository } from '../salary-structures/salary-structures.repository';
import { EmployeesRepository } from '../../employees/employees.repository';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class EmployeeSalaryService {
  constructor(
    private readonly repo: EmployeeSalaryRepository,
    private readonly structuresRepo: SalaryStructuresRepository,
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async getActiveStructure(employeeId: string, organizationId: string) {
    const assignment = await this.repo.findActiveAssignment(employeeId, organizationId);
    if (!assignment) {
      throw new NotFoundException('No active salary structure found for this employee');
    }
    return assignment;
  }

  async getRevisions(employeeId: string, organizationId: string) {
    return this.repo.findAssignmentsByEmployee(employeeId, organizationId);
  }

  async getAllAssignments(organizationId: string, filter?: { search?: string }) {
    return this.repo.findAllAssignments(organizationId, filter);
  }

  async assignStructure(
    organizationId: string,
    input: any,
    userId: string,
    ipAddress?: string,
  ) {
    const employee = await this.employeesRepo.findById(input.employeeId, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee '${input.employeeId}' not found`);
    }

    const structure = await this.structuresRepo.findById(input.salaryStructureId, organizationId);
    if (!structure) {
      throw new NotFoundException(`Salary structure '${input.salaryStructureId}' not found`);
    }

    const effectiveFrom = new Date(input.effectiveFrom);
    const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

    if (effectiveTo && effectiveTo <= effectiveFrom) {
      throw new BadRequestException('Effective to date must be after effective from date');
    }

    const created = await this.repo.createAssignment(organizationId, {
      employeeId: input.employeeId,
      salaryStructureId: input.salaryStructureId,
      annualCtc: input.annualCtc || structure.annualCtc,
      effectiveFrom,
      effectiveTo,
      status: 'ACTIVE',
      componentOverrides: input.componentOverrides || {},
      revisionReason: input.revisionReason || 'Initial salary assignment',
      approvedBy: userId,
      approvedAt: new Date(),
      createdBy: userId,
    });

    // Supersede older active assignments starting before this date
    await this.repo.supersedePriorAssignments(
      input.employeeId,
      organizationId,
      effectiveFrom,
      created.id,
    );

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_STRUCTURE_ASSIGN,
      entityType: 'EmployeeSalaryAssignment',
      entityId: created.id,
      newValues: {
        employeeId: input.employeeId,
        structureId: input.salaryStructureId,
        annualCtc: created.annualCtc,
      },
      ipAddress,
    });

    if (employee.workEmail) {
      await this.emailService.sendNotification(
        employee.workEmail,
        'Salary Structure Assigned',
        `Hello ${employee.firstName},\n\nA salary structure (${structure.name}) has been assigned to your profile with annual CTC of ${created.annualCtc.toLocaleString('en-IN')}.\n\nYou can review your compensation structure in the employee portal.`,
      );
    }

    return created;
  }

  async createRevision(
    employeeId: string,
    organizationId: string,
    input: any,
    userId: string,
    ipAddress?: string,
  ) {
    const employee = await this.employeesRepo.findById(employeeId, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee '${employeeId}' not found`);
    }

    const structure = await this.structuresRepo.findById(input.salaryStructureId, organizationId);
    if (!structure) {
      throw new NotFoundException(`Salary structure '${input.salaryStructureId}' not found`);
    }

    const effectiveFrom = new Date(input.effectiveFrom);
    const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

    if (effectiveTo && effectiveTo <= effectiveFrom) {
      throw new BadRequestException('Effective to date must be after effective from date');
    }

    const created = await this.repo.createAssignment(organizationId, {
      employeeId,
      salaryStructureId: input.salaryStructureId,
      annualCtc: input.annualCtc,
      effectiveFrom,
      effectiveTo,
      status: 'PENDING_APPROVAL',
      componentOverrides: input.componentOverrides || {},
      revisionReason: input.revisionReason,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_REVISION_CREATE,
      entityType: 'EmployeeSalaryAssignment',
      entityId: created.id,
      newValues: created,
      ipAddress,
    });

    return created;
  }

  async approveRevision(
    revisionId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const assignment = await this.repo.findAssignmentById(revisionId, organizationId);
    if (!assignment) {
      throw new NotFoundException(`Salary revision '${revisionId}' not found`);
    }

    if (assignment.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot approve revision with status '${assignment.status}'`);
    }

    const approved = await this.repo.updateAssignmentStatus(revisionId, organizationId, 'ACTIVE', {
      approvedBy: userId,
      approvedAt: new Date(),
    });

    await this.repo.supersedePriorAssignments(
      assignment.employeeId,
      organizationId,
      new Date(assignment.effectiveFrom),
      revisionId,
    );

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_REVISION_APPROVE,
      entityType: 'EmployeeSalaryAssignment',
      entityId: revisionId,
      newValues: { status: 'ACTIVE', approvedBy: userId },
      ipAddress,
    });

    if (assignment.employee?.workEmail) {
      await this.emailService.sendNotification(
        assignment.employee.workEmail,
        'Salary Revision Approved',
        `Hello ${assignment.employee.firstName},\n\nYour salary revision with annual CTC of ${assignment.annualCtc.toLocaleString('en-IN')} effective from ${new Date(assignment.effectiveFrom).toLocaleDateString()} has been approved.`,
      );
    }

    return approved;
  }

  async rejectRevision(
    revisionId: string,
    organizationId: string,
    reason: string,
    userId: string,
    ipAddress?: string,
  ) {
    const assignment = await this.repo.findAssignmentById(revisionId, organizationId);
    if (!assignment) {
      throw new NotFoundException(`Salary revision '${revisionId}' not found`);
    }

    if (assignment.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot reject revision with status '${assignment.status}'`);
    }

    const rejected = await this.repo.updateAssignmentStatus(
      revisionId,
      organizationId,
      'REJECTED',
      {
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason || 'Salary revision rejected by administrator',
      },
    );

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_REVISION_REJECT,
      entityType: 'EmployeeSalaryAssignment',
      entityId: revisionId,
      newValues: { status: 'REJECTED', rejectedBy: userId, rejectionReason: reason },
      ipAddress,
    });

    if (assignment.employee?.workEmail) {
      await this.emailService.sendNotification(
        assignment.employee.workEmail,
        'Salary Revision Update',
        `Hello ${assignment.employee.firstName},\n\nYour submitted salary revision proposal was not approved. Reason: ${reason || 'Administrative decision'}.`,
      );
    }

    return rejected;
  }

  async getMySalaryStructure(userId: string, organizationId: string) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }
    return this.getActiveStructure(employee.id, organizationId);
  }

  async getMySalaryRevisions(userId: string, organizationId: string) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }
    return this.getRevisions(employee.id, organizationId);
  }
}
