import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TransfersRepository } from './transfers.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { AuditAction, TransitionStatus, TransitionType } from '@zentra/shared-types';

@Injectable()
export class TransfersService {
  constructor(
    private readonly repository: TransfersRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const transfer = await this.repository.findById(id, organizationId);
    if (!transfer) {
      throw new NotFoundException(`Transfer request '${id}' not found`);
    }
    return transfer;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${data.employeeId}' not found`);
    }

    // Prevent overlapping pending transfers
    const existingPending = await this.prisma.employeeTransition.findFirst({
      where: {
        organizationId,
        employeeId: employee.id,
        transitionType: { in: ['TRANSFER', 'LOCATION_CHANGE', 'DEPARTMENT_CHANGE'] },
        status: TransitionStatus.PENDING_APPROVAL,
      },
    });
    if (existingPending) {
      throw new BadRequestException('A transfer request is already pending approval for this employee');
    }

    // Validate new department if specified
    if (data.newDepartmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { id: data.newDepartmentId, organizationId, status: 'ACTIVE', deletedAt: null },
      });
      if (!dept) {
        throw new BadRequestException('Target department does not exist or is inactive');
      }
    }

    // Validate new designation if specified
    if (data.newDesignationId) {
      const desig = await this.prisma.designation.findFirst({
        where: { id: data.newDesignationId, organizationId, status: 'ACTIVE', deletedAt: null },
      });
      if (!desig) {
        throw new BadRequestException('Target designation does not exist or is inactive');
      }
    }

    // Validate new location if specified
    if (data.newLocationId) {
      const loc = await this.prisma.location.findFirst({
        where: { id: data.newLocationId, organizationId, status: 'ACTIVE' },
      });
      if (!loc) {
        throw new BadRequestException('Target location does not exist or is inactive');
      }
    }

    // Validate reporting manager & circular relationship
    if (data.newReportingManagerId) {
      if (data.newReportingManagerId === employee.id) {
        throw new BadRequestException('An employee cannot be their own reporting manager');
      }

      const mgr = await this.prisma.employee.findFirst({
        where: { id: data.newReportingManagerId, organizationId, deletedAt: null, status: 'ACTIVE' },
      });
      if (!mgr) {
        throw new BadRequestException('Target reporting manager does not exist or is not active');
      }

      // Check for circular reporting
      let currentCheckId: string | null = mgr.reportingManagerId;
      const visited = new Set<string>([mgr.id]);
      while (currentCheckId) {
        if (currentCheckId === employee.id) {
          throw new BadRequestException('Circular reporting hierarchy detected: the selected manager reports to this employee');
        }
        if (visited.has(currentCheckId)) break;
        visited.add(currentCheckId);
        const parent: { reportingManagerId: string | null } | null = await this.prisma.employee.findUnique({
          where: { id: currentCheckId },
          select: { reportingManagerId: true },
        });
        currentCheckId = parent?.reportingManagerId || null;
      }
    }

    const transfer = await this.repository.create(
      organizationId,
      {
        employeeId: employee.id,
        transitionType: TransitionType.TRANSFER,
        effectiveFrom: new Date(data.effectiveFrom),
        currentDepartmentId: employee.departmentId,
        newDepartmentId: data.newDepartmentId || employee.departmentId,
        currentDesignationId: employee.designationId,
        newDesignationId: data.newDesignationId || employee.designationId,
        currentLocationId: employee.locationId,
        newLocationId: data.newLocationId || employee.locationId,
        currentGradeId: employee.gradeId,
        newGradeId: data.newGradeId || employee.gradeId,
        currentReportingManagerId: employee.reportingManagerId,
        newReportingManagerId: data.newReportingManagerId !== undefined ? data.newReportingManagerId : employee.reportingManagerId,
        currentEmploymentType: employee.employmentType,
        newEmploymentType: data.newEmploymentType || employee.employmentType,
        reason: data.reason,
        remarks: data.remarks,
        status: TransitionStatus.PENDING_APPROVAL,
      },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TRANSFER_CREATE,
      resource: 'employee_transitions',
      resourceId: transfer.id,
      details: { employeeId: employee.id, reason: data.reason },
      ipAddress: ip,
      userAgent: ua,
    });

    return transfer;
  }

  async update(
    id: string,
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findById(id, organizationId);
    return this.repository.update(id, organizationId, data);
  }

  async approve(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const transfer = await this.findById(id, organizationId);
    if (transfer.status !== TransitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve transfer in status '${transfer.status}'`);
    }

    const employee = transfer.employee;

    const previousValues = {
      departmentId: employee.departmentId,
      designationId: employee.designationId,
      locationId: employee.locationId,
      gradeId: employee.gradeId,
      reportingManagerId: employee.reportingManagerId,
      employmentType: employee.employmentType,
    };

    const newValues = {
      departmentId: transfer.newDepartmentId || employee.departmentId,
      designationId: transfer.newDesignationId || employee.designationId,
      locationId: transfer.newLocationId || employee.locationId,
      gradeId: transfer.newGradeId || employee.gradeId,
      reportingManagerId: transfer.newReportingManagerId !== undefined ? transfer.newReportingManagerId : employee.reportingManagerId,
      employmentType: transfer.newEmploymentType || employee.employmentType,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update transfer status
      const updatedTransfer = await tx.employeeTransition.update({
        where: { id },
        data: { status: TransitionStatus.APPROVED },
      });

      // 2. Update Employee record
      await tx.employee.update({
        where: { id: employee.id },
        data: newValues,
      });

      // 3. Create Employment History entry
      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId: employee.id,
          eventType: 'TRANSFERRED',
          effectiveFrom: transfer.effectiveFrom,
          departmentId: newValues.departmentId,
          designationId: newValues.designationId,
          locationId: newValues.locationId,
          gradeId: newValues.gradeId,
          reportingManagerId: newValues.reportingManagerId,
          employmentType: newValues.employmentType,
          remarks: transfer.reason,
          previousValues,
          newValues,
          changedByUserId: userId,
        },
      });

      return updatedTransfer;
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TRANSFER_APPROVE,
      resource: 'employee_transitions',
      resourceId: id,
      details: { previousValues, newValues },
      ipAddress: ip,
      userAgent: ua,
    });

    // Send notifications
    if (employee.workEmail) {
      await this.emailService.sendNotification(
        employee.workEmail,
        'Your Transfer Request Has Been Approved',
        `Hello ${employee.firstName},\n\nYour transfer request has been officially approved with effective date ${transfer.effectiveFrom.toISOString().slice(0, 10)}.`,
      );
    }

    return result;
  }

  async reject(
    id: string,
    organizationId: string,
    comments: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const transfer = await this.findById(id, organizationId);
    if (transfer.status !== TransitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot reject transfer in status '${transfer.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: TransitionStatus.REJECTED,
      remarks: comments ? `${transfer.remarks || ''}\n[Rejected]: ${comments}` : transfer.remarks,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TRANSFER_REJECT,
      resource: 'employee_transitions',
      resourceId: id,
      details: { comments },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async cancel(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const transfer = await this.findById(id, organizationId);
    if (transfer.status !== TransitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot cancel transfer in status '${transfer.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: TransitionStatus.CANCELLED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TRANSFER_CANCEL,
      resource: 'employee_transitions',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
