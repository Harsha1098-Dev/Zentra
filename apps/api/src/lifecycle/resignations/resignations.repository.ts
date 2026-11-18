import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResignationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.prisma.resignationRequest.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
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
        exitClearances: true,
        offboardingRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.resignationRequest.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            reportingManager: true,
          },
        },
        exitClearances: true,
        exitInterview: true,
        offboardingRequest: true,
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.resignationRequest.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        resignationDate: data.resignationDate ? new Date(data.resignationDate) : new Date(),
        lastWorkingDate: new Date(data.lastWorkingDate),
        noticePeriodDays: data.noticePeriodDays,
        reason: data.reason,
        comments: data.comments || null,
        status: data.status || 'PENDING_APPROVAL',
        createdBy: userId,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.resignationRequest.update({
      where: { id },
      data,
      include: {
        employee: true,
        exitClearances: true,
      },
    });
  }
}
