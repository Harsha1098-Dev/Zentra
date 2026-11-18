import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { LeaveTypesService } from '../src/leave/leave-types/leave-types.service';
import { LeaveTypesRepository } from '../src/leave/leave-types/leave-types.repository';
import { LeavePoliciesService } from '../src/leave/leave-policies/leave-policies.service';
import { LeavePoliciesRepository } from '../src/leave/leave-policies/leave-policies.repository';
import { LeaveBalancesService } from '../src/leave/leave-balances/leave-balances.service';
import { LeaveBalancesRepository } from '../src/leave/leave-balances/leave-balances.repository';
import { LeaveRequestsService } from '../src/leave/leave-requests/leave-requests.service';
import { LeaveRequestsRepository } from '../src/leave/leave-requests/leave-requests.repository';
import { CompOffService } from '../src/leave/comp-off/comp-off.service';
import { CompOffRepository } from '../src/leave/comp-off/comp-off.repository';
import { EmployeesRepository } from '../src/employees/employees.repository';
import { ApprovalsService } from '../src/approvals/approvals.service';
import { AuditService } from '../src/audit/audit.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  LeaveCategory,
  LeaveDurationType,
  LeaveRequestStatus,
  CompOffStatus,
  AuditAction,
} from '@zentra/shared-types';

