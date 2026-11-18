import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StatutoryCalculatorService } from '../statutory-calculator.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, TaxRegime } from '@zentra/shared-types';

@Injectable()
export class TdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statutoryCalculator: StatutoryCalculatorService,
    private readonly auditService: AuditService,
  ) {}

  async getMyTaxSummary(organizationId: string, userId: string, email?: string, financialYear: string = '2025-2026') {
    let employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!employee && email) {
      employee = await this.prisma.employee.findFirst({
        where: { organizationId, workEmail: email, deletedAt: null },
      });
    }
    if (!employee) {
      throw new NotFoundException('Employee record not found for user');
    }

    return this.getEmployeeTaxSummary(organizationId, employee.id, financialYear);
  }

  async getEmployeeTaxSummary(organizationId: string, employeeId: string, financialYear: string = '2025-2026') {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      include: {
        salaryAssignments: {
          where: { status: 'ACTIVE' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee '${employeeId}' not found`);
    }

    // 1. Get Employee Tax Profile
    let taxProfile = await this.prisma.employeeTaxProfile.findUnique({
      where: {
        organizationId_employeeId_financialYear: {
          organizationId,
          employeeId,
          financialYear,
        },
      },
    });

    if (!taxProfile) {
      taxProfile = await this.prisma.employeeTaxProfile.create({
        data: {
          organizationId,
          employeeId,
          financialYear,
          selectedRegime: TaxRegime.NEW_REGIME,
        },
      });
    }

    // 2. Get declarations
    const declarations = await this.prisma.employeeTaxDeclaration.findMany({
      where: { organizationId, employeeId, financialYear },
    });

    // 3. Projected annual gross salary
    const activeAssignment = employee.salaryAssignments[0];
    const annualGross = activeAssignment ? activeAssignment.annualCtc : 600000;

    // 4. Current Month & TDS Paid YTD
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    const pastCalculations = await this.prisma.employeeTdsCalculation.findMany({
      where: { organizationId, employeeId, financialYear },
      orderBy: { month: 'asc' },
    });

    const taxPaidYtd = pastCalculations.reduce((sum, c) => sum + c.monthlyTds, 0);

    // 5. Evaluate both New Regime and Old Regime
    const newRegimeCalc = this.statutoryCalculator.calculateTds(
      TaxRegime.NEW_REGIME,
      annualGross,
      declarations,
      currentMonth,
      taxPaidYtd,
    );

    const oldRegimeCalc = this.statutoryCalculator.calculateTds(
      TaxRegime.OLD_REGIME,
      annualGross,
      declarations,
      currentMonth,
      taxPaidYtd,
    );

    const activeCalc = taxProfile.selectedRegime === TaxRegime.OLD_REGIME ? oldRegimeCalc : newRegimeCalc;

    return {
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.workEmail,
      },
      financialYear,
      selectedRegime: taxProfile.selectedRegime,
      activeCalculation: activeCalc,
      regimeComparison: {
        newRegime: newRegimeCalc,
        oldRegime: oldRegimeCalc,
        taxDifference: Number((oldRegimeCalc.totalAnnualTaxLiability - newRegimeCalc.totalAnnualTaxLiability).toFixed(2)),
        recommendedRegime:
          newRegimeCalc.totalAnnualTaxLiability <= oldRegimeCalc.totalAnnualTaxLiability
            ? TaxRegime.NEW_REGIME
            : TaxRegime.OLD_REGIME,
      },
      declarations,
      pastMonthlyTds: pastCalculations,
    };
  }

  async recalculateTdsForRun(
    payrollRunId: string,
    organizationId: string,
    userId: string,
    specificEmployeeId?: string | null,
    financialYear: string = '2025-2026',
    ip?: string,
    ua?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
      include: {
        payrollPeriod: true,
        records: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Payroll run '${payrollRunId}' not found`);
    }

    const month = run.payrollPeriod.payrollMonth;
    const year = run.payrollPeriod.payrollYear;

    let targetRecords = run.records;
    if (specificEmployeeId) {
      targetRecords = targetRecords.filter((r) => r.employeeId === specificEmployeeId);
    }

    const calculatedTdsList = [];

    for (const record of targetRecords) {
      const summary = await this.getEmployeeTaxSummary(organizationId, record.employeeId, financialYear);
      const activeCalc = summary.activeCalculation;

      const tdsRecord = await this.prisma.employeeTdsCalculation.upsert({
        where: {
          organizationId_employeeId_financialYear_month_year: {
            organizationId,
            employeeId: record.employeeId,
            financialYear,
            month,
            year,
          },
        },
        create: {
          organizationId,
          employeeId: record.employeeId,
          payrollRunId,
          financialYear,
          month,
          year,
          selectedRegime: activeCalc.selectedRegime,
          annualGrossSalary: activeCalc.annualGrossSalary,
          standardDeduction: activeCalc.standardDeduction,
          professionalTaxAnnual: activeCalc.professionalTaxAnnual,
          chapterVIAExemptions: activeCalc.chapterVIAExemptions,
          section80C: activeCalc.section80C,
          section80D: activeCalc.section80D,
          section80CCD1B: activeCalc.section80CCD1B,
          section24HomeLoan: activeCalc.section24HomeLoan,
          hraExemption: activeCalc.hraExemption,
          otherExemptions: activeCalc.otherExemptions,
          netTaxableIncome: activeCalc.netTaxableIncome,
          calculatedAnnualTax: activeCalc.calculatedAnnualTax,
          section87ARebate: activeCalc.section87ARebate,
          taxAfterRebate: activeCalc.taxAfterRebate,
          educationCess: activeCalc.educationCess,
          totalAnnualTaxLiability: activeCalc.totalAnnualTaxLiability,
          taxPaidYtd: activeCalc.taxPaidYtd,
          remainingTax: activeCalc.remainingTax,
          remainingMonths: activeCalc.remainingMonths,
          monthlyTds: activeCalc.monthlyTds,
        },
        update: {
          payrollRunId,
          selectedRegime: activeCalc.selectedRegime,
          annualGrossSalary: activeCalc.annualGrossSalary,
          standardDeduction: activeCalc.standardDeduction,
          professionalTaxAnnual: activeCalc.professionalTaxAnnual,
          chapterVIAExemptions: activeCalc.chapterVIAExemptions,
          section80C: activeCalc.section80C,
          section80D: activeCalc.section80D,
          section80CCD1B: activeCalc.section80CCD1B,
          section24HomeLoan: activeCalc.section24HomeLoan,
          hraExemption: activeCalc.hraExemption,
          otherExemptions: activeCalc.otherExemptions,
          netTaxableIncome: activeCalc.netTaxableIncome,
          calculatedAnnualTax: activeCalc.calculatedAnnualTax,
          section87ARebate: activeCalc.section87ARebate,
          taxAfterRebate: activeCalc.taxAfterRebate,
          educationCess: activeCalc.educationCess,
          totalAnnualTaxLiability: activeCalc.totalAnnualTaxLiability,
          taxPaidYtd: activeCalc.taxPaidYtd,
          remainingTax: activeCalc.remainingTax,
          remainingMonths: activeCalc.remainingMonths,
          monthlyTds: activeCalc.monthlyTds,
        },
      });

      // Also update record.tds in PayrollEmployeeRecord
      await this.prisma.payrollEmployeeRecord.update({
        where: { id: record.id },
        data: {
          tds: activeCalc.monthlyTds,
        },
      });

      calculatedTdsList.push(tdsRecord);
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TDS_RECALCULATE,
      resource: 'employee_tds_calculations',
      details: { payrollRunId, count: calculatedTdsList.length },
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      recalculatedCount: calculatedTdsList.length,
      calculations: calculatedTdsList,
    };
  }
}
