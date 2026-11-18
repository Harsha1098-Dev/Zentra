import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SafeFormulaEvaluator } from '../src/payroll/payroll-engine/safe-evaluator';
import { SalaryComponentsService } from '../src/payroll/salary-components/salary-components.service';
import { SalaryStructuresService } from '../src/payroll/salary-structures/salary-structures.service';
import { EmployeeSalaryService } from '../src/payroll/employee-salary/employee-salary.service';
import { PayrollPeriodsService } from '../src/payroll/payroll-periods/payroll-periods.service';
import { PayrollRunsService } from '../src/payroll/payroll-runs/payroll-runs.service';
import { PayrollPaymentsService } from '../src/payroll/payroll-payments/payroll-payments.service';
import { PayslipsService } from '../src/payroll/payslips/payslips.service';
import {
  SalaryComponentType,
  CalculationType,
  PayrollPeriodStatus,
  PayrollRunStatus,
  PayrollRunType,
  AuditAction,
} from '@zentra/shared-types';

describe('Payroll Module Test Suite', () => {
  const orgA = 'org-1111-aaaa';
  const orgB = 'org-2222-bbbb';
  const userA = 'user-admin-101';
  const userEmp1 = 'user-emp-201';
  const empId1 = 'emp-001';
  const empId2 = 'emp-002';

  // =========================================================================
  // 1. SAFE FORMULA EVALUATOR TESTS
  // =========================================================================
  describe('SafeFormulaEvaluator & Number to Words', () => {
    it('should evaluate standard arithmetic expressions with variables correctly', () => {
      const context = { BASIC: 50000, DA: 5000 };
      const result = SafeFormulaEvaluator.evaluate('BASIC * 0.4 + DA', context);
      expect(result).toBe(25000); // 20000 + 5000
    });

    it('should correctly respect operator precedence and parentheses', () => {
      const res1 = SafeFormulaEvaluator.evaluate('10 + 20 * 2', {});
      expect(res1).toBe(50);

      const res2 = SafeFormulaEvaluator.evaluate('(10 + 20) * 2', {});
      expect(res2).toBe(60);
    });

    it('should support math functions like min, max, round, floor, ceil, abs', () => {
      expect(SafeFormulaEvaluator.evaluate('min(100, 50)', {})).toBe(50);
      expect(SafeFormulaEvaluator.evaluate('max(100, 50)', {})).toBe(100);
      expect(SafeFormulaEvaluator.evaluate('round(15.6)', {})).toBe(16);
      expect(SafeFormulaEvaluator.evaluate('floor(15.9)', {})).toBe(15);
      expect(SafeFormulaEvaluator.evaluate('ceil(15.1)', {})).toBe(16);
      expect(SafeFormulaEvaluator.evaluate('abs(-42)', {})).toBe(42);
    });

    it('should safely handle division by zero by returning 0 without crashing', () => {
      const result = SafeFormulaEvaluator.evaluate('100 / 0', {});
      expect(result).toBe(0);
      expect(isFinite(result)).toBe(true);
    });

    it('should detect circular dependency cycles in salary component formulas', () => {
      const formulasWithCycle = {
        BASIC: 'HRA * 0.5',
        HRA: 'BASIC * 0.4',
      };

      const cycle = SafeFormulaEvaluator.detectCircularDependencies(formulasWithCycle);
      expect(cycle).not.toBeNull();
      expect(cycle?.length).toBeGreaterThan(0);
    });

    it('should accept acyclic salary component formulas', () => {
      const validFormulas = {
        BASIC: 'CTC * 0.5',
        HRA: 'BASIC * 0.4',
        SPECIAL_ALLOWANCE: 'CTC - BASIC - HRA',
      };

      const cycle = SafeFormulaEvaluator.detectCircularDependencies(validFormulas);
      expect(cycle).toBeNull();
    });

    it('should convert currency amounts to words in Indian Numbering System', () => {
      expect(SafeFormulaEvaluator.numberToWords(0)).toBe('Zero Rupees Only');
      expect(SafeFormulaEvaluator.numberToWords(500)).toBe('Five Hundred Rupees Only');
      expect(SafeFormulaEvaluator.numberToWords(1500)).toBe('One Thousand Five Hundred Rupees Only');
      expect(SafeFormulaEvaluator.numberToWords(75000)).toBe('Seventy Five Thousand Rupees Only');
      expect(SafeFormulaEvaluator.numberToWords(150000)).toBe('One Lakh Fifty Thousand Rupees Only');
      expect(SafeFormulaEvaluator.numberToWords(10000000)).toBe('One Crore Rupees Only');
      expect(SafeFormulaEvaluator.numberToWords(54321)).toBe('Fifty Four Thousand Three Hundred Twenty One Rupees Only');
    });
  });

  // =========================================================================
  // 2. SALARY COMPONENTS SERVICE TESTS
  // =========================================================================
  describe('SalaryComponentsService', () => {
    let service: SalaryComponentsService;
    let mockRepo: any;
    let mockAuditService: any;

    beforeEach(() => {
      mockRepo = {
        findByCode: jest.fn(),
        findByName: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
      };
      mockAuditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
      service = new SalaryComponentsService(mockRepo, mockAuditService);
    });

    it('should create an earning salary component successfully', async () => {
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.findByName.mockResolvedValue(null);
      mockRepo.create.mockImplementation((orgId: string, data: any) =>
        Promise.resolve({ id: 'comp-1', organizationId: orgId, ...data }),
      );

      const res = await service.create(
        orgA,
        {
          name: 'Basic Salary',
          componentCode: 'BASIC',
          componentType: SalaryComponentType.EARNING,
          calculationType: CalculationType.PERCENTAGE_OF_CTC,
          percentage: 50,
          isTaxable: true,
          includeInCtc: true,
        },
        userA,
      );

      expect(res.componentCode).toBe('BASIC');
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgA,
          action: AuditAction.SALARY_COMPONENT_CREATE,
        }),
      );
    });

    it('should throw ConflictException if component code already exists in organization', async () => {
      mockRepo.findByCode.mockResolvedValue({ id: 'existing-comp', componentCode: 'BASIC' });

      await expect(
        service.create(
          orgA,
          {
            name: 'Basic Salary Duplicate',
            componentCode: 'BASIC',
            componentType: SalaryComponentType.EARNING,
            calculationType: CalculationType.FIXED_AMOUNT,
            amount: 20000,
          },
          userA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should validate formula when calculationType is FORMULA_BASED', async () => {
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.findByName.mockResolvedValue(null);

      await expect(
        service.create(
          orgA,
          {
            name: 'Invalid Formula Comp',
            componentCode: 'TEST',
            componentType: SalaryComponentType.EARNING,
            calculationType: CalculationType.FORMULA_BASED,
            formula: 'BASIC * + / invalid_syntax',
          },
          userA,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // 3. SALARY STRUCTURES SERVICE TESTS
  // =========================================================================
  describe('SalaryStructuresService', () => {
    let service: SalaryStructuresService;
    let mockRepo: any;
    let mockComponentsRepo: any;
    let mockAuditService: any;

    beforeEach(() => {
      mockRepo = {
        findByName: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        clearDefault: jest.fn(),
      };
      mockComponentsRepo = {
        findById: jest.fn().mockImplementation((id: string) =>
          Promise.resolve({
            id,
            componentCode: id.toUpperCase(),
            componentType: SalaryComponentType.EARNING,
          }),
        ),
      };
      mockAuditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
      service = new SalaryStructuresService(mockRepo, mockComponentsRepo, mockAuditService);
    });

    it('should create a valid salary structure', async () => {
      mockRepo.findByName.mockResolvedValue(null);
      mockRepo.create.mockImplementation((orgId: string, data: any) =>
        Promise.resolve({ id: 'struct-1', organizationId: orgId, ...data }),
      );

      const res = await service.create(
        orgA,
        {
          name: 'Standard Corporate Structure',
          code: 'CORP_STD',
          isDefault: true,
          components: [
            { salaryComponentId: 'comp-basic', orderIndex: 1 },
            { salaryComponentId: 'comp-hra', orderIndex: 2 },
          ],
        },
        userA,
      );

      expect(res.name).toBe('Standard Corporate Structure');
      expect(mockRepo.clearDefault).toHaveBeenCalledWith(orgA);
    });

    it('should throw ConflictException if structure name already exists', async () => {
      mockRepo.findByName.mockResolvedValue({ id: 'struct-old', name: 'Existing Structure' });

      await expect(
        service.create(
          orgA,
          {
            name: 'Existing Structure',
            components: [],
          },
          userA,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================================================================
  // 4. EMPLOYEE SALARY ASSIGNMENT & REVISIONS TESTS
  // =========================================================================
  describe('EmployeeSalaryService', () => {
    let service: EmployeeSalaryService;
    let mockRepo: any;
    let mockStructuresRepo: any;
    let mockEmployeesRepo: any;
    let mockAuditService: any;
    let mockEmailService: any;

    beforeEach(() => {
      mockRepo = {
        findActiveAssignment: jest.fn(),
        findAssignmentsByEmployee: jest.fn(),
        createAssignment: jest.fn(),
        findAllAssignments: jest.fn(),
        supersedePriorAssignments: jest.fn().mockResolvedValue({}),
      };
      mockStructuresRepo = {
        findById: jest.fn(),
      };
      mockEmployeesRepo = {
        findById: jest.fn(),
        findByUserId: jest.fn(),
      };
      mockAuditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
      mockEmailService = { sendNotification: jest.fn().mockResolvedValue(true) };

      service = new EmployeeSalaryService(
        mockRepo,
        mockStructuresRepo,
        mockEmployeesRepo,
        mockAuditService,
        mockEmailService,
      );
    });

    it('should assign a salary structure and create a revision with correct CTC', async () => {
      mockEmployeesRepo.findById.mockResolvedValue({ id: empId1, organizationId: orgA, firstName: 'John' });
      mockStructuresRepo.findById.mockResolvedValue({ id: 'struct-1', organizationId: orgA, name: 'Standard Structure' });
      mockRepo.createAssignment.mockResolvedValue({
        id: 'assign-1',
        employeeId: empId1,
        annualCtc: 600000,
        effectiveFrom: new Date('2026-04-01'),
      });

      const res = await service.assignStructure(
        orgA,
        {
          employeeId: empId1,
          salaryStructureId: 'struct-1',
          annualCtc: 600000,
          effectiveFrom: '2026-04-01',
          revisionReason: 'Annual Appraisal',
        },
        userA,
      );

      expect(res.annualCtc).toBe(600000);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SALARY_STRUCTURE_ASSIGN,
        }),
      );
    });
  });

  // =========================================================================
  // 5. PAYROLL PERIODS SERVICE TESTS
  // =========================================================================
  describe('PayrollPeriodsService', () => {
    let service: PayrollPeriodsService;
    let mockRepo: any;
    let mockOrgsRepo: any;
    let mockAuditService: any;

    beforeEach(() => {
      mockRepo = {
        findByMonthAndYear: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        updateStatus: jest.fn(),
      };
      mockOrgsRepo = {
        findById: jest.fn().mockResolvedValue({ id: orgA, createdAt: new Date('2025-01-01') }),
      };
      mockAuditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
      service = new PayrollPeriodsService(mockRepo, mockOrgsRepo, mockAuditService);
    });

    it('should create a payroll period with cutoffs and default to UPCOMING status', async () => {
      mockRepo.findByMonthAndYear.mockResolvedValue(null);
      mockRepo.create.mockImplementation((orgId: string, data: any) => Promise.resolve({ id: 'period-1', ...data }));

      const res = await service.create(
        orgA,
        {
          payrollYear: 2026,
          payrollMonth: 11,
          periodStartDate: '2026-11-01',
          periodEndDate: '2026-11-30',
          payDate: '2026-11-30',
          attendanceCutoffDate: '2026-11-25',
          leaveCutoffDate: '2026-11-25',
          payrollCutoffDate: '2026-11-27',
        },
        userA,
      );

      expect(res.status).toBe(PayrollPeriodStatus.UPCOMING);
      expect(res.payrollMonth).toBe(11);
    });

    it('should throw ConflictException when creating a duplicate period for the same year and month', async () => {
      mockRepo.findByMonthAndYear.mockResolvedValue({ id: 'existing-period', payrollYear: 2026, payrollMonth: 11 });

      await expect(
        service.create(
          orgA,
          {
            payrollYear: 2026,
            payrollMonth: 11,
            periodStartDate: '2026-11-01',
            periodEndDate: '2026-11-30',
            payDate: '2026-11-30',
            attendanceCutoffDate: '2026-11-25',
            leaveCutoffDate: '2026-11-25',
            payrollCutoffDate: '2026-11-27',
          },
          userA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should disallow updating a locked period', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'period-locked',
        organizationId: orgA,
        status: PayrollPeriodStatus.LOCKED,
      });

      await expect(
        service.update('period-locked', orgA, { payDate: '2026-12-05' }, userA),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // 6. PAYROLL RUNS & CALCULATION ENGINE TESTS
  // =========================================================================
  describe('PayrollRunsService & Calculator Engine', () => {
    let service: PayrollRunsService;
    let mockRepo: any;
    let mockPeriodsRepo: any;
    let mockExceptionsRepo: any;
    let mockCalculatorService: any;
    let mockAuditService: any;

    beforeEach(() => {
      mockRepo = {
        create: jest.fn(),
        findById: jest.fn(),
        findByPeriodAndType: jest.fn().mockResolvedValue(null),
        findAll: jest.fn(),
        update: jest.fn(),
        updateStatus: jest.fn(),
        getEmployeeRecords: jest.fn(),
      };
      mockPeriodsRepo = {
        findById: jest.fn(),
      };
      mockExceptionsRepo = {
        countUnresolvedCritical: jest.fn(),
      };
      mockCalculatorService = {
        calculateRun: jest.fn(),
      };
      mockAuditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };

      service = new PayrollRunsService(
        mockRepo,
        mockPeriodsRepo,
        mockExceptionsRepo,
        mockCalculatorService,
        mockAuditService,
      );
    });

    it('should create a payroll run in DRAFT status', async () => {
      mockPeriodsRepo.findById.mockResolvedValue({ id: 'period-1', organizationId: orgA });
      mockRepo.create.mockImplementation((orgId: string, data: any) => Promise.resolve({ id: 'run-1', ...data }));

      const res = await service.create(
        orgA,
        {
          payrollPeriodId: 'period-1',
          runName: 'November 2026 Regular Payroll',
          runType: PayrollRunType.REGULAR,
        },
        userA,
      );

      expect(res.status).toBe(PayrollRunStatus.DRAFT);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should block submission for approval when unresolved critical exceptions exist', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'run-1',
        organizationId: orgA,
        status: PayrollRunStatus.CALCULATED,
      });
      mockExceptionsRepo.countUnresolvedCritical.mockResolvedValue(2); // 2 unresolved critical exceptions

      await expect(service.submit('run-1', orgA, userA)).rejects.toThrow(
        /Cannot submit payroll for approval: There are 2 unresolved critical exception/,
      );
    });

    it('should allow submission for approval when all critical exceptions are resolved or overridden', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'run-1',
        organizationId: orgA,
        status: PayrollRunStatus.CALCULATED,
      });
      mockExceptionsRepo.countUnresolvedCritical.mockResolvedValue(0);
      mockRepo.updateStatus.mockResolvedValue({
        id: 'run-1',
        status: PayrollRunStatus.UNDER_REVIEW,
      });

      const res = await service.submit('run-1', orgA, userA);
      expect(res.status).toBe(PayrollRunStatus.UNDER_REVIEW);
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'run-1',
        orgA,
        PayrollRunStatus.UNDER_REVIEW,
        expect.any(Object),
      );
    });

    it('should approve payroll run from UNDER_REVIEW status', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'run-1',
        organizationId: orgA,
        status: PayrollRunStatus.UNDER_REVIEW,
      });
      mockRepo.updateStatus.mockResolvedValue({
        id: 'run-1',
        status: PayrollRunStatus.APPROVED,
      });

      const res = await service.approve('run-1', orgA, userA);
      expect(res.status).toBe(PayrollRunStatus.APPROVED);
    });
  });

  // =========================================================================
  // 7. PAYROLL PAYMENTS SERVICE TESTS
  // =========================================================================
  describe('PayrollPaymentsService', () => {
    let service: PayrollPaymentsService;
    let mockRepo: any;
    let mockRunsRepo: any;
    let mockAuditService: any;

    beforeEach(() => {
      mockRepo = {
        markRunPaid: jest.fn(),
        markEmployeePaid: jest.fn(),
        uploadPaymentProof: jest.fn(),
        getPaymentStatus: jest.fn(),
      };
      mockRunsRepo = {
        findById: jest.fn(),
      };
      mockAuditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };

      service = new PayrollPaymentsService(mockRepo, mockRunsRepo, mockAuditService);
    });

    it('should reject marking as paid if payroll run is not in APPROVED status', async () => {
      mockRunsRepo.findById.mockResolvedValue({
        id: 'run-1',
        organizationId: orgA,
        status: PayrollRunStatus.UNDER_REVIEW, // not approved
      });

      await expect(
        service.markRunPaid(
          'run-1',
          orgA,
          { paymentReference: 'NEFT-123456' },
          userA,
        ),
      ).rejects.toThrow(/Cannot mark payroll run as paid unless it has been APPROVED/);
    });

    it('should mark run as paid and update records when payroll is APPROVED', async () => {
      mockRunsRepo.findById.mockResolvedValue({
        id: 'run-1',
        organizationId: orgA,
        status: PayrollRunStatus.APPROVED,
      });
      mockRepo.markRunPaid.mockResolvedValue({
        id: 'run-1',
        status: PayrollRunStatus.PAID,
        paymentReference: 'NEFT-123456',
      });

      const res = await service.markRunPaid(
        'run-1',
        orgA,
        { paymentReference: 'NEFT-123456', paymentDate: '2026-11-30' },
        userA,
      );

      expect(res.status).toBe(PayrollRunStatus.PAID);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PAYROLL_PAYMENT_MARK_PAID,
        }),
      );
    });
  });

  // =========================================================================
  // 8. PAYSLIPS & EMPLOYEE SELF-SERVICE ACCESS CONTROL
  // =========================================================================
  describe('PayslipsService & Employee Self-Service', () => {
    let service: PayslipsService;
    let mockRepo: any;
    let mockTemplatesRepo: any;
    let mockTemplatesService: any;
    let mockEmployeesRepo: any;
    let mockPrisma: any;
    let mockAuditService: any;
    let mockEmailService: any;

    beforeEach(() => {
      mockRepo = {
        findByRun: jest.fn(),
        findByEmployee: jest.fn(),
        findByRecordId: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'slip-1', ...data })),
        update: jest.fn().mockImplementation((id: string, data: any) => Promise.resolve({ id, ...data })),
        findById: jest.fn(),
        recordView: jest.fn(),
        recordDownload: jest.fn(),
        findAll: jest.fn(),
      };
      mockTemplatesRepo = {
        findDefault: jest.fn(),
        findAll: jest.fn().mockResolvedValue([]),
      };
      mockTemplatesService = {
        preview: jest.fn().mockResolvedValue({ previewHtml: '<html><body>Payslip</body></html>' }),
      };
      mockEmployeesRepo = {
        findByUserId: jest.fn(),
      };
      mockPrisma = {
        payrollRun: { findFirst: jest.fn(), update: jest.fn() },
        employee: { findFirst: jest.fn() },
        payslip: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn(), upsert: jest.fn() },
        payrollEmployeeRecord: { update: jest.fn(), updateMany: jest.fn() },
        $transaction: jest.fn().mockImplementation(async (callback: any) => callback(mockPrisma)),
      };
      mockAuditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
      mockEmailService = { sendNotification: jest.fn().mockResolvedValue(true) };

      service = new PayslipsService(
        mockPrisma,
        mockRepo,
        mockTemplatesRepo,
        mockTemplatesService,
        mockEmployeesRepo,
        mockAuditService,
        mockEmailService,
      );
    });

    it('should block payslip generation if payroll run is not marked PAID', async () => {
      mockPrisma.payrollRun.findFirst.mockResolvedValue({
        id: 'run-1',
        organizationId: orgA,
        status: PayrollRunStatus.APPROVED, // approved but NOT paid!
      });

      await expect(
        service.generatePayslips('run-1', orgA, userA),
      ).rejects.toThrow(/Cannot generate payslips before payroll run is marked as PAID/);
    });

    it('should allow payslip generation when payroll run is PAID', async () => {
      mockPrisma.payrollRun.findFirst.mockResolvedValue({
        id: 'run-1',
        organizationId: orgA,
        status: PayrollRunStatus.PAID,
        payDate: new Date('2026-11-30'),
        payrollPeriod: { payrollMonth: 11, payrollYear: 2026 },
        records: [
          {
            id: 'rec-1',
            employeeId: empId1,
            grossEarnings: 50000,
            totalDeductions: 5000,
            netPay: 45000,
            snapshotData: {
              breakdowns: {
                earnings: [{ code: 'BASIC', name: 'Basic', amount: 50000 }],
                deductions: [{ code: 'PF', name: 'Provident Fund', amount: 5000 }],
                contributions: [],
              },
            },
            calendarDays: 30,
            payableDays: 30,
            lopDays: 0,
            employee: { id: empId1, workEmail: 'john@zentra.test' },
          },
        ],
      });
      mockTemplatesRepo.findDefault.mockResolvedValue({ id: 'tpl-1' });

      const res = await service.generatePayslips('run-1', orgA, userA);
      expect(res.success).toBe(true);
      expect(res.generatedCount).toBe(1);
    });

    it('should block an employee from accessing another employee payslip', async () => {
      // Mock employee associated with userEmp1
      mockEmployeesRepo.findByUserId.mockResolvedValue({
        id: empId1,
        organizationId: orgA,
        userId: userEmp1,
      });

      // Mock payslip belonging to empId2 (different employee)
      mockRepo.findById.mockResolvedValue({
        id: 'slip-999',
        organizationId: orgA,
        employeeId: empId2, // belongs to empId2!
        status: 'PUBLISHED',
      });

      await expect(
        service.getMyPayslip('slip-999', userEmp1, orgA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent an employee from viewing their payslip if it is not yet PUBLISHED', async () => {
      mockEmployeesRepo.findByUserId.mockResolvedValue({
        id: empId1,
        organizationId: orgA,
        userId: userEmp1,
      });

      mockRepo.findById.mockResolvedValue({
        id: 'slip-101',
        organizationId: orgA,
        employeeId: empId1,
        status: 'DRAFT', // Not published yet
      });

      await expect(
        service.getMyPayslip('slip-101', userEmp1, orgA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow employee to view and download their own published payslip', async () => {
      mockEmployeesRepo.findByUserId.mockResolvedValue({
        id: empId1,
        organizationId: orgA,
        userId: userEmp1,
      });

      mockRepo.findById.mockResolvedValue({
        id: 'slip-101',
        payslipNumber: 'PAY-202611-EMP001',
        organizationId: orgA,
        employeeId: empId1,
        status: 'PUBLISHED',
        netPay: 45000,
        grossEarnings: 50000,
        totalDeductions: 5000,
        netPayWords: 'Forty Five Thousand Rupees Only',
        earningsBreakdown: [{ name: 'Basic', amount: 50000 }],
        deductionsBreakdown: [{ name: 'PF', amount: 5000 }],
        employee: {
          firstName: 'John',
          lastName: 'Doe',
          employeeCode: 'EMP001',
          dateOfJoining: new Date('2024-01-01'),
        },
      });

      const res = await service.downloadMyPayslip('slip-101', userEmp1, orgA);
      expect(res.payslip.payslipNumber).toBe('PAY-202611-EMP001');
      expect(res.filename).toBe('Payslip_PAY-202611-EMP001.html');
      expect(res.html).toBeDefined();
    });
  });

  // =========================================================================
  // 9. TENANT ISOLATION TESTS
  // =========================================================================
  describe('Multi-Tenant Isolation', () => {
    it('should never return organization B records when requesting organization A', async () => {
      const mockRepo = {
        findAll: jest.fn().mockImplementation((orgId: string) => {
          if (orgId === orgA) {
            return Promise.resolve([{ id: 'comp-orgA', organizationId: orgA }]);
          }
          return Promise.resolve([{ id: 'comp-orgB', organizationId: orgB }]);
        }),
      };
      const mockAudit = { log: jest.fn() };
      const compService = new SalaryComponentsService(mockRepo as any, mockAudit as any);

      const orgAResults = await compService.findAll(orgA);
      expect(orgAResults.every((item: any) => item.organizationId === orgA)).toBe(true);

      const orgBResults = await compService.findAll(orgB);
      expect(orgBResults.every((item: any) => item.organizationId === orgB)).toBe(true);
    });
  });
});