describe('Leave Management Module Test Suite', () => {
  let leaveTypesService: LeaveTypesService;
  let leavePoliciesService: LeavePoliciesService;
  let leaveBalancesService: LeaveBalancesService;
  let leaveRequestsService: LeaveRequestsService;
  let compOffService: CompOffService;

  const orgA = 'org-1111-aaaa';
  const orgB = 'org-2222-bbbb';
  const empA = 'emp-101';
  const userA = 'user-201';

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrisma);
    }),
    workweekConfig: {
      findUnique: jest.fn(),
    },
    holiday: {
      findMany: jest.fn(),
    },
    leaveType: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    leaveBalance: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    leaveBalanceHistory: {
      create: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockEmployeesRepo = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    getDirectReportees: jest.fn(),
  };

  const mockApprovalsService = {
    createApprovalFlow: jest.fn().mockResolvedValue({ id: 'flow-123' }),
  };

  const mockLeaveTypesRepo = {
    findByCode: jest.fn(),
    findByName: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    list: jest.fn(),
    listActive: jest.fn(),
    hasAssociatedRecords: jest.fn(),
  };

  const mockLeavePoliciesRepo = {
    findById: jest.fn(),
    findByName: jest.fn(),
    findActivePoliciesForType: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    list: jest.fn(),
  };

  const mockLeaveBalancesRepo = {
    findByEmployeeAndYear: jest.fn(),
    findSpecificBalance: jest.fn(),
    findById: jest.fn(),
    upsertBalance: jest.fn(),
    createHistory: jest.fn(),
    getHistoryByEmployee: jest.fn(),
    listAllBalances: jest.fn(),
  };

  const mockLeaveRequestsRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findOverlappingRequests: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
    listByDateRange: jest.fn(),
  };

  const mockCompOffRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmployeeAndDate: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveTypesService,
        LeavePoliciesService,
        LeaveBalancesService,
        LeaveRequestsService,
        CompOffService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmployeesRepository, useValue: mockEmployeesRepo },
        { provide: ApprovalsService, useValue: mockApprovalsService },
        { provide: LeaveTypesRepository, useValue: mockLeaveTypesRepo },
        { provide: LeavePoliciesRepository, useValue: mockLeavePoliciesRepo },
        { provide: LeaveBalancesRepository, useValue: mockLeaveBalancesRepo },
        { provide: LeaveRequestsRepository, useValue: mockLeaveRequestsRepo },
        { provide: CompOffRepository, useValue: mockCompOffRepo },
      ],
    }).compile();

    leaveTypesService = module.get<LeaveTypesService>(LeaveTypesService);
    leavePoliciesService = module.get<LeavePoliciesService>(LeavePoliciesService);
    leaveBalancesService = module.get<LeaveBalancesService>(LeaveBalancesService);
    leaveRequestsService = module.get<LeaveRequestsService>(LeaveRequestsService);
    compOffService = module.get<CompOffService>(CompOffService);
  });

  describe('1. Leave Types Management', () => {
    it('should successfully create a new leave type with audit log', async () => {
      mockLeaveTypesRepo.findByCode.mockResolvedValue(null);
      mockLeaveTypesRepo.findByName.mockResolvedValue(null);
      mockLeaveTypesRepo.create.mockResolvedValue({
        id: 'lt-1',
        organizationId: orgA,
        name: 'Annual Leave',
        code: 'AL',
        category: LeaveCategory.EARNED_LEAVE,
        isPaid: true,
        isActive: true,
        color: '#1E3A8A',
        icon: 'calendar',
        requiresAttachment: false,
        attachmentRequiredDays: 0,
        allowsHalfDay: true,
        allowsQuarterDay: false,
        allowsHourly: false,
        allowsNegativeBalance: false,
        requiresApproval: true,
        isCompOff: false,
        isLossOfPay: false,
        isRestrictedHoliday: false,
        applicableProbation: true,
        applicableContract: true,
        applicableIntern: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await leaveTypesService.createLeaveType(orgA, {
        name: 'Annual Leave',
        code: 'AL',
        category: LeaveCategory.EARNED_LEAVE,
        isPaid: true,
      } as any);

      expect(result.id).toBe('lt-1');
      expect(result.code).toBe('AL');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgA,
          action: AuditAction.LEAVE_TYPE_CREATE,
        }),
      );
    });

    it('should reject creation if code already exists in the same tenant', async () => {
      mockLeaveTypesRepo.findByCode.mockResolvedValue({ id: 'lt-existing', code: 'AL' });

      await expect(
        leaveTypesService.createLeaveType(orgA, {
          name: 'Annual Leave Duplicate',
          code: 'AL',
          category: LeaveCategory.EARNED_LEAVE,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent deletion of leave type if active requests or balances exist', async () => {
      mockLeaveTypesRepo.findById.mockResolvedValue({ id: 'lt-1', organizationId: orgA });
      mockLeaveTypesRepo.hasAssociatedRecords.mockResolvedValue(true);

      await expect(leaveTypesService.deleteLeaveType('lt-1', orgA)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockLeaveTypesRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('2. Leave Policies & Eligibility Evaluation', () => {
    const policy = {
      id: 'pol-1',
      organizationId: orgA,
      name: 'Standard HQ Policy',
      status: 'active',
      applicableLocations: ['loc-hq'],
      applicableDepartments: ['ALL'],
      applicableDesignations: ['ALL'],
      applicableGrades: ['ALL'],
      applicableEmploymentTypes: ['FULL_TIME'],
      applicableEmployeeStatuses: ['ALL'],
      probationEligibility: false,
      minimumServicePeriodDays: 30,
      annualEntitlement: 24,
      allowWeekendLeave: false,
      allowHolidayLeave: false,
      requiresApproval: true,
    };

    it('should allow employee matching location and passing probation & service period', () => {
      const eligibleEmp = {
        id: 'emp-1',
        locationId: 'loc-hq',
        departmentId: 'dept-eng',
        employmentType: 'FULL_TIME',
        status: 'CONFIRMED',
        joiningDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      };

      const isEligible = leavePoliciesService.evaluateEligibility(eligibleEmp, policy);
      expect(isEligible).toBe(true);
    });

    it('should disallow employee on probation if policy disallows probation eligibility', () => {
      const probationEmp = {
        id: 'emp-2',
        locationId: 'loc-hq',
        employmentType: 'FULL_TIME',
        status: 'PROBATION',
        joiningDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      };

      const isEligible = leavePoliciesService.evaluateEligibility(probationEmp, policy);
      expect(isEligible).toBe(false);
    });

    it('should disallow employee who has not completed minimum service period', () => {
      const newJoiner = {
        id: 'emp-3',
        locationId: 'loc-hq',
        employmentType: 'FULL_TIME',
        status: 'CONFIRMED',
        joiningDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // only 10 days ago
      };

      const isEligible = leavePoliciesService.evaluateEligibility(newJoiner, policy);
      expect(isEligible).toBe(false);
    });
  });

  describe('3. Working Days Calculation (Holidays & Weekends Exclusion)', () => {
    it('should exclude weekend days and public holidays when calculating leave days', async () => {
      // Setup workweek: Saturday and Sunday are weekend
      mockPrisma.workweekConfig.findUnique.mockResolvedValue({
        organizationId: orgA,
        weekendDays: ['SATURDAY', 'SUNDAY'],
      });

      // 2026-11-20 is Friday (working), 2026-11-21 is Sat (weekend), 2026-11-22 is Sun (weekend),
      // 2026-11-23 is Monday (Holiday!), 2026-11-24 is Tuesday (working)
      mockPrisma.holiday.findMany.mockResolvedValue([
        {
          id: 'hol-1',
          name: 'Festival Day',
          date: new Date('2026-11-23T00:00:00.000Z'),
          locationId: null,
        },
      ]);

      const policy = {
        allowWeekendLeave: false,
        allowHolidayLeave: false,
      };

      const employee = { id: empA, locationId: 'loc-1' };
      const fromDate = new Date('2026-11-20T00:00:00.000Z');
      const toDate = new Date('2026-11-24T00:00:00.000Z');

      const count = await leaveRequestsService.calculateLeaveDays(
        orgA,
        employee,
        policy,
        fromDate,
        toDate,
        LeaveDurationType.FULL_DAY,
      );

      // Total days span: 5 days (Fri, Sat, Sun, Mon, Tue).
      // Sat & Sun are weekends (excluded).
      // Mon is holiday (excluded).
      // Effective leave days: 2 (Fri, Tue)
      expect(count).toBe(2);
    });

    it('should return 0.5 for half-day duration', async () => {
      const count = await leaveRequestsService.calculateLeaveDays(
        orgA,
        {},
        null,
        new Date('2026-11-20'),
        new Date('2026-11-20'),
        LeaveDurationType.HALF_DAY,
      );
      expect(count).toBe(0.5);
    });
  });

  describe('4. Leave Balance Lifecycle & Reservation on Leave Application', () => {
    const leaveType = {
      id: 'lt-1',
      name: 'Casual Leave',
      code: 'CL',
      isActive: true,
      allowsNegativeBalance: false,
      requiresApproval: true,
    };

    const mockEmployee = {
      id: empA,
      userId: userA,
      organizationId: orgA,
      status: 'CONFIRMED',
      joiningDate: new Date('2025-01-01'),
    };

    it('should reserve pending balance and create approval flow upon leave request submission', async () => {
      mockEmployeesRepo.findById.mockResolvedValue(mockEmployee);
      mockLeaveTypesRepo.findById.mockResolvedValue(leaveType);
      mockLeavePoliciesRepo.findActivePoliciesForType.mockResolvedValue([]);
      mockLeaveRequestsRepo.findOverlappingRequests.mockResolvedValue([]);

      // Mock available balance: 10 days
      mockBalancesServiceForEmployee(10, 0, 0);

      // Workweek & holidays
      mockPrisma.workweekConfig.findUnique.mockResolvedValue({ weekendDays: ['SATURDAY', 'SUNDAY'] });
      mockPrisma.holiday.findMany.mockResolvedValue([]);

      const createdRequest = {
        id: 'req-1',
        organizationId: orgA,
        employeeId: empA,
        leaveTypeId: 'lt-1',
        fromDate: new Date('2026-12-01'),
        toDate: new Date('2026-12-02'),
        numberOfDays: 2,
        durationType: 'full_day',
        reason: 'Family event',
        status: LeaveRequestStatus.PENDING_APPROVAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLeaveRequestsRepo.create.mockResolvedValue(createdRequest);
      mockLeaveBalancesRepo.findSpecificBalance.mockResolvedValue({
        id: 'bal-1',
        pending: 0,
        used: 0,
        openingBalance: 10,
        accrued: 0,
        granted: 0,
        carryForward: 0,
        adjustment: 0,
        encashed: 0,
      });

      const result = await leaveRequestsService.createLeaveRequest(
        orgA,
        {
          leaveTypeId: 'lt-1',
          employeeId: empA,
          fromDate: '2026-12-01',
          toDate: '2026-12-02',
          durationType: LeaveDurationType.FULL_DAY,
          reason: 'Family event',
        },
        userA,
      );

      expect(result.id).toBe('req-1');
      expect(result.status).toBe(LeaveRequestStatus.PENDING_APPROVAL);

      // Check balance reservation: pending incremented by 2
      expect(mockLeaveBalancesRepo.upsertBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: empA,
          leaveTypeId: 'lt-1',
          pending: 2,
        }),
        expect.anything(),
      );

      // Check balance history recorded
      expect(mockLeaveBalancesRepo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'leave_applied',
          amount: -2,
        }),
        expect.anything(),
      );

      // Check approval flow created
      expect(mockApprovalsService.createApprovalFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          requestType: 'LEAVE_REQUEST',
          entityType: 'LeaveRequest',
          entityId: 'req-1',
        }),
      );
    });

    it('should reject application if insufficient available balance and negative balance disallowed', async () => {
      mockEmployeesRepo.findById.mockResolvedValue(mockEmployee);
      mockLeaveTypesRepo.findById.mockResolvedValue(leaveType);
      mockLeavePoliciesRepo.findActivePoliciesForType.mockResolvedValue([]);
      mockLeaveRequestsRepo.findOverlappingRequests.mockResolvedValue([]);

      // Available balance is only 1, but requesting 3 days
      mockBalancesServiceForEmployee(1, 0, 0);

      mockPrisma.workweekConfig.findUnique.mockResolvedValue({ weekendDays: ['SATURDAY', 'SUNDAY'] });
      mockPrisma.holiday.findMany.mockResolvedValue([]);

      await expect(
        leaveRequestsService.createLeaveRequest(
          orgA,
          {
            leaveTypeId: 'lt-1',
            employeeId: empA,
            fromDate: '2026-12-01',
            toDate: '2026-12-03', // 3 days
            durationType: LeaveDurationType.FULL_DAY,
            reason: 'Vacation',
          },
          userA,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should commit balance from pending to used when request is approved', async () => {
      const pendingRequest = {
        id: 'req-1',
        organizationId: orgA,
        employeeId: empA,
        leaveTypeId: 'lt-1',
        fromDate: new Date('2026-12-01'),
        toDate: new Date('2026-12-02'),
        numberOfDays: 2,
        status: LeaveRequestStatus.PENDING_APPROVAL,
      };
      mockLeaveRequestsRepo.findById.mockResolvedValue(pendingRequest);
      mockLeaveBalancesRepo.findSpecificBalance.mockResolvedValue({
        id: 'bal-1',
        pending: 2,
        used: 1,
      });
      mockLeaveRequestsRepo.update.mockResolvedValue({
        ...pendingRequest,
        status: LeaveRequestStatus.APPROVED,
        approvedBy: userA,
      });

      const approved = await leaveRequestsService.approveLeaveRequest('req-1', orgA, userA);

      expect(approved.status).toBe(LeaveRequestStatus.APPROVED);
      // Pending decreased by 2, Used increased by 2
      expect(mockLeaveBalancesRepo.upsertBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          pending: 0,
          used: 3,
        }),
        expect.anything(),
      );
      expect(mockLeaveBalancesRepo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'leave_approved',
          amount: 2,
        }),
        expect.anything(),
      );
    });

    it('should release pending balance back to available when request is rejected', async () => {
      const pendingRequest = {
        id: 'req-2',
        organizationId: orgA,
        employeeId: empA,
        leaveTypeId: 'lt-1',
        fromDate: new Date('2026-12-01'),
        toDate: new Date('2026-12-02'),
        numberOfDays: 2,
        status: LeaveRequestStatus.PENDING_APPROVAL,
      };
      mockLeaveRequestsRepo.findById.mockResolvedValue(pendingRequest);
      mockLeaveBalancesRepo.findSpecificBalance.mockResolvedValue({
        id: 'bal-1',
        pending: 2,
        used: 0,
      });
      mockLeaveRequestsRepo.update.mockResolvedValue({
        ...pendingRequest,
        status: LeaveRequestStatus.REJECTED,
      });

      const rejected = await leaveRequestsService.rejectLeaveRequest('req-2', orgA, 'Project deadline', userA);

      expect(rejected.status).toBe(LeaveRequestStatus.REJECTED);
      // Pending released
      expect(mockLeaveBalancesRepo.upsertBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          pending: 0,
        }),
        expect.anything(),
      );
      expect(mockLeaveBalancesRepo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'leave_rejected',
        }),
        expect.anything(),
      );
    });

    it('should revert used balance when an approved request is cancelled', async () => {
      const approvedRequest = {
        id: 'req-3',
        organizationId: orgA,
        employeeId: empA,
        leaveTypeId: 'lt-1',
        fromDate: new Date('2026-12-01'),
        toDate: new Date('2026-12-02'),
        numberOfDays: 2,
        status: LeaveRequestStatus.CANCEL_REQUESTED,
      };
      mockLeaveRequestsRepo.findById.mockResolvedValue(approvedRequest);
      mockLeaveBalancesRepo.findSpecificBalance.mockResolvedValue({
        id: 'bal-1',
        used: 4,
        pending: 0,
      });
      mockLeaveRequestsRepo.update.mockResolvedValue({
        ...approvedRequest,
        status: LeaveRequestStatus.CANCELLED_AFTER_APPROVAL,
      });

      const cancelled = await leaveRequestsService.approveLeaveRequest('req-3', orgA, userA);

      expect(cancelled.status).toBe(LeaveRequestStatus.CANCELLED_AFTER_APPROVAL);
      // Used reduced by 2
      expect(mockLeaveBalancesRepo.upsertBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          used: 2,
        }),
        expect.anything(),
      );
    });
  });

  describe('5. Compensatory Off Flow', () => {
    it('should approve comp-off and credit granted leave days with 90-day expiry', async () => {
      const compOffReq = {
        id: 'co-1',
        organizationId: orgA,
        employeeId: empA,
        workedDate: new Date('2026-11-15T00:00:00.000Z'), // Sunday
        workedHours: 8,
        reason: 'Server upgrade over the weekend',
        creditedDays: 1.0,
        status: CompOffStatus.PENDING_APPROVAL,
      };

      mockCompOffRepo.findById.mockResolvedValue(compOffReq);
      mockPrisma.leaveType.findFirst.mockResolvedValue({
        id: 'lt-compoff',
        isCompOff: true,
      });
      mockPrisma.leaveBalance.upsert.mockResolvedValue({
        id: 'bal-compoff',
        closingBalance: 1.0,
      });
      mockCompOffRepo.update.mockResolvedValue({
        ...compOffReq,
        status: CompOffStatus.APPROVED,
        expiryDate: new Date('2027-02-13T00:00:00.000Z'),
      });

      const approved = await compOffService.approveCompOffRequest('co-1', orgA, userA);

      expect(approved.status).toBe(CompOffStatus.APPROVED);
      expect(mockPrisma.leaveBalance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            granted: { increment: 1.0 },
          }),
        }),
      );
      expect(mockPrisma.leaveBalanceHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'grant',
            amount: 1.0,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COMP_OFF_REQUEST_APPROVE,
        }),
      );
    });
  });

  describe('6. Manual Balance Adjustment with Audit Trail', () => {
    it('should adjust balance up or down and generate balance history with audit log', async () => {
      mockEmployeesRepo.findById.mockResolvedValue({ id: empA });
      mockLeaveTypesRepo.findById.mockResolvedValue({
        id: 'lt-1',
        name: 'Sick Leave',
        allowsNegativeBalance: false,
      });

      mockLeaveBalancesRepo.findSpecificBalance.mockResolvedValue({
        id: 'bal-sl',
        openingBalance: 5,
        accrued: 0,
        granted: 0,
        carryForward: 0,
        adjustment: 0,
        used: 1,
        pending: 0,
        encashed: 0,
      });

      mockLeaveBalancesRepo.upsertBalance.mockResolvedValue({
        id: 'bal-sl',
        organizationId: orgA,
        employeeId: empA,
        leaveTypeId: 'lt-1',
        year: 2026,
        openingBalance: 5,
        accrued: 0,
        granted: 0,
        carryForward: 0,
        adjustment: 2,
        used: 1,
        pending: 0,
        encashed: 0,
        closingBalance: 6,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await leaveBalancesService.adjustBalance(
        empA,
        {
          leaveTypeId: 'lt-1',
          year: 2026,
          adjustmentAmount: 2,
          reason: 'Correction of previous year carry forward',
        },
        orgA,
        userA,
      );

      expect(updated.adjustment).toBe(2);
      expect(updated.availableBalance).toBe(6);
      expect(mockLeaveBalancesRepo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'manual_adjustment',
          amount: 2,
          reason: 'Correction of previous year carry forward',
        }),
        expect.anything(),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LEAVE_BALANCE_ADJUST,
          entityId: 'bal-sl',
        }),
      );
    });
  });

  describe('7. Multi-Tenancy Scoping', () => {
    it('should not allow access to leave types belonging to another organization', async () => {
      mockLeaveTypesRepo.findById.mockImplementation((id: string, organizationId: string) => {
        if (organizationId === orgB) return Promise.resolve(null);
        return Promise.resolve({ id, organizationId: orgA, name: 'AL', code: 'AL' });
      });

      await expect(leaveTypesService.getLeaveTypeById('lt-1', orgB)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  function mockBalancesServiceForEmployee(available: number, used: number, pending: number) {
    mockLeaveTypesRepo.listActive.mockResolvedValue([]);
    mockLeaveBalancesRepo.findByEmployeeAndYear.mockResolvedValue([
      {
        id: 'bal-1',
        organizationId: orgA,
        employeeId: empA,
        leaveTypeId: 'lt-1',
        year: 2026,
        openingBalance: available + used + pending,
        accrued: 0,
        granted: 0,
        carryForward: 0,
        adjustment: 0,
        used,
        pending,
        encashed: 0,
        closingBalance: available + pending,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        leaveType: {
          id: 'lt-1',
          name: 'Casual Leave',
          code: 'CL',
          category: 'casual_leave',
          isPaid: true,
          isActive: true,
          allowsNegativeBalance: false,
          requiresApproval: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ]);
  }
});
