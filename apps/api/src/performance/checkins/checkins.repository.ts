import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CheckinsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.goalId) where.goalId = filters.goalId;
    if (filters.keyResultId) where.keyResultId = filters.keyResultId;
    if (filters.status) where.status = filters.status;

    return this.prisma.checkIn.findMany({
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
        goal: { select: { id: true, title: true } },
        keyResult: { select: { id: true, title: true, metricType: true, targetValue: true, unit: true } },
      },
      orderBy: { checkInDate: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.checkIn.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        goal: true,
        keyResult: true,
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.checkIn.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        goalId: data.goalId || null,
        keyResultId: data.keyResultId || null,
        checkInDate: data.checkInDate ? new Date(data.checkInDate) : new Date(),
        currentValue: data.currentValue,
        progressPercentage: data.progressPercentage,
        comments: data.comments || null,
        blockers: data.blockers || null,
        supportRequired: data.supportRequired || null,
        status: data.status || 'PENDING',
        createdBy: userId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.checkInDate) updateData.checkInDate = new Date(updateData.checkInDate);
    if (updateData.approvedAt) updateData.approvedAt = new Date(updateData.approvedAt);

    return this.prisma.checkIn.update({
      where: { id },
      data: updateData,
    });
  }
}
