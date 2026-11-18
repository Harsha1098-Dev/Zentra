import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getMySummary(organizationId: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found for user');
    }
    return this.repository.getMySummary(organizationId, employee.id);
  }

  async getTeamSummary(organizationId: string, userId: string) {
    const manager = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!manager) {
      throw new NotFoundException('Manager profile not found for user');
    }
    return this.repository.getTeamSummary(organizationId, manager.id);
  }

  async getDepartmentSummary(organizationId: string, departmentId?: string) {
    const where: any = { organizationId, deletedAt: null };
    if (departmentId) where.departmentId = departmentId;

    const employees = await this.prisma.employee.findMany({
      where,
      select: { id: true, departmentId: true },
    });
    const employeeIds = employees.map((e) => e.id);

    const goals = await this.prisma.goal.findMany({
      where: { organizationId, employeeId: { in: employeeIds }, deletedAt: null },
    });

    return {
      departmentId: departmentId || 'ALL',
      employeeCount: employees.length,
      goalsCount: goals.length,
      goalsCompleted: goals.filter((g) => g.status === 'COMPLETED').length,
      avgProgress: goals.length > 0 ? Math.round(goals.reduce((a, b) => a + b.progressPercentage, 0) / goals.length) : 0,
    };
  }

  async getOrganizationSummary(organizationId: string) {
    return this.repository.getOrganizationSummary(organizationId);
  }

  async getGoalCompletion(organizationId: string, employeeId?: string) {
    const where: any = { organizationId, deletedAt: null };
    if (employeeId) where.employeeId = employeeId;

    const goals = await this.prisma.goal.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });

    const statusCounts = goals.reduce((acc: any, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: goals.length,
      statusCounts,
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        employeeName: `${g.employee?.firstName} ${g.employee?.lastName}`,
        status: g.status,
        progressPercentage: g.progressPercentage,
        priority: g.priority,
        dueDate: g.dueDate,
      })),
    };
  }

  async getOkrProgress(organizationId: string) {
    const objectives = await this.prisma.objective.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        keyResults: { where: { deletedAt: null } },
      },
    });

    return {
      totalObjectives: objectives.length,
      objectives: objectives.map((obj) => ({
        id: obj.id,
        title: obj.title,
        ownerType: obj.ownerType,
        status: obj.status,
        progressPercentage: obj.progressPercentage,
        keyResultsCount: obj.keyResults.length,
      })),
    };
  }

  async getRatingDistribution(organizationId: string, performanceCycleId?: string) {
    return this.repository.getRatingDistribution(organizationId, performanceCycleId);
  }

  async exportReport(
    organizationId: string,
    reportType: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    let csvData = 'ID,Title,Status,Progress\n';

    if (reportType === 'GOALS') {
      const goals = await this.prisma.goal.findMany({
        where: { organizationId, deletedAt: null },
        include: { employee: true },
      });
      csvData = 'Employee Code,Employee Name,Goal Title,Category,Priority,Progress %,Status,Due Date\n';
      for (const g of goals) {
        csvData += `"${g.employee?.employeeCode}","${g.employee?.firstName} ${g.employee?.lastName}","${g.title}","${g.goalCategory}","${g.priority}",${g.progressPercentage},"${g.status}","${g.dueDate.toISOString().slice(0, 10)}"\n`;
      }
    } else if (reportType === 'APPRAISALS') {
      const assignments = await this.prisma.appraisalAssignment.findMany({
        where: { organizationId },
        include: { employee: true, performanceCycle: true },
      });
      csvData = 'Employee Code,Employee Name,Cycle Name,Self Review,Manager Review,Final Rating,Status\n';
      for (const a of assignments) {
        csvData += `"${a.employee?.employeeCode}","${a.employee?.firstName} ${a.employee?.lastName}","${a.performanceCycle?.name}","${a.selfReviewStatus}","${a.managerReviewStatus}",${a.finalRating ?? 'N/A'},"${a.status}"\n`;
      }
    } else {
      const okrs = await this.prisma.objective.findMany({
        where: { organizationId, deletedAt: null },
      });
      csvData = 'Objective ID,Title,Owner Type,Owner ID,Progress %,Status\n';
      for (const o of okrs) {
        csvData += `"${o.id}","${o.title}","${o.ownerType}","${o.ownerId}",${o.progressPercentage},"${o.status}"\n`;
      }
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PERFORMANCE_REPORT_EXPORT,
      resource: 'performance_reports',
      resourceId: reportType,
      details: { reportType, rowCount: csvData.split('\n').length - 1 },
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      reportType,
      filename: `performance_${reportType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`,
      data: csvData,
    };
  }
}
