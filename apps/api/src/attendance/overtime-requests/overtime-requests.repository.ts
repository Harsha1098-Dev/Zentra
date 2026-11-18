import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOvertimeRequestInput } from '@zentra/shared-types';

@Injectable()
export class OvertimeRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, employeeId: string, input: CreateOvertimeRequestInput) {
    return this.prisma.overtimeRequest.create({
      data: {
        organizationId,
        employeeId,
        attendanceRecordId: input.attendanceRecordId,
        date: new Date(input.date || input.attendanceDate || Date.now()),
        overtimeMinutes: input.overtimeMinutes,
        overtimeType: (input.overtimeType as string) ?? 'DAILY',
        reason: input.reason || input.overtimeReason || '',
        status: 'PENDING_APPROVAL',
      },
      include: {
        employee: true,
        attendanceRecord: true,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.overtimeRequest.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        attendanceRecord: true,
      },
    });
  }

  async findMany(organizationId: string, filter: { employeeId?: string; status?: string }) {
    return this.prisma.overtimeRequest.findMany({
      where: {
        organizationId,
        ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { name: true } },
          },
        },
        attendanceRecord: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async updateDecision(
    organizationId: string,
    id: string,
    data: {
      status: string;
      approvedBy?: string;
      approvedAt?: Date;
      rejectedBy?: string;
      rejectedAt?: Date;
      rejectionReason?: string;
    },
  ) {
    return this.prisma.overtimeRequest.update({
      where: { id },
      data,
    });
  }
}
