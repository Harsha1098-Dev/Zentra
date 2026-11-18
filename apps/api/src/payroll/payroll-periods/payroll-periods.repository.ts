import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayrollPeriod } from '@prisma/client';

@Injectable()
export class PayrollPeriodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, year?: number): Promise<any[]> {
    const where: any = { organizationId };
    if (year) {
      where.payrollYear = year;
    }

    return this.prisma.payrollPeriod.findMany({
      where,
      include: {
        _count: {
          select: { payrollRuns: true, payslips: true },
        },
      },
      orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
    });
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    return this.prisma.payrollPeriod.findFirst({
      where: { id, organizationId },
      include: {
        payrollRuns: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { payslips: true },
        },
      },
    });
  }

  async findByMonthAndYear(
    month: number,
    year: number,
    organizationId: string,
  ): Promise<PayrollPeriod | null> {
    return this.prisma.payrollPeriod.findFirst({
      where: {
        organizationId,
        payrollMonth: month,
        payrollYear: year,
      },
    });
  }

  async create(organizationId: string, data: any): Promise<PayrollPeriod> {
    return this.prisma.payrollPeriod.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any): Promise<PayrollPeriod> {
    return this.prisma.payrollPeriod.update({
      where: { id },
      data,
    });
  }

  async updateStatus(
    id: string,
    organizationId: string,
    status: string,
  ): Promise<PayrollPeriod> {
    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status },
    });
  }
}
