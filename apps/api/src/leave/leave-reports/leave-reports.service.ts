import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { LeaveBalancesService } from '../leave-balances/leave-balances.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class LeaveReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesRepo: EmployeesRepository,
    private readonly balancesService: LeaveBalancesService,
    private readonly auditService: AuditService,
  ) {}

  async getMySummary(userId: string, organizationId: string, year: number) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    const balances = await this.balancesService.getBalancesForEmployee(employee.id, year, organizationId);

    const totalOpening = balances.reduce((sum, b) => sum + b.openingBalance, 0);
    const totalGranted = balances.reduce((sum, b) => sum + b.granted + b.accrued + b.carryForward + b.adjustment, 0);
    const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
    const totalPending = balances.reduce((sum, b) => sum + b.pending, 0);
    const totalAvailable = balances.reduce((sum, b) => sum + b.availableBalance, 0);

    const upcomingLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        employeeId: employee.id,
        fromDate: { gte: new Date() },
        status: { in: ['APPROVED', 'PENDING_APPROVAL'] },
      },
      include: { leaveType: true },
      orderBy: { fromDate: 'asc' },
      take: 5,
    });

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        department: employee.department?.name,
      },
      year,
      totals: {
        totalOpening,
        totalGranted,
        totalUsed,
        totalPending,
        totalAvailable,
      },
      balances,
      upcomingLeaves: upcomingLeaves.map((l) => ({
        id: l.id,
        leaveTypeName: l.leaveType.name,
        fromDate: l.fromDate.toISOString().slice(0, 10),
        toDate: l.toDate.toISOString().slice(0, 10),
        numberOfDays: Number(l.numberOfDays),
        status: l.status,
      })),
    };
  }

  async getTeamSummary(userId: string, organizationId: string, year: number) {
    const manager = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!manager) {
      throw new NotFoundException('Manager profile not found for current user');
    }

    const teamReports = await this.employeesRepo.getDirectReportees(manager.id, organizationId);

    const membersSummary = await Promise.all(
      teamReports.map(async (emp: any) => {
        const balances = await this.balancesService.getBalancesForEmployee(emp.id, year, organizationId);
        const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
        const totalAvailable = balances.reduce((sum, b) => sum + b.availableBalance, 0);
        const totalPending = balances.reduce((sum, b) => sum + b.pending, 0);

        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          department: emp.department?.name,
          designation: emp.designation?.name,
          totalUsed,
          totalPending,
          totalAvailable,
          balances,
        };
      }),
    );

    return {
      managerId: manager.id,
      year,
      totalTeamMembers: teamReports.length,
      members: membersSummary,
    };
  }

  async getDepartmentSummary(organizationId: string, year: number) {
    const departments = await this.prisma.department.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const employees = await this.prisma.employee.findMany({
          where: { organizationId, departmentId: dept.id, deletedAt: null },
          select: { id: true },
        });

        const employeeIds = employees.map((e) => e.id);
        if (employeeIds.length === 0) {
          return {
            departmentId: dept.id,
            departmentName: dept.name,
            totalEmployees: 0,
            totalUsed: 0,
            totalPending: 0,
            totalAvailable: 0,
          };
        }

        const balances = await this.prisma.leaveBalance.findMany({
          where: {
            organizationId,
            employeeId: { in: employeeIds },
            year,
          },
        });

        let totalUsed = 0;
        let totalPending = 0;
        let totalAvailable = 0;

        for (const b of balances) {
          const used = Number(b.used);
          const pending = Number(b.pending);
          const avail =
            Number(b.openingBalance) +
            Number(b.accrued) +
            Number(b.granted) +
            Number(b.carryForward) +
            Number(b.adjustment) -
            used -
            pending -
            Number(b.encashed);

          totalUsed += used;
          totalPending += pending;
          totalAvailable += avail;
        }

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalEmployees: employeeIds.length,
          totalUsed: Number(totalUsed.toFixed(2)),
          totalPending: Number(totalPending.toFixed(2)),
          totalAvailable: Number(totalAvailable.toFixed(2)),
        };
      }),
    );

    return {
      year,
      departments: departmentStats,
    };
  }

  async getOrganizationSummary(organizationId: string, year: number) {
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const typeStats = await Promise.all(
      leaveTypes.map(async (type) => {
        const balances = await this.prisma.leaveBalance.findMany({
          where: {
            organizationId,
            leaveTypeId: type.id,
            year,
          },
        });

        let totalAllocated = 0;
        let totalUsed = 0;
        let totalPending = 0;
        let totalAvailable = 0;

        for (const b of balances) {
          const alloc =
            Number(b.openingBalance) +
            Number(b.accrued) +
            Number(b.granted) +
            Number(b.carryForward) +
            Number(b.adjustment);
          const used = Number(b.used);
          const pending = Number(b.pending);
          const avail = alloc - used - pending - Number(b.encashed);

          totalAllocated += alloc;
          totalUsed += used;
          totalPending += pending;
          totalAvailable += avail;
        }

        return {
          leaveTypeId: type.id,
          leaveTypeName: type.name,
          category: type.category,
          isPaid: type.isPaid,
          color: type.color,
          totalEmployees: balances.length,
          totalAllocated: Number(totalAllocated.toFixed(2)),
          totalUsed: Number(totalUsed.toFixed(2)),
          totalPending: Number(totalPending.toFixed(2)),
          totalAvailable: Number(totalAvailable.toFixed(2)),
        };
      }),
    );

    const totalRequests = await this.prisma.leaveRequest.count({
      where: {
        organizationId,
        fromDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
    });

    return {
      year,
      totalRequests,
      leaveTypes: typeStats,
    };
  }

  async exportReportCsv(
    organizationId: string,
    type: 'balances' | 'requests',
    year: number,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    let csvData = '';
    let rowCount = 0;

    if (type === 'balances') {
      const balances = await this.prisma.leaveBalance.findMany({
        where: { organizationId, year },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
          leaveType: true,
        },
        orderBy: [{ employee: { employeeCode: 'asc' } }, { leaveType: { name: 'asc' } }],
      });

      rowCount = balances.length;
      csvData =
        'Employee ID,Employee Name,Department,Designation,Leave Type,Year,Opening,Accrued,Granted,Carry Forward,Adjustment,Used,Pending,Available,Closing\n';

      for (const b of balances) {
        const empName = `"${b.employee.firstName} ${b.employee.lastName}"`;
        const dept = `"${b.employee.department?.name || ''}"`;
        const desig = `"${b.employee.designation?.name || ''}"`;
        const leaveTypeName = `"${b.leaveType.name}"`;

        const opening = Number(b.openingBalance);
        const accrued = Number(b.accrued);
        const granted = Number(b.granted);
        const cf = Number(b.carryForward);
        const adj = Number(b.adjustment);
        const used = Number(b.used);
        const pending = Number(b.pending);
        const encashed = Number(b.encashed);
        const avail = opening + accrued + granted + cf + adj - used - pending - encashed;
        const closing = opening + accrued + granted + cf + adj - used - encashed;

        csvData += `${b.employee.employeeCode},${empName},${dept},${desig},${leaveTypeName},${b.year},${opening},${accrued},${granted},${cf},${adj},${used},${pending},${avail},${closing}\n`;
      }
    } else {
      const requests = await this.prisma.leaveRequest.findMany({
        where: {
          organizationId,
          fromDate: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
          leaveType: true,
        },
        orderBy: { appliedOn: 'desc' },
      });

      rowCount = requests.length;
      csvData =
        'Request ID,Employee ID,Employee Name,Department,Leave Type,From Date,To Date,Days,Duration Type,Status,Applied On,Reason\n';

      for (const r of requests) {
        const empName = `"${r.employee.firstName} ${r.employee.lastName}"`;
        const dept = `"${r.employee.department?.name || ''}"`;
        const leaveTypeName = `"${r.leaveType.name}"`;
        const reason = `"${(r.reason || '').replace(/"/g, '""')}"`;

        csvData += `${r.id},${r.employee.employeeCode},${empName},${dept},${leaveTypeName},${r.fromDate.toISOString().slice(0, 10)},${r.toDate.toISOString().slice(0, 10)},${Number(r.numberOfDays)},${r.durationType},${r.status},${r.appliedOn.toISOString().slice(0, 10)},${reason}\n`;
      }
    }

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_REPORT_EXPORT,
      entityType: 'LeaveReport',
      entityId: `${type}-${year}`,
      newValues: {
        reportType: type,
        year,
        rowsExported: rowCount,
      },
      ipAddress,
      userAgent,
    });

    return csvData;
  }
}
