import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters.jobOpeningId) {
      where.jobOpeningId = filters.jobOpeningId;
    }
    if (filters.candidateId) {
      where.candidateId = filters.candidateId;
    }
    if (filters.applicationStatus) {
      where.applicationStatus = filters.applicationStatus;
    }
    if (filters.currentStageId) {
      where.currentStageId = filters.currentStageId;
    }

    return this.prisma.jobApplication.findMany({
      where,
      include: {
        candidate: true,
        jobOpening: {
          select: {
            id: true,
            title: true,
            jobCode: true,
            department: { select: { name: true } },
            location: { select: { name: true } },
            stages: { orderBy: { stageOrder: 'asc' } },
          },
        },
        offer: true,
        _count: {
          select: { interviews: true, stageHistory: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.jobApplication.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        candidate: true,
        jobOpening: {
          include: {
            stages: { orderBy: { stageOrder: 'asc' } },
            hiringManager: true,
            recruiter: true,
          },
        },
        stageHistory: {
          orderBy: { changedAt: 'desc' },
        },
        interviews: {
          include: {
            feedbacks: {
              include: {
                interviewer: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { interviewDate: 'asc' },
        },
        offer: true,
        documents: true,
        notes: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findActiveApplication(jobOpeningId: string, candidateId: string, organizationId: string) {
    return this.prisma.jobApplication.findFirst({
      where: {
        organizationId,
        jobOpeningId,
        candidateId,
        applicationStatus: { notIn: ['REJECTED', 'WITHDRAWN'] },
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: any, initialStage: any, createdBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.jobApplication.create({
        data: {
          organizationId,
          jobOpeningId: data.jobOpeningId,
          candidateId: data.candidateId,
          applicationStatus: 'APPLIED',
          currentStageId: initialStage.id,
          currentStageName: initialStage.stageName,
          sourceType: data.sourceType || 'DIRECT',
          sourceName: data.sourceName,
          referralEmployeeId: data.referralEmployeeId,
          resumeUrl: data.resumeUrl,
          coverLetterUrl: data.coverLetterUrl,
          createdBy,
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          organizationId,
          jobApplicationId: application.id,
          fromStageId: null,
          toStageId: initialStage.id,
          fromStageName: null,
          toStageName: initialStage.stageName,
          changedBy: createdBy,
          comments: 'Initial application submitted',
        },
      });

      return tx.jobApplication.findUniqueOrThrow({
        where: { id: application.id },
        include: {
          candidate: true,
          jobOpening: true,
          stageHistory: true,
        },
      });
    });
  }

  async updateStage(
    id: string,
    organizationId: string,
    toStage: any,
    currentStage: any,
    changedBy: string,
    comments?: string,
    newStatus?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.jobApplication.update({
        where: { id },
        data: {
          currentStageId: toStage.id,
          currentStageName: toStage.stageName,
          ...(newStatus ? { applicationStatus: newStatus } : {}),
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          organizationId,
          jobApplicationId: id,
          fromStageId: currentStage.id,
          toStageId: toStage.id,
          fromStageName: currentStage.stageName,
          toStageName: toStage.stageName,
          changedBy,
          comments,
        },
      });

      return tx.jobApplication.findUniqueOrThrow({
        where: { id },
        include: {
          candidate: true,
          jobOpening: true,
          stageHistory: { orderBy: { changedAt: 'desc' } },
        },
      });
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.jobApplication.update({
      where: { id },
      data,
    });
  }
}
