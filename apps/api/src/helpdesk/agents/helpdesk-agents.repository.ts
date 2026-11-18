import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HelpdeskAgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.helpdeskAgent.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        categoryAgents: {
          include: {
            helpdeskCategory: true,
            helpdeskSubCategory: true,
          },
        },
        _count: {
          select: {
            assignedTickets: {
              where: {
                ticketStatus: {
                  notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'],
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.helpdeskAgent.findFirst({
      where: { id, organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        categoryAgents: {
          include: {
            helpdeskCategory: true,
            helpdeskSubCategory: true,
          },
        },
        _count: {
          select: {
            assignedTickets: true,
          },
        },
      },
    });
  }

  async findByUserId(organizationId: string, userId: string) {
    return this.prisma.helpdeskAgent.findFirst({
      where: { organizationId, userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        categoryAgents: true,
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.helpdeskAgent.create({
      data: {
        organizationId,
        ...data,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        categoryAgents: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.helpdeskAgent.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        categoryAgents: true,
      },
    });
  }

  async assignCategory(organizationId: string, agentId: string, categoryId: string, isPrimary = false, subCategoryId?: string) {
    return this.prisma.helpdeskCategoryAgent.upsert({
      where: {
        organizationId_helpdeskCategoryId_helpdeskSubCategoryId_helpdeskAgentId: {
          organizationId,
          helpdeskCategoryId: categoryId,
          helpdeskSubCategoryId: subCategoryId ?? null as any,
          helpdeskAgentId: agentId,
        },
      },
      create: {
        organizationId,
        helpdeskAgentId: agentId,
        helpdeskCategoryId: categoryId,
        helpdeskSubCategoryId: subCategoryId,
        isPrimary,
      },
      update: {
        isPrimary,
      },
    });
  }

  async removeCategory(organizationId: string, agentId: string, categoryId: string) {
    return this.prisma.helpdeskCategoryAgent.deleteMany({
      where: {
        organizationId,
        helpdeskAgentId: agentId,
        helpdeskCategoryId: categoryId,
      },
    });
  }

  async findCategoryAgents(organizationId: string, categoryId: string, subCategoryId?: string) {
    return this.prisma.helpdeskCategoryAgent.findMany({
      where: {
        organizationId,
        helpdeskCategoryId: categoryId,
        ...(subCategoryId ? { helpdeskSubCategoryId: subCategoryId } : {}),
        helpdeskAgent: {
          isActive: true,
        },
      },
      include: {
        helpdeskAgent: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { isPrimary: 'desc' },
    });
  }
}
