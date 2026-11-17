import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndOrg(userId: string, organizationId: string) {
    return this.prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        organization: {
          include: {
            products: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.organizationMembership.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            products: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.prisma.organizationMembership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        organization: {
          include: {
            products: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByOrganizationId(organizationId: string) {
    return this.prisma.organizationMembership.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            createdAt: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, organizationId: string, status = 'ACTIVE') {
    return this.prisma.organizationMembership.create({
      data: {
        userId,
        organizationId,
        status,
        joinedAt: status === 'ACTIVE' ? new Date() : null,
      },
      include: {
        organization: true,
      },
    });
  }

  async updateStatus(id: string, status: string, joinedAt?: Date) {
    return this.prisma.organizationMembership.update({
      where: { id },
      data: {
        status,
        ...(joinedAt ? { joinedAt } : {}),
      },
    });
  }
}
