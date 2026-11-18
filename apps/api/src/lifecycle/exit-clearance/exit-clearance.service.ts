import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ExitClearanceRepository } from './exit-clearance.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  ClearanceStatus,
  OffboardingStatus,
} from '@zentra/shared-types';

@Injectable()
export class ExitClearanceService {
  constructor(
    private readonly repository: ExitClearanceRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    organizationId: string,
    filters: { status?: string; employeeId?: string; resignationRequestId?: string } = {},
  ) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const clearance = await this.repository.findById(id, organizationId);
    if (!clearance) {
      throw new NotFoundException(`Exit clearance task '${id}' not found`);
    }
    return clearance;
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

    const clearance = await this.repository.create(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.EXIT_CLEARANCE_CREATE,
      resource: 'exit_clearances',
      resourceId: clearance.id,
      details: {
        employeeId: data.employeeId,
        clearanceType: data.clearanceType,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return clearance;
  }

  async complete(
    id: string,
    organizationId: string,
    data: { comments?: string; attachmentUrl?: string; status?: string },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const clearance = await this.findById(id, organizationId);
    const targetStatus = data.status || ClearanceStatus.COMPLETED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.exitClearance.update({
        where: { id },
        data: {
          status: targetStatus,
          comments: data.comments || clearance.comments,
          attachmentUrl: data.attachmentUrl || clearance.attachmentUrl,
          completedBy: userId,
          completedAt: new Date(),
        },
      });

      // Check if all mandatory clearances for this resignation or employee are now completed/waived
      const pendingMandatory = await tx.exitClearance.findFirst({
        where: {
          organizationId,
          employeeId: clearance.employeeId,
          resignationRequestId: clearance.resignationRequestId,
          isMandatory: true,
          status: ClearanceStatus.PENDING,
        },
      });

      if (!pendingMandatory) {
        // All mandatory clearances completed, check for offboarding request
        const offboarding = await tx.offboardingRequest.findFirst({
          where: {
            organizationId,
            employeeId: clearance.employeeId,
            status: OffboardingStatus.PENDING_CLEARANCE,
          },
        });

        if (offboarding) {
          await tx.offboardingRequest.update({
            where: { id: offboarding.id },
            data: { status: OffboardingStatus.CLEARANCE_COMPLETED },
          });
        }
      }

      return res;
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.EXIT_CLEARANCE_COMPLETE,
      resource: 'exit_clearances',
      resourceId: id,
      details: { status: targetStatus, comments: data.comments },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async reassign(
    id: string,
    organizationId: string,
    assignedTo: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findById(id, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      assignedTo,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.EXIT_CLEARANCE_REASSIGN,
      resource: 'exit_clearances',
      resourceId: id,
      details: { assignedTo },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
