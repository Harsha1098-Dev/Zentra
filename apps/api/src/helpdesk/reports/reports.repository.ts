import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HelpdeskReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      breached,
      feedbackAgg,
      categories,
      ticketsWithTimes,
      allTicketsForDist,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: { organizationId } }),
      this.prisma.ticket.count({ where: { organizationId, ticketStatus: 'OPEN' } }),
      this.prisma.ticket.count({ where: { organizationId, ticketStatus: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { organizationId, ticketStatus: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { organizationId, ticketStatus: 'CLOSED' } }),
      this.prisma.ticket.count({
        where: {
          organizationId,
          escalationStatus: 'BREACHED',
        },
      }),
      this.prisma.ticketFeedback.aggregate({
        where: { organizationId },
        _avg: { rating: true },
        _count: true,
      }),
      this.prisma.helpdeskCategory.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          _count: { select: { tickets: true } },
        },
      }),
      this.prisma.ticket.findMany({
        where: {
          organizationId,
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      }),
      this.prisma.ticket.findMany({
        where: { organizationId },
        select: {
          priority: true,
          ticketStatus: true,
        },
      }),
    ]);

    // Average resolution time in hours
    let averageResolutionHours = 0;
    if (ticketsWithTimes.length > 0) {
      const totalHours = ticketsWithTimes.reduce((acc, t) => {
        if (!t.resolvedAt) return acc;
        const diffMs = t.resolvedAt.getTime() - t.createdAt.getTime();
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      averageResolutionHours = Number((totalHours / ticketsWithTimes.length).toFixed(1));
    }

    // SLA compliance rate
    const slaComplianceRate = total > 0
      ? Number((((total - breached) / total) * 100).toFixed(1))
      : 100;

    // Distributions
    const priorityMap = new Map<string, number>();
    const statusMap = new Map<string, number>();

    for (const t of allTicketsForDist) {
      priorityMap.set(t.priority, (priorityMap.get(t.priority) || 0) + 1);
      statusMap.set(t.ticketStatus, (statusMap.get(t.ticketStatus) || 0) + 1);
    }

    const priorityDistribution = Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count,
    }));

    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const categoryDistribution = categories.map((c) => ({
      categoryName: c.name,
      count: c._count.tickets,
    }));

    return {
      totalTicketsCount: total,
      openTicketsCount: open,
      inProgressTicketsCount: inProgress,
      resolvedTicketsCount: resolved,
      closedTicketsCount: closed,
      slaBreachedCount: breached,
      slaComplianceRate,
      averageResolutionHours,
      averageSatisfactionRating: feedbackAgg._avg.rating
        ? Number(feedbackAgg._avg.rating.toFixed(1))
        : 0,
      categoryDistribution,
      priorityDistribution,
      statusDistribution,
    };
  }

  async getWorkbenchSummary(organizationId: string, agentId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      assignedToMeCount,
      unassignedCount,
      urgentTicketsCount,
      slaBreachWarningCount,
      resolvedTodayCount,
    ] = await Promise.all([
      agentId
        ? this.prisma.ticket.count({
            where: {
              organizationId,
              assignedAgentId: agentId,
              ticketStatus: { notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'] },
            },
          })
        : 0,
      this.prisma.ticket.count({
        where: {
          organizationId,
          assignedAgentId: null,
          ticketStatus: { notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'] },
        },
      }),
      this.prisma.ticket.count({
        where: {
          organizationId,
          priority: { in: ['URGENT', 'CRITICAL'] },
          ticketStatus: { notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'] },
        },
      }),
      this.prisma.ticket.count({
        where: {
          organizationId,
          ticketStatus: { notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'] },
          OR: [
            { escalationStatus: { in: ['ESCALATED', 'BREACHED'] } },
            {
              slaResolutionDueAt: {
                lte: new Date(Date.now() + 2 * 60 * 60 * 1000),
              },
            },
          ],
        },
      }),
      this.prisma.ticket.count({
        where: {
          organizationId,
          ticketStatus: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { gte: today },
        },
      }),
    ]);

    return {
      assignedToMeCount,
      unassignedCount,
      urgentTicketsCount,
      slaBreachWarningCount,
      resolvedTodayCount,
    };
  }

  async getExportTickets(organizationId: string) {
    return this.prisma.ticket.findMany({
      where: { organizationId },
      include: {
        employee: true,
        helpdeskCategory: true,
        assignedAgent: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
