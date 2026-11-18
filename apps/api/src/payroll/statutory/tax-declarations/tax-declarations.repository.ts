import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TaxDeclarationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEmployee(organizationId: string, employeeId: string, financialYear?: string) {
    const where: any = { organizationId, employeeId };
    if (financialYear) {
      where.financialYear = financialYear;
    }

    return this.prisma.employeeTaxDeclaration.findMany({
      where,
      include: {
        proofs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.employeeTaxDeclaration.findFirst({
      where: { id, organizationId },
      include: {
        proofs: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
    });
  }

  async findAll(organizationId: string, filters: { financialYear?: string; status?: string; employeeId?: string } = {}) {
    const where: any = { organizationId };
    if (filters.financialYear) where.financialYear = filters.financialYear;
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.employeeTaxDeclaration.findMany({
      where,
      include: {
        proofs: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, employeeId: string, data: any) {
    return this.prisma.employeeTaxDeclaration.create({
      data: {
        organizationId,
        employeeId,
        ...data,
      },
      include: {
        proofs: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.employeeTaxDeclaration.update({
      where: { id },
      data,
      include: {
        proofs: true,
      },
    });
  }

  async submitAllDrafts(organizationId: string, employeeId: string, financialYear: string) {
    return this.prisma.employeeTaxDeclaration.updateMany({
      where: {
        organizationId,
        employeeId,
        financialYear,
        status: 'DRAFT',
      },
      data: {
        status: 'SUBMITTED',
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
