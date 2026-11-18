import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImprovementPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.managerId) where.managerId = filters.managerId;
    if (filters.status) where.status = filters.status;

    return this.prisma.improvementPlan.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.improvementPlan.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        manager: true,
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.improvementPlan.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        managerId: data.managerId,
        title: data.title,
        description: data.description || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        improvementAreas: data.improvementAreas || null,
        successCriteria: data.successCriteria,
        supportRequired: data.supportRequired || null,
        status: data.status || 'ACTIVE',
        createdBy: userId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    return this.prisma.improvementPlan.update({
      where: { id },
      data: updateData,
    });
  }
}
