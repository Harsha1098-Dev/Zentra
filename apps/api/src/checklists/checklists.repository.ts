import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createChecklist(data: {
    organizationId: string;
    name: string;
    description?: string | null;
    module: string;
    entityType: string;
    triggerEvent?: string | null;
    isActive?: boolean;
    createdBy?: string | null;
    items?: Array<{
      title: string;
      description?: string | null;
      ownerType?: string;
      ownerId?: string | null;
      ownerRole?: string | null;
      dueOffsetDays?: number;
      isMandatory?: boolean;
      executionOrder?: number;
    }>;
  }) {
    return this.prisma.checklist.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description || null,
        module: data.module || 'people',
        entityType: data.entityType,
        triggerEvent: data.triggerEvent || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || null,
        items: {
          create: (data.items || []).map((item, idx) => ({
            title: item.title,
            description: item.description || null,
            ownerType: item.ownerType || 'role',
            ownerId: item.ownerId || null,
            ownerRole: item.ownerRole || null,
            dueOffsetDays: item.dueOffsetDays || 0,
            isMandatory: item.isMandatory !== undefined ? item.isMandatory : true,
            executionOrder: item.executionOrder || idx + 1,
          })),
        },
      },
      include: {
        items: {
          orderBy: { executionOrder: 'asc' },
        },
      },
    });
  }

  async findChecklistById(id: string, organizationId: string) {
    return this.prisma.checklist.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        items: {
          orderBy: { executionOrder: 'asc' },
        },
      },
    });
  }

  async updateChecklist(id: string, organizationId: string, data: any) {
    const { items, ...checklistData } = data;

    return this.prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items)) {
        await tx.checklistItem.deleteMany({
          where: { checklistId: id },
        });

        await tx.checklistItem.createMany({
          data: items.map((item: any, idx: number) => ({
            checklistId: id,
            title: item.title,
            description: item.description || null,
            ownerType: item.ownerType || 'role',
            ownerId: item.ownerId || null,
            ownerRole: item.ownerRole || null,
            dueOffsetDays: item.dueOffsetDays || 0,
            isMandatory: item.isMandatory !== undefined ? item.isMandatory : true,
            executionOrder: item.executionOrder || idx + 1,
          })),
        });
      }

      return tx.checklist.update({
        where: { id },
        data: checklistData,
        include: {
          items: {
            orderBy: { executionOrder: 'asc' },
          },
        },
      });
    });
  }

  async softDeleteChecklist(id: string, organizationId: string) {
    return this.prisma.checklist.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async listChecklists(organizationId: string, entityType?: string) {
    return this.prisma.checklist.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(entityType ? { entityType } : {}),
      },
      include: {
        items: {
          orderBy: { executionOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createChecklistRun(data: {
    organizationId: string;
    checklistId: string;
    entityType: string;
    entityId: string;
    dueDate?: Date | null;
    createdBy?: string | null;
    items: Array<{
      checklistItemId?: string | null;
      title: string;
      ownerType: string;
      ownerId?: string | null;
      dueDate?: Date | null;
    }>;
  }) {
    return this.prisma.checklistRun.create({
      data: {
        organizationId: data.organizationId,
        checklistId: data.checklistId,
        entityType: data.entityType,
        entityId: data.entityId,
        status: 'pending',
        dueDate: data.dueDate || null,
        createdBy: data.createdBy || null,
        items: {
          create: data.items.map((i) => ({
            checklistItemId: i.checklistItemId || null,
            title: i.title,
            ownerType: i.ownerType,
            ownerId: i.ownerId || null,
            dueDate: i.dueDate || null,
            status: 'pending',
          })),
        },
      },
      include: {
        items: true,
        checklist: true,
      },
    });
  }

  async findChecklistRunById(id: string, organizationId: string) {
    return this.prisma.checklistRun.findFirst({
      where: { id, organizationId },
      include: {
        items: true,
        checklist: true,
      },
    });
  }

  async listChecklistRuns(organizationId: string, entityType?: string, entityId?: string) {
    return this.prisma.checklistRun.findMany({
      where: {
        organizationId,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      },
      include: {
        items: true,
        checklist: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateChecklistRunItem(
    itemId: string,
    runId: string,
    data: {
      status: string;
      completedBy?: string | null;
      completedAt?: Date | null;
      comments?: string | null;
    },
  ) {
    return this.prisma.checklistRunItem.update({
      where: { id: itemId },
      data,
    });
  }

  async updateChecklistRunStatus(runId: string, status: string) {
    return this.prisma.checklistRun.update({
      where: { id: runId },
      data: { status },
    });
  }
}
