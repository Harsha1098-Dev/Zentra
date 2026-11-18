import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus, ApprovalStepStatus } from '@zentra/shared-types';

@Injectable()
export class ApprovalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createApprovalFlow(data: {
    organizationId: string;
    requestType: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    status?: string;
    metadata?: any;
    steps: Array<{
      stepOrder: number;
      stepName: string;
      approverType: string;
      approverId?: string | null;
      approverRole?: string | null;
      status?: string;
      dueDate?: Date | null;
    }>;
  }) {
    return this.prisma.approvalFlow.create({
      data: {
        organizationId: data.organizationId,
        requestType: data.requestType,
        entityType: data.entityType,
        entityId: data.entityId,
        requestedBy: data.requestedBy,
        currentStep: 1,
        status: data.status || ApprovalStatus.PENDING,
        metadata: data.metadata || {},
        steps: {
          create: data.steps.map((s, idx) => ({
            stepOrder: s.stepOrder || idx + 1,
            stepName: s.stepName,
            approverType: s.approverType,
            approverId: s.approverId || null,
            approverRole: s.approverRole || null,
            status: s.status || (idx === 0 ? ApprovalStepStatus.PENDING : ApprovalStepStatus.WAITING),
            dueDate: s.dueDate || null,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.approvalFlow.findFirst({
      where: { id, organizationId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });
  }

  async updateFlow(id: string, organizationId: string, data: any) {
    return this.prisma.approvalFlow.update({
      where: { id },
      data,
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });
  }

  async updateStep(stepId: string, data: any) {
    return this.prisma.approvalStep.update({
      where: { id: stepId },
      data,
    });
  }

  async listFlows(
    organizationId: string,
    filter: {
      status?: string;
      requestType?: string;
      entityType?: string;
      userId?: string;
      scope?: 'awaiting_me' | 'my_requests' | 'all' | 'delegated';
      delegatedUserIds?: string[];
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = { organizationId };

    if (filter.status) where.status = filter.status;
    if (filter.requestType) where.requestType = filter.requestType;
    if (filter.entityType) where.entityType = filter.entityType;

    const currentUserId = filter.userId;
    const delegatedUserIds = filter.delegatedUserIds || [];

    if (filter.scope === 'my_requests' && currentUserId) {
      where.requestedBy = currentUserId;
    } else if (filter.scope === 'awaiting_me' && currentUserId) {
      const allowedApproverIds = [currentUserId, ...delegatedUserIds];
      where.status = ApprovalStatus.PENDING;
      where.steps = {
        some: {
          status: ApprovalStepStatus.PENDING,
          approverId: { in: allowedApproverIds },
        },
      };
    } else if (filter.scope === 'delegated' && delegatedUserIds.length > 0) {
      where.status = ApprovalStatus.PENDING;
      where.steps = {
        some: {
          status: ApprovalStepStatus.PENDING,
          approverId: { in: delegatedUserIds },
        },
      };
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.approvalFlow.count({ where }),
      this.prisma.approvalFlow.findMany({
        where,
        skip,
        take: limit,
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
        orderBy: [{ initiatedAt: 'desc' }],
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

  async findOverdueSteps(organizationId: string) {
    const now = new Date();
    return this.prisma.approvalStep.findMany({
      where: {
        approvalFlow: { organizationId },
        status: 'pending',
        dueDate: { lt: now },
        escalatedAt: null,
      },
      include: {
        approvalFlow: true,
      },
    });
  }
}
