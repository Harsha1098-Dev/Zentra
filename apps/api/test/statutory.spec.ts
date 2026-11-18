import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { StatutoryCalculatorService } from '../src/payroll/statutory/statutory-calculator.service';
import { StatutorySettingsService } from '../src/payroll/statutory/statutory-settings/statutory-settings.service';
import { StatutoryComponentsService } from '../src/payroll/statutory/statutory-components/statutory-components.service';
import { PfService } from '../src/payroll/statutory/pf/pf.service';
import { EsiService } from '../src/payroll/statutory/esi/esi.service';
import { ProfessionalTaxService } from '../src/payroll/statutory/professional-tax/professional-tax.service';
import { LwfService } from '../src/payroll/statutory/lwf/lwf.service';
import { TaxProfileService } from '../src/payroll/statutory/tax-profile/tax-profile.service';
import { TaxDeclarationsService } from '../src/payroll/statutory/tax-declarations/tax-declarations.service';
import { InvestmentProofsService } from '../src/payroll/statutory/investment-proofs/investment-proofs.service';
import { TdsService } from '../src/payroll/statutory/tds/tds.service';
import { ComplianceReportsService } from '../src/payroll/statutory/compliance-reports/compliance-reports.service';
import { Form16Service } from '../src/payroll/statutory/form16/form16.service';
import {
  TaxRegime,
  StatutoryType,
  DeclarationStatus,
  ProofVerificationStatus,
  Form16Status,
  AuditAction,
} from '@zentra/shared-types';

