import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskQueryFilterInput, TaskStatus } from '@zentra/shared-types';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    title: string;
    description?: string | null;
    assignedTo?: string | null;
    assignedBy?: string | null;
    dueDate?: Date | null;
    priority?: string;
    status?: string;
    sourceType?: string | null;
    sourceId?: string | null;
  }) {
    return this.prisma.task.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description || null,
        assignedTo: data.assignedTo || null,
        assignedBy: data.assignedBy || null,
        dueDate: data.dueDate || null,
        priority: data.priority || 'medium',
        status: data.status || TaskStatus.PENDING,
        sourceType: data.sourceType || null,
        sourceId: data.sourceId || null,
      },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.task.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async list(organizationId: string, filter: TaskQueryFilterInput, userId?: string, isManager: boolean = false) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.sourceType) where.sourceType = filter.sourceType;

    // Non-managers can only see tasks assigned to them or created by them
    if (!isManager && userId) {
      where.OR = [{ assignedTo: userId }, { assignedBy: userId }];
    } else if (filter.assignedTo) {
      where.assignedTo = filter.assignedTo;
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
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
}
