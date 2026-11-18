import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { AttendanceRecordsRepository } from '../attendance-records/attendance-records.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, AttendanceStatus } from '@zentra/shared-types';

@Injectable()
export class AttendanceReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesRepo: EmployeesRepository,
    private readonly recordsRepo: AttendanceRecordsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getMyReport(userId: string, organizationId: string, startDate?: string, endDate?: string) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee record not found for current user');
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const records = await this.recordsRepo.findRecords(organizationId, {
      employeeId: employee.id,
      startDate: start,
      endDate: end,
    });

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode,
        department: employee.department?.name,
      },
      period: { startDate: start, endDate: end },
      totalRecords: records.length,
      records,
    };
  }

  async getTeamReport(userId: string, organizationId: string, startDate?: string, endDate?: string) {
    const manager = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!manager) {
      throw new NotFoundException('Manager employee profile not found');
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const reportees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        reportingManagerId: manager.id,
        deletedAt: null,
      },
      select: { id: true, employeeCode: true, firstName: true, lastName: true },
    });

    const reporteeIds = reportees.map((r) => r.id);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        employeeId: { in: reporteeIds },
        attendanceDate: {
          gte: this.recordsRepo.normalizeDate(start),
          lte: this.recordsRepo.normalizeDate(end),
        },
      },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
        shift: true,
      },
      orderBy: [{ attendanceDate: 'desc' }, { employeeId: 'asc' }],
    });

    return {
      manager: { id: manager.id, name: `${manager.firstName} ${manager.lastName}` },
      period: { startDate: start, endDate: end },
      teamSize: reportees.length,
      records,
    };
  }

  async getOrganizationReport(organizationId: string, filter: any) {
    const start = filter.startDate ? new Date(filter.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filter.endDate ? new Date(filter.endDate) : new Date();

    const records = await this.recordsRepo.findRecords(organizationId, {
      departmentId: filter.departmentId,
      locationId: filter.locationId,
      startDate: start,
      endDate: end,
      status: filter.status,
    });

    return {
      period: { startDate: start, endDate: end },
      totalRecords: records.length,
      records,
    };
  }

  async getLateArrivalsReport(organizationId: string, filter: any) {
    const start = filter.startDate ? new Date(filter.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filter.endDate ? new Date(filter.endDate) : new Date();

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        isLate: true,
        attendanceDate: {
          gte: this.recordsRepo.normalizeDate(start),
          lte: this.recordsRepo.normalizeDate(end),
        },
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
        shift: true,
      },
      orderBy: [{ attendanceDate: 'desc' }, { lateMinutes: 'desc' }],
    });

    return {
      period: { startDate: start, endDate: end },
      totalCount: records.length,
      records,
    };
  }

  async getEarlyDeparturesReport(organizationId: string, filter: any) {
    const start = filter.startDate ? new Date(filter.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filter.endDate ? new Date(filter.endDate) : new Date();

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        isEarlyExit: true,
        attendanceDate: {
          gte: this.recordsRepo.normalizeDate(start),
          lte: this.recordsRepo.normalizeDate(end),
        },
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
        shift: true,
      },
      orderBy: [{ attendanceDate: 'desc' }, { earlyMinutes: 'desc' }],
    });

    return {
      period: { startDate: start, endDate: end },
      totalCount: records.length,
      records,
    };
  }

  async getOvertimeReport(organizationId: string, filter: any) {
    const start = filter.startDate ? new Date(filter.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filter.endDate ? new Date(filter.endDate) : new Date();

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        overtimeMinutes: { gt: 0 },
        attendanceDate: {
          gte: this.recordsRepo.normalizeDate(start),
          lte: this.recordsRepo.normalizeDate(end),
        },
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
        shift: true,
        overtimeRequests: true,
      },
      orderBy: [{ attendanceDate: 'desc' }, { overtimeMinutes: 'desc' }],
    });

    return {
      period: { startDate: start, endDate: end },
      totalCount: records.length,
      records,
    };
  }

  async getExceptionsReport(organizationId: string, filter: any) {
    const start = filter.startDate ? new Date(filter.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filter.endDate ? new Date(filter.endDate) : new Date();

    // Exceptions: checked in but no checkout, or late / early exit / regularised
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        attendanceDate: {
          gte: this.recordsRepo.normalizeDate(start),
          lte: this.recordsRepo.normalizeDate(end),
        },
        OR: [
          { checkInTime: { not: null }, checkOutTime: null },
          { isLate: true },
          { isEarlyExit: true },
          { isRegularised: true },
        ],
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
        shift: true,
      },
      orderBy: [{ attendanceDate: 'desc' }],
    });

    return {
      period: { startDate: start, endDate: end },
      totalCount: records.length,
      records,
    };
  }

  async exportCsv(
    organizationId: string,
    reportType: string,
    filter: any,
    userId: string,
    ipAddress?: string,
  ): Promise<string> {
    let records: any[] = [];

    switch (reportType) {
      case 'late': {
        const res = await this.getLateArrivalsReport(organizationId, filter);
        records = res.records;
        break;
      }
      case 'early': {
        const res = await this.getEarlyDeparturesReport(organizationId, filter);
        records = res.records;
        break;
      }
      case 'overtime': {
        const res = await this.getOvertimeReport(organizationId, filter);
        records = res.records;
        break;
      }
      case 'exceptions': {
        const res = await this.getExceptionsReport(organizationId, filter);
        records = res.records;
        break;
      }
      default: {
        const res = await this.getOrganizationReport(organizationId, filter);
        records = res.records;
        break;
      }
    }

    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Date',
      'Status',
      'Shift',
      'Check In',
      'Check Out',
      'Worked Hours',
      'Break Minutes',
      'Late Minutes',
      'Early Minutes',
      'Overtime Hours',
      'Is Regularised',
      'Is Locked',
    ];

    const rows = records.map((r) => [
      r.employee?.employeeCode ?? '',
      `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim(),
      r.employee?.department?.name ?? '',
      r.attendanceDate ? new Date(r.attendanceDate).toISOString().slice(0, 10) : '',
      r.status,
      r.shift?.name ?? '',
      r.checkInTime ? new Date(r.checkInTime).toISOString().slice(11, 19) : '',
      r.checkOutTime ? new Date(r.checkOutTime).toISOString().slice(11, 19) : '',
      (r.workedMinutes / 60).toFixed(2),
      r.breakMinutes,
      r.lateMinutes,
      r.earlyMinutes,
      (r.overtimeMinutes / 60).toFixed(2),
      r.isRegularised ? 'Yes' : 'No',
      r.isLocked ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ATTENDANCE_REPORT_EXPORTED,
      entityType: 'attendance_report',
      entityId: reportType,
      newValues: { reportType, rowCount: rows.length, filter },
      ipAddress,
    });

    return csvContent;
  }
}
