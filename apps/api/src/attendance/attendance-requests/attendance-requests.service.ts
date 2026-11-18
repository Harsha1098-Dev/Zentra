import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceRequestsRepository } from './attendance-requests.repository';
import { AttendanceLocksService } from '../attendance-locks/attendance-locks.service';
import { AttendanceRecordsRepository } from '../attendance-records/attendance-records.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateAttendanceRequestInput,
  AttendanceRequestDecisionInput,
  AttendanceStatus,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class AttendanceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: AttendanceRequestsRepository,
    private readonly recordsRepo: AttendanceRecordsRepository,
    private readonly locksService: AttendanceLocksService,
    private readonly auditService: AuditService,
  ) {}

  async submit(
    organizationId: string,
    employeeId: string,
    input: CreateAttendanceRequestInput,
    ipAddress?: string,
  ) {
    const fromDate = new Date(input.fromDate);
    const toDate = new Date(input.toDate);

    if (fromDate > toDate) {
      throw new BadRequestException('From date must be before or equal to to date');
    }

    const isLocked = await this.locksService.isPeriodLocked(organizationId, fromDate);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked for payroll cutoff.');
    }

    const req = await this.repo.create(organizationId, employeeId, input);

    const action = input.requestType === 'ON_DUTY'
      ? AuditAction.ATTENDANCE_REQUEST_ONDUTY_APPLIED
      : AuditAction.ATTENDANCE_REQUEST_WFH_APPLIED;

    await this.auditService.log({
      organizationId,
      actorUserId: employeeId,
      action,
      entityType: 'attendance_request',
      entityId: req.id,
      newValues: { requestType: req.requestType, fromDate: req.fromDate, toDate: req.toDate },
      ipAddress,
    });

    return req;
  }

  async findById(organizationId: string, id: string) {
    const req = await this.repo.findById(organizationId, id);
    if (!req) {
      throw new NotFoundException('Attendance request not found');
    }
    return req;
  }

  async findMany(organizationId: string, filter: { employeeId?: string; requestType?: string; status?: string }) {
    return this.repo.findMany(organizationId, filter);
  }

  async decide(
    organizationId: string,
    id: string,
    decision: AttendanceRequestDecisionInput,
    approverId: string,
    ipAddress?: string,
  ) {
    const req = await this.findById(organizationId, id);
    if (req.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot decide on attendance request with status ${req.status}`);
    }

    if (decision.status === 'APPROVED') {
      const targetStatus = req.requestType === 'ON_DUTY'
        ? AttendanceStatus.ON_DUTY
        : AttendanceStatus.WORK_FROM_HOME;

      const result = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.attendanceRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt: new Date(),
          },
        });

        // Update or create records for the requested date range
        const curr = new Date(req.fromDate);
        const end = new Date(req.toDate);

        while (curr <= end) {
          const normDate = this.recordsRepo.normalizeDate(curr);
          const isDateLocked = await this.locksService.isPeriodLocked(organizationId, normDate);

          if (!isDateLocked) {
            await tx.attendanceRecord.upsert({
              where: {
                organizationId_employeeId_attendanceDate: {
                  organizationId,
                  employeeId: req.employeeId,
                  attendanceDate: normDate,
                },
              },
              create: {
                organizationId,
                employeeId: req.employeeId,
                attendanceDate: normDate,
                status: targetStatus,
                remarks: `Approved ${req.requestType} request: ${req.reason}`,
              },
              update: {
                status: targetStatus,
                remarks: `Approved ${req.requestType} request: ${req.reason}`,
              },
            });
          }

          curr.setDate(curr.getDate() + 1);
        }

        return updated;
      });

      const action = req.requestType === 'ON_DUTY'
        ? AuditAction.ATTENDANCE_REQUEST_ONDUTY_APPROVED
        : AuditAction.ATTENDANCE_REQUEST_WFH_APPROVED;

      await this.auditService.log({
        organizationId,
        actorUserId: approverId,
        action,
        entityType: 'attendance_request',
        entityId: id,
        newValues: { type: req.requestType, fromDate: req.fromDate, toDate: req.toDate },
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

      const action = req.requestType === 'ON_DUTY'
        ? AuditAction.ATTENDANCE_REQUEST_ONDUTY_REJECTED
        : AuditAction.ATTENDANCE_REQUEST_WFH_REJECTED;

      await this.auditService.log({
        organizationId,
        actorUserId: approverId,
        action,
        entityType: 'attendance_request',
        entityId: id,
        newValues: { type: req.requestType, reason: decision.rejectionReason },
        ipAddress,
      });

      return updated;
    }
  }
}
