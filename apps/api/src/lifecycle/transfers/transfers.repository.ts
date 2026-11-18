import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    const where: any = {
      organizationId,
      transitionType: { in: ['TRANSFER', 'LOCATION_CHANGE', 'DEPARTMENT_CHANGE'] },
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
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
            reportingManager: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.employeeTransition.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
            reportingManager: true,
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
