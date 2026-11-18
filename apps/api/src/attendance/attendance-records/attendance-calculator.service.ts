import { Injectable } from '@nestjs/common';
import { AttendanceStatus } from '@zentra/shared-types';

export interface AttendanceCalculationInput {
  attendanceDate: Date;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  shift?: {
    startTime: string;
    endTime: string;
    isOvernight?: boolean;
    breakDurationMinutes?: number;
    isPaidBreak?: boolean;
    checkInMarginBeforeMinutes?: number;
    checkOutMarginAfterMinutes?: number;
  } | null;
  policy?: {
    mode?: string;
    workHoursPerDay?: number | any;
    minHoursHalfDay?: number | any;
    minHoursFullDay?: number | any;
    gracePeriodLateCheckIn?: number;
    gracePeriodEarlyCheckOut?: number;
    allowOvertime?: boolean;
    minOvertimeMinutes?: number;
    maxOvertimeMinutesPerDay?: number;
  } | null;
  context?: {
    isOnLeave?: boolean;
    isHoliday?: boolean;
    isWeekend?: boolean;
    isOnDuty?: boolean;
    isWfh?: boolean;
  };
}

export interface AttendanceCalculationResult {
  status: AttendanceStatus;
  workedMinutes: number;
  breakMinutes: number;
  payableMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyMinutes: number;
  deviationMinutes: number;
  isLate: boolean;
  isEarlyExit: boolean;
}

@Injectable()
export class AttendanceCalculatorService {
  calculate(input: AttendanceCalculationInput): AttendanceCalculationResult {
    const { attendanceDate, checkInTime, checkOutTime, shift, policy, context = {} } = input;

    // 1. Check special contextual statuses first
    if (context.isOnLeave) {
      return this.emptyResult(AttendanceStatus.ON_LEAVE);
    }
    if (context.isHoliday) {
      return this.emptyResult(AttendanceStatus.HOLIDAY);
    }
    if (context.isWeekend) {
      return this.emptyResult(AttendanceStatus.WEEKEND);
    }
    if (context.isOnDuty) {
      return this.emptyResult(AttendanceStatus.ON_DUTY);
    }
    if (context.isWfh) {
      return this.emptyResult(AttendanceStatus.WORK_FROM_HOME);
    }

    if (!checkInTime) {
      return this.emptyResult(AttendanceStatus.ABSENT);
    }

    // 2. Resolve Shift Timings on the attendance date
    let shiftStart: Date | null = null;
    let shiftEnd: Date | null = null;

    if (shift) {
      shiftStart = this.parseShiftTime(attendanceDate, shift.startTime);
      shiftEnd = this.parseShiftTime(attendanceDate, shift.endTime);

      if (shift.isOvernight && shiftEnd <= shiftStart) {
        shiftEnd = new Date(shiftEnd.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // 3. Late Arrival Check
    let isLate = false;
    let lateMinutes = 0;
    const graceLate = policy?.gracePeriodLateCheckIn ?? 15;

    if (shiftStart) {
      const allowedCheckIn = new Date(shiftStart.getTime() + graceLate * 60 * 1000);
      if (checkInTime > allowedCheckIn) {
        isLate = true;
        lateMinutes = Math.max(0, Math.floor((checkInTime.getTime() - shiftStart.getTime()) / 60000));
      }
    }

    // 4. In-progress attendance (checked in but not checked out)
    if (!checkOutTime) {
      return {
        status: AttendanceStatus.PRESENT,
        workedMinutes: 0,
        breakMinutes: 0,
        payableMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes,
        earlyMinutes: 0,
        deviationMinutes: lateMinutes,
        isLate,
        isEarlyExit: false,
      };
    }

    // 5. Early Exit Check
    let isEarlyExit = false;
    let earlyMinutes = 0;
    const graceEarly = policy?.gracePeriodEarlyCheckOut ?? 15;

    if (shiftEnd) {
      const allowedCheckOut = new Date(shiftEnd.getTime() - graceEarly * 60 * 1000);
      if (checkOutTime < allowedCheckOut) {
        isEarlyExit = true;
        earlyMinutes = Math.max(0, Math.floor((shiftEnd.getTime() - checkOutTime.getTime()) / 60000));
      }
    }

    const deviationMinutes = lateMinutes + earlyMinutes;

    // 6. Worked, Break, and Payable Minutes
    const rawDuration = Math.max(0, Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000));
    const breakMinutes = shift?.breakDurationMinutes ?? 0;
    const workedMinutes = Math.max(0, rawDuration - breakMinutes);
    const payableMinutes = shift?.isPaidBreak ? rawDuration : workedMinutes;

    // 7. Overtime Calculation
    let overtimeMinutes = 0;
    if (policy?.allowOvertime) {
      let expectedMinutes = Number(policy.workHoursPerDay ?? 8.0) * 60;
      if (shiftStart && shiftEnd) {
        const shiftDuration = Math.floor((shiftEnd.getTime() - shiftStart.getTime()) / 60000);
        expectedMinutes = shift?.isPaidBreak ? shiftDuration : Math.max(0, shiftDuration - breakMinutes);
      }

      const rawOvertime = Math.max(0, workedMinutes - expectedMinutes);
      const minOt = policy.minOvertimeMinutes ?? 30;
      const maxOt = policy.maxOvertimeMinutesPerDay ?? 240;

      if (rawOvertime >= minOt) {
        overtimeMinutes = Math.min(rawOvertime, maxOt);
      }
    }

    // 8. Determine Status
    const workedHours = workedMinutes / 60;
    const minFull = Number(policy?.minHoursFullDay ?? 8.0);
    const minHalf = Number(policy?.minHoursHalfDay ?? 4.0);

    let status = AttendanceStatus.ABSENT;
    if (workedHours >= minFull) {
      status = AttendanceStatus.PRESENT;
    } else if (workedHours >= minHalf) {
      status = AttendanceStatus.HALF_DAY;
    } else if (policy?.mode === 'LENIENT' && workedHours > 0) {
      status = AttendanceStatus.PRESENT;
    }

    return {
      status,
      workedMinutes,
      breakMinutes,
      payableMinutes,
      overtimeMinutes,
      lateMinutes,
      earlyMinutes,
      deviationMinutes,
      isLate,
      isEarlyExit,
    };
  }

  private parseShiftTime(baseDate: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(baseDate);
    d.setUTCHours(hours, minutes, 0, 0);
    return d;
  }

  private emptyResult(status: AttendanceStatus): AttendanceCalculationResult {
    return {
      status,
      workedMinutes: 0,
      breakMinutes: 0,
      payableMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      deviationMinutes: 0,
      isLate: false,
      isEarlyExit: false,
    };
  }
}
