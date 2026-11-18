import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OvertimeRequestsRepository } from './overtime-requests.repository';
import { AttendanceLocksService } from '../attendance-locks/attendance-locks.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateOvertimeRequestInput,
  OvertimeDecisionInput,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class OvertimeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: OvertimeRequestsRepository,
    private readonly locksService: AttendanceLocksService,
    private readonly auditService: AuditService,
  ) {}

  async submit(
    organizationId: string,
    employeeId: string,
    input: CreateOvertimeRequestInput,
    ipAddress?: string,
  ) {
    const otDate = new Date(input.date || input.attendanceDate || Date.now());
    const isLocked = await this.locksService.isPeriodLocked(organizationId, otDate);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked for payroll cutoff. Overtime claims not permitted.');
    }

    const ot = await this.repo.create(organizationId, employeeId, input);

    await this.auditService.log({
      organizationId,
      actorUserId: employeeId,
      action: AuditAction.OVERTIME_REQUESTED,
      entityType: 'overtime_request',
      entityId: ot.id,
      newValues: { date: ot.date, overtimeMinutes: ot.overtimeMinutes, type: ot.overtimeType },
      ipAddress,
    });

    return ot;
  }

  async findById(organizationId: string, id: string) {
    const ot = await this.repo.findById(organizationId, id);
    if (!ot) {
      throw new NotFoundException('Overtime request not found');
    }
    return ot;
  }

  async findMany(organizationId: string, filter: { employeeId?: string; status?: string }) {
    return this.repo.findMany(organizationId, filter);
  }

  async decide(
    organizationId: string,
    id: string,
    decision: OvertimeDecisionInput,
    approverId: string,
    ipAddress?: string,
  ) {
    const ot = await this.findById(organizationId, id);
    if (ot.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot decide on overtime request with status ${ot.status}`);
    }

    const isLocked = await this.locksService.isPeriodLocked(organizationId, ot.date);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked for payroll cutoff.');
    }

    if (decision.status === 'APPROVED') {
      const result = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.overtimeRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt: new Date(),
          },
        });

        if (ot.attendanceRecordId) {
          await tx.attendanceRecord.update({
            where: { id: ot.attendanceRecordId },
            data: {
              approvedOvertimeMinutes: ot.overtimeMinutes,
            },
          });
        }

        return updated;
      });

      await this.auditService.log({
        organizationId,
        actorUserId: approverId,
        action: AuditAction.OVERTIME_APPROVED,
        entityType: 'overtime_request',
        entityId: id,
        newValues: { date: ot.date, minutes: ot.overtimeMinutes },
        ipAddress,
      });

      return result;
    } else {
      const updated = await this.repo.updateDecision(organizationId, id, {
        status: 'REJECTED',
        rejectedBy: approverId,
        rejectedAt: new Date(),
        rejectionReason: decision.rejectionReason ?? undefined,
      });

      await this.auditService.log({
        organizationId,
        actorUserId: approverId,
        action: AuditAction.OVERTIME_REJECTED,
        entityType: 'overtime_request',
        entityId: id,
        newValues: { date: ot.date, reason: decision.rejectionReason },
        ipAddress,
      });

      return updated;
    }
  }
}
