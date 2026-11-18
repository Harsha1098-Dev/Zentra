import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMySummary(organizationId: string, employeeId: string) {
    const [goals, okrs, kras, feedback, latestAssignment] = await Promise.all([
      this.prisma.goal.findMany({
        where: { organizationId, employeeId, deletedAt: null },
      }),
      this.prisma.objective.findMany({
        where: { organizationId, ownerId: employeeId, deletedAt: null },
        include: { keyResults: { where: { deletedAt: null } } },
      }),
      this.prisma.kRA.findMany({
        where: { organizationId, employeeId, deletedAt: null },
      }),
      this.prisma.continuousFeedback.findMany({
        where: { organizationId, employeeId, deletedAt: null },
      }),
      this.prisma.appraisalAssignment.findFirst({
        where: { organizationId, employeeId },
        orderBy: { createdAt: 'desc' },
        include: { performanceCycle: true },
      }),
    ]);

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const avgGoalProgress = totalGoals > 0 ? Math.round(goals.reduce((a, b) => a + b.progressPercentage, 0) / totalGoals) : 0;

    const totalOkrs = okrs.length;
    const avgOkrProgress = totalOkrs > 0 ? Math.round(okrs.reduce((a, b) => a + b.progressPercentage, 0) / totalOkrs) : 0;

    return {
      employeeId,
      goals: {
        total: totalGoals,
        completed: completedGoals,
        averageProgress: avgGoalProgress,
      },
      okrs: {
        total: totalOkrs,
        averageProgress: avgOkrProgress,
      },
      krasCount: kras.length,
      feedbackCount: feedback.length,
      latestAppraisal: latestAssignment
        ? {
            id: latestAssignment.id,
            cycleName: latestAssignment.performanceCycle?.name,
            status: latestAssignment.status,
            finalRating: latestAssignment.finalRating,
            acknowledgedAt: latestAssignment.acknowledgedAt,
          }
        : null,
    };
  }

  async getTeamSummary(organizationId: string, managerId: string) {
    const reportees = await this.prisma.employee.findMany({
      where: { organizationId, reportingManagerId: managerId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        department: { select: { name: true } },
      },
    });

    const reporteeIds = reportees.map((r) => r.id);

    const [goals, assignments] = await Promise.all([
      this.prisma.goal.findMany({
        where: { organizationId, employeeId: { in: reporteeIds }, deletedAt: null },
      }),
      this.prisma.appraisalAssignment.findMany({
        where: { organizationId, employeeId: { in: reporteeIds } },
        include: { employee: true },
      }),
    ]);

    return {
      managerId,
      reporteesCount: reportees.length,
      teamGoalsCount: goals.length,
      teamGoalsCompleted: goals.filter((g) => g.status === 'COMPLETED').length,
      teamAppraisalsCount: assignments.length,
      submittedReviews: assignments.filter((a) => a.managerReviewStatus === 'SUBMITTED').length,
      reportees: reportees.map((r) => {
        const empGoals = goals.filter((g) => g.employeeId === r.id);
        const empAssignment = assignments.find((a) => a.employeeId === r.id);
        return {
          ...r,
          goalsCount: empGoals.length,
          goalsCompleted: empGoals.filter((g) => g.status === 'COMPLETED').length,
          appraisalStatus: empAssignment?.status || 'NOT_STARTED',
          finalRating: empAssignment?.finalRating || null,
        };
      }),
    };
  }

  async getOrganizationSummary(organizationId: string) {
    const [employeesCount, activeCycles, goals, okrs, assignments] = await Promise.all([
      this.prisma.employee.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.performanceCycle.count({
        where: { organizationId, status: { in: ['ACTIVE', 'IN_PROGRESS'] }, deletedAt: null },
      }),
      this.prisma.goal.findMany({
        where: { organizationId, deletedAt: null },
        select: { status: true, progressPercentage: true },
      }),
      this.prisma.objective.findMany({
        where: { organizationId, deletedAt: null },
        select: { status: true, progressPercentage: true },
      }),
      this.prisma.appraisalAssignment.findMany({
        where: { organizationId },
        select: { status: true, finalRating: true },
      }),
    ]);

    return {
      totalEmployees: employeesCount,
      activeCyclesCount: activeCycles,
      goals: {
        total: goals.length,
        completed: goals.filter((g) => g.status === 'COMPLETED').length,
        inProgress: goals.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'ACTIVE').length,
        avgProgress: goals.length > 0 ? Math.round(goals.reduce((a, b) => a + b.progressPercentage, 0) / goals.length) : 0,
      },
      okrs: {
        total: okrs.length,
        avgProgress: okrs.length > 0 ? Math.round(okrs.reduce((a, b) => a + b.progressPercentage, 0) / okrs.length) : 0,
      },
      appraisals: {
        total: assignments.length,
        submitted: assignments.filter((a) => a.status === 'SUBMITTED' || a.status === 'APPROVED' || a.status === 'PUBLISHED').length,
        published: assignments.filter((a) => a.status === 'PUBLISHED' || a.status === 'ACKNOWLEDGED').length,
      },
    };
  }

  async getRatingDistribution(organizationId: string, performanceCycleId?: string) {
    const where: any = {
      organizationId,
      finalRating: { not: null },
    };
    if (performanceCycleId) where.performanceCycleId = performanceCycleId;

    const assignments = await this.prisma.appraisalAssignment.findMany({
      where,
      select: { finalRating: true },
    });

    const distribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    for (const a of assignments) {
      if (a.finalRating !== null) {
        const rounded = Math.round(a.finalRating).toString();
        if (distribution[rounded] !== undefined) {
          distribution[rounded] += 1;
        }
      }
    }

    return {
      totalEvaluated: assignments.length,
      distribution,
    };
  }
}
