import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string; assetType?: string } = {}) {
    return this.prisma.asset.findMany({
      where: {
        organizationId,
        ...(filters.status ? { returnStatus: filters.status } : {}),
        ...(filters.employeeId ? { assignedEmployeeId: filters.employeeId } : {}),
        ...(filters.assetType ? { assetType: filters.assetType } : {}),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.asset.findFirst({
      where: { id, organizationId },
      include: {
        assignedTo: true,
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    const isAssigned = !!data.assignedEmployeeId;
    return this.prisma.asset.create({
      data: {
        organizationId,
        assetName: data.assetName,
        assetType: data.assetType,
        assetSerialNumber: data.assetSerialNumber,
        assignedEmployeeId: data.assignedEmployeeId || null,
        assignedDate: data.assignedDate ? new Date(data.assignedDate) : (isAssigned ? new Date() : null),
        assetCondition: data.assetCondition || 'NEW',
        returnStatus: isAssigned ? 'ASSIGNED' : 'UNASSIGNED',
        assignedBy: isAssigned ? userId : null,
        comments: data.comments || null,
      },
      include: {
        assignedTo: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.asset.update({
      where: { id },
      data,
      include: {
        assignedTo: true,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    return this.prisma.asset.delete({
      where: { id },
    });
  }
}
