import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AttendancePoliciesService } from '../src/attendance/attendance-policies/attendance-policies.service';
import { AttendancePoliciesRepository } from '../src/attendance/attendance-policies/attendance-policies.repository';
import { ShiftsService } from '../src/attendance/shifts/shifts.service';
import { ShiftsRepository } from '../src/attendance/shifts/shifts.repository';
import { ShiftAssignmentsService } from '../src/attendance/shift-assignments/shift-assignments.service';
import { ShiftAssignmentsRepository } from '../src/attendance/shift-assignments/shift-assignments.repository';
import { AttendanceRecordsService } from '../src/attendance/attendance-records/attendance-records.service';
import { AttendanceRecordsRepository } from '../src/attendance/attendance-records/attendance-records.repository';
import { AttendanceCalculatorService } from '../src/attendance/attendance-records/attendance-calculator.service';
import { AttendanceRegularisationsService } from '../src/attendance/attendance-regularisations/attendance-regularisations.service';
import { AttendanceRegularisationsRepository } from '../src/attendance/attendance-regularisations/attendance-regularisations.repository';
import { OvertimeRequestsService } from '../src/attendance/overtime-requests/overtime-requests.service';
import { OvertimeRequestsRepository } from '../src/attendance/overtime-requests/overtime-requests.repository';
import { AttendanceRequestsService } from '../src/attendance/attendance-requests/attendance-requests.service';
import { AttendanceRequestsRepository } from '../src/attendance/attendance-requests/attendance-requests.repository';
import { AttendanceLocksService } from '../src/attendance/attendance-locks/attendance-locks.service';
import { AttendanceLocksRepository } from '../src/attendance/attendance-locks/attendance-locks.repository';
import { EmployeesRepository } from '../src/employees/employees.repository';
import { AuditService } from '../src/audit/audit.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AttendanceStatus, CheckInSource } from '@zentra/shared-types';

