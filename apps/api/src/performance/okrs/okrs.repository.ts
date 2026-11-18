import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OkrsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Objectives ---

  async findAllObjectives(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };
    if (filters.ownerType) where.ownerType = filters.ownerType;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.status) where.status = filters.status;

    return this.prisma.objective.findMany({
      where,
      include: {
        keyResults: {
          where: { deletedAt: null },
        },
        parentObjective: {
          select: { id: true, title: true, ownerType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findObjectiveById(id: string, organizationId: string) {
    return this.prisma.objective.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        keyResults: {
          where: { deletedAt: null },
          include: {
            checkIns: {
              orderBy: { checkInDate: 'desc' },
              take: 3,
            },
          },
        },
        parentObjective: true,
        subObjectives: true,
      },
    });
  }

  async createObjective(organizationId: string, data: any, userId: string) {
    return this.prisma.objective.create({
      data: {
        organizationId,
        ownerType: data.ownerType || 'EMPLOYEE',
        ownerId: data.ownerId,
        title: data.title,
        description: data.description,
        periodStartDate: new Date(data.periodStartDate),
        periodEndDate: new Date(data.periodEndDate),
        status: data.status || 'ACTIVE',
        progressPercentage: data.progressPercentage || 0,
        parentObjectiveId: data.parentObjectiveId || null,
        alignmentType: data.alignmentType || null,
        createdBy: userId,
      },
    });
  }

  async updateObjective(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.periodStartDate) updateData.periodStartDate = new Date(updateData.periodStartDate);
    if (updateData.periodEndDate) updateData.periodEndDate = new Date(updateData.periodEndDate);

    return this.prisma.objective.update({
      where: { id },
      data: updateData,
    });
  }

  async softDeleteObjective(id: string, organizationId: string) {
    return this.prisma.objective.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    });
  }

  // --- Key Results ---

  async findAllKeyResults(organizationId: string, objectiveId?: string) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };
    if (objectiveId) where.objectiveId = objectiveId;

    return this.prisma.keyResult.findMany({
      where,
      include: {
        objective: {
          select: { id: true, title: true, ownerType: true, ownerId: true },
        },
        checkIns: {
          orderBy: { checkInDate: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findKeyResultById(id: string, organizationId: string) {
    return this.prisma.keyResult.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        objective: true,
        checkIns: {
          orderBy: { checkInDate: 'desc' },
        },
      },
    });
  }

  async createKeyResult(organizationId: string, data: any, userId: string) {
    return this.prisma.keyResult.create({
      data: {
        organizationId,
        objectiveId: data.objectiveId,
        title: data.title,
        description: data.description,
        metricType: data.metricType || 'PERCENTAGE',
        startValue: data.startValue ?? 0,
        targetValue: data.targetValue,
        currentValue: data.currentValue ?? data.startValue ?? 0,
        unit: data.unit || '%',
        weightage: data.weightage ?? 100,
        dueDate: new Date(data.dueDate),
        status: data.status || 'ACTIVE',
        progressPercentage: data.progressPercentage || 0,
        createdBy: userId,
      },
    });
  }

  async updateKeyResult(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    return this.prisma.keyResult.update({
      where: { id },
      data: updateData,
    });
  }

  async softDeleteKeyResult(id: string, organizationId: string) {
    return this.prisma.keyResult.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
