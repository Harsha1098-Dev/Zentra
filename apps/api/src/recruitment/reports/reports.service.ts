import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getJobOpeningSummary(organizationId: string) {
    return this.repository.getJobOpeningSummary(organizationId);
  }

  async getCandidatePipeline(organizationId: string) {
    return this.repository.getCandidatePipeline(organizationId);
  }

  async getInterviewStatus(organizationId: string) {
    return this.repository.getInterviewStatus(organizationId);
  }

  async getOfferStatus(organizationId: string) {
    return this.repository.getOfferStatus(organizationId);
  }

  async getTimeToHire(organizationId: string) {
    return this.repository.getTimeToHire(organizationId);
  }

  async getSourceReport(organizationId: string) {
    return this.repository.getSourceReport(organizationId);
  }

  async exportReport(organizationId: string, userId: string, ip?: string, ua?: string) {
    const applications = await this.repository.getApplicationsForExport(organizationId);

    const headers = [
      'Application ID',
      'Candidate Name',
      'Candidate Email',
      'Job Title',
      'Department',
      'Current Stage',
      'Status',
      'Source',
      'Applied At',
      'Offer Status',
    ];

    const rows = applications.map((a) => [
      a.id,
      `"${a.candidate.firstName} ${a.candidate.lastName}"`,
      a.candidate.email,
      `"${a.jobOpening.title}"`,
      `"${a.jobOpening.department?.name || 'N/A'}"`,
      a.currentStageName,
      a.applicationStatus,
      a.sourceType,
      a.appliedAt.toISOString().split('T')[0],
      a.offer?.offerStatus || 'NONE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.RECRUITMENT_REPORT_EXPORT,
      resource: 'RecruitmentReport',
      details: { exportCount: applications.length },
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      csv: csvContent,
      rowCount: applications.length,
      fileName: `zentra_recruitment_report_${organizationId}_${Date.now()}.csv`,
    };
  }
}
