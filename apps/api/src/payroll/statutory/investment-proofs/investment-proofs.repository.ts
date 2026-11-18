import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class InvestmentProofsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEmployee(organizationId: string, employeeId: string) {
    return this.prisma.employeeInvestmentProof.findMany({
      where: { organizationId, employeeId },
      include: {
        declaration: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.employeeInvestmentProof.findFirst({
      where: { id, organizationId },
      include: {
        declaration: true,
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

  async findAll(organizationId: string, filters: { verificationStatus?: string; employeeId?: string } = {}) {
    const where: any = { organizationId };
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.employeeInvestmentProof.findMany({
      where,
      include: {
        declaration: true,
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
    return this.prisma.employeeInvestmentProof.create({
      data: {
        organizationId,
        employeeId,
        ...data,
      },
      include: {
        declaration: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.employeeInvestmentProof.update({
      where: { id },
      data,
      include: {
        declaration: true,
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
