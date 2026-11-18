import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PfRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganizationId(organizationId: string) {
    return this.prisma.pfConfiguration.findUnique({
      where: { organizationId },
    });
  }

  async upsert(organizationId: string, data: any) {
    return this.prisma.pfConfiguration.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }

  async getMonthlyPfRecords(organizationId: string, month: number, year: number) {
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
            taxProfiles: {
              where: { organizationId },
              take: 1,
            },
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