describe('Attendance & Time Tracking Module Test Suite', () => {
  let policiesService: AttendancePoliciesService;
  let shiftsService: ShiftsService;
  let assignmentsService: ShiftAssignmentsService;
  let recordsService: AttendanceRecordsService;
  let regularisationsService: AttendanceRegularisationsService;
  let overtimeService: OvertimeRequestsService;
  let attendanceRequestsService: AttendanceRequestsService;
  let locksService: AttendanceLocksService;
  let calculator: AttendanceCalculatorService;

  const orgA = 'org-aaaa-1111';
  const orgB = 'org-bbbb-2222';
  const empA = 'emp-101';
  const empB = 'emp-102';
  const userA = 'user-201';

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrisma);
    }),
    attendancePolicy: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    shift: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    shiftAssignment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    attendanceRecord: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    attendanceRegularisation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    overtimeRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    attendanceRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    attendanceLock: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    leaveRequest: {
      findFirst: jest.fn(),
    },
    holiday: {
      findFirst: jest.fn(),
    },
    workweekConfig: {
      findUnique: jest.fn(),
    },
    employee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockEmployeesRepo = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancePoliciesService,
        AttendancePoliciesRepository,
        ShiftsService,
        ShiftsRepository,
        ShiftAssignmentsService,
        ShiftAssignmentsRepository,
        AttendanceRecordsService,
        AttendanceRecordsRepository,
        AttendanceCalculatorService,
        AttendanceRegularisationsService,
        AttendanceRegularisationsRepository,
        OvertimeRequestsService,
        OvertimeRequestsRepository,
        AttendanceRequestsService,
        AttendanceRequestsRepository,
        AttendanceLocksService,
        AttendanceLocksRepository,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmployeesRepository, useValue: mockEmployeesRepo },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    policiesService = module.get<AttendancePoliciesService>(AttendancePoliciesService);
    shiftsService = module.get<ShiftsService>(ShiftsService);
    assignmentsService = module.get<ShiftAssignmentsService>(ShiftAssignmentsService);
    recordsService = module.get<AttendanceRecordsService>(AttendanceRecordsService);
    regularisationsService = module.get<AttendanceRegularisationsService>(AttendanceRegularisationsService);
    overtimeService = module.get<OvertimeRequestsService>(OvertimeRequestsService);
    attendanceRequestsService = module.get<AttendanceRequestsService>(AttendanceRequestsService);
    locksService = module.get<AttendanceLocksService>(AttendanceLocksService);
    calculator = module.get<AttendanceCalculatorService>(AttendanceCalculatorService);
  });

  describe('1. Attendance Policy Management', () => {
    it('should create an attendance policy and log audit', async () => {
      mockPrisma.attendancePolicy.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendancePolicy.create.mockResolvedValueOnce({
        id: 'policy-1',
        organizationId: orgA,
        name: 'Standard Strict Policy',
        code: 'POLICY_STRICT',
        mode: 'STRICT',
        workHoursPerDay: 8.0,
        minHoursFullDay: 8.0,
        minHoursHalfDay: 4.0,
        gracePeriodLateCheckIn: 15,
        isDefault: true,
      });

      const res = await policiesService.create(
        orgA,
        {
          name: 'Standard Strict Policy',
          code: 'POLICY_STRICT',
          mode: 'STRICT',
          workHoursPerDay: 8.0,
          minHoursFullDay: 8.0,
          minHoursHalfDay: 4.0,
          gracePeriodLateCheckIn: 15,
          isDefault: true,
        },
        userA,
      );

      expect(res.id).toBe('policy-1');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgA,
          entityType: 'attendance_policy',
          entityId: 'policy-1',
        }),
      );
    });

    it('should reject policy creation with duplicate code in same org', async () => {
      mockPrisma.attendancePolicy.findFirst.mockResolvedValueOnce({
        id: 'policy-1',
        code: 'POLICY_STRICT',
      });

      await expect(
        policiesService.create(
          orgA,
          {
            name: 'Another Policy',
            code: 'POLICY_STRICT',
          },
          userA,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('2. Shift Management & Overnight Calculation', () => {
    it('should create regular shift and detect non-overnight', async () => {
      mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
      mockPrisma.shift.create.mockResolvedValueOnce({
        id: 'shift-1',
        organizationId: orgA,
        name: 'Morning Shift',
        code: 'SHIFT_MORNING',
        startTime: '09:00',
        endTime: '17:00',
        isOvernight: false,
        breakDurationMinutes: 60,
      });

      const res = await shiftsService.create(
        orgA,
        {
          name: 'Morning Shift',
          code: 'SHIFT_MORNING',
          startTime: '09:00',
          endTime: '17:00',
          breakDurationMinutes: 60,
        },
        userA,
      );

      expect(res.id).toBe('shift-1');
      expect(res.isOvernight).toBe(false);
    });

    it('should automatically detect overnight shift when start time > end time', async () => {
      mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
      mockPrisma.shift.create.mockImplementationOnce(({ data }) => ({
        id: 'shift-night',
        ...data,
      }));

      const res = await shiftsService.create(
        orgA,
        {
          name: 'Night Shift',
          code: 'SHIFT_NIGHT',
          startTime: '22:00',
          endTime: '06:00',
        },
        userA,
      );

      expect(res.isOvernight).toBe(true);
    });
  });

  describe('3. Shift Assignment & Overlap Validation', () => {
    it('should prevent overlapping shift assignment without isOverride', async () => {
      mockEmployeesRepo.findById.mockResolvedValueOnce({ id: empA, organizationId: orgA });
      mockPrisma.shift.findFirst.mockResolvedValueOnce({ id: 'shift-1', organizationId: orgA });

      // Simulate existing overlapping assignment
      mockPrisma.shiftAssignment.findMany.mockResolvedValueOnce([
        { id: 'assign-existing', employeeId: empA, startDate: new Date('2026-11-01'), endDate: new Date('2026-11-30') },
      ]);

      await expect(
        assignmentsService.create(
          orgA,
          {
            employeeId: empA,
            shiftId: 'shift-1',
            startDate: '2026-11-15',
            endDate: '2026-11-20',
            isOverride: false,
          },
          userA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow overlapping assignment when isOverride=true', async () => {
      mockEmployeesRepo.findById.mockResolvedValueOnce({ id: empA, organizationId: orgA });
      mockPrisma.shift.findFirst.mockResolvedValueOnce({ id: 'shift-2', organizationId: orgA });

      mockPrisma.shiftAssignment.create.mockResolvedValueOnce({
        id: 'assign-override',
        employeeId: empA,
        shiftId: 'shift-2',
        isOverride: true,
      });

      const res = await assignmentsService.create(
        orgA,
        {
          employeeId: empA,
          shiftId: 'shift-2',
          startDate: '2026-11-15',
          endDate: '2026-11-16',
          isOverride: true,
        },
        userA,
      );

      expect(res.id).toBe('assign-override');
      expect(res.isOverride).toBe(true);
    });
  });

  describe('4. Attendance Calculation Engine Unit Tests', () => {
    const baseDate = new Date('2026-11-18T00:00:00.000Z');
    const standardShift = {
      startTime: '09:00',
      endTime: '17:00',
      isOvernight: false,
      breakDurationMinutes: 60,
      isPaidBreak: false,
    };
    const standardPolicy = {
      mode: 'STRICT',
      workHoursPerDay: 8.0,
      minHoursFullDay: 7.0,
      minHoursHalfDay: 4.0,
      gracePeriodLateCheckIn: 15,
      gracePeriodEarlyCheckOut: 15,
      allowOvertime: true,
      minOvertimeMinutes: 30,
      maxOvertimeMinutesPerDay: 240,
    };

    it('should compute on-time arrival and full day present', () => {
      const checkIn = new Date('2026-11-18T09:05:00.000Z'); // 5 min in, within 15 min grace
      const checkOut = new Date('2026-11-18T17:05:00.000Z'); // full 8 hours raw (480 min) - 60 break = 420 min (7.0 hrs)

      const result = calculator.calculate({
        attendanceDate: baseDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        shift: standardShift,
        policy: standardPolicy,
      });

      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(result.isLate).toBe(false);
      expect(result.lateMinutes).toBe(0);
      expect(result.isEarlyExit).toBe(false);
      expect(result.workedMinutes).toBe(420);
      expect(result.payableMinutes).toBe(420);
    });

    it('should detect late check-in beyond grace period', () => {
      const checkIn = new Date('2026-11-18T09:30:00.000Z'); // 30 min late (> 15 grace)
      const checkOut = new Date('2026-11-18T17:00:00.000Z');

      const result = calculator.calculate({
        attendanceDate: baseDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        shift: standardShift,
        policy: standardPolicy,
      });

      expect(result.isLate).toBe(true);
      expect(result.lateMinutes).toBe(30);
      expect(result.deviationMinutes).toBe(30);
    });

    it('should detect early departure', () => {
      const checkIn = new Date('2026-11-18T09:00:00.000Z');
      const checkOut = new Date('2026-11-18T16:00:00.000Z'); // 1 hour early

      const result = calculator.calculate({
        attendanceDate: baseDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        shift: standardShift,
        policy: standardPolicy,
      });

      expect(result.isEarlyExit).toBe(true);
      expect(result.earlyMinutes).toBe(60);
      expect(result.deviationMinutes).toBe(60);
    });

    it('should evaluate half day when worked hours >= minHoursHalfDay but < minHoursFullDay', () => {
      const checkIn = new Date('2026-11-18T09:00:00.000Z');
      const checkOut = new Date('2026-11-18T14:30:00.000Z'); // 5.5 hours raw - 1 hour break = 4.5 hours worked

      const result = calculator.calculate({
        attendanceDate: baseDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        shift: standardShift,
        policy: standardPolicy, // minHalf: 4.0, minFull: 7.0
      });

      expect(result.status).toBe(AttendanceStatus.HALF_DAY);
      expect(result.workedMinutes).toBe(270);
    });

    it('should calculate overtime minutes correctly', () => {
      const checkIn = new Date('2026-11-18T09:00:00.000Z');
      const checkOut = new Date('2026-11-18T19:00:00.000Z'); // 10 hours raw - 1 hour break = 9 hours (540 min). Shift duration = 7 hrs (420 min). Excess = 120 min

      const result = calculator.calculate({
        attendanceDate: baseDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        shift: standardShift,
        policy: standardPolicy,
      });

      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(result.overtimeMinutes).toBe(120);
    });

    it('should correctly handle overnight shift calculations', () => {
      const nightShift = {
        startTime: '22:00',
        endTime: '06:00',
        isOvernight: true,
        breakDurationMinutes: 60,
      };

      const checkIn = new Date('2026-11-18T22:00:00.000Z'); // on-time (< 15 min grace)
      const checkOut = new Date('2026-11-19T06:00:00.000Z'); // 8 hours total (480 min) - 60 = 420 min (7 hrs)

      const result = calculator.calculate({
        attendanceDate: baseDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        shift: nightShift,
        policy: standardPolicy,
      });

      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(result.isLate).toBe(false);
      expect(result.isEarlyExit).toBe(false);
      expect(result.workedMinutes).toBe(420);
    });

    it('should assign ON_LEAVE when context specifies approved leave', () => {
      const result = calculator.calculate({
        attendanceDate: baseDate,
        context: { isOnLeave: true },
      });
      expect(result.status).toBe(AttendanceStatus.ON_LEAVE);
    });

    it('should assign HOLIDAY when context specifies holiday', () => {
      const result = calculator.calculate({
        attendanceDate: baseDate,
        context: { isHoliday: true },
      });
      expect(result.status).toBe(AttendanceStatus.HOLIDAY);
    });

    it('should assign WEEKEND when context specifies weekend', () => {
      const result = calculator.calculate({
        attendanceDate: baseDate,
        context: { isWeekend: true },
      });
      expect(result.status).toBe(AttendanceStatus.WEEKEND);
    });

    it('should assign ON_DUTY when context specifies on-duty', () => {
      const result = calculator.calculate({
        attendanceDate: baseDate,
        context: { isOnDuty: true },
      });
      expect(result.status).toBe(AttendanceStatus.ON_DUTY);
    });

    it('should assign WORK_FROM_HOME when context specifies WFH', () => {
      const result = calculator.calculate({
        attendanceDate: baseDate,
        context: { isWfh: true },
      });
      expect(result.status).toBe(AttendanceStatus.WORK_FROM_HOME);
    });
  });

  describe('5. Check-In & Check-Out Workflows', () => {
    it('should reject check-in if period is locked', async () => {
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce({
        id: 'lock-1',
        organizationId: orgA,
        status: 'LOCKED',
      });

      await expect(
        recordsService.checkIn(
          orgA,
          empA,
          { source: CheckInSource.WEB },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record check-in successfully and log audit', async () => {
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null); // not locked
      mockPrisma.attendanceRecord.findUnique.mockResolvedValueOnce(null); // not checked in yet
      mockPrisma.shiftAssignment.findFirst.mockResolvedValueOnce(null); // no specific assignment
      mockPrisma.shift.findFirst.mockResolvedValueOnce({
        id: 'default-shift',
        startTime: '09:00',
        endTime: '17:00',
        breakDurationMinutes: 60,
      });
      mockPrisma.attendancePolicy.findFirst.mockResolvedValueOnce({
        mode: 'STRICT',
        minHoursFullDay: 8.0,
      });

      mockPrisma.attendanceRecord.upsert.mockResolvedValueOnce({
        id: 'rec-1',
        organizationId: orgA,
        employeeId: empA,
        attendanceDate: new Date('2026-11-18T00:00:00.000Z'),
        checkInTime: new Date('2026-11-18T09:00:00.000Z'),
        status: AttendanceStatus.PRESENT,
      });

      const res = await recordsService.checkIn(
        orgA,
        empA,
        {
          source: CheckInSource.WEB,
          checkInTime: '2026-11-18T09:00:00.000Z',
        },
        '127.0.0.1',
      );

      expect(res.id).toBe('rec-1');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTENDANCE_CHECK_IN',
          entityType: 'attendance_record',
        }),
      );
    });

    it('should prevent duplicate check-in on the same date', async () => {
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValueOnce({
        id: 'rec-1',
        checkInTime: new Date('2026-11-18T09:00:00.000Z'),
      });

      await expect(
        recordsService.checkIn(
          orgA,
          empA,
          { source: CheckInSource.WEB, checkInTime: '2026-11-18T09:30:00.000Z' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent checkout when no check-in exists', async () => {
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValueOnce(null);

      await expect(
        recordsService.checkOut(
          orgA,
          empA,
          { source: CheckInSource.WEB },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process check-out and calculate final metrics', async () => {
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendanceRecord.findUnique.mockResolvedValueOnce({
        id: 'rec-1',
        organizationId: orgA,
        employeeId: empA,
        attendanceDate: new Date('2026-11-18T00:00:00.000Z'),
        checkInTime: new Date('2026-11-18T09:00:00.000Z'),
        checkOutTime: null,
        shift: {
          startTime: '09:00',
          endTime: '17:00',
          breakDurationMinutes: 60,
          isPaidBreak: false,
        },
        policy: {
          mode: 'STRICT',
          minHoursFullDay: 7.0,
          minHoursHalfDay: 4.0,
        },
      });

      mockPrisma.attendanceRecord.upsert.mockResolvedValueOnce({
        id: 'rec-1',
        status: AttendanceStatus.PRESENT,
        workedMinutes: 420,
      });

      const res = await recordsService.checkOut(
        orgA,
        empA,
        {
          source: CheckInSource.WEB,
          checkOutTime: '2026-11-18T17:00:00.000Z',
        },
        '127.0.0.1',
      );

      expect(res.id).toBe('rec-1');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTENDANCE_CHECK_OUT',
          entityType: 'attendance_record',
        }),
      );
    });
  });

  describe('6. Attendance Regularisation Workflow', () => {
    it('should submit regularisation and prevent duplicate pending requests', async () => {
      mockPrisma.attendanceRecord.findFirst.mockResolvedValueOnce({
        id: 'rec-1',
        organizationId: orgA,
        employeeId: empA,
        attendanceDate: new Date(),
        regularisations: [{ status: 'PENDING_APPROVAL' }],
      });
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null);

      await expect(
        regularisationsService.submit(
          orgA,
          empA,
          {
            attendanceRecordId: 'rec-1',
            reason: 'MISSED_PUNCH',
            explanation: 'Forgot badge',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve regularisation and atomically recalculate attendance record', async () => {
      mockPrisma.attendanceRegularisation.findFirst.mockResolvedValueOnce({
        id: 'reg-1',
        organizationId: orgA,
        employeeId: empA,
        status: 'PENDING_APPROVAL',
        requestedCheckIn: new Date('2026-11-18T09:00:00.000Z'),
        requestedCheckOut: new Date('2026-11-18T17:00:00.000Z'),
        attendanceRecord: {
          id: 'rec-1',
          attendanceDate: new Date('2026-11-18T00:00:00.000Z'),
          checkInTime: null,
          checkOutTime: null,
          shift: {
            startTime: '09:00',
            endTime: '17:00',
            breakDurationMinutes: 60,
          },
          policy: {
            mode: 'STRICT',
            minHoursFullDay: 7.0,
            minHoursHalfDay: 4.0,
          },
        },
      });
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null);

      mockPrisma.attendanceRegularisation.update.mockResolvedValueOnce({
        id: 'reg-1',
        status: 'APPROVED',
      });
      mockPrisma.attendanceRecord.update.mockResolvedValueOnce({
        id: 'rec-1',
        status: AttendanceStatus.PRESENT,
        isRegularised: true,
        workedMinutes: 420,
      });

      const res = await regularisationsService.decide(
        orgA,
        'reg-1',
        { status: 'APPROVED' },
        userA,
      );

      expect(res.regularisation.status).toBe('APPROVED');
      expect(res.record.status).toBe(AttendanceStatus.PRESENT);
      expect(res.record.isRegularised).toBe(true);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ATTENDANCE_REGULARISATION_APPROVE',
          entityType: 'attendance_regularisation',
        }),
      );
    });

    it('should reject regularisation leaving record unchanged', async () => {
      mockPrisma.attendanceRegularisation.findFirst.mockResolvedValueOnce({
        id: 'reg-2',
        organizationId: orgA,
        status: 'PENDING_APPROVAL',
        attendanceRecord: {
          id: 'rec-2',
          attendanceDate: new Date(),
        },
      });
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendanceRegularisation.update.mockResolvedValueOnce({
        id: 'reg-2',
        status: 'REJECTED',
      });

      const res = await regularisationsService.decide(
        orgA,
        'reg-2',
        { status: 'REJECTED', rejectionReason: 'Invalid reason' },
        userA,
      );

      expect(res.regularisation.status).toBe('REJECTED');
    });
  });

  describe('7. Overtime Tracking & Decisions', () => {
    it('should approve overtime request and update approvedOvertimeMinutes on record', async () => {
      mockPrisma.overtimeRequest.findFirst.mockResolvedValueOnce({
        id: 'ot-1',
        organizationId: orgA,
        employeeId: empA,
        attendanceRecordId: 'rec-1',
        overtimeMinutes: 90,
        status: 'PENDING_APPROVAL',
        date: new Date('2026-11-18'),
      });
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce(null);

      mockPrisma.overtimeRequest.update.mockResolvedValueOnce({
        id: 'ot-1',
        status: 'APPROVED',
      });
      mockPrisma.attendanceRecord.update.mockResolvedValueOnce({
        id: 'rec-1',
        approvedOvertimeMinutes: 90,
      });

      const res = await overtimeService.decide(
        orgA,
        'ot-1',
        { status: 'APPROVED' },
        userA,
      );

      expect(res.status).toBe('APPROVED');
      expect(mockPrisma.attendanceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rec-1' },
          data: { approvedOvertimeMinutes: 90 },
        }),
      );
    });
  });

  describe('8. Attendance Period Locks (Payroll Cutoff)', () => {
    it('should lock attendance period and mark records locked', async () => {
      mockPrisma.attendanceLock.create.mockResolvedValueOnce({
        id: 'lock-nov',
        organizationId: orgA,
        name: 'November Payroll Lock',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-15'),
        status: 'LOCKED',
      });

      const lock = await locksService.lockPeriod(
        orgA,
        {
          name: 'November Payroll Lock',
          startDate: '2026-11-01',
          endDate: '2026-11-15',
        },
        userA,
      );

      expect(lock.id).toBe('lock-nov');
      expect(mockPrisma.attendanceRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: orgA,
            attendanceDate: {
              gte: new Date('2026-11-01'),
              lte: new Date('2026-11-15'),
            },
          },
          data: { isLocked: true },
        }),
      );
    });

    it('should unlock attendance period successfully', async () => {
      mockPrisma.attendanceLock.findFirst.mockResolvedValueOnce({
        id: 'lock-nov',
        organizationId: orgA,
        name: 'November Payroll Lock',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-15'),
        status: 'LOCKED',
      });

      mockPrisma.attendanceLock.update.mockResolvedValueOnce({
        id: 'lock-nov',
        status: 'UNLOCKED',
      });

      const unlocked = await locksService.unlock(orgA, 'lock-nov', userA);

      expect(unlocked.status).toBe('UNLOCKED');
      expect(mockPrisma.attendanceRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isLocked: false },
        }),
      );
    });
  });

  describe('9. Multi-Tenant Isolation', () => {
    it('should not allow access to records across organizations', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValueOnce(null);

      const record = await recordsService.getTodayStatus(orgB, empA);
      expect(record.record).toBeNull();
    });
  });
});
