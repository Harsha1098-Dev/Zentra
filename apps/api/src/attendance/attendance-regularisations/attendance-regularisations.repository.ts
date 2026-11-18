import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceRegularisationInput } from '@zentra/shared-types';

@Injectable()
export class AttendanceRegularisationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, employeeId: string, input: CreateAttendanceRegularisationInput) {
    return this.prisma.attendanceRegularisation.create({
      data: {
        organizationId,
        employeeId,
        attendanceRecordId: input.attendanceRecordId || '',
        requestedCheckIn: (input.requestedCheckIn || input.requestedCheckInTime) ? new Date(input.requestedCheckIn || input.requestedCheckInTime!) : null,
        requestedCheckOut: (input.requestedCheckOut || input.requestedCheckOutTime) ? new Date(input.requestedCheckOut || input.requestedCheckOutTime!) : null,
        reason: input.reason,
        explanation: input.explanation || input.description || '',
        status: 'PENDING_APPROVAL',
      },
      include: {
        attendanceRecord: true,
        employee: true,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.attendanceRegularisation.findFirst({
      where: { id, organizationId },
      include: {
        attendanceRecord: {
          include: {
            shift: true,
            policy: true,
          },
        },
        employee: true,
      },
    });
  }

  async countMonthlyByEmployee(organizationId: string, employeeId: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

    return this.prisma.attendanceRegularisation.count({
      where: {
        organizationId,
        employeeId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  async findMany(organizationId: string, filter: { employeeId?: string; status?: string }) {
    return this.prisma.attendanceRegularisation.findMany({
      where: {
        organizationId,
        ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      include: {
        attendanceRecord: true,
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
      },
      orderBy: { createdAt: 'desc' },
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
    return this.prisma.attendanceRegularisation.update({
      where: { id },
      data,
    });
  }
}
