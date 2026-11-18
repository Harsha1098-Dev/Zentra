import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getJobOpeningSummary(organizationId: string) {
    const jobs = await this.prisma.jobOpening.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        jobStatus: true,
        numberOfOpenings: true,
        filledOpenings: true,
        department: { select: { name: true } },
      },
    });

    const totalOpenings = jobs.reduce((sum, j) => sum + j.numberOfOpenings, 0);
    const filledOpenings = jobs.reduce((sum, j) => sum + j.filledOpenings, 0);
    const openJobs = jobs.filter((j) => j.jobStatus === 'OPEN').length;
    const closedJobs = jobs.filter((j) => j.jobStatus === 'CLOSED').length;
    const draftJobs = jobs.filter((j) => j.jobStatus === 'DRAFT').length;

    return {
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      draftJobs,
      totalOpenings,
      filledOpenings,
      pendingOpenings: Math.max(0, totalOpenings - filledOpenings),
    };
  }

  async getCandidatePipeline(organizationId: string) {
    const applications = await this.prisma.jobApplication.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        currentStageName: true,
        applicationStatus: true,
      },
    });

    const stageMap: Record<string, number> = {};
    for (const app of applications) {
      const stage = app.currentStageName || 'Applied';
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    }

    return {
      totalApplications: applications.length,
      stageCounts: Object.entries(stageMap).map(([stageName, count]) => ({
        stageName,
        count,
      })),
    };
  }

  async getInterviewStatus(organizationId: string) {
    const interviews = await this.prisma.interview.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        feedbackStatus: true,
        interviewDate: true,
      },
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const scheduledToday = interviews.filter((i) => {
      const d = i.interviewDate.toISOString().split('T')[0];
      return d === todayStr && i.status === 'SCHEDULED';
    }).length;

    return {
      totalInterviews: interviews.length,
      scheduled: interviews.filter((i) => i.status === 'SCHEDULED').length,
      completed: interviews.filter((i) => i.status === 'COMPLETED').length,
      cancelled: interviews.filter((i) => i.status === 'CANCELLED').length,
      pendingFeedback: interviews.filter((i) => i.feedbackStatus === 'PENDING').length,
      scheduledToday,
    };
  }

  async getOfferStatus(organizationId: string) {
    const offers = await this.prisma.offer.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, offerStatus: true },
    });

    const total = offers.length;
    const accepted = offers.filter((o) => o.offerStatus === 'ACCEPTED').length;
    const rejected = offers.filter((o) => o.offerStatus === 'REJECTED').length;
    const pendingApproval = offers.filter((o) => o.offerStatus === 'PENDING_APPROVAL').length;
    const sent = offers.filter((o) => o.offerStatus === 'SENT').length;

    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return {
      totalOffers: total,
      accepted,
      rejected,
      pendingApproval,
      sent,
      acceptanceRatePercentage: rate,
    };
  }

  async getTimeToHire(organizationId: string) {
    const acceptedOffers = await this.prisma.offer.findMany({
      where: { organizationId, offerStatus: 'ACCEPTED', deletedAt: null },
      include: {
        jobApplication: { select: { appliedAt: true } },
      },
    });

    if (acceptedOffers.length === 0) {
      return { averageDaysToHire: 28, samplesCount: 0 };
    }

    let totalDays = 0;
    for (const off of acceptedOffers) {
      const applied = off.jobApplication?.appliedAt || off.createdAt;
      const accepted = off.acceptedAt || off.updatedAt;
      const days = Math.max(1, Math.round((accepted.getTime() - applied.getTime()) / (1000 * 3600 * 24)));
      totalDays += days;
    }

    return {
      averageDaysToHire: Math.round(totalDays / acceptedOffers.length),
      samplesCount: acceptedOffers.length,
    };
  }

  async getSourceReport(organizationId: string) {
    const candidates = await this.prisma.candidate.findMany({
      where: { organizationId, deletedAt: null },
      select: { sourceType: true },
    });

    const sourceMap: Record<string, number> = {};
    for (const c of candidates) {
      sourceMap[c.sourceType] = (sourceMap[c.sourceType] || 0) + 1;
    }

    return Object.entries(sourceMap).map(([source, count]) => ({
      source,
      count,
      percentage: candidates.length > 0 ? Math.round((count / candidates.length) * 100) : 0,
    }));
  }

  async getApplicationsForExport(organizationId: string) {
    return this.prisma.jobApplication.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        candidate: true,
        jobOpening: { include: { department: true } },
        offer: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }
}
