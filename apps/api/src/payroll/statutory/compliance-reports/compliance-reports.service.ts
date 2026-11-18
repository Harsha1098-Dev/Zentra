import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import {
  AuditAction,
  StatutoryComplianceDashboardDto,
  Tds24QReportRowDto,
  StatutoryType,
} from '@zentra/shared-types';

@Injectable()
export class ComplianceReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard(organizationId: string, financialYear: string = '2025-2026'): Promise<StatutoryComplianceDashboardDto> {
    const activeEmployeesCount = await this.prisma.employee.count({
      where: { organizationId, deletedAt: null, status: 'ACTIVE' },
    });

    const taxProfiles = await this.prisma.employeeTaxProfile.findMany({
      where: { organizationId, financialYear },
    });

    const newRegimeCount = taxProfiles.filter((p) => p.selectedRegime === 'NEW_REGIME').length;
    const oldRegimeCount = taxProfiles.filter((p) => p.selectedRegime === 'OLD_REGIME').length;
    const pendingCount = Math.max(0, activeEmployeesCount - taxProfiles.length);

    const verifiedPanCount = taxProfiles.filter((p) => p.panVerificationStatus === 'VERIFIED').length;
    const unverifiedPanCount = taxProfiles.filter((p) => p.panVerificationStatus === 'UNVERIFIED').length;
    const failedPanCount = taxProfiles.filter((p) => p.panVerificationStatus === 'FAILED').length;
    const missingPanCount = Math.max(
      0,
      activeEmployeesCount - taxProfiles.filter((p) => p.panNumber && p.panNumber.trim().length > 0).length,
    );

    const declarations = await this.prisma.employeeTaxDeclaration.findMany({
      where: { organizationId, financialYear },
    });

    const totalSubmitted = declarations.filter((d) => d.status === 'SUBMITTED').length;
    const pendingReview = totalSubmitted;
    const approved = declarations.filter((d) => d.status === 'APPROVED').length;
    const rejected = declarations.filter((d) => d.status === 'REJECTED').length;

    const proofs = await this.prisma.employeeInvestmentProof.findMany({
      where: { organizationId },
    });

    const totalUploaded = proofs.length;
    const pendingVerification = proofs.filter((p) => p.verificationStatus === 'PENDING').length;
    const verified = proofs.filter((p) => p.verificationStatus === 'VERIFIED').length;
    const rejectedProofs = proofs.filter((p) => p.verificationStatus === 'REJECTED').length;

