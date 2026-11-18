import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProfessionalTaxRepository } from './professional-tax.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, ProfessionalTaxReportRowDto } from '@zentra/shared-types';

@Injectable()
export class ProfessionalTaxService {
  constructor(
    private readonly repository: ProfessionalTaxRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAllRules(organizationId: string) {
    let rules = await this.repository.findAllRules(organizationId);
    if (rules.length === 0) {
      // Auto-seed Maharashtra and Karnataka rules & slabs
      const mhRule = await this.repository.createRule(organizationId, {
        state: 'Maharashtra',
        stateCode: 'MH',
        isActive: true,
        deductionFrequency: 'MONTHLY',
      });
      await this.repository.addSlab(organizationId, mhRule.id, {
        minSalary: 0,
        maxSalary: 7500,
        taxAmount: 0,
        gender: 'ALL',
      });
      await this.repository.addSlab(organizationId, mhRule.id, {
        minSalary: 7501,
        maxSalary: 10000,
        taxAmount: 175,
        gender: 'MALE',
      });
      await this.repository.addSlab(organizationId, mhRule.id, {
        minSalary: 10001,
        maxSalary: null,
        taxAmount: 200,
        gender: 'ALL',
        specificMonth: 2, // February
        specificMonthAmount: 300,
      });

      const kaRule = await this.repository.createRule(organizationId, {
        state: 'Karnataka',
        stateCode: 'KA',
        isActive: true,
        deductionFrequency: 'MONTHLY',
      });
      await this.repository.addSlab(organizationId, kaRule.id, {
        minSalary: 0,
        maxSalary: 14999,
        taxAmount: 0,
        gender: 'ALL',
      });
      await this.repository.addSlab(organizationId, kaRule.id, {
        minSalary: 15000,
        maxSalary: null,
        taxAmount: 200,
        gender: 'ALL',
      });

      rules = await this.repository.findAllRules(organizationId);
    }
    return rules;
  }

  async findRuleById(id: string, organizationId: string) {
    const rule = await this.repository.findRuleById(id, organizationId);
    if (!rule) {
      throw new NotFoundException(`Professional Tax rule '${id}' not found`);
    }
    return rule;
  }

  async createRule(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.repository.findRuleByStateCode(organizationId, data.stateCode);
    if (existing) {
      throw new ConflictException(`PT rule for state code '${data.stateCode}' already exists`);
    }

    const created = await this.repository.createRule(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROFESSIONAL_TAX_UPDATE,
      resource: 'professional_tax_rules',
      resourceId: created.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return created;
  }

  async updateRule(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findRuleById(id, organizationId);
    const updated = await this.repository.updateRule(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROFESSIONAL_TAX_UPDATE,
      resource: 'professional_tax_rules',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async addSlab(organizationId: string, ruleId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findRuleById(ruleId, organizationId);
    const slab = await this.repository.addSlab(organizationId, ruleId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROFESSIONAL_TAX_SLAB_CREATE,
      resource: 'professional_tax_slabs',
      resourceId: slab.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return slab;
  }

  async updateSlab(slabId: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const updated = await this.repository.updateSlab(slabId, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROFESSIONAL_TAX_SLAB_UPDATE,
      resource: 'professional_tax_slabs',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async deleteSlab(slabId: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const deleted = await this.repository.deleteSlab(slabId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROFESSIONAL_TAX_SLAB_DELETE,
      resource: 'professional_tax_slabs',
      resourceId: slabId,
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  async getPtReport(organizationId: string, month: number, year: number): Promise<ProfessionalTaxReportRowDto[]> {
    const records = await this.repository.getMonthlyPtRecords(organizationId, month, year);

    return records.map((rec) => ({
      employeeCode: rec.employee.employeeCode,
      employeeName: `${rec.employee.firstName} ${rec.employee.lastName}`,
      state: rec.employee.location?.state || 'Maharashtra',
      locationName: rec.employee.location?.name || 'Headquarters',
      grossSalary: Number(rec.grossEarnings.toFixed(2)),
      ptAmount: Number(rec.professionalTax.toFixed(2)),
    }));
  }

  async exportPtReport(organizationId: string, month: number, year: number, userId: string): Promise<string> {
    const report = await this.getPtReport(organizationId, month, year);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.COMPLIANCE_REPORT_EXPORT,
      resource: 'pt_report',
      details: { month, year, rowCount: report.length },
    });

    const header = ['Employee Code', 'Employee Name', 'State', 'Location', 'Gross Salary', 'PT Amount'].join(',');
    const rows = report.map((r) =>
      [`"${r.employeeCode}"`, `"${r.employeeName}"`, `"${r.state}"`, `"${r.locationName}"`, r.grossSalary, r.ptAmount].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
