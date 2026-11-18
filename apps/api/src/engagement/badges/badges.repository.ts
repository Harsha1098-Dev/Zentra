import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BadgesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, isActiveOnly = true) {
    const where: any = { organizationId };
    if (isActiveOnly) where.isActive = true;

    return this.prisma.badge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { employeeBadges: true },
        },
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.badge.findFirst({
      where: { id, organizationId },
    });
  }

  async findByName(organizationId: string, name: string) {
    return this.prisma.badge.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.badge.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.badge.update({
      where: { id },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.badge.delete({
      where: { id },
    });
  }

  async findEmployeeBadges(organizationId: string, employeeId: string) {
    return this.prisma.employeeBadge.findMany({
      where: { organizationId, employeeId },
      include: {
        badge: true,
      },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async awardBadge(organizationId: string, data: {
    badgeId: string;
    employeeId: string;
    reason?: string;
    recognitionId?: string;
  }) {
    return this.prisma.employeeBadge.create({
      data: {
        organizationId,
        badgeId: data.badgeId,
        employeeId: data.employeeId,
        reason: data.reason,
        recognitionId: data.recognitionId,
      },
      include: {
        badge: true,
        employee: true,
      },
    });
  }
}
