import { Injectable } from '@nestjs/common';
import { EsiRepository } from './esi.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, EsiRegisterReportRowDto } from '@zentra/shared-types';

@Injectable()
export class EsiService {
  constructor(
    private readonly repository: EsiRepository,
    private readonly auditService: AuditService,
  ) {}

  async getConfig(organizationId: string) {
    let config = await this.repository.findByOrganizationId(organizationId);
    if (!config) {
      config = await this.repository.upsert(organizationId, {
        esiEnabled: true,
        employeeContributionRate: 0.75,
        employerContributionRate: 3.25,
        wageCeiling: 21000,
        disabilityWageCeiling: 25000,
      });
    }
    return config;
  }

  async updateConfig(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const updated = await this.repository.upsert(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ESI_CONFIG_UPDATE,
      resource: 'esi_configurations',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async getEsiReport(organizationId: string, month: number, year: number): Promise<EsiRegisterReportRowDto[]> {
    const records = await this.repository.getMonthlyEsiRecords(organizationId, month, year);

    return records.map((rec) => {
      const ipNumber = rec.employee.taxProfiles?.[0]?.esiNumber || 'NA';
      const noOfDaysWorked = Math.max(0, Math.round(rec.payableDays));
      const totalMonthlyWages = rec.grossEarnings;
      const employeeContribution = rec.employeeEsi;
      const employerContribution = rec.employerEsi;
      const totalContribution = Number((employeeContribution + employerContribution).toFixed(2));

      return {
        ipNumber,
        ipName: `${rec.employee.firstName} ${rec.employee.lastName}`,
        noOfDaysWorked,
        totalMonthlyWages: Number(totalMonthlyWages.toFixed(2)),
        employeeContribution: Number(employeeContribution.toFixed(2)),
        employerContribution: Number(employerContribution.toFixed(2)),
        totalContribution,
        reasonForZeroWorkingDays: noOfDaysWorked === 0 ? 'LOP/Leave without pay' : undefined,
      };
    });
  }

  async exportEsiReport(organizationId: string, month: number, year: number, userId: string): Promise<string> {
    const report = await this.getEsiReport(organizationId, month, year);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.COMPLIANCE_REPORT_EXPORT,
      resource: 'esi_register_report',
      details: { month, year, rowCount: report.length },
    });

    const header = [
      'IP Number',
      'IP Name',
      'No of Days Worked',
      'Total Monthly Wages',
      'Employee Contribution (0.75%)',
      'Employer Contribution (3.25%)',
      'Total Contribution',
      'Reason For Zero Working Days',
    ].join(',');

    const rows = report.map((r) =>
      [
        `"${r.ipNumber}"`,
        `"${r.ipName}"`,
        r.noOfDaysWorked,
        r.totalMonthlyWages,
        r.employeeContribution,
        r.employerContribution,
        r.totalContribution,
        `"${r.reasonForZeroWorkingDays || ''}"`,
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
