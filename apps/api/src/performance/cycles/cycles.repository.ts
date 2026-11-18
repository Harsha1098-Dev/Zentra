import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CyclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.performanceCycle.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            appraisalAssignments: true,
            calibrationSessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.performanceCycle.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        appraisalAssignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
          },
        },
        calibrationSessions: true,
      },
    });
  }

  async findByName(name: string, organizationId: string) {
    return this.prisma.performanceCycle.findFirst({
      where: {
        name,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.performanceCycle.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        cycleType: data.cycleType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reviewStartDate: data.reviewStartDate ? new Date(data.reviewStartDate) : null,
        reviewEndDate: data.reviewEndDate ? new Date(data.reviewEndDate) : null,
        selfReviewStartDate: data.selfReviewStartDate ? new Date(data.selfReviewStartDate) : null,
        selfReviewEndDate: data.selfReviewEndDate ? new Date(data.selfReviewEndDate) : null,
        managerReviewStartDate: data.managerReviewStartDate ? new Date(data.managerReviewStartDate) : null,
        managerReviewEndDate: data.managerReviewEndDate ? new Date(data.managerReviewEndDate) : null,
        calibrationStartDate: data.calibrationStartDate ? new Date(data.calibrationStartDate) : null,
        calibrationEndDate: data.calibrationEndDate ? new Date(data.calibrationEndDate) : null,
        publishDate: data.publishDate ? new Date(data.publishDate) : null,
        status: data.status || 'DRAFT',
        includeOkr: data.includeOkr ?? true,
        includeGoals: data.includeGoals ?? true,
        includeKra: data.includeKra ?? true,
        includeCompetency: data.includeCompetency ?? true,
        include360Feedback: data.include360Feedback ?? false,
        includeSelfReview: data.includeSelfReview ?? true,
        includeManagerReview: data.includeManagerReview ?? true,
        includeCalibration: data.includeCalibration ?? true,
        createdBy: userId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    const dateFields = [
      'startDate',
      'endDate',
      'reviewStartDate',
      'reviewEndDate',
      'selfReviewStartDate',
      'selfReviewEndDate',
      'managerReviewStartDate',
      'managerReviewEndDate',
      'calibrationStartDate',
      'calibrationEndDate',
      'publishDate',
    ];
    for (const f of dateFields) {
      if (updateData[f]) {
        updateData[f] = new Date(updateData[f]);
      }
    }

    return this.prisma.performanceCycle.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.performanceCycle.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }
}
