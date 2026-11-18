import { Injectable } from '@nestjs/common';
import { PfRepository } from './pf.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, PfEcrReportRowDto } from '@zentra/shared-types';

@Injectable()
export class PfService {
  constructor(
    private readonly repository: PfRepository,
    private readonly auditService: AuditService,
  ) {}

  async getConfig(organizationId: string) {
    let config = await this.repository.findByOrganizationId(organizationId);
    if (!config) {
      config = await this.repository.upsert(organizationId, {
        pfEnabled: true,
        epfRateEmployee: 12.0,
        epfRateEmployer: 3.67,
        epsRateEmployer: 8.33,
        edliRate: 0.5,
        adminChargesRate: 0.5,
        wageCeiling: 15000,
        restrictEmployerShareToCeiling: true,
        allowVpf: true,
        proRatePensionBasis: true,
      });
    }
    return config;
  }

  async updateConfig(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const updated = await this.repository.upsert(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PF_CONFIG_UPDATE,
      resource: 'pf_configurations',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async getEcrReport(organizationId: string, month: number, year: number): Promise<PfEcrReportRowDto[]> {
    const records = await this.repository.getMonthlyPfRecords(organizationId, month, year);

    return records.map((rec) => {
      const uan = rec.employee.taxProfiles?.[0]?.uanNumber || 'NA';
      const grossWages = rec.grossEarnings;
      // EPF wage is capped at 15000 or actual basic/gross
      const epfWages = Math.min(grossWages, 15000);
      const epsWages = epfWages;
      const edliWages = epfWages;
      const ncpDays = Math.max(0, Math.round(rec.lopDays));

      return {
        uan,
        memberCode: rec.employee.employeeCode,
        memberName: `${rec.employee.firstName} ${rec.employee.lastName}`,
        grossWages: Number(grossWages.toFixed(2)),
        epfWages: Number(epfWages.toFixed(2)),
        epsWages: Number(epsWages.toFixed(2)),
        edliWages: Number(edliWages.toFixed(2)),
        epfContributionEmployee: Number(rec.employeePf.toFixed(2)),
        epsContributionEmployer: Number(rec.eps.toFixed(2)),
        epfContributionEmployerDifference: Number(rec.employerPf.toFixed(2)),
        ncpDays,
        refundOfAdvances: 0,
      };
    });
  }

  async exportEcrReport(organizationId: string, month: number, year: number, userId: string): Promise<string> {
    const report = await this.getEcrReport(organizationId, month, year);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.COMPLIANCE_REPORT_EXPORT,
      resource: 'pf_ecr_report',
      details: { month, year, rowCount: report.length },
    });

    const header = [
      'UAN',
      'Member Code',
      'Member Name',
      'Gross Wages',
      'EPF Wages',
      'EPS Wages',
      'EDLI Wages',
      'EE Share (EPF)',
      'ER Share (EPS)',
      'ER Share (EPF Diff)',
      'NCP Days',
      'Refund of Advances',
    ].join(',');

    const rows = report.map((r) =>
      [
        `"${r.uan}"`,
        `"${r.memberCode}"`,
        `"${r.memberName}"`,
        r.grossWages,
        r.epfWages,
        r.epsWages,
        r.edliWages,
        r.epfContributionEmployee,
        r.epsContributionEmployer,
        r.epfContributionEmployerDifference,
        r.ncpDays,
        r.refundOfAdvances,
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
