import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProbationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    const where: any = { organizationId };
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.probationReview.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            dateOfJoining: true,
            probationEndDate: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            reportingManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { probationEndDate: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.probationReview.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            reportingManager: true,
          },
        },
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.probationReview.create({
      data: {
        ...data,
        organizationId,
        createdBy: userId,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.probationReview.update({
      where: { id },
      data,
      include: {
        employee: true,
      },
    });
  }
}
