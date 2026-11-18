import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Payslip } from '@prisma/client';

@Injectable()
export class PayslipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filter?: {
      payrollRunId?: string;
      payrollPeriodId?: string;
      status?: string;
      search?: string;
    },
  ): Promise<any[]> {
    const where: any = { organizationId };

    if (filter?.payrollRunId) where.payrollRunId = filter.payrollRunId;
    if (filter?.payrollPeriodId) where.payrollPeriodId = filter.payrollPeriodId;
    if (filter?.status) where.status = filter.status;
    if (filter?.search) {
      where.employee = {
        OR: [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { employeeCode: { contains: filter.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.payslip.findMany({
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
        payrollPeriod: true,
        payrollRun: true,
      },
      orderBy: [{ payDate: 'desc' }, { payslipNumber: 'asc' }],
    });
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    return this.prisma.payslip.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            bankDetail: true,
          },
        },
        payrollPeriod: true,
        payrollRun: true,
        template: true,
      },
    });
  }

  async findByEmployeeId(
    employeeId: string,
    organizationId: string,
    filter?: { year?: number; status?: string },
  ): Promise<any[]> {
    const where: any = {
      employeeId,
      organizationId,
      status: filter?.status || 'PUBLISHED',
    };

    if (filter?.year) {
      where.payrollPeriod = { payrollYear: filter.year };
    }

    return this.prisma.payslip.findMany({
      where,
      include: {
        payrollPeriod: true,
        payrollRun: true,
      },
      orderBy: { payDate: 'desc' },
    });
  }

  async findByRecordId(
    payrollEmployeeRecordId: string,
    organizationId: string,
  ): Promise<Payslip | null> {
    return this.prisma.payslip.findFirst({
      where: { payrollEmployeeRecordId, organizationId },
    });
  }

  async create(data: any): Promise<Payslip> {
    return this.prisma.payslip.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<Payslip> {
    return this.prisma.payslip.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: string): Promise<Payslip> {
    return this.prisma.payslip.update({
      where: { id },
      data: { status },
    });
  }

  async recordView(id: string): Promise<void> {
    await this.prisma.payslip.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  }

  async recordDownload(id: string): Promise<void> {
    await this.prisma.payslip.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });
  }
}
