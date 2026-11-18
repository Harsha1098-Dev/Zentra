import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { LwfRepository } from './lwf.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, LwfReportRowDto } from '@zentra/shared-types';

@Injectable()
export class LwfService {
  constructor(
    private readonly repository: LwfRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAllRules(organizationId: string) {
    let rules = await this.repository.findAllRules(organizationId);
    if (rules.length === 0) {
      // Auto-seed default state LWF rules
      await this.repository.createRule(organizationId, {
        state: 'Maharashtra',
        stateCode: 'MH',
        isActive: true,
        employeeContribution: 12,
        employerContribution: 36,
        deductionFrequency: 'HALF_YEARLY',
        deductionMonths: [6, 12],
      });
      await this.repository.createRule(organizationId, {
        state: 'Karnataka',
        stateCode: 'KA',
        isActive: true,
        employeeContribution: 20,
        employerContribution: 40,
        deductionFrequency: 'YEARLY',
        deductionMonths: [12],
      });
      await this.repository.createRule(organizationId, {
        state: 'Gujarat',
        stateCode: 'GJ',
        isActive: true,
        employeeContribution: 6,
        employerContribution: 12,
        deductionFrequency: 'HALF_YEARLY',
        deductionMonths: [6, 12],
      });

      rules = await this.repository.findAllRules(organizationId);
    }
    return rules;
  }

  async findRuleById(id: string, organizationId: string) {
    const rule = await this.repository.findRuleById(id, organizationId);
    if (!rule) {
      throw new NotFoundException(`LWF rule '${id}' not found`);
    }
    return rule;
  }

  async createRule(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.repository.findRuleByStateCode(organizationId, data.stateCode);
    if (existing) {
      throw new ConflictException(`LWF rule for state '${data.stateCode}' already exists`);
    }

    const created = await this.repository.createRule(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.LWF_RULE_CREATE,
      resource: 'lwf_rules',
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
      action: AuditAction.LWF_RULE_UPDATE,
      resource: 'lwf_rules',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async deleteRule(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findRuleById(id, organizationId);
    const deleted = await this.repository.deleteRule(id);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.LWF_RULE_DELETE,
      resource: 'lwf_rules',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  async getLwfReport(organizationId: string, month: number, year: number): Promise<LwfReportRowDto[]> {
    const records = await this.repository.getMonthlyLwfRecords(organizationId, month, year);

    return records.map((rec) => ({
      employeeCode: rec.employee.employeeCode,
      employeeName: `${rec.employee.firstName} ${rec.employee.lastName}`,
      state: rec.employee.location?.state || 'Maharashtra',
      locationName: rec.employee.location?.name || 'Headquarters',
      employeeContribution: Number(rec.lwfEmployee.toFixed(2)),
      employerContribution: Number(rec.lwfEmployer.toFixed(2)),
      totalContribution: Number((rec.lwfEmployee + rec.lwfEmployer).toFixed(2)),
    }));
  }

  async exportLwfReport(organizationId: string, month: number, year: number, userId: string): Promise<string> {
    const report = await this.getLwfReport(organizationId, month, year);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.COMPLIANCE_REPORT_EXPORT,
      resource: 'lwf_report',
      details: { month, year, rowCount: report.length },
    });

    const header = ['Employee Code', 'Employee Name', 'State', 'Location', 'EE Contribution', 'ER Contribution', 'Total Contribution'].join(',');
    const rows = report.map((r) =>
      [`"${r.employeeCode}"`, `"${r.employeeName}"`, `"${r.state}"`, `"${r.locationName}"`, r.employeeContribution, r.employerContribution, r.totalContribution].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
