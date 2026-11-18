import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransitionType } from '@zentra/shared-types';

@Injectable()
export class PromotionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    const where: any = {
      organizationId,
      transitionType: TransitionType.PROMOTION,
    };
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.employeeTransition.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { id: true, name: true } },
            grade: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.employeeTransition.findFirst({
      where: { id, organizationId, transitionType: TransitionType.PROMOTION },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            grade: true,
            salaryAssignments: {
              where: { status: 'ACTIVE' },
              orderBy: { effectiveFrom: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.employeeTransition.create({
      data: {
        ...data,
        organizationId,
        transitionType: TransitionType.PROMOTION,
        createdBy: userId,
      },
      include: { employee: true },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.employeeTransition.update({
      where: { id },
      data,
      include: { employee: true },
    });
  }
}