    // Monthly contribution totals from latest payroll run
    const latestRun = await this.prisma.payrollRun.findFirst({
      where: { organizationId, status: { in: ['CALCULATED', 'APPROVED', 'PAID'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        payrollPeriod: true,
        records: true,
      },
    });

    let monthlyContributions = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalPfEmployee: 0,
      totalPfEmployer: 0,
      totalEsiEmployee: 0,
      totalEsiEmployer: 0,
      totalPt: 0,
      totalLwf: 0,
      totalTds: 0,
    };

    if (latestRun) {
      monthlyContributions.month = latestRun.payrollPeriod.payrollMonth;
      monthlyContributions.year = latestRun.payrollPeriod.payrollYear;

      for (const rec of latestRun.records) {
        monthlyContributions.totalPfEmployee += rec.employeePf;
        monthlyContributions.totalPfEmployer += rec.employerPf + rec.eps + rec.edli + rec.adminChargesPf;
        monthlyContributions.totalEsiEmployee += rec.employeeEsi;
        monthlyContributions.totalEsiEmployer += rec.employerEsi;
        monthlyContributions.totalPt += rec.professionalTax;
        monthlyContributions.totalLwf += rec.lwfEmployee + rec.lwfEmployer;
        monthlyContributions.totalTds += rec.tds;
      }

      monthlyContributions.totalPfEmployee = Number(monthlyContributions.totalPfEmployee.toFixed(2));
      monthlyContributions.totalPfEmployer = Number(monthlyContributions.totalPfEmployer.toFixed(2));
      monthlyContributions.totalEsiEmployee = Number(monthlyContributions.totalEsiEmployee.toFixed(2));
      monthlyContributions.totalEsiEmployer = Number(monthlyContributions.totalEsiEmployer.toFixed(2));
      monthlyContributions.totalPt = Number(monthlyContributions.totalPt.toFixed(2));
      monthlyContributions.totalLwf = Number(monthlyContributions.totalLwf.toFixed(2));
      monthlyContributions.totalTds = Number(monthlyContributions.totalTds.toFixed(2));
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const upcomingDeadlines: StatutoryComplianceDashboardDto['upcomingDeadlines'] = [
      {
        title: 'PF ECR & Electronic Payment',
        description: 'Monthly EPF and EPS contribution remittance for employees',
        dueDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
        statutoryType: StatutoryType.PF,
        status: 'UPCOMING',
      },
      {
        title: 'ESI Monthly Challan',
        description: 'Monthly ESI contribution deposit on ESIC portal',
        dueDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
        statutoryType: StatutoryType.ESI,
        status: 'UPCOMING',
      },
      {
        title: 'TDS Challan 281 Deposit',
        description: 'Deposit of tax deducted at source under Section 192',
        dueDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-07`,
        statutoryType: StatutoryType.TDS,
        status: 'UPCOMING',
      },
      {
        title: 'Professional Tax Return',
        description: 'State PT remittance and monthly challan submission',
        dueDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-20`,
        statutoryType: StatutoryType.PROFESSIONAL_TAX,
        status: 'UPCOMING',
      },
    ];

    return {
      financialYear,
      activeEmployeesCount,
      regimeSelectionSummary: {
        newRegimeCount,
        oldRegimeCount,
        pendingCount,
      },
      panStatusSummary: {
        verifiedCount: verifiedPanCount,
        unverifiedCount: unverifiedPanCount,
        failedCount: failedPanCount,
        missingCount: missingPanCount,
      },
      declarationsSummary: {
        totalSubmitted,
        pendingReview,
        approved,
        rejected,
      },
      proofsSummary: {
        totalUploaded,
        pendingVerification,
        verified,
        rejected: rejectedProofs,
      },
      monthlyContributions,
      upcomingDeadlines,
    };
  }

  async getTds24QReport(
    organizationId: string,
    quarter: number = 1,
    financialYear: string = '2025-2026',
  ): Promise<Tds24QReportRowDto[]> {
    // Quarter months mapping
    // Q1: Apr, May, Jun (4, 5, 6)
    // Q2: Jul, Aug, Sep (7, 8, 9)
    // Q3: Oct, Nov, Dec (10, 11, 12)
    // Q4: Jan, Feb, Mar (1, 2, 3)
    const quarterMonthsMap: Record<number, number[]> = {
      1: [4, 5, 6],
      2: [7, 8, 9],
      3: [10, 11, 12],
      4: [1, 2, 3],
    };

    const targetMonths = quarterMonthsMap[quarter] || [4, 5, 6];

    const tdsCalculations = await this.prisma.employeeTdsCalculation.findMany({
      where: {
        organizationId,
        financialYear,
        month: { in: targetMonths },
      },
      include: {
        employee: {
          include: {
            taxProfiles: {
              where: { organizationId, financialYear },
              take: 1,
            },
          },
        },
      },
    });

    return tdsCalculations.map((c) => {
      const pan = c.employee.taxProfiles?.[0]?.panNumber || 'PANNOTAVBL';
      const monthlyGross = Number((c.annualGrossSalary / 12).toFixed(2));
      const monthlyTax = Number((c.monthlyTds / 1.04).toFixed(2));
      const cess = Number((c.monthlyTds - monthlyTax).toFixed(2));

      return {
        pan,
        employeeCode: c.employee.employeeCode,
        employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
        dateOfPayment: `${c.year}-${String(c.month).padStart(2, '0')}-28`,
        taxableAmountPaid: monthlyGross,
        tdsDeducted: monthlyTax,
        surcharge: 0,
        educationCess: cess,
        totalTaxDeducted: c.monthlyTds,
        dateOfDeduction: `${c.year}-${String(c.month).padStart(2, '0')}-28`,
        remarksReason: pan === 'PANNOTAVBL' ? 'C' : undefined,
      };
    });
  }

  async exportTds24QReport(
    organizationId: string,
    quarter: number,
    financialYear: string,
    userId: string,
  ): Promise<string> {
    const report = await this.getTds24QReport(organizationId, quarter, financialYear);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.COMPLIANCE_REPORT_EXPORT,
      resource: 'tds_24q_report',
      details: { quarter, financialYear, rowCount: report.length },
    });

    const header = [
      'PAN of Deductee',
      'Employee Code',
      'Employee Name',
      'Date of Payment',
      'Taxable Amount Paid',
      'TDS Deducted',
      'Surcharge',
      'Education Cess (4%)',
      'Total Tax Deducted',
      'Date of Deduction',
      'Remarks',
    ].join(',');

    const rows = report.map((r) =>
      [
        `"${r.pan}"`,
        `"${r.employeeCode}"`,
        `"${r.employeeName}"`,
        `"${r.dateOfPayment}"`,
        r.taxableAmountPaid,
        r.tdsDeducted,
        r.surcharge,
        r.educationCess,
        r.totalTaxDeducted,
        `"${r.dateOfDeduction}"`,
        `"${r.remarksReason || ''}"`,
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
