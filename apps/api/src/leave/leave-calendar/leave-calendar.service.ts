import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaveRequestsRepository } from '../leave-requests/leave-requests.repository';
import { EmployeesRepository } from '../../employees/employees.repository';

export interface CalendarEventDto {
  id: string;
  type: 'leave' | 'holiday' | 'weekend';
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  color?: string;
  status?: string;
  employee?: {
    id: string;
    employeeCode?: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string | null;
    departmentName?: string;
  };
  reason?: string;
  leaveTypeName?: string;
  isSelf: boolean;
}

@Injectable()
export class LeaveCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestsRepo: LeaveRequestsRepository,
    private readonly employeesRepo: EmployeesRepository,
  ) {}

  async getCalendarEvents(
    userId: string,
    organizationId: string,
    query: {
      startDate: string;
      endDate: string;
      departmentId?: string;
      locationId?: string;
      scope?: 'me' | 'team' | 'department' | 'all';
    },
    userRoles: string[] = [],
  ): Promise<CalendarEventDto[]> {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    const scope = query.scope || 'all';

    const currentEmployee = await this.employeesRepo.findByUserId(userId, organizationId);
    const isHrOrAdmin = userRoles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r));

    const events: CalendarEventDto[] = [];

    // 1. Fetch holidays
    const holidayWhere: any = {
      organizationId,
      date: { gte: start, lte: end },
    };
    if (query.locationId) {
      holidayWhere.OR = [{ locationId: null }, { locationId: query.locationId }];
    } else if (currentEmployee?.locationId) {
      holidayWhere.OR = [{ locationId: null }, { locationId: currentEmployee.locationId }];
    }

    const holidays = await this.prisma.holiday.findMany({
      where: holidayWhere,
      orderBy: { date: 'asc' },
    });

    for (const h of holidays) {
      const dateStr = h.date.toISOString().slice(0, 10);
      events.push({
        id: `holiday-${h.id}`,
        type: 'holiday',
        title: h.name,
        startDate: dateStr,
        endDate: dateStr,
        isAllDay: true,
        color: '#F59E0B',
        isSelf: false,
      });
    }

    // 2. Fetch leaves according to scope
    let filterOptions: any = {};
    if (scope === 'me' && currentEmployee) {
      filterOptions.employeeId = currentEmployee.id;
    } else if (scope === 'team' && currentEmployee) {
      const team = await this.employeesRepo.getDirectReportees(currentEmployee.id, organizationId);
      const teamIds = [currentEmployee.id, ...team.map((m: any) => m.id)];
      filterOptions.statuses = ['APPROVED', 'PENDING_APPROVAL'];
      // We'll filter in-memory if teamIds specified
    } else if (scope === 'department' && currentEmployee?.departmentId) {
      filterOptions.departmentId = currentEmployee.departmentId;
    } else if (query.departmentId) {
      filterOptions.departmentId = query.departmentId;
    }

    const leaves = await this.requestsRepo.listByDateRange(organizationId, start, end, filterOptions);

    for (const leave of leaves) {
      const isSelf = currentEmployee && leave.employeeId === currentEmployee.id;
      // Sensitive reason hiding: only visible if viewer is employee themselves or HR/Admin
      const visibleReason = isSelf || isHrOrAdmin ? leave.reason : 'On Leave';

      events.push({
        id: `leave-${leave.id}`,
        type: 'leave',
        title: `${leave.employee.firstName} ${leave.employee.lastName} (${leave.leaveType.name})`,
        startDate: leave.fromDate.toISOString().slice(0, 10),
        endDate: leave.toDate.toISOString().slice(0, 10),
        isAllDay: leave.durationType === 'full_day',
        color: leave.leaveType.color || '#3B82F6',
        status: leave.status,
        employee: {
          id: leave.employee.id,
          employeeCode: leave.employee.employeeCode,
          firstName: leave.employee.firstName,
          lastName: leave.employee.lastName,
          profilePhotoUrl: leave.employee.profilePhotoUrl,
          departmentName: leave.employee.department?.name,
        },
        reason: visibleReason,
        leaveTypeName: leave.leaveType.name,
        isSelf: Boolean(isSelf),
      });
    }

    return events;
  }
}
