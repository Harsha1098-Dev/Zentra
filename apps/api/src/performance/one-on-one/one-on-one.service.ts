import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OneOnOneRepository } from './one-on-one.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class OneOnOneService {
  constructor(
    private readonly repository: OneOnOneRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters: any = {}, userId?: string, roles: string[] = []) {
    if (roles.includes('EMPLOYEE') && !roles.includes('SUPER_ADMIN') && !roles.includes('HR_ADMIN') && !roles.includes('MANAGER')) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) {
        filters.employeeId = emp.id;
      }
    }
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const meeting = await this.repository.findById(id, organizationId);
    if (!meeting) {
      throw new NotFoundException(`1:1 Meeting '${id}' not found`);
    }
    return meeting;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    let employeeId = data.employeeId;
    let managerId = data.managerId;

    if (!employeeId || !managerId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) {
        if (!employeeId) employeeId = emp.id;
        if (!managerId && emp.reportingManagerId) managerId = emp.reportingManagerId;
      }
    }

    if (!employeeId || !managerId) {
      throw new BadRequestException('Both employee and manager must be specified for 1:1 meeting');
    }

    const meeting = await this.repository.create(
      organizationId,
      { ...data, employeeId, managerId },
      userId,
    );

    // Sync action items to tasks module if specified
    if (Array.isArray(data.actionItems) && data.actionItems.length > 0) {
      for (const item of data.actionItems) {
        if (item.title) {
          try {
            await this.prisma.task.create({
              data: {
                organizationId,
                title: item.title,
                description: `Action item from 1:1 meeting on ${new Date(meeting.meetingDate).toLocaleDateString()}`,
                assignedTo: item.assigneeId || employeeId,
                assignedBy: userId,
                status: 'pending',
                priority: 'medium',
              },
            });
          } catch {
            // Non-blocking task creation
          }
        }
      }
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONE_ON_ONE_CREATE,
      resource: 'one_on_one_meetings',
      resourceId: meeting.id,
      details: { employeeId, managerId, meetingDate: meeting.meetingDate },
      ipAddress: ip,
      userAgent: ua,
    });

    return meeting;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONE_ON_ONE_UPDATE,
      resource: 'one_on_one_meetings',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async completeMeeting(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      status: 'COMPLETED',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONE_ON_ONE_COMPLETE,
      resource: 'one_on_one_meetings',
      resourceId: id,
      details: { status: 'COMPLETED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
