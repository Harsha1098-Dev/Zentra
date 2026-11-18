import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowQueryFilterInput } from '@zentra/shared-types';

@Injectable()
export class WorkflowsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRule(data: {
    organizationId: string;
    name: string;
    description?: string | null;
    module?: string;
    entityType: string;
    triggerEvent: string;
    conditions?: any[];
    conditionMatchType?: string;
    isActive?: boolean;
    priority?: number;
    createdBy?: string | null;
    actions?: Array<{
      actionType: string;
      actionConfig: any;
      executionOrder?: number;
      isActive?: boolean;
    }>;
  }) {
    return this.prisma.workflowRule.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description || null,
        module: data.module || 'people',
        entityType: data.entityType,
        triggerEvent: data.triggerEvent,
        conditions: (data.conditions as any) || [],
        conditionMatchType: data.conditionMatchType || 'ALL',
        isActive: data.isActive !== undefined ? data.isActive : true,
        priority: data.priority || 0,
        createdBy: data.createdBy || null,
        actions: {
          create: (data.actions || []).map((a, idx) => ({
            actionType: a.actionType,
            actionConfig: a.actionConfig || {},
            executionOrder: a.executionOrder || idx + 1,
            isActive: a.isActive !== undefined ? a.isActive : true,
          })),
        },
      },
      include: {
        actions: {
          orderBy: { executionOrder: 'asc' },
        },
      },
    });
  }

  async findRuleById(id: string, organizationId: string) {
    return this.prisma.workflowRule.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        actions: {
          orderBy: { executionOrder: 'asc' },
        },
      },
    });
  }

  async updateRule(id: string, organizationId: string, data: any) {
    const { actions, ...ruleData } = data;

    return this.prisma.$transaction(async (tx) => {
      if (actions && Array.isArray(actions)) {
        await tx.workflowAction.deleteMany({
          where: { workflowRuleId: id },
        });

        await tx.workflowAction.createMany({
          data: actions.map((a: any, idx: number) => ({
            workflowRuleId: id,
            actionType: a.actionType,
            actionConfig: a.actionConfig || {},
            executionOrder: a.executionOrder || idx + 1,
            isActive: a.isActive !== undefined ? a.isActive : true,
          })),
        });
      }

      return tx.workflowRule.update({
        where: { id },
        data: ruleData,
        include: {
          actions: {
            orderBy: { executionOrder: 'asc' },
          },
        },
      });
    });
  }

  async softDeleteRule(id: string, organizationId: string) {
    return this.prisma.workflowRule.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async listRules(organizationId: string, filter: WorkflowQueryFilterInput) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filter.module) where.module = filter.module;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.triggerEvent) where.triggerEvent = filter.triggerEvent;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.workflowRule.count({ where }),
      this.prisma.workflowRule.findMany({
        where,
        skip,
        take: limit,
        include: {
          actions: {
            orderBy: { executionOrder: 'asc' },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findMatchingRules(
    organizationId: string,
    entityType: string,
    triggerEvent: string,
  ) {
    return this.prisma.workflowRule.findMany({
      where: {
        organizationId,
        entityType,
        triggerEvent,
        isActive: true,
        deletedAt: null,
      },
      include: {
        actions: {
          where: { isActive: true },
          orderBy: { executionOrder: 'asc' },
        },
      },
      orderBy: { priority: 'desc' },
    });
  }

  async createExecution(data: {
    organizationId: string;
    workflowRuleId: string;
    entityType: string;
    entityId: string;
    triggerEvent: string;
    status: string;
    context?: any;
    errorMessage?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }) {
    return this.prisma.workflowExecution.create({
      data: {
        organizationId: data.organizationId,
        workflowRuleId: data.workflowRuleId,
        entityType: data.entityType,
        entityId: data.entityId,
        triggerEvent: data.triggerEvent,
        status: data.status,
        context: data.context || {},
        errorMessage: data.errorMessage || null,
        startedAt: data.startedAt || new Date(),
        completedAt: data.completedAt || null,
      },
    });
  }

  async listExecutions(workflowRuleId: string, organizationId: string, limit: number = 50) {
    return this.prisma.workflowExecution.findMany({
      where: { workflowRuleId, organizationId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
