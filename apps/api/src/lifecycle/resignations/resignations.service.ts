import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ResignationsRepository } from './resignations.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  ResignationStatus,
  ClearanceType,
  ClearanceStatus,
  OffboardingStatus,
} from '@zentra/shared-types';

@Injectable()
export class ResignationsService {
  constructor(
    private readonly repository: ResignationsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const resignation = await this.repository.findById(id, organizationId);
    if (!resignation) {
      throw new NotFoundException(`Resignation request '${id}' not found`);
    }
    return resignation;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    let employeeId = data.employeeId;

    if (!employeeId) {
      // Find employee by userId
      const employee = await this.prisma.employee.findFirst({
        where: { userId, organizationId, deletedAt: null },
      });
      if (!employee) {
        throw new NotFoundException('Employee profile not found for the current user');
      }
      employeeId = employee.id;
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${employeeId}' not found`);
    }

    // Check if there is already an active resignation
    const existing = await this.prisma.resignationRequest.findFirst({
      where: {
        organizationId,
        employeeId,
        status: { in: [ResignationStatus.PENDING_APPROVAL, ResignationStatus.APPROVED] },
      },
    });

    if (existing) {
      throw new BadRequestException('Employee already has an active resignation request');
    }

    const resignationDate = data.resignationDate ? new Date(data.resignationDate) : new Date();
    const lastWorkingDate = new Date(data.lastWorkingDate);

    // Calculate days if not provided or validate
    let noticeDays = data.noticePeriodDays;
    if (noticeDays === undefined || noticeDays === null) {
      const diffTime = Math.abs(lastWorkingDate.getTime() - resignationDate.getTime());
      noticeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const resignation = await this.repository.create(
      organizationId,
      {
        employeeId,
        resignationDate,
        lastWorkingDate,
        noticePeriodDays: noticeDays,
        reason: data.reason,
        comments: data.comments || null,
        status: ResignationStatus.PENDING_APPROVAL,
      },
      userId,
    );

    await this.prisma.employmentHistory.create({
      data: {
        organizationId,
        employeeId,
        eventType: 'RESIGNATION_SUBMITTED',
        effectiveFrom: lastWorkingDate,
        remarks: `Resignation submitted. Proposed last working date: ${lastWorkingDate.toLocaleDateString()}. Notice period: ${noticeDays} days. Reason: ${data.reason}`,
        newValues: {
          resignationRequestId: resignation.id,
          lastWorkingDate: lastWorkingDate.toISOString(),
          noticePeriodDays: noticeDays,
        },
        changedByUserId: userId,
      },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.RESIGNATION_CREATE,
      resource: 'resignation_requests',
      resourceId: resignation.id,
      details: { employeeId, lastWorkingDate, noticePeriodDays: noticeDays },
      ipAddress: ip,
      userAgent: ua,
    });

    return resignation;
  }

  async approve(
    id: string,
    organizationId: string,
    reviewData: { lastWorkingDate?: string; comments?: string } = {},
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const resignation = await this.findById(id, organizationId);
    if (resignation.status !== ResignationStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve resignation in status '${resignation.status}'`);
    }

    const finalLastWorkingDate = reviewData.lastWorkingDate
      ? new Date(reviewData.lastWorkingDate)
      : resignation.lastWorkingDate;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update resignation status
      const updated = await tx.resignationRequest.update({
        where: { id },
        data: {
          status: ResignationStatus.APPROVED,
          lastWorkingDate: finalLastWorkingDate,
          comments: reviewData.comments
            ? `${resignation.comments || ''}\n[HR Approval Note]: ${reviewData.comments}`.trim()
            : resignation.comments,
        },
      });

      // 2. Default exit clearances
      const defaultClearanceTypes = [
        { type: ClearanceType.IT_ACCESS_REVOCATION, mandatory: true },
        { type: ClearanceType.ASSET_RETURN, mandatory: true },
        { type: ClearanceType.FINANCE_CLEARANCE, mandatory: true },
        { type: ClearanceType.KNOWLEDGE_TRANSFER, mandatory: true },
        { type: ClearanceType.HR_CLEARANCE, mandatory: true },
      ];

      for (const item of defaultClearanceTypes) {
        await tx.exitClearance.create({
          data: {
            organizationId,
            employeeId: resignation.employeeId,
            resignationRequestId: id,
            clearanceType: item.type,
            status: ClearanceStatus.PENDING,
            dueDate: finalLastWorkingDate,
            isMandatory: item.mandatory,
          },
        });
      }

      // 3. Create OffboardingRequest
      await tx.offboardingRequest.create({
        data: {
          organizationId,
          employeeId: resignation.employeeId,
          resignationRequestId: id,
          exitType: 'RESIGNATION',
          lastWorkingDate: finalLastWorkingDate,
          status: OffboardingStatus.PENDING_CLEARANCE,
          createdBy: userId,
        },
      });

      // 4. Record history event
      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId: resignation.employeeId,
          eventType: 'RESIGNATION_APPROVED',
          effectiveFrom: finalLastWorkingDate,
          remarks: `Resignation approved. Confirmed last working date: ${finalLastWorkingDate.toLocaleDateString()}. Clearance checklist initiated.`,
          newValues: {
            resignationRequestId: id,
            lastWorkingDate: finalLastWorkingDate.toISOString(),
            approvedBy: userId,
          },
          changedByUserId: userId,
        },
      });

      return updated;
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.RESIGNATION_APPROVE,
      resource: 'resignation_requests',
      resourceId: id,
      details: { finalLastWorkingDate },
      ipAddress: ip,
      userAgent: ua,
    });

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
    const resignation = await this.findById(id, organizationId);
    if (resignation.status !== ResignationStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot reject resignation in status '${resignation.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: ResignationStatus.REJECTED,
      comments: comments ? `${resignation.comments || ''}\n[Rejected]: ${comments}`.trim() : resignation.comments,
    });

    await this.prisma.employmentHistory.create({
      data: {
        organizationId,
        employeeId: resignation.employeeId,
        eventType: 'RESIGNATION_REJECTED',
        effectiveFrom: new Date(),
        remarks: `Resignation request was rejected. Comments: ${comments || 'None'}`,
        newValues: { resignationRequestId: id },
        changedByUserId: userId,
      },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.RESIGNATION_REJECT,
      resource: 'resignation_requests',
      resourceId: id,
      details: { comments },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async withdraw(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const resignation = await this.findById(id, organizationId);
    if (resignation.status !== ResignationStatus.PENDING_APPROVAL && resignation.status !== ResignationStatus.APPROVED) {
      throw new BadRequestException(`Cannot withdraw resignation in status '${resignation.status}'`);
    }

    // Check if offboarding has already been completed
    if (resignation.offboardingRequest && resignation.offboardingRequest.status === OffboardingStatus.COMPLETED) {
      throw new BadRequestException('Cannot withdraw resignation after offboarding has been completed');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Set resignation to WITHDRAWN
      const updated = await tx.resignationRequest.update({
        where: { id },
        data: { status: ResignationStatus.WITHDRAWN },
      });

      // 2. Cancel any pending exit clearances
      await tx.exitClearance.updateMany({
        where: {
          resignationRequestId: id,
          status: ClearanceStatus.PENDING,
        },
        data: { status: ClearanceStatus.WAIVED, comments: 'Cancelled due to resignation withdrawal' },
      });

      // 3. Cancel offboarding request if exists
      if (resignation.offboardingRequest) {
        await tx.offboardingRequest.update({
          where: { id: resignation.offboardingRequest.id },
          data: { status: OffboardingStatus.CANCELLED },
        });
      }

      // 4. Record history event
      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId: resignation.employeeId,
          eventType: 'RESIGNATION_WITHDRAWN',
          effectiveFrom: new Date(),
          remarks: 'Resignation request was withdrawn.',
          newValues: { resignationRequestId: id },
          changedByUserId: userId,
        },
      });

      return updated;
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.RESIGNATION_WITHDRAW,
      resource: 'resignation_requests',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return result;
  }

  async cancel(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const resignation = await this.findById(id, organizationId);
    if (resignation.status !== ResignationStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot cancel resignation in status '${resignation.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: ResignationStatus.CANCELLED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.RESIGNATION_CANCEL,
      resource: 'resignation_requests',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
