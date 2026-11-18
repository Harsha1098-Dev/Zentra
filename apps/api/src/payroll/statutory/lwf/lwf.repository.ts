import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LwfRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllRules(organizationId: string) {
    return this.prisma.lwfRule.findMany({
      where: { organizationId },
      orderBy: { state: 'asc' },
    });
  }

  async findRuleById(id: string, organizationId: string) {
    return this.prisma.lwfRule.findFirst({
      where: { id, organizationId },
    });
  }

  async findRuleByStateCode(organizationId: string, stateCode: string) {
    return this.prisma.lwfRule.findUnique({
      where: {
        organizationId_stateCode: {
          organizationId,
          stateCode,
        },
      },
    });
  }

  async createRule(organizationId: string, data: any) {
    return this.prisma.lwfRule.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async updateRule(id: string, organizationId: string, data: any) {
    return this.prisma.lwfRule.update({
      where: { id },
      data,
    });
  }

  async deleteRule(id: string) {
    return this.prisma.lwfRule.delete({
      where: { id },
    });
  }

  async getMonthlyLwfRecords(organizationId: string, month: number, year: number) {
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
