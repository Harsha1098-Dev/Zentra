import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalaryRevisionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.prisma.salaryRevision.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.salaryRevision.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
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
    return this.prisma.salaryRevision.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        currentSalaryStructureId: data.currentSalaryStructureId || null,
        newSalaryStructureId: data.newSalaryStructureId || null,
        currentAnnualCtc: data.currentAnnualCtc,
        newAnnualCtc: data.newAnnualCtc,
        revisionType: data.revisionType,
        effectiveFrom: data.effectiveFrom,
        reason: data.reason,
        remarks: data.remarks || null,
        status: data.status || 'PENDING_APPROVAL',
        createdBy: userId,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.salaryRevision.update({
      where: { id },
      data,
      include: {
        employee: true,
      },
    });
  }
}
