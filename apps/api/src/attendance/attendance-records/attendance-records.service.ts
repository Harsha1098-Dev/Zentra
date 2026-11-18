import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceRecordsRepository } from './attendance-records.repository';
import { AttendanceCalculatorService } from './attendance-calculator.service';
import { ShiftAssignmentsService } from '../shift-assignments/shift-assignments.service';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { AttendancePoliciesRepository } from '../attendance-policies/attendance-policies.repository';
import { AttendanceLocksService } from '../attendance-locks/attendance-locks.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CheckInInput,
  CheckOutInput,
  ManualAttendanceInput,
  AttendanceRecordQueryFilterInput,
  AttendanceStatus,
  CheckInSource,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class AttendanceRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: AttendanceRecordsRepository,
    private readonly calculator: AttendanceCalculatorService,
    private readonly shiftAssignmentsService: ShiftAssignmentsService,
    private readonly shiftsRepo: ShiftsRepository,
    private readonly policiesRepo: AttendancePoliciesRepository,
    private readonly locksService: AttendanceLocksService,
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
  ) {}

  async checkIn(
    organizationId: string,
    employeeId: string,
    input: CheckInInput,
    ipAddress?: string,
  ) {
    const checkInTime = input.checkInTime ? new Date(input.checkInTime) : new Date();
    const attendanceDate = this.repo.normalizeDate(checkInTime);

    // 1. Period Lock Check
    const isLocked = await this.locksService.isPeriodLocked(organizationId, attendanceDate);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked for payroll cutoff. Modifications are not allowed.');
    }

    // 2. Existing record check
    const existing = await this.repo.findByEmployeeAndDate(organizationId, employeeId, attendanceDate);
    if (existing && existing.checkInTime) {
      throw new BadRequestException('You have already checked in for this date');
    }

    // 3. Resolve active shift and policy
    const shiftAssignment = await this.shiftAssignmentsService.findActiveAssignment(
      organizationId,
      employeeId,
      attendanceDate,
    );
    const activeShift = shiftAssignment?.shift || (await this.shiftsRepo.findDefault(organizationId));
    const activePolicy = activeShift?.policy || (await this.policiesRepo.findDefault(organizationId));

    // 4. Resolve Context (Leave, Holiday, Weekend, WFH, OnDuty)
    const context = await this.resolveContext(organizationId, employeeId, attendanceDate);

    // 5. Calculate Metrics
    const calc = this.calculator.calculate({
      attendanceDate,
      checkInTime,
      shift: activeShift,
      policy: activePolicy,
      context,
    });

    // 6. Persist Check-In
    const record = await this.repo.upsert(organizationId, employeeId, attendanceDate, {
      shiftId: activeShift?.id ?? null,
      policyId: activePolicy?.id ?? null,
      status: calc.status,
      checkInTime,
      checkInSource: input.source ?? CheckInSource.WEB,
      checkInIp: ipAddress ?? input.ipAddress,
      checkInLocation: input.location ? JSON.stringify(input.location) : null,
      isLate: calc.isLate,
      lateMinutes: calc.lateMinutes,
      deviationMinutes: calc.deviationMinutes,
      isLocked,
      remarks: input.remarks || input.notes || null,
    });

    // 7. Audit Log
    await this.auditService.log({
      organizationId,
      actorUserId: employeeId,
      action: AuditAction.ATTENDANCE_CHECK_IN,
      entityType: 'attendance_record',
      entityId: record.id,
      newValues: { checkInTime, source: input.source, isLate: calc.isLate, lateMinutes: calc.lateMinutes },
      ipAddress,
    });

    return record;
  }

  async checkOut(
    organizationId: string,
    employeeId: string,
    input: CheckOutInput,
    ipAddress?: string,
  ) {
    const checkOutTime = input.checkOutTime ? new Date(input.checkOutTime) : new Date();
    const attendanceDate = this.repo.normalizeDate(checkOutTime);

    // 1. Period Lock Check
    const isLocked = await this.locksService.isPeriodLocked(organizationId, attendanceDate);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked for payroll cutoff. Modifications are not allowed.');
    }

    // 2. Find Check-In record
    const existing = await this.repo.findByEmployeeAndDate(organizationId, employeeId, attendanceDate);
    if (!existing || !existing.checkInTime) {
      throw new BadRequestException('No check-in record found for today. Please check in first.');
    }
    if (existing.checkOutTime) {
      throw new BadRequestException('You have already checked out for today');
    }

    // 3. Resolve active shift and policy
    const activeShift = existing.shift || (await this.shiftsRepo.findDefault(organizationId));
    const activePolicy = existing.policy || (await this.policiesRepo.findDefault(organizationId));
    const context = await this.resolveContext(organizationId, employeeId, attendanceDate);

    // 4. Calculate Final Metrics
    const calc = this.calculator.calculate({
      attendanceDate,
      checkInTime: existing.checkInTime,
      checkOutTime,
      shift: activeShift,
      policy: activePolicy,
      context,
    });

    // 5. Persist Check-Out
    const record = await this.repo.upsert(organizationId, employeeId, attendanceDate, {
      checkOutTime,
      checkOutSource: input.source ?? CheckInSource.WEB,
      checkOutIp: ipAddress ?? input.ipAddress,
      checkOutLocation: input.location ? JSON.stringify(input.location) : null,
      status: calc.status,
      workedMinutes: calc.workedMinutes,
      breakMinutes: calc.breakMinutes,
      payableMinutes: calc.payableMinutes,
      overtimeMinutes: calc.overtimeMinutes,
      earlyMinutes: calc.earlyMinutes,
      isEarlyExit: calc.isEarlyExit,
      deviationMinutes: calc.deviationMinutes,
      remarks: (input.remarks || input.notes) ? (existing.remarks ? `${existing.remarks}; ${input.remarks || input.notes}` : (input.remarks || input.notes)) : existing.remarks,
    });

    // 6. Audit Log
    await this.auditService.log({
      organizationId,
      actorUserId: employeeId,
      action: AuditAction.ATTENDANCE_CHECK_OUT,
      entityType: 'attendance_record',
      entityId: record.id,
      newValues: { checkOutTime, workedMinutes: calc.workedMinutes, overtimeMinutes: calc.overtimeMinutes },
      ipAddress,
    });

    return record;
  }

  async recordManual(
    organizationId: string,
    input: ManualAttendanceInput,
    hrUserId: string,
    ipAddress?: string,
  ) {
    const attendanceDate = this.repo.normalizeDate(new Date(input.attendanceDate));

    // 1. Period Lock Check
    const isLocked = await this.locksService.isPeriodLocked(organizationId, attendanceDate);
    if (isLocked) {
      throw new BadRequestException('Attendance period is locked for payroll cutoff. Modifications are not allowed.');
    }

    const checkInTime = input.checkInTime ? new Date(input.checkInTime) : null;
    const checkOutTime = input.checkOutTime ? new Date(input.checkOutTime) : null;

    if (checkInTime && checkOutTime && checkInTime > checkOutTime) {
      throw new BadRequestException('Check-in time cannot be after check-out time');
    }

    const shift = input.shiftId
      ? await this.shiftsRepo.findById(organizationId, input.shiftId)
      : await this.shiftsRepo.findDefault(organizationId);
    const policy = shift?.policy || (await this.policiesRepo.findDefault(organizationId));
    const context = await this.resolveContext(organizationId, input.employeeId, attendanceDate);

    const calc = this.calculator.calculate({
      attendanceDate,
      checkInTime,
      checkOutTime,
      shift,
      policy,
      context,
    });

    const status = (input.status || input.attendanceStatus || calc.status) as string;

    const record = await this.repo.upsert(organizationId, input.employeeId, attendanceDate, {
      shiftId: shift?.id ?? null,
      policyId: policy?.id ?? null,
      status,
      checkInTime,
      checkOutTime,
      checkInSource: CheckInSource.MANUAL,
      checkOutSource: checkOutTime ? CheckInSource.MANUAL : null,
      workedMinutes: calc.workedMinutes,
      breakMinutes: calc.breakMinutes,
      payableMinutes: calc.payableMinutes,
      overtimeMinutes: calc.overtimeMinutes,
      lateMinutes: calc.lateMinutes,
      earlyMinutes: calc.earlyMinutes,
      deviationMinutes: calc.deviationMinutes,
      isLate: calc.isLate,
      isEarlyExit: calc.isEarlyExit,
      remarks: input.remarks || input.notes || null,
    });

    await this.auditService.log({
      organizationId,
      actorUserId: hrUserId,
      action: AuditAction.ATTENDANCE_MANUAL_ENTRY,
      entityType: 'attendance_record',
      entityId: record.id,
      newValues: { employeeId: input.employeeId, attendanceDate, status },
      ipAddress,
    });

    return record;
  }

  async getTodayStatus(organizationId: string, employeeId: string) {
    const today = new Date();
    const normalized = this.repo.normalizeDate(today);

    const record = await this.repo.findByEmployeeAndDate(organizationId, employeeId, normalized);
    const shiftAssignment = await this.shiftAssignmentsService.findActiveAssignment(organizationId, employeeId, normalized);
    const shift = shiftAssignment?.shift || (await this.shiftsRepo.findDefault(organizationId));
    const isLocked = await this.locksService.isPeriodLocked(organizationId, normalized);

    return {
      today: normalized,
      isCheckedIn: !!record?.checkInTime && !record?.checkOutTime,
      isCheckedOut: !!record?.checkOutTime,
      record: record || null,
      shift: shift || null,
      isLocked,
    };
  }

  async getMySummary(organizationId: string, employeeId: string, startDate?: Date, endDate?: Date) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const records = await this.repo.findRecords(organizationId, {
      employeeId,
      startDate: start,
      endDate: end,
    });

    let totalWorkedMinutes = 0;
    let totalOvertimeMinutes = 0;
    let lateDays = 0;
    let earlyExitDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let leaveDays = 0;
    let holidays = 0;
    let weekends = 0;
    let onDutyDays = 0;
    let wfhDays = 0;

    for (const r of records) {
      totalWorkedMinutes += r.workedMinutes;
      totalOvertimeMinutes += r.overtimeMinutes;
      if (r.isLate) lateDays++;
      if (r.isEarlyExit) earlyExitDays++;

      switch (r.status) {
        case AttendanceStatus.PRESENT:
          presentDays++;
          break;
        case AttendanceStatus.HALF_DAY:
          halfDays++;
          break;
        case AttendanceStatus.ABSENT:
          absentDays++;
          break;
        case AttendanceStatus.ON_LEAVE:
          leaveDays++;
          break;
        case AttendanceStatus.HOLIDAY:
          holidays++;
          break;
        case AttendanceStatus.WEEKEND:
          weekends++;
          break;
        case AttendanceStatus.ON_DUTY:
          onDutyDays++;
          break;
        case AttendanceStatus.WORK_FROM_HOME:
          wfhDays++;
          break;
      }
    }

    return {
      period: { startDate: start, endDate: end },
      totalDays: records.length,
      presentDays,
      halfDays,
      absentDays,
      leaveDays,
      holidays,
      weekends,
      onDutyDays,
      wfhDays,
      lateDays,
      earlyExitDays,
      totalWorkedHours: Number((totalWorkedMinutes / 60).toFixed(2)),
      totalOvertimeHours: Number((totalOvertimeMinutes / 60).toFixed(2)),
    };
  }

  async getMyRecords(organizationId: string, employeeId: string, filter: AttendanceRecordQueryFilterInput) {
    const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
    const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

    return this.repo.findRecords(organizationId, {
      employeeId,
      startDate,
      endDate,
      status: filter.status,
    });
  }

  async getTeamAttendance(organizationId: string, managerEmployeeId: string, date?: Date) {
    const attendanceDate = date ? new Date(date) : new Date();

    // Find reportees
    const reportees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        reportingManagerId: managerEmployeeId,
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        workEmail: true,
        profilePhotoUrl: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
    });

    const reporteeIds = reportees.map((r) => r.id);
    const normalized = this.repo.normalizeDate(attendanceDate);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        employeeId: { in: reporteeIds },
        attendanceDate: normalized,
      },
      include: {
        shift: true,
      },
    });

    const recordMap = new Map<string, any>();
    records.forEach((r) => recordMap.set(r.employeeId, r));

    return reportees.map((rep) => ({
      employee: rep,
      record: recordMap.get(rep.id) || null,
      status: recordMap.get(rep.id)?.status || AttendanceStatus.ABSENT,
    }));
  }

  async getOrganizationAttendance(organizationId: string, filter: AttendanceRecordQueryFilterInput) {
    const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
    const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

    return this.repo.findRecords(organizationId, {
      employeeId: filter.employeeId,
      departmentId: filter.departmentId,
      locationId: filter.locationId,
      startDate,
      endDate,
      status: filter.status,
    });
  }

  private async resolveContext(organizationId: string, employeeId: string, date: Date) {
    const normalized = this.repo.normalizeDate(date);

    // 1. Approved Leave
    const approvedLeave = await this.prisma.leaveRequest.findFirst({
      where: {
        organizationId,
        employeeId,
        status: 'APPROVED',
        fromDate: { lte: normalized },
        toDate: { gte: normalized },
      },
    });

    // 2. Holiday
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        organizationId,
        date: normalized,
      },
    });

    // 3. Workweek / Weekend
    const workweek = await this.prisma.workweekConfig.findUnique({
      where: { organizationId },
    });
    const dayOfWeek = normalized.getUTCDay(); // 0 is Sunday, 6 is Saturday
    let isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (workweek && Array.isArray(workweek.weekendDays)) {
      isWeekend = (workweek.weekendDays as number[]).includes(dayOfWeek);
    }

    // 4. Approved On-Duty or WFH
    const attendanceReq = await this.prisma.attendanceRequest.findFirst({
      where: {
        organizationId,
        employeeId,
        status: 'APPROVED',
        fromDate: { lte: normalized },
        toDate: { gte: normalized },
      },
    });

    return {
      isOnLeave: !!approvedLeave,
      isHoliday: !!holiday,
      isWeekend,
      isOnDuty: attendanceReq?.requestType === 'ON_DUTY',
      isWfh: attendanceReq?.requestType === 'WORK_FROM_HOME',
    };
  }
}
