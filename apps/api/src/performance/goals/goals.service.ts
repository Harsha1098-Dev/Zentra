import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GoalsRepository } from './goals.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class GoalsService {
  constructor(
    private readonly repository: GoalsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters: any = {}, userId?: string, roles: string[] = []) {
    // If regular employee without admin/manager roles, default to own goals
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
    const goal = await this.repository.findById(id, organizationId);
    if (!goal) {
      throw new NotFoundException(`Goal '${id}' not found`);
    }
    return goal;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    let employeeId = data.employeeId;
    if (!employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (!emp) {
        throw new BadRequestException('No employee record found for user to assign goal');
      }
      employeeId = emp.id;
    }

    // Weightage validation
    if (data.weightage !== undefined && (data.weightage < 0 || data.weightage > 100)) {
      throw new BadRequestException('Goal weightage must be between 0 and 100');
    }

    // Duplicate check for same employee and period
    const startDate = new Date(data.startDate);
    const dueDate = new Date(data.dueDate);
    const duplicate = await this.repository.findDuplicate(
      organizationId,
      employeeId,
      data.title,
      startDate,
      dueDate,
    );
    if (duplicate) {
      throw new BadRequestException(
        `A goal with title '${data.title}' already exists for this employee in the specified period`,
      );
    }

    // Alignment verification
    if (data.alignedGoalId) {
      await this.validateAlignment(data.alignedGoalId, organizationId);
    }

    const payload = {
      ...data,
      employeeId,
      status: data.status || 'ACTIVE',
    };

    const goal = await this.repository.create(organizationId, payload, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.GOAL_CREATE,
      resource: 'goals',
      resourceId: goal.id,
      details: { title: goal.title, employeeId: goal.employeeId, goalType: goal.goalType },
      ipAddress: ip,
      userAgent: ua,
    });

    return goal;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.findById(id, organizationId);

    if (data.weightage !== undefined && (data.weightage < 0 || data.weightage > 100)) {
      throw new BadRequestException('Goal weightage must be between 0 and 100');
    }

    if (data.progressPercentage !== undefined && (data.progressPercentage < 0 || data.progressPercentage > 100)) {
      throw new BadRequestException('Progress percentage must be between 0 and 100');
    }

    if (data.title || data.startDate || data.dueDate) {
      const title = data.title || existing.title;
      const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
      const dueDate = data.dueDate ? new Date(data.dueDate) : existing.dueDate;

      const duplicate = await this.repository.findDuplicate(
        organizationId,
        existing.employeeId,
        title,
        startDate,
        dueDate,
        id,
      );
      if (duplicate) {
        throw new BadRequestException(
          `A goal with title '${title}' already exists for this employee in the specified period`,
        );
      }
    }

    if (data.alignedGoalId) {
      await this.detectCircularAlignment(id, data.alignedGoalId, organizationId);
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.GOAL_UPDATE,
      resource: 'goals',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async alignGoal(
    id: string,
    organizationId: string,
    alignedGoalId: string,
    alignmentType: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findById(id, organizationId);
    await this.detectCircularAlignment(id, alignedGoalId, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      alignedGoalId,
      alignmentType,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.GOAL_ALIGN,
      resource: 'goals',
      resourceId: id,
      details: { alignedGoalId, alignmentType },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async approveGoal(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      status: 'ACTIVE',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.GOAL_APPROVE,
      resource: 'goals',
      resourceId: id,
      details: { status: 'ACTIVE' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async rejectGoal(id: string, organizationId: string, userId: string, reason?: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      status: 'CANCELLED',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.GOAL_REJECT,
      resource: 'goals',
      resourceId: id,
      details: { status: 'CANCELLED', reason },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async delete(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const deleted = await this.repository.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.GOAL_DELETE,
      resource: 'goals',
      resourceId: id,
      details: { deleted: true },
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  private async validateAlignment(targetGoalId: string, organizationId: string) {
    const target = await this.prisma.goal.findFirst({
      where: { id: targetGoalId, organizationId, deletedAt: null },
    });
    if (!target) {
      throw new NotFoundException(`Target goal for alignment '${targetGoalId}' not found`);
    }
    if (target.status !== 'ACTIVE' && target.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Cannot align with target goal in status '${target.status}'. Target must be ACTIVE or IN_PROGRESS`,
      );
    }
  }

  private async detectCircularAlignment(sourceGoalId: string, targetGoalId: string, organizationId: string) {
    if (sourceGoalId === targetGoalId) {
      throw new BadRequestException('A goal cannot be aligned to itself');
    }

    await this.validateAlignment(targetGoalId, organizationId);

    // Follow the alignment chain from targetGoalId upwards
    let currentId: string | null = targetGoalId;
    const visited = new Set<string>([sourceGoalId]);

    while (currentId) {
      if (visited.has(currentId)) {
        throw new BadRequestException('Circular goal alignment detected. Operation rejected');
      }
      visited.add(currentId);

      const parent: any = await this.prisma.goal.findFirst({
        where: { id: currentId, organizationId, deletedAt: null },
        select: { alignedGoalId: true },
      });

      currentId = parent?.alignedGoalId || null;
    }
  }
}
