import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InterviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
    };

    if (filters.candidateId) {
      where.candidateId = filters.candidateId;
    }
    if (filters.jobApplicationId) {
      where.jobApplicationId = filters.jobApplicationId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.interviewDate) {
      where.interviewDate = new Date(filters.interviewDate);
    }

    return this.prisma.interview.findMany({
      where,
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        jobApplication: {
          select: {
            id: true,
            jobOpening: { select: { id: true, title: true, jobCode: true } },
          },
        },
        feedbacks: {
          include: {
            interviewer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { interviewDate: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.interview.findFirst({
      where: { id, organizationId },
      include: {
        candidate: true,
        jobApplication: {
          include: {
            jobOpening: true,
          },
        },
        feedbacks: {
          include: {
            interviewer: true,
          },
        },
      },
    });
  }

  async findInterviewerConflict(
    organizationId: string,
    interviewerId: string,
    interviewDate: Date,
    startTime: string,
    endTime: string,
    excludeInterviewId?: string,
  ) {
    // Check if interviewer has another scheduled interview at this date & overlapping time
    return this.prisma.interview.findFirst({
      where: {
        organizationId,
        id: excludeInterviewId ? { not: excludeInterviewId } : undefined,
        interviewDate,
        status: 'SCHEDULED',
        startTime: { lte: endTime },
        endTime: { gte: startTime },
        interviewerIds: {
          array_contains: interviewerId,
        },
      },
    });
  }

  async create(organizationId: string, data: any, candidateId: string, createdBy: string) {
    return this.prisma.interview.create({
      data: {
        organizationId,
        jobApplicationId: data.jobApplicationId,
        candidateId,
        interviewRound: data.interviewRound || 1,
        interviewType: data.interviewType || 'TECHNICAL_INTERVIEW',
        interviewMode: data.interviewMode || 'VIDEO',
        interviewDate: new Date(data.interviewDate),
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone || 'Asia/Kolkata',
        interviewerIds: data.interviewerIds || [],
        meetingLink: data.meetingLink,
        location: data.location,
        status: 'SCHEDULED',
        feedbackStatus: 'PENDING',
        createdBy,
      },
      include: {
        candidate: true,
        jobApplication: { include: { jobOpening: true } },
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData = { ...data };
    if (updateData.interviewDate) {
      updateData.interviewDate = new Date(updateData.interviewDate);
    }
    return this.prisma.interview.update({
      where: { id },
      data: updateData,
    });
  }

  async createFeedback(organizationId: string, interviewId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const feedback = await tx.interviewFeedback.create({
        data: {
          organizationId,
          interviewId,
          interviewerId: data.interviewerId,
          candidateId: data.candidateId,
          jobApplicationId: data.jobApplicationId,
          recommendation: data.recommendation,
          technicalRating: data.technicalRating,
          communicationRating: data.communicationRating,
          cultureFitRating: data.cultureFitRating,
          overallRating: data.overallRating,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          comments: data.comments,
        },
      });

      // Update interview status
      await tx.interview.update({
        where: { id: interviewId },
        data: {
          feedbackStatus: 'SUBMITTED',
          status: 'COMPLETED',
        },
      });

      return feedback;
    });
  }

  async findFeedback(interviewId: string, interviewerId: string) {
    return this.prisma.interviewFeedback.findFirst({
      where: { interviewId, interviewerId },
    });
  }
}
