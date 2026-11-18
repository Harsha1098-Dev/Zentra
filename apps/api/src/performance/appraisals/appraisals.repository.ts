import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppraisalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Templates ---

  async findAllTemplates(organizationId: string) {
    return this.prisma.appraisalTemplate.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        ratingScale: true,
        _count: { select: { appraisalAssignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplateById(id: string, organizationId: string) {
    return this.prisma.appraisalTemplate.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { ratingScale: true },
    });
  }

  async createTemplate(organizationId: string, data: any, userId: string) {
    if (data.isDefault) {
      await this.prisma.appraisalTemplate.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }

    return this.prisma.appraisalTemplate.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description || null,
        appraisalType: data.appraisalType || 'ANNUAL',
        includeSelfReview: data.includeSelfReview ?? true,
        includeManagerReview: data.includeManagerReview ?? true,
        includeMultiRater: data.includeMultiRater ?? false,
        includeGoalRating: data.includeGoalRating ?? true,
        includeKraRating: data.includeKraRating ?? true,
        includeCompetencyRating: data.includeCompetencyRating ?? true,
        includeOkrRating: data.includeOkrRating ?? true,
        ratingScaleId: data.ratingScaleId || null,
        sections: data.sections || null,
        questions: data.questions || null,
        weightages: data.weightages || null,
        isDefault: data.isDefault ?? false,
        status: data.status || 'ACTIVE',
        createdBy: userId,
      },
    });
  }

  async updateTemplate(id: string, organizationId: string, data: any) {
    if (data.isDefault) {
      await this.prisma.appraisalTemplate.updateMany({
        where: { organizationId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.appraisalTemplate.update({
      where: { id },
      data,
    });
  }

  async softDeleteTemplate(id: string, organizationId: string) {
    return this.prisma.appraisalTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  // --- Rating Scales ---

  async findAllRatingScales(organizationId: string) {
    return this.prisma.ratingScale.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRatingScaleById(id: string, organizationId: string) {
    return this.prisma.ratingScale.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async createRatingScale(organizationId: string, data: any, userId: string) {
    if (data.isDefault) {
      await this.prisma.ratingScale.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }

    return this.prisma.ratingScale.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description || null,
        scaleType: data.scaleType || 'FIVE_POINT',
        levels: data.levels,
        isDefault: data.isDefault ?? false,
        status: data.status || 'ACTIVE',
        createdBy: userId,
      },
    });
  }

  async updateRatingScale(id: string, organizationId: string, data: any) {
    return this.prisma.ratingScale.update({
      where: { id },
      data,
    });
  }

  // --- Assignments ---

  async findAllAssignments(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };
    if (filters.performanceCycleId) where.performanceCycleId = filters.performanceCycleId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.reportingManagerId) where.reportingManagerId = filters.reportingManagerId;
    if (filters.status) where.status = filters.status;

    return this.prisma.appraisalAssignment.findMany({
      where,
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
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        performanceCycle: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        appraisalTemplate: {
          select: {
            id: true,
            name: true,
            appraisalType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAssignmentById(id: string, organizationId: string) {
    return this.prisma.appraisalAssignment.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            grade: true,
          },
        },
        reportingManager: true,
        reviewer: true,
        performanceCycle: true,
        appraisalTemplate: {
          include: { ratingScale: true },
        },
        responses: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createAssignment(organizationId: string, data: any) {
    return this.prisma.appraisalAssignment.create({
      data: {
        organizationId,
        performanceCycleId: data.performanceCycleId,
        employeeId: data.employeeId,
        appraisalTemplateId: data.appraisalTemplateId,
        reportingManagerId: data.reportingManagerId || null,
        reviewerId: data.reviewerId || data.reportingManagerId || null,
        departmentHeadId: data.departmentHeadId || null,
        status: 'NOT_STARTED',
        selfReviewStatus: 'NOT_STARTED',
        managerReviewStatus: 'NOT_STARTED',
      },
      include: {
        employee: true,
        performanceCycle: true,
        appraisalTemplate: true,
      },
    });
  }

  async updateAssignment(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.acknowledgedAt) updateData.acknowledgedAt = new Date(updateData.acknowledgedAt);

    return this.prisma.appraisalAssignment.update({
      where: { id },
      data: updateData,
    });
  }
}
