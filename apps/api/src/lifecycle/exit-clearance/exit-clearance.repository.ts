import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExitClearanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string; resignationRequestId?: string } = {}) {
    return this.prisma.exitClearance.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.resignationRequestId ? { resignationRequestId: filters.resignationRequestId } : {}),
      },
      include: {
        employee: {
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
    return this.prisma.exitClearance.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        resignation: true,
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.exitClearance.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        resignationRequestId: data.resignationRequestId || null,
        clearanceType: data.clearanceType,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'PENDING',
        comments: data.comments || null,
        isMandatory: data.isMandatory !== undefined ? data.isMandatory : true,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.exitClearance.update({
      where: { id },
      data,
      include: {
        employee: true,
      },
    });
  }
}
