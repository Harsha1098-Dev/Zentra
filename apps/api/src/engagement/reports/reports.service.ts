import { Injectable } from '@nestjs/common';
import { EngagementReportsRepository } from './reports.repository';
import { RecognitionRepository } from '../recognition/recognition.repository';
import { SurveysService } from '../surveys/surveys.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EngagementReportsService {
  constructor(
    private readonly repository: EngagementReportsRepository,
    private readonly recognitionRepository: RecognitionRepository,
    private readonly surveysService: SurveysService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async getEmployeeHub(organizationId: string, employeeId: string) {
    const pointsBalance = await this.recognitionRepository.getEmployeePointsBalance(
      organizationId,
      employeeId,
    );

    const earnedBadgesCount = await this.prisma.employeeBadge.count({
      where: { organizationId, employeeId },
    });

    const activeSurveys = await this.repository.getActiveSurveys(organizationId);
    const pendingSurveysCount = activeSurveys.filter(
      (s) => !s.responses.some((r) => r.employeeId === employeeId),
    ).length;

    const activePolls = await this.repository.getActivePolls(organizationId);
    const activePollsCount = activePolls.length;

    const recentRecognitions = await this.repository.getRecentRecognitions(organizationId, 5);
    const upcomingCelebrations = await this.repository.getUpcomingCelebrations(organizationId, 14);

    const joinedWellness = await this.prisma.wellnessActivity.findMany({
      where: {
        organizationId,
        participations: {
          some: { employeeId },
        },
      },
      take: 5,
    });

    return {
      pointsBalance,
      earnedBadgesCount,
      pendingSurveysCount,
      activePollsCount,
      recentRecognitions,
      upcomingCelebrations,
      joinedWellness,
    };
  }

  async getManagerTeamEngagement(organizationId: string, managerEmployeeId: string) {
    const teamMembers = await this.repository.getEmployeeDirectReports(
      organizationId,
      managerEmployeeId,
    );
    const teamEmployeeIds = teamMembers.map((m) => m.id);

    // Active surveys and completion in team
    const activeSurveys = await this.repository.getActiveSurveys(organizationId);
    let totalAssigned = activeSurveys.length * teamEmployeeIds.length;
    let completedCount = 0;

    for (const s of activeSurveys) {
      completedCount += s.responses.filter(
        (r) => r.employeeId && teamEmployeeIds.includes(r.employeeId),
      ).length;
    }

    const completionRate =
      totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

    // Recognitions received by team
    const recognitionsReceived = await this.prisma.recognition.findMany({
      where: {
        organizationId,
        receiverId: { in: teamEmployeeIds },
        status: 'APPROVED',
      },
      include: {
        sender: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } },
        badge: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Upcoming celebrations in team
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const teamCelebrations = await this.prisma.celebration.findMany({
      where: {
        organizationId,
        employeeId: { in: teamEmployeeIds },
        eventDate: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: { eventDate: 'asc' },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      teamSize: teamMembers.length,
      teamMembers,
      surveyCompletionRate: completionRate,
      recognitionsCount: recognitionsReceived.length,
      recognitionsReceived,
      upcomingCelebrations: teamCelebrations,
    };
  }

  async getOrgSummary(organizationId: string) {
    const totalSurveysCount = await this.prisma.engagementSurvey.count({
      where: { organizationId },
    });

    const activeSurveysCount = await this.prisma.engagementSurvey.count({
      where: { organizationId, status: 'ACTIVE' },
    });

    const activePollsCount = await this.prisma.poll.count({
      where: { organizationId, status: 'ACTIVE' },
    });

    const totalRecognitionsGiven = await this.prisma.recognition.count({
      where: { organizationId, status: 'APPROVED' },
    });

    const pointsAgg = await this.prisma.recognition.aggregate({
      where: { organizationId, status: 'APPROVED' },
      _sum: { pointsAwarded: true },
    });
    const totalPointsAwarded = pointsAgg._sum.pointsAwarded || 0;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 14);

    const upcomingCelebrationsCount = await this.prisma.celebration.count({
      where: {
        organizationId,
        eventDate: { gte: today, lte: futureDate },
      },
    });

    const activeWellnessActivitiesCount = await this.prisma.wellnessActivity.count({
      where: { organizationId, status: 'ACTIVE' },
    });

    // Calculate eNPS trend from recent eNPS surveys
    const enpsSurveys = await this.repository.getEnpsSurveys(organizationId);
    const enpsTrend: Array<{ surveyTitle: string; score: number; date: string }> = [];

    let overallEnps = 0;
    if (enpsSurveys.length > 0) {
      for (const s of enpsSurveys) {
        const enps = await this.surveysService.calculateEnps(organizationId, s.id);
        enpsTrend.push({
          surveyTitle: s.title,
          score: enps.enpsScore,
          date: s.createdAt.toISOString().split('T')[0],
        });
      }
      overallEnps = enpsTrend[0].score;
    }

    return {
      totalSurveysCount,
      activeSurveysCount,
      overallEnpsScore: overallEnps,
      activePollsCount,
      totalRecognitionsGiven,
      totalPointsAwarded,
      upcomingCelebrationsCount,
      activeWellnessActivitiesCount,
      enpsTrend,
    };
  }

  async exportData(
    organizationId: string,
    exportType: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    let csv = '';

    if (exportType === 'surveys') {
      const surveys = await this.prisma.engagementSurvey.findMany({
        where: { organizationId },
        include: { _count: { select: { questions: true, responses: true } } },
      });
      csv = 'ID,Title,Type,Status,Total Questions,Total Responses,Anonymous,Created At\n';
      csv += surveys
        .map(
          (s) =>
            `"${s.id}","${s.title}","${s.surveyType}","${s.status}",${s._count.questions},${s._count.responses},${s.isAnonymous},"${s.createdAt.toISOString()}"`,
        )
        .join('\n');
    } else if (exportType === 'recognitions') {
      const recognitions = await this.prisma.recognition.findMany({
        where: { organizationId },
        include: {
          sender: { select: { firstName: true, lastName: true, workEmail: true } },
          receiver: { select: { firstName: true, lastName: true, workEmail: true } },
        },
      });
      csv = 'ID,Sender,Receiver,Category,Type,Points,Status,Date\n';
      csv += recognitions
        .map(
          (r) =>
            `"${r.id}","${r.sender.firstName} ${r.sender.lastName} (${r.sender.workEmail})","${r.receiver.firstName} ${r.receiver.lastName} (${r.receiver.workEmail})","${r.category}","${r.recognitionType}",${r.pointsAwarded},"${r.status}","${r.createdAt.toISOString()}"`,
        )
        .join('\n');
    } else if (exportType === 'rewards') {
      const redemptions = await this.prisma.rewardRedemption.findMany({
        where: { organizationId },
        include: {
          reward: true,
          employee: { select: { firstName: true, lastName: true, workEmail: true } },
        },
      });
      csv = 'ID,Employee,Reward,Points Spent,Status,Date\n';
      csv += redemptions
        .map(
          (r) =>
            `"${r.id}","${r.employee.firstName} ${r.employee.lastName}","${r.reward.title}",${r.pointsSpent},"${r.status}","${r.createdAt.toISOString()}"`,
        )
        .join('\n');
    } else {
      // Default eNPS export
      const enpsSurveys = await this.repository.getEnpsSurveys(organizationId);
      csv = 'Survey ID,Survey Title,eNPS Score,Total Responses,Promoters,Passives,Detractors\n';
      for (const s of enpsSurveys) {
        const enps = await this.surveysService.calculateEnps(organizationId, s.id);
        csv += `"${s.id}","${s.title}",${enps.enpsScore},${enps.totalResponses},${enps.promotersCount},${enps.passivesCount},${enps.detractorsCount}\n`;
      }
    }

    await this.auditService.log({
      action: AuditAction.ENGAGEMENT_REPORT_EXPORT,
      entityType: 'EngagementReport',
      entityId: organizationId,
      organizationId,
      actorUserId: userId,
      details: { exportType },
      ipAddress,
      userAgent,
    });

    return csv;
  }
}
