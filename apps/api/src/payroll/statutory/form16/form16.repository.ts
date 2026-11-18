import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class Form16Repository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { financialYear?: string; status?: string } = {}) {
    const where: any = { organizationId };
    if (filters.financialYear) where.financialYear = filters.financialYear;
    if (filters.status) where.status = filters.status;

    return this.prisma.form16Record.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.form16Record.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            dateOfJoining: true,
            taxProfiles: {
              where: { organizationId },
              take: 1,
            },
          },
        },
      },
    });
  }

  async findByEmployee(organizationId: string, employeeId: string) {
    return this.prisma.form16Record.findMany({
      where: { organizationId, employeeId, status: 'PUBLISHED' },
      orderBy: { financialYear: 'desc' },
    });
  }

  async upsert(organizationId: string, employeeId: string, financialYear: string, data: any) {
    return this.prisma.form16Record.upsert({
      where: {
        organizationId_employeeId_financialYear: {
          organizationId,
          employeeId,
          financialYear,
        },
      },
      create: {
        organizationId,
        employeeId,
        financialYear,
        ...data,
      },
      update: {
        ...data,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async publishRecords(organizationId: string, recordIds?: string[], financialYear?: string, publishedBy?: string) {
    const where: any = { organizationId };
    if (recordIds && recordIds.length > 0) {
      where.id = { in: recordIds };
    } else if (financialYear) {
      where.financialYear = financialYear;
    }

    return this.prisma.form16Record.updateMany({
      where,
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy,
      },
    });
  }

  async findEmployeeByUserId(organizationId: string, userId: string, email?: string) {
    let employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!employee && email) {
      employee = await this.prisma.employee.findFirst({
        where: { organizationId, workEmail: email, deletedAt: null },
      });
    }
    return employee;
  }
}