describe('Statutory Payroll & Compliance Module Test Suite (India)', () => {
  const orgA = 'org-1111-aaaa';
  const orgB = 'org-2222-bbbb';
  const userAdminA = 'user-admin-101';
  const userEmp1 = 'user-emp-201';
  const empId1 = 'emp-001';
  const empId2 = 'emp-002';

  const calculator = new StatutoryCalculatorService();

  // =========================================================================
  // 1. STATUTORY CALCULATOR - EPF & EPS ENGINE
  // =========================================================================
  describe('EPF Calculation Engine', () => {
    const pfConfig = {
      epfRateEmployee: 12.0,
      epfRateEmployer: 3.67,
      epsRateEmployer: 8.33,
      edliRate: 0.5,
      adminChargesRate: 0.5,
      wageCeiling: 15000,
      restrictEmployerShareToCeiling: true,
    };

    it('should compute employee and employer PF correctly for wages below ₹15,000 ceiling', () => {
      const basicWages = 10000;
      const res = calculator.calculatePf(basicWages, pfConfig, true, 0);

      // Employee 12% = 1,200
      expect(res.employeePf).toBe(1200);
      // Employer EPS 8.33% = 833
      expect(res.eps).toBe(833);
      // Employer EPF = 12% (1200) - 833 = 367
      expect(res.employerPf).toBe(367);
      // EDLI 0.5% = 50
      expect(res.edli).toBe(50);
      // Admin charges 0.5% = 50
      expect(res.adminChargesPf).toBe(50);
      expect(res.totalEmployerContribution).toBe(367 + 833 + 50 + 50);
    });

    it('should apply ₹15,000 statutory wage ceiling to employer pension & EDLI for high earners', () => {
      const basicWages = 50000;
      const res = calculator.calculatePf(basicWages, pfConfig, true, 0);

      // Employee 12% on actual wages (50,000 * 0.12) = 6,000
      expect(res.employeePf).toBe(6000);
      // Employer EPS is capped at 8.33% of ₹15,000 = ₹1,249.50 (~1,250)
      expect(res.eps).toBe(1249.5);
      // Employer EPF = capped 12% of 15k (1800) - 1249.50 = 550.50
      expect(res.employerPf).toBe(550.5);
      // EDLI is capped at 0.5% of 15k = 75
      expect(res.edli).toBe(75);
      // Admin charges = 0.5% of 50k = 250
      expect(res.adminChargesPf).toBe(250);
    });

    it('should calculate voluntary provident fund (VPF) when opted by employee', () => {
      const basicWages = 20000;
      // 12% EPF + 5% VPF = 17% employee share
      const res = calculator.calculatePf(basicWages, pfConfig, true, 5);

      expect(res.employeePf).toBe(2400 + 1000); // 3400
      // Employer share remains standard
      expect(res.eps).toBe(1249.5);
    });

    it('should return zero contributions when employee is marked PF ineligible or wages zero', () => {
      const res1 = calculator.calculatePf(20000, pfConfig, false, 0);
      expect(res1.employeePf).toBe(0);
      expect(res1.employerPf).toBe(0);
      expect(res1.totalEmployerContribution).toBe(0);

      const res2 = calculator.calculatePf(0, pfConfig, true, 0);
      expect(res2.employeePf).toBe(0);
      expect(res2.employerPf).toBe(0);
    });
  });

  // =========================================================================
  // 2. STATUTORY CALCULATOR - ESI ENGINE
  // =========================================================================
  describe('ESI Calculation Engine', () => {
    const esiConfig = {
      employeeContributionRate: 0.75,
      employerContributionRate: 3.25,
      wageCeiling: 21000,
      disabilityWageCeiling: 25000,
    };

    it('should calculate ESI for gross wage <= ₹21,000 threshold (0.75% EE, 3.25% ER)', () => {
      const grossSalary = 18000;
      const res = calculator.calculateEsi(grossSalary, esiConfig, true, false);

      expect(res.isEligible).toBe(true);
      expect(res.employeeEsi).toBe(135); // 18000 * 0.0075 = 135
      expect(res.employerEsi).toBe(585); // 18000 * 0.0325 = 585
      expect(res.totalEsi).toBe(720);
    });

    it('should mark employee as ineligible and return 0 if gross salary exceeds ₹21,000', () => {
      const grossSalary = 25000;
      const res = calculator.calculateEsi(grossSalary, esiConfig, true, false);

      expect(res.isEligible).toBe(false);
      expect(res.employeeEsi).toBe(0);
      expect(res.employerEsi).toBe(0);
      expect(res.totalEsi).toBe(0);
    });

    it('should support disability wage ceiling up to ₹25,000', () => {
      const grossSalary = 24000;
      // Normal employee: not eligible
      const normalRes = calculator.calculateEsi(grossSalary, esiConfig, true, false);
      expect(normalRes.isEligible).toBe(false);

      // Employee with disability: eligible up to 25k
      const disabledRes = calculator.calculateEsi(grossSalary, esiConfig, true, true);
      expect(disabledRes.isEligible).toBe(true);
      expect(disabledRes.employeeEsi).toBe(180); // 24000 * 0.0075 = 180
      expect(disabledRes.employerEsi).toBe(780); // 24000 * 0.0325 = 780
    });
  });

  // =========================================================================
  // 3. STATUTORY CALCULATOR - PROFESSIONAL TAX SLABS ENGINE
  // =========================================================================
  describe('Professional Tax Slabs Engine', () => {
    const mhSlabs = [
      { minSalary: 0, maxSalary: 7500, taxAmount: 0, gender: 'ALL' },
      { minSalary: 7501, maxSalary: 10000, taxAmount: 175, gender: 'MALE' },
      { minSalary: 10001, maxSalary: null, taxAmount: 200, gender: 'ALL', specificMonth: 2, specificMonthAmount: 300 },
    ];

    it('should evaluate Maharashtra slab for monthly salary above ₹10,000', () => {
      // Month = 5 (May)
      const ptAmount = calculator.calculateProfessionalTax(45000, mhSlabs, 5, 'MALE');
      expect(ptAmount).toBe(200);
    });

    it('should apply February month adjustment (₹300) for Maharashtra', () => {
      // Month = 2 (February)
      const ptFeb = calculator.calculateProfessionalTax(45000, mhSlabs, 2, 'MALE');
      expect(ptFeb).toBe(300);
    });

    it('should evaluate lower slabs for salary <= 7500 as 0', () => {
      const ptZero = calculator.calculateProfessionalTax(6000, mhSlabs, 5, 'MALE');
      expect(ptZero).toBe(0);
    });

    it('should evaluate Karnataka slab (>= ₹15,000 -> ₹200)', () => {
      const kaSlabs = [
        { minSalary: 0, maxSalary: 14999, taxAmount: 0, gender: 'ALL' },
        { minSalary: 15000, maxSalary: null, taxAmount: 200, gender: 'ALL' },
      ];
      expect(calculator.calculateProfessionalTax(12000, kaSlabs, 5)).toBe(0);
      expect(calculator.calculateProfessionalTax(25000, kaSlabs, 5)).toBe(200);
    });
  });

  // =========================================================================
  // 4. STATUTORY CALCULATOR - LWF ENGINE
  // =========================================================================
  describe('Labour Welfare Fund (LWF) Engine', () => {
    const mhLwfRule = {
      employeeContribution: 12,
      employerContribution: 36,
      deductionMonths: [6, 12], // June and December
    };

    it('should apply LWF deduction during designated contribution months (e.g. June and December)', () => {
      const juneRes = calculator.calculateLwf(30000, mhLwfRule, 6);
      expect(juneRes.lwfEmployee).toBe(12);
      expect(juneRes.lwfEmployer).toBe(36);

      const decRes = calculator.calculateLwf(30000, mhLwfRule, 12);
      expect(decRes.lwfEmployee).toBe(12);
      expect(decRes.lwfEmployer).toBe(36);
    });

    it('should return 0 during non-deduction months (e.g. July)', () => {
      const julyRes = calculator.calculateLwf(30000, mhLwfRule, 7);
      expect(julyRes.lwfEmployee).toBe(0);
      expect(julyRes.lwfEmployer).toBe(0);
    });
  });

  // =========================================================================
  // 5. STATUTORY CALCULATOR - TDS & TAX REGIME ENGINE
  // =========================================================================
  describe('TDS & Tax Regime Calculation Engine', () => {
    it('should apply Section 87A rebate for New Regime (zero tax up to ₹7,00,000 taxable income)', () => {
      // Annual gross 7,50,000 - 75,000 standard deduction = 6,75,000 net taxable
      const res = calculator.calculateTds(TaxRegime.NEW_REGIME, 750000, [], 4);

      expect(res.standardDeduction).toBe(75000);
      expect(res.netTaxableIncome).toBe(675000);
      // Tax calculated: 0 on 3L, 5% on 3.75L (375000 * 0.05) = 18,750
      expect(res.calculatedAnnualTax).toBe(18750);
      // 87A rebate wipes it out completely
      expect(res.section87ARebate).toBe(18750);
      expect(res.taxAfterRebate).toBe(0);
      expect(res.totalAnnualTaxLiability).toBe(0);
      expect(res.monthlyTds).toBe(0);
    });

    it('should calculate progressive New Regime tax slabs with 4% cess for higher income', () => {
      // Annual gross 12,00,000
      // Net taxable = 12,00,000 - 75,000 = 11,25,000
      // Slabs:
      // 0 - 3L: 0
      // 3L - 7L (4L @ 5%): 20,000
      // 7L - 10L (3L @ 10%): 30,000
      // 10L - 11.25L (1.25L @ 15%): 18,750
      // Total tax = 20000 + 30000 + 18750 = 68,750
      // Cess 4% = 2,750
      // Total liability = 71,500
      const res = calculator.calculateTds(TaxRegime.NEW_REGIME, 1200000, [], 4);

      expect(res.netTaxableIncome).toBe(1125000);
      expect(res.calculatedAnnualTax).toBe(68750);
      expect(res.section87ARebate).toBe(0); // Income > 7L, no rebate
      expect(res.educationCess).toBe(2750);
      expect(res.totalAnnualTaxLiability).toBe(71500);
      // In April (month 4), 12 remaining months: 71,500 / 12 = 5,958.33
      expect(res.monthlyTds).toBe(5958.33);
    });

    it('should calculate Old Regime with standard deduction ₹50,000 and Chapter VI-A deductions', () => {
      const declarations = [
        { declarationType: 'SECTION_80C', declaredAmount: 150000, approvedAmount: 150000, status: 'APPROVED' },
        { declarationType: 'SECTION_80D', declaredAmount: 25000, approvedAmount: 25000, status: 'APPROVED' },
        { declarationType: 'SECTION_80CCD_1B', declaredAmount: 50000, approvedAmount: 50000, status: 'APPROVED' },
        { declarationType: 'SECTION_24_HOME_LOAN', declaredAmount: 200000, approvedAmount: 200000, status: 'APPROVED' },
      ];

      // Gross 12,00,000
      // Deductions: Std 50,000 + PT 2,400 + 80C 1,50,000 + 80D 25,000 + 80CCD 50,000 + Sec24 2,00,000 = 4,77,400
      // Net Taxable = 12,00,000 - 4,77,400 = 7,22,600
      const res = calculator.calculateTds(TaxRegime.OLD_REGIME, 1200000, declarations, 4, 0, 2400);

      expect(res.standardDeduction).toBe(50000);
      expect(res.section80C).toBe(150000);
      expect(res.section80D).toBe(25000);
      expect(res.section80CCD1B).toBe(50000);
      expect(res.section24HomeLoan).toBe(200000);
      expect(res.netTaxableIncome).toBe(722600);
    });

    it('should correctly divide remaining tax by remaining months in financial year', () => {
      // If 4 months already passed (e.g. August, month 8), remaining months = 12 - (8-4) = 8
      const res = calculator.calculateTds(TaxRegime.NEW_REGIME, 1200000, [], 8, 23833.32);

      expect(res.remainingMonths).toBe(8);
      expect(res.taxPaidYtd).toBe(23833.32);
      expect(res.remainingTax).toBeCloseTo(71500 - 23833.32, 1);
    });
  });

  // =========================================================================
  // 6. MULTI-TENANCY & STATUTORY SETTINGS SERVICE TESTS
  // =========================================================================
  describe('Statutory Settings & Multi-Tenant Isolation', () => {
    let mockAuditService: any;
    let mockSettingsRepo: any;
    let settingsService: StatutorySettingsService;

    const mockDb = new Map<string, any>();

    beforeEach(() => {
      mockDb.clear();
      mockAuditService = { log: jest.fn().mockResolvedValue({}) };
      mockSettingsRepo = {
        findByOrganizationId: jest.fn().mockImplementation(async (orgId) => mockDb.get(orgId) || null),
        upsert: jest.fn().mockImplementation(async (orgId, data) => {
          const existing = mockDb.get(orgId) || { id: `sett-${orgId}`, organizationId: orgId };
          const merged = { ...existing, ...data };
          mockDb.set(orgId, merged);
          return merged;
        }),
      };
      settingsService = new StatutorySettingsService(mockSettingsRepo, mockAuditService);
    });

    it('should auto-initialize statutory settings if none exist for organization', async () => {
      const settings = await settingsService.getSettings(orgA);
      expect(settings).toBeDefined();
      expect(settings.financialYear).toBe('2025-2026');
      expect(settings.defaultTaxRegime).toBe('NEW_REGIME');
      expect(settings.pfEnabled).toBe(true);
    });

    it('should strictly isolate statutory settings between Org A and Org B', async () => {
      await settingsService.updateSettings(orgA, { pfEstablishmentCode: 'MH/BAN/001' }, userAdminA);
      await settingsService.updateSettings(orgB, { pfEstablishmentCode: 'DL/CPM/002' }, userAdminA);

      const a = await settingsService.getSettings(orgA);
      const b = await settingsService.getSettings(orgB);

      expect(a.pfEstablishmentCode).toBe('MH/BAN/001');
      expect(b.pfEstablishmentCode).toBe('DL/CPM/002');
      expect(a.pfEstablishmentCode).not.toBe(b.pfEstablishmentCode);
    });
  });

  // =========================================================================
  // 7. STATUTORY COMPONENTS SERVICE TESTS
  // =========================================================================
  describe('Statutory Components Service', () => {
    let mockAuditService: any;
    let mockComponentsRepo: any;
    let componentsService: StatutoryComponentsService;

    const componentsDb = new Map<string, any>();

    beforeEach(() => {
      componentsDb.clear();
      mockAuditService = { log: jest.fn().mockResolvedValue({}) };
      mockComponentsRepo = {
        findAll: jest.fn().mockImplementation(async (orgId, filters) => {
          return Array.from(componentsDb.values()).filter((c) => c.organizationId === orgId);
        }),
        findById: jest.fn().mockImplementation(async (id, orgId) => {
          const comp = componentsDb.get(id);
          return comp && comp.organizationId === orgId ? comp : null;
        }),
        findByCode: jest.fn().mockImplementation(async (orgId, code) => {
          return Array.from(componentsDb.values()).find(
            (c) => c.organizationId === orgId && c.code === code,
          ) || null;
        }),
        create: jest.fn().mockImplementation(async (orgId, data) => {
          const id = `comp-${Date.now()}-${Math.random()}`;
          const comp = { id, organizationId: orgId, ...data };
          componentsDb.set(id, comp);
          return comp;
        }),
        update: jest.fn().mockImplementation(async (id, orgId, data) => {
          const existing = componentsDb.get(id);
          const updated = { ...existing, ...data };
          componentsDb.set(id, updated);
          return updated;
        }),
      };
      componentsService = new StatutoryComponentsService(mockComponentsRepo, mockAuditService);
    });

    it('should create a statutory component and log audit trail', async () => {
      const created = await componentsService.create(
        orgA,
        {
          statutoryType: StatutoryType.PF,
          name: 'Employee Provident Fund',
          code: 'EPF_BASE',
          employeeContributionRate: 12,
          employerContributionRate: 12,
        },
        userAdminA,
      );

      expect(created.id).toBeDefined();
      expect(created.code).toBe('EPF_BASE');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgA,
          action: AuditAction.STATUTORY_COMPONENT_CREATE,
        }),
      );
    });

    it('should reject duplicate component code within the same organization', async () => {
      await componentsService.create(
        orgA,
        { statutoryType: StatutoryType.ESI, name: 'ESI 1', code: 'ESI_COMP' },
        userAdminA,
      );

      await expect(
        componentsService.create(
          orgA,
          { statutoryType: StatutoryType.ESI, name: 'ESI 2', code: 'ESI_COMP' },
          userAdminA,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow the same component code in a different organization', async () => {
      const compA = await componentsService.create(
        orgA,
        { statutoryType: StatutoryType.PF, name: 'EPF', code: 'EPF' },
        userAdminA,
      );
      const compB = await componentsService.create(
        orgB,
        { statutoryType: StatutoryType.PF, name: 'EPF', code: 'EPF' },
        userAdminA,
      );

      expect(compA.id).toBeDefined();
      expect(compB.id).toBeDefined();
      expect(compA.organizationId).toBe(orgA);
      expect(compB.organizationId).toBe(orgB);
    });
  });

  // =========================================================================
  // 8. INVESTMENT DECLARATIONS & PROOFS WORKFLOW TESTS
  // =========================================================================
  describe('Investment Declarations & Proofs Workflow', () => {
    let mockAuditService: any;
    let mockDecRepo: any;
    let mockProofRepo: any;
    let mockPrisma: any;
    let decService: TaxDeclarationsService;
    let proofService: InvestmentProofsService;

    const decDb = new Map<string, any>();
    const proofDb = new Map<string, any>();

    beforeEach(() => {
      decDb.clear();
      proofDb.clear();
      mockAuditService = { log: jest.fn().mockResolvedValue({}) };

      mockDecRepo = {
        findEmployeeByUserId: jest.fn().mockResolvedValue({ id: empId1, organizationId: orgA }),
        findAllByEmployee: jest.fn().mockImplementation(async (orgId, empId) => {
          return Array.from(decDb.values()).filter((d) => d.organizationId === orgId && d.employeeId === empId);
        }),
        findById: jest.fn().mockImplementation(async (id, orgId) => {
          const d = decDb.get(id);
          return d && d.organizationId === orgId ? d : null;
        }),
        findAll: jest.fn().mockImplementation(async (orgId) => {
          return Array.from(decDb.values()).filter((d) => d.organizationId === orgId);
        }),
        create: jest.fn().mockImplementation(async (orgId, empId, data) => {
          const id = `dec-${Date.now()}`;
          const dec = { id, organizationId: orgId, employeeId: empId, ...data };
          decDb.set(id, dec);
          return dec;
        }),
        update: jest.fn().mockImplementation(async (id, orgId, data) => {
          const existing = decDb.get(id);
          const updated = { ...existing, ...data };
          decDb.set(id, updated);
          return updated;
        }),
        submitAllDrafts: jest.fn().mockImplementation(async (orgId, empId) => {
          let count = 0;
          for (const d of decDb.values()) {
            if (d.organizationId === orgId && d.employeeId === empId && d.status === DeclarationStatus.DRAFT) {
              d.status = DeclarationStatus.SUBMITTED;
              count++;
            }
          }
          return { count };
        }),
      };

      mockProofRepo = {
        findEmployeeByUserId: jest.fn().mockResolvedValue({ id: empId1, organizationId: orgA }),
        findAllByEmployee: jest.fn().mockImplementation(async (orgId, empId) => {
          return Array.from(proofDb.values()).filter((p) => p.organizationId === orgId && p.employeeId === empId);
        }),
        findById: jest.fn().mockImplementation(async (id, orgId) => {
          const p = proofDb.get(id);
          return p && p.organizationId === orgId ? p : null;
        }),
        findAll: jest.fn().mockImplementation(async (orgId) => {
          return Array.from(proofDb.values()).filter((p) => p.organizationId === orgId);
        }),
        create: jest.fn().mockImplementation(async (orgId, empId, data) => {
          const id = `proof-${Date.now()}`;
          const proof = { id, organizationId: orgId, employeeId: empId, ...data };
          proofDb.set(id, proof);
          return proof;
        }),
        update: jest.fn().mockImplementation(async (id, orgId, data) => {
          const existing = proofDb.get(id);
          const updated = { ...existing, ...data };
          proofDb.set(id, updated);
          return updated;
        }),
      };

      mockPrisma = {
        employeeTaxDeclaration: {
          update: jest.fn().mockImplementation(async ({ where, data }) => {
            const existing = decDb.get(where.id);
            const updated = { ...existing, ...data };
            decDb.set(where.id, updated);
            return updated;
          }),
        },
      };

      decService = new TaxDeclarationsService(mockDecRepo, mockAuditService);
      proofService = new InvestmentProofsService(mockProofRepo, mockPrisma, mockAuditService);
    });

    it('should create declaration in DRAFT status and submit it', async () => {
      const dec = await decService.createMyDeclaration(
        orgA,
        userEmp1,
        {
          financialYear: '2025-2026',
          declarationType: 'SECTION_80C',
          subCategory: 'PPF',
          declaredAmount: 150000,
        },
      );

      expect(dec.status).toBe(DeclarationStatus.DRAFT);
      expect(dec.declaredAmount).toBe(150000);

      const submitRes = await decService.submitMyDeclarations(orgA, userEmp1, '2025-2026');
      expect(submitRes.submittedCount).toBe(1);

      const stored = decDb.get(dec.id);
      expect(stored.status).toBe(DeclarationStatus.SUBMITTED);
    });

    it('should allow admin to review and approve declaration', async () => {
      const dec = await decService.createMyDeclaration(
        orgA,
        userEmp1,
        { financialYear: '2025-2026', declarationType: 'SECTION_80D', subCategory: 'Health_Insurance', declaredAmount: 25000 },
      );

      const reviewed = await decService.reviewDeclaration(
        dec.id,
        orgA,
        { status: DeclarationStatus.APPROVED, approvedAmount: 25000 },
        userAdminA,
      );

      expect(reviewed.status).toBe(DeclarationStatus.APPROVED);
      expect(reviewed.approvedAmount).toBe(25000);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TAX_DECLARATION_APPROVE }),
      );
    });

    it('should upload investment proof and verification should update declaration approved amount', async () => {
      const dec = await decService.createMyDeclaration(
        orgA,
        userEmp1,
        { financialYear: '2025-2026', declarationType: 'SECTION_80C', subCategory: 'ELSS_Mutual_Fund', declaredAmount: 50000 },
      );

      const proof = await proofService.createMyProof(
        orgA,
        userEmp1,
        {
          declarationId: dec.id,
          documentName: 'elss_statement.pdf',
          documentUrl: 'https://cdn.zentra.com/proofs/elss.pdf',
          amountDeclared: 50000,
          amountSubmitted: 50000,
        },
      );

      expect(proof.verificationStatus).toBe(ProofVerificationStatus.PENDING);

      const verified = await proofService.verifyProof(
        proof.id,
        orgA,
        { verificationStatus: ProofVerificationStatus.VERIFIED, verifiedAmount: 50000 },
        userAdminA,
      );

      expect(verified.verificationStatus).toBe(ProofVerificationStatus.VERIFIED);
      expect(verified.verifiedAmount).toBe(50000);

      // Verify parent declaration was updated
      const updatedDec = decDb.get(dec.id);
      expect(updatedDec.status).toBe(DeclarationStatus.APPROVED);
      expect(updatedDec.approvedAmount).toBe(50000);
    });
  });

  // =========================================================================
  // 9. FORM 16 GENERATION & PUBLICATION TESTS
  // =========================================================================
  describe('Form 16 Generation & Publication', () => {
    let mockAuditService: any;
    let mockForm16Repo: any;
    let mockPrisma: any;
    let form16Service: Form16Service;

    const form16Db = new Map<string, any>();

    beforeEach(() => {
      form16Db.clear();
      mockAuditService = { log: jest.fn().mockResolvedValue({}) };
      mockForm16Repo = {
        findEmployeeByUserId: jest.fn().mockResolvedValue({ id: empId1, organizationId: orgA }),
        findByEmployee: jest.fn().mockImplementation(async (orgId, empId) => {
          return Array.from(form16Db.values()).filter(
            (r) => r.organizationId === orgId && r.employeeId === empId && r.status === Form16Status.PUBLISHED,
          );
        }),
        findById: jest.fn().mockImplementation(async (id, orgId) => {
          const r = form16Db.get(id);
          return r && r.organizationId === orgId ? r : null;
        }),
        findAll: jest.fn().mockImplementation(async (orgId) => {
          return Array.from(form16Db.values()).filter((r) => r.organizationId === orgId);
        }),
        upsert: jest.fn().mockImplementation(async (orgId, empId, fy, data) => {
          const id = `f16-${empId}-${fy}`;
          const rec = {
            id,
            organizationId: orgId,
            employeeId: empId,
            financialYear: fy,
            employee: { id: empId, employeeCode: 'EMP001', firstName: 'Harsha', lastName: 'V' },
            ...data,
          };
          form16Db.set(id, rec);
          return rec;
        }),
        publishRecords: jest.fn().mockImplementation(async (orgId, ids, fy) => {
          let count = 0;
          for (const r of form16Db.values()) {
            if (r.organizationId === orgId && (!ids || ids.includes(r.id))) {
              r.status = Form16Status.PUBLISHED;
              r.publishedAt = new Date();
              count++;
            }
          }
          return { count };
        }),
      };

      mockPrisma = {
        employee: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: empId1,
              organizationId: orgA,
              employeeCode: 'EMP001',
              firstName: 'Harsha',
              lastName: 'V',
              salaryAssignments: [{ annualCtc: 1200000, status: 'ACTIVE' }],
              taxProfiles: [{ selectedRegime: TaxRegime.NEW_REGIME }],
              taxDeclarations: [],
              tdsCalculations: [{ monthlyTds: 5958.33 }],
            },
          ]),
        },
      };

      form16Service = new Form16Service(mockForm16Repo, mockPrisma, calculator, mockAuditService);
    });

    it('should compile annual income and tax calculations into Form 16 record in GENERATED status', async () => {
      const prepRes = await form16Service.prepareForm16(orgA, '2025-2026', '2026-2027', undefined, userAdminA);

      expect(prepRes.preparedCount).toBe(1);
      const record = prepRes.records[0];
      expect(record.status).toBe(Form16Status.GENERATED);
      expect(record.grossSalary).toBe(1200000);
      expect(record.standardDeduction).toBe(75000);
      expect(record.totalTaxableIncome).toBe(1125000);
      expect(record.totalTaxPayable).toBe(68750);
      expect(record.cess).toBe(2750);
      expect(record.netTaxPayable).toBe(71500);
    });

    it('should publish Form 16 records making them downloadable in employee self-service', async () => {
      await form16Service.prepareForm16(orgA, '2025-2026', '2026-2027');

      // Before publication: ESS cannot view it
      const beforePub = await form16Service.getMyForm16(orgA, userEmp1);
      expect(beforePub.length).toBe(0);

      // Publish
      const pubRes = await form16Service.publishForm16(orgA, undefined, '2025-2026', userAdminA);
      expect(pubRes.publishedCount).toBe(1);

      // After publication: ESS sees published Form 16
      const afterPub = await form16Service.getMyForm16(orgA, userEmp1);
      expect(afterPub.length).toBe(1);
      expect(afterPub[0].status).toBe(Form16Status.PUBLISHED);
    });
  });
});
