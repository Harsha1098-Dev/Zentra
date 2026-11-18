import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayrollRun } from '@prisma/client';

@Injectable()
export class PayrollRunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filter?: { status?: string; year?: number }): Promise<any[]> {
    const where: any = { organizationId };
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.year) {
      where.payrollPeriod = { payrollYear: filter.year };
    }

    return this.prisma.payrollRun.findMany({
      where,
      include: {
        payrollPeriod: true,
        _count: {
          select: { records: true, exceptions: true, payslips: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    return this.prisma.payrollRun.findFirst({
      where: { id, organizationId },
      include: {
        payrollPeriod: true,
        _count: {
          select: { records: true, exceptions: true, inputs: true, payslips: true },
        },
      },
    });
  }

  async findByPeriodAndType(
    payrollPeriodId: string,
    runType: string,
    organizationId: string,
  ): Promise<PayrollRun | null> {
    return this.prisma.payrollRun.findFirst({
      where: {
        payrollPeriodId,
        runType,
        organizationId,
      },
    });
  }

  async create(organizationId: string, data: any): Promise<PayrollRun> {
    return this.prisma.payrollRun.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        payrollPeriod: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any): Promise<PayrollRun> {
    return this.prisma.payrollRun.update({
      where: { id },
      data,
      include: { payrollPeriod: true },
    });
  }

  async updateStatus(
    id: string,
    organizationId: string,
    status: string,
    extraData: any = {},
  ): Promise<PayrollRun> {
    return this.prisma.payrollRun.update({
      where: { id },
      data: {
        status,
        ...extraData,
      },
      include: { payrollPeriod: true },
    });
  }

  async findEmployeeRecords(
    payrollRunId: string,
    organizationId: string,
    filter?: { departmentId?: string; search?: string },
  ): Promise<any[]> {
    const where: any = {
      payrollRunId,
      organizationId,
    };

    if (filter?.departmentId) {
      where.employee = { departmentId: filter.departmentId };
    }
    if (filter?.search) {
      where.employee = {
        ...(where.employee || {}),
        OR: [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { employeeCode: { contains: filter.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.payrollEmployeeRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            dateOfJoining: true,
          },
        },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }],
    });
  }
}
