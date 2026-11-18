import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };

    if (filters.status) {
      where.ticketStatus = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.categoryId) {
      where.helpdeskCategoryId = filters.categoryId;
    }
    if (filters.agentId) {
      where.assignedAgentId = filters.agentId;
    }
    if (filters.unassigned === 'true' || filters.unassigned === true) {
      where.assignedAgentId = null;
    }
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.search) {
      where.OR = [
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              workEmail: true,
              department: {
                select: { id: true, name: true },
              },
            },
          },
          helpdeskCategory: true,
          helpdeskSubCategory: true,
          assignedAgent: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          feedback: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit ? Number(filters.limit) : 50,
        skip: filters.offset ? Number(filters.offset) : 0,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total };
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.ticket.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: {
              select: { id: true, name: true },
            },
          },
        },
        helpdeskCategory: true,
        helpdeskSubCategory: true,
        assignedAgent: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        slaPolicy: {
          include: {
            escalationRules: true,
          },
        },
        conversations: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        statusHistories: {
          include: {
            changedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { changedAt: 'asc' },
        },
        assignmentHistories: {
          orderBy: { assignedAt: 'asc' },
        },
        feedback: true,
      },
    });
  }

  async findDuplicateTicket(
    organizationId: string,
    employeeId: string,
    categoryId: string,
    subject: string,
    windowMinutes = 10,
  ) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.prisma.ticket.findFirst({
      where: {
        organizationId,
        employeeId,
        helpdeskCategoryId: categoryId,
        subject: { equals: subject.trim(), mode: 'insensitive' },
        ticketStatus: {
          notIn: ['CLOSED', 'CANCELLED'],
        },
        createdAt: { gte: windowStart },
      },
    });
  }

  async getNextTicketNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.ticket.count({
      where: { organizationId },
    });
    const nextNum = count + 1;
    return `TICK-${String(nextNum).padStart(5, '0')}`;
  }

  async create(organizationId: string, data: any) {
    return this.prisma.ticket.create({
      data: {
        organizationId,
        ...data,
      },
      include: {
        employee: true,
        helpdeskCategory: true,
        helpdeskSubCategory: true,
        assignedAgent: {
          include: {
            user: true,
          },
        },
        conversations: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.ticket.update({
      where: { id },
      data,
      include: {
        employee: true,
        helpdeskCategory: true,
        helpdeskSubCategory: true,
        assignedAgent: {
          include: {
            user: true,
          },
        },
        feedback: true,
      },
    });
  }

  async addStatusHistory(organizationId: string, data: any) {
    return this.prisma.ticketStatusHistory.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async addAssignmentHistory(organizationId: string, data: any) {
    return this.prisma.ticketAssignmentHistory.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async addConversation(organizationId: string, data: any) {
    const { attachments, ...convoData } = data;
    return this.prisma.ticketConversation.create({
      data: {
        organizationId,
        ...convoData,
        ...(attachments && attachments.length > 0
          ? {
              attachments: {
                create: attachments.map((att: any) => ({
                  organizationId,
                  ticketId: convoData.ticketId,
                  fileName: att.fileName,
                  fileUrl: att.fileUrl,
                  fileType: att.fileType,
                  fileSize: att.fileSize,
                  uploadedBy: convoData.authorId,
                })),
              },
            }
          : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        attachments: true,
      },
    });
  }

  async addAttachment(organizationId: string, data: any) {
    return this.prisma.ticketAttachment.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async createFeedback(organizationId: string, data: any) {
    return this.prisma.ticketFeedback.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async findFeedbackByTicketId(organizationId: string, ticketId: string) {
    return this.prisma.ticketFeedback.findFirst({
      where: { organizationId, ticketId },
    });
  }
}
