import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveBalancesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmployeeAndYear(employeeId: string, year: number, organizationId: string) {
    return this.prisma.leaveBalance.findMany({
      where: {
        organizationId,
        employeeId,
        year,
      },
      include: {
        leaveType: true,
        leavePolicy: true,
      },
      orderBy: {
        leaveType: {
          name: 'asc',
        },
      },
    });
  }

  async findSpecificBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.leaveBalance.findUnique({
      where: {
        organizationId_employeeId_leaveTypeId_year: {
          organizationId,
          employeeId,
          leaveTypeId,
          year,
        },
      },
      include: {
        leaveType: true,
        leavePolicy: true,
      },
    });
  }

  async findById(id: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.leaveBalance.findFirst({
      where: { id, organizationId },
      include: {
        leaveType: true,
        leavePolicy: true,
      },
    });
  }

  async upsertBalance(
    data: {
      organizationId: string;
      employeeId: string;
      leaveTypeId: string;
      leavePolicyId?: string | null;
      year: number;
      openingBalance?: number;
      accrued?: number;
      granted?: number;
      used?: number;
      pending?: number;
      carryForward?: number;
      encashed?: number;
      adjustment?: number;
      closingBalance?: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.leaveBalance.upsert({
      where: {
        organizationId_employeeId_leaveTypeId_year: {
          organizationId: data.organizationId,
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          year: data.year,
        },
      },
      create: {
        organizationId: data.organizationId,
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        leavePolicyId: data.leavePolicyId || null,
        year: data.year,
        openingBalance: data.openingBalance ?? 0,
        accrued: data.accrued ?? 0,
        granted: data.granted ?? 0,
        used: data.used ?? 0,
        pending: data.pending ?? 0,
        carryForward: data.carryForward ?? 0,
        encashed: data.encashed ?? 0,
        adjustment: data.adjustment ?? 0,
        closingBalance: data.closingBalance ?? (data.openingBalance ?? 0),
      },
      update: {
        leavePolicyId: data.leavePolicyId !== undefined ? data.leavePolicyId : undefined,
        openingBalance: data.openingBalance !== undefined ? data.openingBalance : undefined,
        accrued: data.accrued !== undefined ? data.accrued : undefined,
        granted: data.granted !== undefined ? data.granted : undefined,
        used: data.used !== undefined ? data.used : undefined,
        pending: data.pending !== undefined ? data.pending : undefined,
        carryForward: data.carryForward !== undefined ? data.carryForward : undefined,
        encashed: data.encashed !== undefined ? data.encashed : undefined,
        adjustment: data.adjustment !== undefined ? data.adjustment : undefined,
        closingBalance: data.closingBalance !== undefined ? data.closingBalance : undefined,
      },
      include: {
        leaveType: true,
        leavePolicy: true,
      },
    });
  }

  async createHistory(
    data: {
      organizationId: string;
      leaveBalanceId: string;
      employeeId: string;
      leaveTypeId: string;
      action: string;
      amount: number;
      previousBalance: number;
      newBalance: number;
      reason?: string | null;
      referenceId?: string | null;
      actorUserId?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.leaveBalanceHistory.create({
      data: {
        organizationId: data.organizationId,
        leaveBalanceId: data.leaveBalanceId,
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        action: data.action,
        amount: data.amount,
        previousBalance: data.previousBalance,
        newBalance: data.newBalance,
        reason: data.reason || null,
        referenceId: data.referenceId || null,
        actorUserId: data.actorUserId || null,
      },
    });
  }

  async getHistoryByEmployee(
    employeeId: string,
    organizationId: string,
    leaveTypeId?: string,
    limit: number = 50,
  ) {
    const where: any = {
      organizationId,
      employeeId,
    };
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;

    return this.prisma.leaveBalanceHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        leaveBalance: {
          include: {
            leaveType: true,
          },
        },
      },
    });
  }

  async listAllBalances(organizationId: string, year: number) {
    return this.prisma.leaveBalance.findMany({
      where: { organizationId, year },
      include: {
        leaveType: true,
        leavePolicy: true,
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
          },
        },
      },
    });
  }
}
