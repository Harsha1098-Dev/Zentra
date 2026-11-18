import { Injectable, NotFoundException } from '@nestjs/common';
import { Form16Repository } from './form16.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { StatutoryCalculatorService } from '../statutory-calculator.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, Form16Status, TaxRegime } from '@zentra/shared-types';

@Injectable()
export class Form16Service {
  constructor(
    private readonly repository: Form16Repository,
    private readonly prisma: PrismaService,
    private readonly statutoryCalculator: StatutoryCalculatorService,
    private readonly auditService: AuditService,
  ) {}

  async prepareForm16(
    organizationId: string,
    financialYear: string,
    assessmentYear: string,
    employeeIds?: string[],
    userId?: string,
    ip?: string,
    ua?: string,
  ) {
    const where: any = { organizationId, deletedAt: null };
    if (employeeIds && employeeIds.length > 0) {
      where.id = { in: employeeIds };
    }

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        salaryAssignments: {
          where: { status: 'ACTIVE' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
        taxProfiles: {
          where: { organizationId, financialYear },
          take: 1,
        },
        taxDeclarations: {
          where: { organizationId, financialYear },
        },
        tdsCalculations: {
          where: { organizationId, financialYear },
        },
      },
    });

    const preparedRecords = [];

    for (const emp of employees) {
      const taxProfile = emp.taxProfiles?.[0];
      const selectedRegime = taxProfile?.selectedRegime || TaxRegime.NEW_REGIME;
      const pan = taxProfile?.panNumber || null;

      // Calculate annual totals from monthly TDS calculations or employee salary
      const tdsCalcs = emp.tdsCalculations || [];
      const totalTdsDeducted = tdsCalcs.reduce((acc, c) => acc + c.monthlyTds, 0);

      const activeAssignment = emp.salaryAssignments?.[0];
      const annualGross = activeAssignment ? activeAssignment.annualCtc : 600000;

      const calc = this.statutoryCalculator.calculateTds(
        selectedRegime,
        annualGross,
        emp.taxDeclarations || [],
        3, // March (final month)
        0,
      );

      const record = await this.repository.upsert(organizationId, emp.id, financialYear, {
        assessmentYear,
        selectedRegime,
        grossSalary: calc.annualGrossSalary,
        exemptionsUs10: calc.hraExemption,
        standardDeduction: calc.standardDeduction,
        professionalTax: calc.professionalTaxAnnual,
        grossTotalIncome: Math.max(0, calc.annualGrossSalary - calc.standardDeduction - calc.professionalTaxAnnual),
        totalDeductionsChapterVIA: calc.chapterVIAExemptions,
        totalTaxableIncome: calc.netTaxableIncome,
        totalTaxPayable: calc.calculatedAnnualTax,
        section87ARebate: calc.section87ARebate,
        cess: calc.educationCess,
        netTaxPayable: calc.totalAnnualTaxLiability,
        totalTdsDeducted: Number(totalTdsDeducted.toFixed(2)),
        totalTdsDeposited: Number(totalTdsDeducted.toFixed(2)),
        status: Form16Status.GENERATED,
      });

      preparedRecords.push(record);
    }

    if (userId) {
      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.FORM16_PREPARE,
        resource: 'form16_records',
        details: { financialYear, count: preparedRecords.length },
        ipAddress: ip,
        userAgent: ua,
      });
    }

    return {
      financialYear,
      assessmentYear,
      preparedCount: preparedRecords.length,
      records: preparedRecords,
    };
  }

  async publishForm16(
    organizationId: string,
    recordIds?: string[],
    financialYear?: string,
    userId?: string,
    ip?: string,
    ua?: string,
  ) {
    const result = await this.repository.publishRecords(organizationId, recordIds, financialYear, userId);

    if (userId) {
      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.FORM16_PUBLISH,
        resource: 'form16_records',
        details: { recordIds, financialYear, count: result.count },
        ipAddress: ip,
        userAgent: ua,
      });
    }

    return { publishedCount: result.count };
  }

  async findAll(organizationId: string, filters: { financialYear?: string; status?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const record = await this.repository.findById(id, organizationId);
    if (!record) {
      throw new NotFoundException(`Form 16 record '${id}' not found`);
    }
    return record;
  }

  async getMyForm16(organizationId: string, userId: string, email?: string) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not found for user');
    }

    return this.repository.findByEmployee(organizationId, employee.id);
  }

  async downloadForm16(id: string, organizationId: string, userId?: string) {
    const record = await this.findById(id, organizationId);

    if (userId) {
      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.FORM16_DOWNLOAD,
        resource: 'form16_records',
        resourceId: id,
      });
    }

    return {
      certificateNumber: `F16-${record.financialYear}-${record.employeeId.slice(0, 8).toUpperCase()}`,
      employee: {
        id: record.employee.id,
        name: `${record.employee.firstName} ${record.employee.lastName}`,
        code: record.employee.employeeCode,
        pan: record.employee.taxProfiles?.[0]?.panNumber || 'PANNOTAVBL',
      },
      assessmentYear: record.assessmentYear,
      financialYear: record.financialYear,
      regime: record.selectedRegime,
      summary: {
        grossSalary: record.grossSalary,
        standardDeduction: record.standardDeduction,
        exemptionsUs10: record.exemptionsUs10,
        professionalTax: record.professionalTax,
        grossTotalIncome: record.grossTotalIncome,
        totalDeductionsChapterVIA: record.totalDeductionsChapterVIA,
        totalTaxableIncome: record.totalTaxableIncome,
        totalTaxPayable: record.totalTaxPayable,
        section87ARebate: record.section87ARebate,
        cess: record.cess,
        netTaxPayable: record.netTaxPayable,
        totalTdsDeducted: record.totalTdsDeducted,
        totalTdsDeposited: record.totalTdsDeposited,
      },
      publishedAt: record.publishedAt,
    };
  }
}
