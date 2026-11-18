import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  normalizeDate(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async findByEmployeeAndDate(organizationId: string, employeeId: string, date: Date) {
    const attendanceDate = this.normalizeDate(date);
    return this.prisma.attendanceRecord.findUnique({
      where: {
        organizationId_employeeId_attendanceDate: {
          organizationId,
          employeeId,
          attendanceDate,
        },
      },
      include: {
        shift: true,
        policy: true,
        regularisations: true,
        overtimeRequests: true,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.attendanceRecord.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        shift: true,
        policy: true,
        regularisations: true,
        overtimeRequests: true,
      },
    });
  }

  async upsert(organizationId: string, employeeId: string, attendanceDate: Date, data: any) {
    const normalized = this.normalizeDate(attendanceDate);
    return this.prisma.attendanceRecord.upsert({
      where: {
        organizationId_employeeId_attendanceDate: {
          organizationId,
          employeeId,
          attendanceDate: normalized,
        },
      },
      create: {
        organizationId,
        employeeId,
        attendanceDate: normalized,
        ...data,
      },
      update: data,
      include: {
        employee: true,
        shift: true,
        policy: true,
      },
    });
  }

  async findRecords(
    organizationId: string,
    filter: {
      employeeId?: string;
      departmentId?: string;
      locationId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    },
  ) {
    const where: any = { organizationId };

    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.departmentId || filter.locationId) {
      where.employee = {
        ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
        ...(filter.locationId ? { locationId: filter.locationId } : {}),
      };
    }
    if (filter.startDate || filter.endDate) {
      where.attendanceDate = {
        ...(filter.startDate ? { gte: this.normalizeDate(filter.startDate) } : {}),
        ...(filter.endDate ? { lte: this.normalizeDate(filter.endDate) } : {}),
      };
    }

    return this.prisma.attendanceRecord.findMany({
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
          },
        },
        shift: true,
        policy: true,
      },
      orderBy: [{ attendanceDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async countByStatus(organizationId: string, startDate: Date, endDate: Date, employeeId?: string) {
    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        organizationId,
        ...(employeeId ? { employeeId } : {}),
        attendanceDate: {
          gte: this.normalizeDate(startDate),
          lte: this.normalizeDate(endDate),
        },
      },
      _count: { _all: true },
    });

    return records;
  }
}
