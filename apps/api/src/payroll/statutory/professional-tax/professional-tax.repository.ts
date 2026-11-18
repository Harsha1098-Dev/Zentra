import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProfessionalTaxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllRules(organizationId: string) {
    return this.prisma.professionalTaxRule.findMany({
      where: { organizationId },
      include: {
        slabs: {
          orderBy: { minSalary: 'asc' },
        },
      },
      orderBy: { state: 'asc' },
    });
  }

  async findRuleById(id: string, organizationId: string) {
    return this.prisma.professionalTaxRule.findFirst({
      where: { id, organizationId },
      include: {
        slabs: {
          orderBy: { minSalary: 'asc' },
        },
      },
    });
  }

  async findRuleByStateCode(organizationId: string, stateCode: string) {
    return this.prisma.professionalTaxRule.findUnique({
      where: {
        organizationId_stateCode: {
          organizationId,
          stateCode,
        },
      },
      include: {
        slabs: {
          orderBy: { minSalary: 'asc' },
        },
      },
    });
  }

  async createRule(organizationId: string, data: any) {
    return this.prisma.professionalTaxRule.create({
      data: {
        organizationId,
        ...data,
      },
      include: { slabs: true },
    });
  }

  async updateRule(id: string, organizationId: string, data: any) {
    return this.prisma.professionalTaxRule.update({
      where: { id },
      data,
      include: { slabs: true },
    });
  }

  async addSlab(organizationId: string, ruleId: string, data: any) {
    return this.prisma.professionalTaxSlab.create({
      data: {
        organizationId,
        ruleId,
        ...data,
      },
    });
  }

  async updateSlab(slabId: string, organizationId: string, data: any) {
    return this.prisma.professionalTaxSlab.update({
      where: { id: slabId },
      data,
    });
  }

  async deleteSlab(slabId: string) {
    return this.prisma.professionalTaxSlab.delete({
      where: { id: slabId },
    });
  }

  async getMonthlyPtRecords(organizationId: string, month: number, year: number) {
    return this.prisma.payrollEmployeeRecord.findMany({
      where: {
        organizationId,
        payrollRun: {
          payrollPeriod: {
            payrollMonth: month,
            payrollYear: year,
          },
        },
      },
      include: {
        employee: {
          include: {
            location: true,
          },
        },
        payrollRun: {
          include: {
            payrollPeriod: true,
          },
        },
      },
    });
  }
}
