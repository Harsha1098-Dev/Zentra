import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceRequestInput } from '@zentra/shared-types';

@Injectable()
export class AttendanceRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, employeeId: string, input: CreateAttendanceRequestInput) {
    return this.prisma.attendanceRequest.create({
      data: {
        organizationId,
        employeeId,
        requestType: input.requestType,
        fromDate: new Date(input.fromDate),
        toDate: new Date(input.toDate),
        reason: input.reason,
        status: 'PENDING_APPROVAL',
      },
      include: {
        employee: true,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.attendanceRequest.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
      },
    });
  }

  async findMany(organizationId: string, filter: { employeeId?: string; requestType?: string; status?: string }) {
    return this.prisma.attendanceRequest.findMany({
      where: {
        organizationId,
        ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
        ...(filter.requestType ? { requestType: filter.requestType } : {}),
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
      },
      orderBy: { fromDate: 'desc' },
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
    return this.prisma.attendanceRequest.update({
      where: { id },
      data,
    });
  }
}
