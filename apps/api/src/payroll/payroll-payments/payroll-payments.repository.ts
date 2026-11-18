import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayrollPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async markRunPaid(
    payrollRunId: string,
    organizationId: string,
    paymentDate: Date,
    paymentReference: string,
    paymentNotes?: string,
  ): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark all pending/processed employee records as PAID
      await tx.payrollEmployeeRecord.updateMany({
        where: {
          payrollRunId,
          organizationId,
          paymentStatus: { in: ['PENDING', 'PROCESSED'] },
        },
        data: {
          paymentStatus: 'PAID',
          paymentDate,
          paymentReference,
        },
      });

      // 2. Update run status to PAID
      return tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: 'PAID',
          paymentDate,
          paymentReference,
          paymentNotes,
        },
        include: { payrollPeriod: true },
      });
    });
  }

  async markEmployeePaid(
    payrollRunId: string,
    employeeId: string,
    organizationId: string,
    paymentDate: Date,
    paymentReference: string,
  ): Promise<any> {
    const updatedRecord = await this.prisma.payrollEmployeeRecord.update({
      where: {
        payrollRunId_employeeId: {
          payrollRunId,
          employeeId,
        },
      },
      data: {
        paymentStatus: 'PAID',
        paymentDate,
        paymentReference,
      },
    });

    // Check if all employees in the run are paid
    const unpaidCount = await this.prisma.payrollEmployeeRecord.count({
      where: {
        payrollRunId,
        organizationId,
        paymentStatus: { not: 'PAID' },
      },
    });

    if (unpaidCount === 0) {
      await this.prisma.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: 'PAID' },
      });
    }

    return updatedRecord;
  }

  async uploadPaymentProof(
    payrollRunId: string,
    organizationId: string,
    paymentProofUrl: string,
    paymentReference?: string,
    paymentNotes?: string,
  ): Promise<any> {
    return this.prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        paymentProofUrl,
        paymentReference: paymentReference || undefined,
        paymentNotes: paymentNotes || undefined,
      },
    });
  }

  async getPaymentStatus(payrollRunId: string, organizationId: string): Promise<any> {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
      include: { payrollPeriod: true },
    });

    const statusCounts = await this.prisma.payrollEmployeeRecord.groupBy({
      by: ['paymentStatus'],
      where: { payrollRunId, organizationId },
      _count: { id: true },
      _sum: { netPay: true },
    });

    return {
      run,
      summary: statusCounts.map((s) => ({
        paymentStatus: s.paymentStatus,
        count: s._count.id,
        totalNetPay: s._sum.netPay || 0,
      })),
    };
  }
}
