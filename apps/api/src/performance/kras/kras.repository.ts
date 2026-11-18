import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KrasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, employeeId?: string) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };
    if (employeeId) where.employeeId = employeeId;

    return this.prisma.kRA.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.kRA.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.kRA.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        category: data.category || 'CORE',
        weightage: data.weightage ?? 100,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || 'ACTIVE',
        createdBy: userId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    return this.prisma.kRA.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.kRA.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }
}
