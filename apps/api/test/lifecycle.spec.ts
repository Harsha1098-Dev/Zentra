import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnboardingService } from '../src/lifecycle/onboarding/onboarding.service';
import { OnboardingRepository } from '../src/lifecycle/onboarding/onboarding.repository';
import { ProbationService } from '../src/lifecycle/probation/probation.service';
import { ProbationRepository } from '../src/lifecycle/probation/probation.repository';
import { TransfersService } from '../src/lifecycle/transfers/transfers.service';
import { TransfersRepository } from '../src/lifecycle/transfers/transfers.repository';
import { PromotionsService } from '../src/lifecycle/promotions/promotions.service';
import { PromotionsRepository } from '../src/lifecycle/promotions/promotions.repository';
import { SalaryRevisionsService } from '../src/lifecycle/salary-revisions/salary-revisions.service';
import { SalaryRevisionsRepository } from '../src/lifecycle/salary-revisions/salary-revisions.repository';
import { ResignationsService } from '../src/lifecycle/resignations/resignations.service';
import { ResignationsRepository } from '../src/lifecycle/resignations/resignations.repository';
import { ExitClearanceService } from '../src/lifecycle/exit-clearance/exit-clearance.service';
import { ExitClearanceRepository } from '../src/lifecycle/exit-clearance/exit-clearance.repository';
import { OffboardingService } from '../src/lifecycle/offboarding/offboarding.service';
import { OffboardingRepository } from '../src/lifecycle/offboarding/offboarding.repository';
import { AssetsService } from '../src/lifecycle/assets/assets.service';
import { AssetsRepository } from '../src/lifecycle/assets/assets.repository';
import { LettersService } from '../src/lifecycle/letters/letters.service';
import { LettersRepository } from '../src/lifecycle/letters/letters.repository';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { EmailService } from '../src/email/email.service';
import {
  OnboardingRunStatus,
  ProbationRecommendation,
  ProbationStatus,
  TransitionStatus,
  SalaryRevisionType,
  SalaryRevisionStatus,
  ResignationStatus,
  ClearanceType,
  ClearanceStatus,
  OffboardingStatus,
  AssetCondition,
  AssetReturnStatus,
  LifecycleLetterType,
} from '@zentra/shared-types';

