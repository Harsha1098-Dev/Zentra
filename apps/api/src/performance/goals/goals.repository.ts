import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.goalType) where.goalType = filters.goalType;
    if (filters.goalCategory) where.goalCategory = filters.goalCategory;
    if (filters.priority) where.priority = filters.priority;

    return this.prisma.goal.findMany({
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
        alignedGoal: {
          select: {
            id: true,
            title: true,
            goalType: true,
            status: true,
          },
        },
        checkIns: {
          orderBy: { checkInDate: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.goal.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            reportingManagerId: true,
            department: { select: { name: true } },
          },
        },
        alignedGoal: true,
        alignedSubGoals: true,
        parentGoal: true,
        subGoals: true,
        checkIns: {
          orderBy: { checkInDate: 'desc' },
        },
      },
    });
  }

  async findDuplicate(
    organizationId: string,
    employeeId: string,
    title: string,
    startDate: Date,
    dueDate: Date,
    excludeId?: string,
  ) {
    const where: any = {
      organizationId,
      employeeId,
      title: { equals: title, mode: 'insensitive' },
      startDate,
      dueDate,
      deletedAt: null,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return this.prisma.goal.findFirst({ where });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.goal.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        goalType: data.goalType || 'INDIVIDUAL',
        goalCategory: data.goalCategory || 'BUSINESS',
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        weightage: data.weightage ?? 100,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'DRAFT',
        progressPercentage: data.progressPercentage || 0,
        parentGoalId: data.parentGoalId || null,
        alignedGoalId: data.alignedGoalId || null,
        alignmentType: data.alignmentType || null,
        createdBy: userId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    return this.prisma.goal.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }
}
