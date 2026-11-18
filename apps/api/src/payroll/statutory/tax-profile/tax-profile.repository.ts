import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TaxProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmployeeAndYear(organizationId: string, employeeId: string, financialYear: string) {
    return this.prisma.employeeTaxProfile.findUnique({
      where: {
        organizationId_employeeId_financialYear: {
          organizationId,
          employeeId,
          financialYear,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
      },
    });
  }

  async findLatestByEmployee(organizationId: string, employeeId: string) {
    return this.prisma.employeeTaxProfile.findFirst({
      where: { organizationId, employeeId },
      orderBy: { financialYear: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
      },
    });
  }

  async upsert(organizationId: string, employeeId: string, financialYear: string, data: any) {
    return this.prisma.employeeTaxProfile.upsert({
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
            workEmail: true,
          },
        },
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
