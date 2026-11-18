import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllFlows(organizationId: string) {
    return this.prisma.onboardingFlow.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        items: {
          orderBy: { executionOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFlowById(id: string, organizationId: string) {
    return this.prisma.onboardingFlow.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        items: {
          orderBy: { executionOrder: 'asc' },
        },
      },
    });
  }

  async createFlow(organizationId: string, data: any, userId: string) {
    const { items, ...flowData } = data;
    return this.prisma.onboardingFlow.create({
      data: {
        ...flowData,
        organizationId,
        createdBy: userId,
        items: items && items.length > 0 ? {
          create: items.map((item: any, idx: number) => ({
            ...item,
            executionOrder: item.executionOrder ?? idx + 1,
          })),
        } : undefined,
      },
      include: { items: true },
    });
  }

  async updateFlow(id: string, organizationId: string, data: any) {
    const { items, ...flowData } = data;
    return this.prisma.onboardingFlow.update({
      where: { id },
      data: flowData,
      include: { items: true },
    });
  }

  async softDeleteFlow(id: string, organizationId: string) {
    return this.prisma.onboardingFlow.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async setFlowActive(id: string, organizationId: string, isActive: boolean) {
    return this.prisma.onboardingFlow.update({
      where: { id },
      data: { isActive },
    });
  }

  // Runs
  async findAllRuns(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    const where: any = { organizationId };
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.onboardingRun.findMany({
      where,
      include: {
        flow: { select: { id: true, name: true } },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            dateOfJoining: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRunById(id: string, organizationId: string) {
    return this.prisma.onboardingRun.findFirst({
      where: { id, organizationId },
      include: {
        flow: true,
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
            reportingManager: true,
          },
        },
        items: {
          include: { flowItem: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createRun(organizationId: string, data: {
    onboardingFlowId: string;
    employeeId: string;
    startDate?: Date;
    expectedCompletionDate?: Date | null;
    createdBy: string;
  }, flowItems: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.onboardingRun.create({
        data: {
          organizationId,
          onboardingFlowId: data.onboardingFlowId,
          employeeId: data.employeeId,
          startDate: data.startDate || new Date(),
          expectedCompletionDate: data.expectedCompletionDate,
          createdBy: data.createdBy,
          status: 'IN_PROGRESS',
          progressPercentage: 0,
        },
      });

      if (flowItems.length > 0) {
        const startDate = data.startDate || new Date();
        const itemsToCreate = flowItems.map((fi) => {
          let dueDate: Date | null = null;
          if (typeof fi.dueOffsetDays === 'number') {
            dueDate = new Date(startDate.getTime() + fi.dueOffsetDays * 86400000);
          }
          return {
            onboardingRunId: run.id,
            onboardingFlowItemId: fi.id,
            title: fi.title,
            ownerType: fi.ownerType,
            ownerId: fi.ownerId,
            dueDate,
            status: 'PENDING',
          };
        });

        await tx.onboardingRunItem.createMany({
          data: itemsToCreate,
        });
      }

      return tx.onboardingRun.findUnique({
        where: { id: run.id },
        include: { items: true, employee: true, flow: true },
      });
    });
  }

  async updateRun(id: string, organizationId: string, data: any) {
    return this.prisma.onboardingRun.update({
      where: { id },
      data,
    });
  }

  async findRunItemById(itemId: string) {
    return this.prisma.onboardingRunItem.findUnique({
      where: { id: itemId },
      include: {
        run: {
          include: {
            employee: true,
          },
        },
        flowItem: true,
      },
    });
  }

  async updateRunItem(itemId: string, data: any) {
    return this.prisma.onboardingRunItem.update({
      where: { id: itemId },
      data,
    });
  }

  async findEmployeeTasks(organizationId: string, employeeId: string, userId?: string) {
    return this.prisma.onboardingRunItem.findMany({
      where: {
        run: {
          organizationId,
          status: 'IN_PROGRESS',
        },
        OR: [
          {
            run: { employeeId },
            ownerType: 'EMPLOYEE',
          },
          ...(userId
            ? [
                { ownerId: userId },
                {
                  ownerType: 'MANAGER',
                  run: { employee: { reportingManager: { userId } } },
                },
              ]
            : []),
        ],
      },
      include: {
        run: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
            flow: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
