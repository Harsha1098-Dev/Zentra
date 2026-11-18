import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceRegularisationsRepository } from './attendance-regularisations.repository';
import { AttendanceRecordsRepository } from '../attendance-records/attendance-records.repository';
import { AttendanceCalculatorService } from '../attendance-records/attendance-calculator.service';
import { AttendanceLocksService } from '../attendance-locks/attendance-locks.service';
import { AttendancePoliciesRepository } from '../attendance-policies/attendance-policies.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateAttendanceRegularisationInput,
  RegularisationDecisionInput,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class AttendanceRegularisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: AttendanceRegularisationsRepository,
    private readonly recordsRepo: AttendanceRecordsRepository,
    private readonly calculator: AttendanceCalculatorService,
    private readonly locksService: AttendanceLocksService,
    private readonly policiesRepo: AttendancePoliciesRepository,
    private readonly auditService: AuditService,
  ) {}

  async submit(
    organizationId: string,
    employeeId: string,
    input: CreateAttendanceRegularisationInput,
    ipAddress?: string,
  ) {
    let record: any = null;
    if (input.attendanceRecordId) {
      record = await this.recordsRepo.findById(organizationId, input.attendanceRecordId);
    } else if (input.attendanceDate) {
      record = await this.recordsRepo.findByEmployeeAndDate(organizationId, employeeId, new Date(input.attendanceDate));
    }

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    if (record.employeeId !== employeeId) {
      throw new ForbiddenException('Cannot regularise attendance record of another employee');
    }

    // 1. Period Lock Check
    const isLocked = await this.locksService.isPeriodLocked(organizationId, record.attendanceDate);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked. Modifications are not allowed.');
    }

    // 2. Policy limit checks
    const policy = record.policy || (await this.policiesRepo.findDefault(organizationId));
    if (policy) {
      // Deadline check
      const deadlineDays = policy.regularisationDeadlineDays ?? 7;
      const daysDiff = (Date.now() - new Date(record.attendanceDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > deadlineDays) {
        throw new BadRequestException(`Regularisation deadline exceeded (${deadlineDays} days from attendance date)`);
      }

      // Monthly limit check
      const now = new Date();
      const monthlyCount = await this.repo.countMonthlyByEmployee(organizationId, employeeId, now.getFullYear(), now.getMonth());
      const maxMonthly = policy.maxRegularisationsPerMonth ?? 3;
      if (monthlyCount >= maxMonthly) {
        throw new BadRequestException(`Monthly regularisation limit reached (max ${maxMonthly} requests per month)`);
      }
    }

    // 3. Prevent duplicate pending requests for the same record
    const existingPending = record.regularisations?.find((r: any) => r.status === 'PENDING_APPROVAL');
    if (existingPending) {
      throw new BadRequestException('A pending regularisation request already exists for this attendance record');
    }

    const regularisation = await this.repo.create(organizationId, employeeId, {
      ...input,
      attendanceRecordId: record.id,
    });

    await this.auditService.log({
      organizationId,
      actorUserId: employeeId,
      action: AuditAction.ATTENDANCE_REGULARISATION_REQUESTED,
      entityType: 'attendance_regularisation',
      entityId: regularisation.id,
      newValues: { attendanceRecordId: record.id, reason: input.reason },
      ipAddress,
    });

    return regularisation;
  }

  async findById(organizationId: string, id: string) {
    const reg = await this.repo.findById(organizationId, id);
    if (!reg) {
      throw new NotFoundException('Regularisation request not found');
    }
    return reg;
  }

  async findMany(organizationId: string, filter: { employeeId?: string; status?: string }) {
    return this.repo.findMany(organizationId, filter);
  }

  async decide(
    organizationId: string,
    id: string,
    decision: RegularisationDecisionInput,
    approverId: string,
    ipAddress?: string,
  ) {
    const reg = await this.findById(organizationId, id);
    if (reg.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot decide on regularisation with status ${reg.status}`);
    }

    const record = reg.attendanceRecord;
    const isLocked = await this.locksService.isPeriodLocked(organizationId, record.attendanceDate);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked. Modifications are not allowed.');
    }

    if (decision.status === 'APPROVED') {
      // Recalculate metrics with requested timings
      const newCheckIn = reg.requestedCheckIn || record.checkInTime;
      const newCheckOut = reg.requestedCheckOut || record.checkOutTime;

      const calc = this.calculator.calculate({
        attendanceDate: record.attendanceDate,
        checkInTime: newCheckIn,
        checkOutTime: newCheckOut,
        shift: record.shift,
        policy: record.policy,
      });

      // Atomic transaction: update regularisation and attendance record
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedReg = await tx.attendanceRegularisation.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt: new Date(),
          },
        });

        const updatedRecord = await tx.attendanceRecord.update({
          where: { id: record.id },
          data: {
            checkInTime: newCheckIn,
            checkOutTime: newCheckOut,
            status: calc.status,
            workedMinutes: calc.workedMinutes,
            breakMinutes: calc.breakMinutes,
            payableMinutes: calc.payableMinutes,
            overtimeMinutes: calc.overtimeMinutes,
            lateMinutes: calc.lateMinutes,
            earlyMinutes: calc.earlyMinutes,
            deviationMinutes: calc.deviationMinutes,
            isLate: calc.isLate,
            isEarlyExit: calc.isEarlyExit,
            isRegularised: true,
          },
        });

        return { regularisation: updatedReg, record: updatedRecord };
      });

      await this.auditService.log({
        organizationId,
        actorUserId: approverId,
        action: AuditAction.ATTENDANCE_REGULARISATION_APPROVED,
        entityType: 'attendance_regularisation',
        entityId: id,
        newValues: { recordId: record.id, newStatus: calc.status },
        ipAddress,
      });

      return result;
    } else {
      // REJECTED
      const updatedReg = await this.repo.updateDecision(organizationId, id, {
        status: 'REJECTED',
        rejectedBy: approverId,
        rejectedAt: new Date(),
        rejectionReason: decision.rejectionReason ?? undefined,
      });

      await this.auditService.log({
        organizationId,
        actorUserId: approverId,
        action: AuditAction.ATTENDANCE_REGULARISATION_REJECTED,
        entityType: 'attendance_regularisation',
        entityId: id,
        newValues: { recordId: record.id, reason: decision.rejectionReason },
        ipAddress,
      });

      return { regularisation: updatedReg, record };
    }
  }
}
