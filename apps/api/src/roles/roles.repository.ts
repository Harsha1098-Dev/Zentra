import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findByCode(code: string, organizationId?: string | null) {
    // If organizationId is provided, first search org-specific role, then fallback to system role
    if (organizationId) {
      const orgRole = await this.prisma.role.findFirst({
        where: { code, organizationId },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      if (orgRole) return orgRole;
    }

    return this.prisma.role.findFirst({
      where: { code, organizationId: null },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findAvailableForOrganization(organizationId?: string | null) {
    return this.prisma.role.findMany({
      where: {
        OR: [
          { organizationId: null },
          ...(organizationId ? [{ organizationId }] : []),
        ],
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async assignRoleToMembership(membershipId: string, roleId: string, organizationId: string) {
    return this.prisma.userRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId,
          roleId,
        },
      },
      update: {},
      create: {
        membershipId,
        roleId,
        organizationId,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
  }

  async removeRoleFromMembership(membershipId: string, roleId: string) {
    return this.prisma.userRole.deleteMany({
      where: {
        membershipId,
        roleId,
      },
    });
  }

  async findRolesForMembership(membershipId: string) {
    return this.prisma.userRole.findMany({
      where: { membershipId },
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
    });
  }
}
