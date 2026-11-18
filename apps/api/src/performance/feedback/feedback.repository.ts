import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.givenBy) where.givenBy = filters.givenBy;
    if (filters.feedbackType) where.feedbackType = filters.feedbackType;
    if (filters.feedbackCategory) where.feedbackCategory = filters.feedbackCategory;

    return this.prisma.continuousFeedback.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        giver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.continuousFeedback.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        employee: true,
        giver: true,
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.continuousFeedback.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        givenBy: data.givenBy,
        feedbackType: data.feedbackType || 'PRAISE',
        feedbackCategory: data.feedbackCategory || 'QUALITY_OF_WORK',
        feedback: data.feedback,
        rating: data.rating || null,
        isPrivate: data.isPrivate ?? false,
        isAnonymous: data.isAnonymous ?? false,
        status: data.status || 'ACTIVE',
        requestReason: data.requestReason || null,
        requestedBy: data.requestedBy || null,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        giver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.continuousFeedback.update({
      where: { id },
      data,
    });
  }
}
