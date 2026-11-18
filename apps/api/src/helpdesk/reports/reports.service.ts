import { Injectable } from '@nestjs/common';
import { HelpdeskReportsRepository } from './reports.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HelpdeskReportsService {
  constructor(
    private readonly repository: HelpdeskReportsRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async getSummary(organizationId: string) {
    return this.repository.getSummary(organizationId);
  }

  async getWorkbenchSummary(organizationId: string, userId: string) {
    // Find if user is an agent
    const agent = await this.prisma.helpdeskAgent.findFirst({
      where: { organizationId, userId },
    });
    return this.repository.getWorkbenchSummary(organizationId, agent?.id);
  }

  async exportCsv(
    organizationId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const tickets = await this.repository.getExportTickets(organizationId);

    const headers = [
      'Ticket Number',
      'Subject',
      'Employee Code',
      'Employee Name',
      'Category',
      'Priority',
      'Status',
      'Assigned Agent',
      'Created At',
      'Resolved At',
      'Satisfaction Rating',
    ];

    const rows = tickets.map((t) => [
      t.ticketNumber,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.employee?.employeeCode || '',
      `"${(t.employee?.firstName + ' ' + t.employee?.lastName).trim()}"`,
      `"${t.helpdeskCategory?.name || ''}"`,
      t.priority,
      t.ticketStatus,
      t.assignedAgent?.user ? `"${t.assignedAgent.user.firstName} ${t.assignedAgent.user.lastName}"` : 'Unassigned',
      t.createdAt.toISOString(),
      t.resolvedAt ? t.resolvedAt.toISOString() : '',
      t.satisfactionRating !== null && t.satisfactionRating !== undefined ? t.satisfactionRating : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.HELPDESK_REPORT_EXPORT,
      resource: 'HelpdeskReport',
      ipAddress,
      userAgent,
      details: { format: 'CSV', count: tickets.length },
    });

    return csvContent;
  }
}
