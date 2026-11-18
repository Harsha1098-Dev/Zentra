import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HelpdeskCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.helpdeskCategory.findMany({
      where: { organizationId },
      include: {
        parentCategory: true,
        subCategories: true,
        categoryAgents: {
          include: {
            helpdeskAgent: {
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
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.helpdeskCategory.findFirst({
      where: { id, organizationId },
      include: {
        parentCategory: true,
        subCategories: true,
        categoryAgents: {
          include: {
            helpdeskAgent: {
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
          },
        },
        slaPolicy: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  async findByCode(organizationId: string, categoryCode: string) {
    return this.prisma.helpdeskCategory.findFirst({
      where: { organizationId, categoryCode },
    });
  }

  async findByName(organizationId: string, name: string) {
    return this.prisma.helpdeskCategory.findFirst({
      where: { organizationId, name: { equals: name, mode: 'insensitive' } },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.helpdeskCategory.create({
      data: {
        organizationId,
        ...data,
      },
      include: {
        subCategories: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.helpdeskCategory.update({
      where: { id },
      data,
      include: {
        subCategories: true,
      },
    });
  }

  async countOpenTickets(organizationId: string, categoryId: string) {
    return this.prisma.ticket.count({
      where: {
        organizationId,
        helpdeskCategoryId: categoryId,
        ticketStatus: {
          notIn: ['CLOSED', 'CANCELLED'],
        },
      },
    });
  }

  // SubCategories
  async findSubCategoryById(organizationId: string, subCategoryId: string) {
    return this.prisma.helpdeskSubCategory.findFirst({
      where: { id: subCategoryId, organizationId },
      include: {
        helpdeskCategory: true,
      },
    });
  }

  async createSubCategory(organizationId: string, data: any) {
    return this.prisma.helpdeskSubCategory.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async updateSubCategory(organizationId: string, id: string, data: any) {
    return this.prisma.helpdeskSubCategory.update({
      where: { id },
      data,
    });
  }

  async countOpenTicketsForSubCategory(organizationId: string, subCategoryId: string) {
    return this.prisma.ticket.count({
      where: {
        organizationId,
        helpdeskSubCategoryId: subCategoryId,
        ticketStatus: {
          notIn: ['CLOSED', 'CANCELLED'],
        },
      },
    });
  }
}
