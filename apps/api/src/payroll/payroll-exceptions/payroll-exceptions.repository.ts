import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayrollException } from '@prisma/client';

@Injectable()
export class PayrollExceptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRun(payrollRunId: string, organizationId: string): Promise<any[]> {
    return this.prisma.payrollException.findMany({
      where: {
        payrollRunId,
        organizationId,
      },
      include: {
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
      orderBy: [{ severity: 'asc' }, { isResolved: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    return this.prisma.payrollException.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });
  }

  async countUnresolvedCritical(payrollRunId: string, organizationId: string): Promise<number> {
    return this.prisma.payrollException.count({
      where: {
        payrollRunId,
        organizationId,
        severity: 'CRITICAL',
        isResolved: false,
        isOverridden: false,
      },
    });
  }

  async clearExceptions(payrollRunId: string, organizationId: string): Promise<void> {
    await this.prisma.payrollException.deleteMany({
      where: { payrollRunId, organizationId },
    });
  }

  async bulkCreate(exceptions: any[]): Promise<void> {
    if (exceptions.length === 0) return;
    await this.prisma.payrollException.createMany({
      data: exceptions,
    });
  }

  async resolve(
    id: string,
    organizationId: string,
    resolvedBy: string,
    resolutionNotes: string,
  ): Promise<PayrollException> {
    return this.prisma.payrollException.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNotes,
      },
    });
  }

  async override(
    id: string,
    organizationId: string,
    overriddenBy: string,
    overrideReason: string,
  ): Promise<PayrollException> {
    return this.prisma.payrollException.update({
      where: { id },
      data: {
        isOverridden: true,
        overriddenBy,
        overrideReason,
      },
    });
  }
}