describe('Employee Lifecycle Suite', () => {
  let onboardingService: OnboardingService;
  let probationService: ProbationService;
  let transfersService: TransfersService;
  let promotionsService: PromotionsService;
  let salaryRevisionsService: SalaryRevisionsService;
  let resignationsService: ResignationsService;
  let exitClearanceService: ExitClearanceService;
  let offboardingService: OffboardingService;
  let assetsService: AssetsService;
  let lettersService: LettersService;

  const orgId = 'org-lifecycle-100';
  const userId = 'usr-admin-100';

  const mockPrisma: any = {
    $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    employee: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    organization: {
      findFirst: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
    },
    designation: {
      findFirst: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
    grade: {
      findFirst: jest.fn(),
    },
    salaryStructure: {
      findFirst: jest.fn(),
    },
    employeeSalaryAssignment: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    employmentHistory: {
      create: jest.fn().mockResolvedValue({ id: 'hist-1' }),
    },
    exitClearance: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    exitInterview: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    resignationRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    offboardingRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    asset: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    lifecycleLetter: {
      create: jest.fn(),
    },
    onboardingRun: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    probationReview: {
      findFirst: jest.fn(),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'prob-1', ...data })),
    },
    employeeTransition: {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    salaryRevision: {
      update: jest.fn(),
    },
  };

  const mockOnboardingRepo = {
    findFlowById: jest.fn(),
    createRun: jest.fn(),
    findRunById: jest.fn(),
    updateRun: jest.fn(),
    updateRunItem: jest.fn(),
    findRunItemById: jest.fn(),
  };

  const mockProbationRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  };

  const mockTransfersRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  };

  const mockPromotionsRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  };

  const mockSalaryRevisionsRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  };

  const mockResignationsRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  };

  const mockExitClearanceRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  };

  const mockOffboardingRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    saveExitInterview: jest.fn(),
  };

  const mockAssetsRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  };

  const mockLettersRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(true),
  };

  const mockEmailService = {
    sendNotification: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        ProbationService,
        TransfersService,
        PromotionsService,
        SalaryRevisionsService,
        ResignationsService,
        ExitClearanceService,
        OffboardingService,
        AssetsService,
        LettersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OnboardingRepository, useValue: mockOnboardingRepo },
        { provide: ProbationRepository, useValue: mockProbationRepo },
        { provide: TransfersRepository, useValue: mockTransfersRepo },
        { provide: PromotionsRepository, useValue: mockPromotionsRepo },
        { provide: SalaryRevisionsRepository, useValue: mockSalaryRevisionsRepo },
        { provide: ResignationsRepository, useValue: mockResignationsRepo },
        { provide: ExitClearanceRepository, useValue: mockExitClearanceRepo },
        { provide: OffboardingRepository, useValue: mockOffboardingRepo },
        { provide: AssetsRepository, useValue: mockAssetsRepo },
        { provide: LettersRepository, useValue: mockLettersRepo },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    onboardingService = module.get(OnboardingService);
    probationService = module.get(ProbationService);
    transfersService = module.get(TransfersService);
    promotionsService = module.get(PromotionsService);
    salaryRevisionsService = module.get(SalaryRevisionsService);
    resignationsService = module.get(ResignationsService);
    exitClearanceService = module.get(ExitClearanceService);
    offboardingService = module.get(OffboardingService);
    assetsService = module.get(AssetsService);
    lettersService = module.get(LettersService);
  });

  // ==========================================
  // 1. ONBOARDING
  // ==========================================
  describe('1. Onboarding Module', () => {
    it('initiates an onboarding run for an active employee', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: 'emp-1',
        firstName: 'John',
        lastName: 'Doe',
        workEmail: 'john@example.com',
      });
      mockOnboardingRepo.findFlowById.mockResolvedValue({
        id: 'flow-1',
        name: 'Standard Engineering Flow',
        items: [{ title: 'Sign NDA', stepOrder: 1 }],
      });
      mockOnboardingRepo.createRun.mockResolvedValue({
        id: 'run-1',
        onboardingFlowId: 'flow-1',
        employeeId: 'emp-1',
        status: OnboardingRunStatus.IN_PROGRESS,
      });

      const run = await onboardingService.createRun(
        orgId,
        { onboardingFlowId: 'flow-1', employeeId: 'emp-1' },
        userId,
      );

      expect(run.id).toBe('run-1');
      expect(mockEmailService.sendNotification).toHaveBeenCalledWith(
        'john@example.com',
        expect.stringContaining('Onboarding Has Started'),
        expect.any(String),
      );
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('rejects initiation if employee or flow is not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      await expect(
        onboardingService.createRun(orgId, { onboardingFlowId: 'flow-1', employeeId: 'emp-404' }, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==========================================
  // 2. PROBATION REVIEW & CONFIRMATION
  // ==========================================
  describe('2. Probation Tracking & Confirmation', () => {
    it('confirms employee probation and changes status to ACTIVE', async () => {
      mockProbationRepo.findById.mockResolvedValue({
        id: 'prob-1',
        employeeId: 'emp-1',
        status: ProbationStatus.SUBMITTED,
        employee: { id: 'emp-1', status: 'ON_PROBATION' },
      });
      mockProbationRepo.update.mockResolvedValue({
        id: 'prob-1',
        status: ProbationStatus.CONFIRMED,
      });
      mockPrisma.employee.update.mockResolvedValue({
        id: 'emp-1',
        status: 'ACTIVE',
      });

      const confirmed = await probationService.approveReview(
        'prob-1',
        orgId,
        { action: 'CONFIRM', comments: 'Exceeded performance goals' },
        userId,
      );

      expect(confirmed.status).toBe(ProbationStatus.CONFIRMED);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'emp-1' },
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
      expect(mockPrisma.employmentHistory.create).toHaveBeenCalled();
    });

    it('extends probation period by specified extension date', async () => {
      const currentEnd = new Date('2026-11-30');
      mockProbationRepo.findById.mockResolvedValue({
        id: 'prob-2',
        employeeId: 'emp-2',
        status: ProbationStatus.SUBMITTED,
        employee: { id: 'emp-2', probationEndDate: currentEnd },
      });
      mockProbationRepo.update.mockResolvedValue({
        id: 'prob-2',
        status: ProbationStatus.EXTENDED,
      });

      const extended = await probationService.approveReview(
        'prob-2',
        orgId,
        { action: 'EXTEND', extensionDate: '2027-01-31', comments: 'Requires additional ramp-up time' },
        userId,
      );

      expect(extended.status).toBe(ProbationStatus.EXTENDED);
      expect(mockPrisma.employee.update).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. EMPLOYEE TRANSFERS & CIRCULAR HIERARCHY
  // ==========================================
  describe('3. Employee Transfers', () => {
    it('detects and blocks circular reporting manager hierarchy', async () => {
      mockPrisma.employee.findFirst
        .mockResolvedValueOnce({
          id: 'emp-alice',
          reportingManagerId: null,
          transitions: [],
        })
        .mockResolvedValueOnce({
          id: 'emp-bob',
          // Bob reports to Alice!
          reportingManagerId: 'emp-alice',
        });

      await expect(
        transfersService.create(
          orgId,
          {
            employeeId: 'emp-alice',
            newReportingManagerId: 'emp-bob',
            effectiveFrom: '2026-12-01',
            reason: 'Org Restructure',
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('approves transfer and records update in employment history', async () => {
      mockTransfersRepo.findById.mockResolvedValue({
        id: 'tr-1',
        status: TransitionStatus.PENDING_APPROVAL,
        employee: {
          id: 'emp-1',
          departmentId: 'dept-old',
          designationId: 'desig-old',
          locationId: 'loc-old',
          gradeId: null,
          reportingManagerId: null,
        },
        newDepartmentId: 'dept-new',
        newDesignationId: 'desig-old',
        newLocationId: 'loc-new',
        newGradeId: null,
        newReportingManagerId: null,
        effectiveFrom: new Date('2026-12-01'),
        reason: 'Relocation',
      });
      mockTransfersRepo.update.mockResolvedValue({
        id: 'tr-1',
        status: TransitionStatus.APPROVED,
      });

      const res = await transfersService.approve('tr-1', orgId, userId);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'emp-1' },
          data: expect.objectContaining({ departmentId: 'dept-new', locationId: 'loc-new' }),
        }),
      );
      expect(mockPrisma.employmentHistory.create).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 4. EMPLOYEE PROMOTIONS
  // ==========================================
  describe('4. Employee Promotions', () => {
    it('approves promotion and updates employee designation and grade', async () => {
      mockPromotionsRepo.findById.mockResolvedValue({
        id: 'prom-1',
        status: TransitionStatus.PENDING_APPROVAL,
        employee: {
          id: 'emp-1',
          designationId: 'desig-junior',
          gradeId: 'grade-1',
          departmentId: 'dept-eng',
          locationId: 'loc-hq',
        },
        newDesignationId: 'desig-senior',
        newGradeId: 'grade-2',
        reason: 'Top performer',
        remarks: JSON.stringify({ notes: 'Promoted to Senior Engineer' }),
      });

      await promotionsService.approve('prom-1', orgId, userId);

      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'emp-1' },
          data: expect.objectContaining({
            designationId: 'desig-senior',
            gradeId: 'grade-2',
          }),
        }),
      );
      expect(mockPrisma.employmentHistory.create).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 5. SALARY REVISIONS & HISTORY PRESERVATION
  // ==========================================
  describe('5. Salary Revisions', () => {
    it('approves revision, supersedes previous active assignment, and creates new active assignment', async () => {
      mockSalaryRevisionsRepo.findById.mockResolvedValue({
        id: 'rev-1',
        status: SalaryRevisionStatus.PENDING_APPROVAL,
        employee: { id: 'emp-1' },
        currentSalaryStructureId: 'struct-1',
        newSalaryStructureId: 'struct-1',
        currentAnnualCtc: 1200000,
        newAnnualCtc: 1500000,
        revisionType: SalaryRevisionType.ANNUAL_INCREMENT,
        effectiveFrom: new Date('2026-12-01'),
        reason: 'Annual appraisal cycle',
      });
      mockPrisma.employeeSalaryAssignment.findMany.mockResolvedValue([
        { id: 'assign-old', status: 'ACTIVE' },
      ]);
      mockPrisma.salaryRevision.update.mockResolvedValue({
        id: 'rev-1',
        status: SalaryRevisionStatus.APPROVED,
      });

      await salaryRevisionsService.approve('rev-1', orgId, userId);

      // Verify old assignment is superseded
      expect(mockPrisma.employeeSalaryAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'assign-old' },
          data: expect.objectContaining({ status: 'SUPERSEDED' }),
        }),
      );

      // Verify new assignment is created with updated CTC
      expect(mockPrisma.employeeSalaryAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: 'emp-1',
            annualCtc: 1500000,
            status: 'ACTIVE',
          }),
        }),
      );
      expect(mockPrisma.employmentHistory.create).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 6. RESIGNATIONS & EXIT CLEARANCES
  // ==========================================
  describe('6. Resignations & Clearances', () => {
    it('approves resignation and auto-generates mandatory exit clearances and offboarding request', async () => {
      mockResignationsRepo.findById.mockResolvedValue({
        id: 'res-1',
        employeeId: 'emp-1',
        status: ResignationStatus.PENDING_APPROVAL,
        lastWorkingDate: new Date('2026-12-31'),
        comments: 'Relocation to another state',
      });
      mockPrisma.resignationRequest.update.mockResolvedValue({
        id: 'res-1',
        status: ResignationStatus.APPROVED,
      });

      await resignationsService.approve('res-1', orgId, {}, userId);

      // Verify default exit clearances created
      expect(mockPrisma.exitClearance.create).toHaveBeenCalledTimes(5);
      // Verify OffboardingRequest created
      expect(mockPrisma.offboardingRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: 'emp-1',
            resignationRequestId: 'res-1',
            status: OffboardingStatus.PENDING_CLEARANCE,
          }),
        }),
      );
    });

    it('withdraws resignation and cancels pending clearances and offboarding', async () => {
      mockResignationsRepo.findById.mockResolvedValue({
        id: 'res-2',
        employeeId: 'emp-2',
        status: ResignationStatus.APPROVED,
        offboardingRequest: { id: 'off-2', status: OffboardingStatus.PENDING_CLEARANCE },
      });
      mockPrisma.resignationRequest.update.mockResolvedValue({
        id: 'res-2',
        status: ResignationStatus.WITHDRAWN,
      });

      await resignationsService.withdraw('res-2', orgId, userId);

      expect(mockPrisma.resignationRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ResignationStatus.WITHDRAWN }),
        }),
      );
      expect(mockPrisma.exitClearance.updateMany).toHaveBeenCalled();
      expect(mockPrisma.offboardingRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OffboardingStatus.CANCELLED }),
        }),
      );
    });
  });

  // ==========================================
  // 7. OFFBOARDING & PRECONDITION CHECKS
  // ==========================================
  describe('7. Offboarding Completion', () => {
    it('rejects completion when mandatory clearances are still pending', async () => {
      mockOffboardingRepo.findById.mockResolvedValue({
        id: 'off-1',
        employeeId: 'emp-1',
        status: OffboardingStatus.PENDING_CLEARANCE,
        lastWorkingDate: new Date('2026-12-31'),
        exitType: 'RESIGNATION',
      });
      mockPrisma.exitClearance.findMany.mockResolvedValue([
        { id: 'clr-1', clearanceType: ClearanceType.ASSET_RETURN, isMandatory: true, status: ClearanceStatus.PENDING },
      ]);

      await expect(
        offboardingService.complete('off-1', orgId, {}, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects completion when company assets are unreturned', async () => {
      mockOffboardingRepo.findById.mockResolvedValue({
        id: 'off-1',
        employeeId: 'emp-1',
        status: OffboardingStatus.PENDING_CLEARANCE,
        lastWorkingDate: new Date('2026-12-31'),
        exitType: 'RESIGNATION',
      });
      // No pending clearances
      mockPrisma.exitClearance.findMany.mockResolvedValue([]);
      // Unreturned asset
      mockPrisma.asset.findMany.mockResolvedValue([
        { id: 'ast-1', assetName: 'MacBook Pro', assetSerialNumber: 'MBP-99', returnStatus: AssetReturnStatus.ASSIGNED },
      ]);

      await expect(
        offboardingService.complete('off-1', orgId, {}, userId),
      ).rejects.toThrow(/unreturned company assets/);
    });

    it('rejects completion when direct reportees exist without reassignment manager', async () => {
      mockOffboardingRepo.findById.mockResolvedValue({
        id: 'off-1',
        employeeId: 'emp-mgr',
        status: OffboardingStatus.CLEARANCE_COMPLETED,
        lastWorkingDate: new Date('2026-12-31'),
        exitType: 'RESIGNATION',
      });
      mockPrisma.exitClearance.findMany.mockResolvedValue([]);
      mockPrisma.asset.findMany.mockResolvedValue([]);
      // Has active reportees
      mockPrisma.employee.findMany.mockResolvedValue([
        { id: 'rep-1', reportingManagerId: 'emp-mgr', status: 'ACTIVE' },
      ]);

      await expect(
        offboardingService.complete('off-1', orgId, { reassignedReportingManagerId: null }, userId),
      ).rejects.toThrow(/direct reportees/);
    });

    it('completes offboarding atomically: marks EXITED, reassigns reportees, generates letters', async () => {
      mockOffboardingRepo.findById.mockResolvedValue({
        id: 'off-complete',
        employeeId: 'emp-mgr',
        status: OffboardingStatus.CLEARANCE_COMPLETED,
        lastWorkingDate: new Date('2026-12-31'),
        exitType: 'RESIGNATION',
      });
      mockPrisma.exitClearance.findMany.mockResolvedValue([]);
      mockPrisma.asset.findMany.mockResolvedValue([]);
      mockPrisma.employee.findMany.mockResolvedValue([
        { id: 'rep-1', reportingManagerId: 'emp-mgr', status: 'ACTIVE' },
      ]);
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: 'emp-new-mgr',
        status: 'ACTIVE',
      });
      mockPrisma.employee.update.mockResolvedValue({
        id: 'emp-mgr',
        firstName: 'Jane',
        lastName: 'Manager',
        status: 'EXITED',
        dateOfExit: new Date('2026-12-31'),
        dateOfJoining: new Date('2023-01-01'),
      });
      mockPrisma.offboardingRequest.update.mockResolvedValue({
        id: 'off-complete',
        status: OffboardingStatus.COMPLETED,
      });

      const res = await offboardingService.complete(
        'off-complete',
        orgId,
        {
          reassignedReportingManagerId: 'emp-new-mgr',
          exitReason: 'Career Change',
          generateRelievingLetter: true,
          generateExperienceLetter: true,
        },
        userId,
      );

      // Reportees reassigned
      expect(mockPrisma.employee.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { reportingManagerId: 'emp-new-mgr' },
        }),
      );
      // Status set to EXITED
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'EXITED' }),
        }),
      );
      // Relieving and Experience letters created
      expect(mockPrisma.lifecycleLetter.create).toHaveBeenCalledTimes(2);
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 8. ASSETS MANAGEMENT
  // ==========================================
  describe('8. Assets Management', () => {
    it('creates, assigns, and returns company assets', async () => {
      // 1. Create
      mockPrisma.asset.findFirst.mockResolvedValue(null);
      mockAssetsRepo.create.mockResolvedValue({
        id: 'ast-10',
        assetName: 'Dell Monitor 27"',
        assetSerialNumber: 'MON-100',
        returnStatus: 'UNASSIGNED',
      });

      const asset = await assetsService.create(
        orgId,
        {
          assetName: 'Dell Monitor 27"',
          assetType: 'MONITOR',
          assetSerialNumber: 'MON-100',
        },
        userId,
      );
      expect(asset.id).toBe('ast-10');

      // 2. Assign
      mockAssetsRepo.findById.mockResolvedValue({
        id: 'ast-10',
        returnStatus: AssetReturnStatus.UNASSIGNED,
        comments: null,
      });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
      mockAssetsRepo.update.mockResolvedValue({
        id: 'ast-10',
        returnStatus: AssetReturnStatus.ASSIGNED,
        assignedEmployeeId: 'emp-1',
      });

      const assigned = await assetsService.assign(
        'ast-10',
        orgId,
        { employeeId: 'emp-1' },
        userId,
      );
      expect(assigned.returnStatus).toBe(AssetReturnStatus.ASSIGNED);

      // 3. Return
      mockAssetsRepo.findById.mockResolvedValue({
        id: 'ast-10',
        returnStatus: AssetReturnStatus.ASSIGNED,
        assignedEmployeeId: 'emp-1',
        assetName: 'Dell Monitor 27"',
        assetSerialNumber: 'MON-100',
      });
      mockAssetsRepo.update.mockResolvedValue({
        id: 'ast-10',
        returnStatus: AssetReturnStatus.RETURNED,
        assetCondition: AssetCondition.GOOD,
      });

      const returned = await assetsService.returnAsset(
        'ast-10',
        orgId,
        { returnCondition: AssetCondition.GOOD },
        userId,
      );
      expect(returned.returnStatus).toBe(AssetReturnStatus.RETURNED);
    });
  });

  // ==========================================
  // 9. LIFECYCLE LETTERS GENERATION
  // ==========================================
  describe('9. Lifecycle Letters', () => {
    it('generates letter with interpolated dynamic variables and outputs printable HTML', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({
        id: 'emp-1',
        employeeCode: 'EMP-001',
        firstName: 'Alice',
        lastName: 'Wonder',
        dateOfJoining: new Date('2024-01-15'),
        department: { name: 'Engineering' },
        designation: { name: 'Principal Engineer' },
        location: { name: 'Bengaluru' },
        organization: { name: 'Acme Corp' },
        salaryAssignments: [{ annualCtc: 2400000 }],
      });
      mockLettersRepo.create.mockImplementation((_, data) => Promise.resolve({ id: 'let-1', ...data }));

      const letter = await lettersService.generate(
        orgId,
        {
          employeeId: 'emp-1',
          letterType: LifecycleLetterType.EXPERIENCE,
        },
        userId,
      );

      expect(letter.title).toContain('Certificate of Employment and Experience - Alice Wonder');
      expect(letter.content).toContain('Alice Wonder (Employee ID: EMP-001)');
      expect(letter.content).toContain('Principal Engineer');
      expect(letter.content).toContain('Engineering');
      expect(letter.content).toContain('Acme Corp');

      // Test download HTML payload
      mockLettersRepo.findById.mockResolvedValue({
        ...letter,
        id: 'let-1',
        organization: { name: 'Acme Corp' },
      });
      const download = await lettersService.download('let-1', orgId, userId);
      expect(download.html).toContain('<!DOCTYPE html>');
      expect(download.html).toContain('Acme Corp');
    });
  });
});
