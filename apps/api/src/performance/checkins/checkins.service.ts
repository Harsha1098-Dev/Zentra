import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CheckinsRepository } from './checkins.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class CheckinsService {
  constructor(
    private readonly repository: CheckinsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters: any = {}, userId?: string, roles: string[] = []) {
    if (roles.includes('EMPLOYEE') && !roles.includes('SUPER_ADMIN') && !roles.includes('HR_ADMIN') && !roles.includes('MANAGER')) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) filters.employeeId = emp.id;
    }
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const checkIn = await this.repository.findById(id, organizationId);
    if (!checkIn) {
      throw new NotFoundException(`Check-in '${id}' not found`);
    }
    return checkIn;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    let employeeId = data.employeeId;
    if (!employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (!emp) {
        throw new BadRequestException('No employee record found for user to submit check-in');
      }
      employeeId = emp.id;
    }

    let progressPercentage = data.progressPercentage;

    if (data.keyResultId) {
      const kr = await this.prisma.keyResult.findFirst({
        where: { id: data.keyResultId, organizationId, deletedAt: null },
      });
      if (!kr) {
        throw new NotFoundException(`Key result '${data.keyResultId}' not found`);
      }

      if (progressPercentage === undefined) {
        if (kr.metricType === 'BOOLEAN') {
          progressPercentage = data.currentValue >= 1 ? 100 : 0;
        } else {
          const range = kr.targetValue - kr.startValue;
          progressPercentage = range === 0 ? 100 : Math.min(100, Math.max(0, Math.round(((data.currentValue - kr.startValue) / range) * 100)));
        }
      }

      // Automatically update the Key Result's current value and progress
      await this.prisma.keyResult.update({
        where: { id: kr.id },
        data: {
          currentValue: data.currentValue,
          progressPercentage,
        },
      });

      // Recalculate parent objective
      const keyResults = await this.prisma.keyResult.findMany({
        where: { objectiveId: kr.objectiveId, organizationId, deletedAt: null },
      });
      let totalW = 0;
      let weightedP = 0;
      for (const item of keyResults) {
        const w = item.weightage > 0 ? item.weightage : 1;
        totalW += w;
        weightedP += item.progressPercentage * w;
      }
      const avg = totalW > 0 ? Math.round(weightedP / totalW) : 0;
      await this.prisma.objective.update({
        where: { id: kr.objectiveId },
        data: { progressPercentage: Math.min(100, Math.max(0, avg)) },
      });
    } else if (data.goalId) {
      const goal = await this.prisma.goal.findFirst({
        where: { id: data.goalId, organizationId, deletedAt: null },
      });
      if (!goal) {
        throw new NotFoundException(`Goal '${data.goalId}' not found`);
      }

      if (progressPercentage === undefined) {
        progressPercentage = Math.min(100, Math.max(0, data.currentValue));
      }

      await this.prisma.goal.update({
        where: { id: goal.id },
        data: { progressPercentage },
      });
    }

    if (progressPercentage === undefined) {
      progressPercentage = Math.min(100, Math.max(0, data.currentValue));
    }

    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new BadRequestException('Progress percentage must be between 0 and 100');
    }

    const checkIn = await this.repository.create(
      organizationId,
      {
        ...data,
        employeeId,
        progressPercentage,
      },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CHECK_IN_CREATE,
      resource: 'check_ins',
      resourceId: checkIn.id,
      details: {
        employeeId: checkIn.employeeId,
        keyResultId: checkIn.keyResultId,
        goalId: checkIn.goalId,
        progressPercentage: checkIn.progressPercentage,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return checkIn;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    if (data.progressPercentage !== undefined && (data.progressPercentage < 0 || data.progressPercentage > 100)) {
      throw new BadRequestException('Progress percentage must be between 0 and 100');
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CHECK_IN_UPDATE,
      resource: 'check_ins',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async approveCheckIn(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CHECK_IN_APPROVE,
      resource: 'check_ins',
      resourceId: id,
      details: { status: 'APPROVED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async rejectCheckIn(id: string, organizationId: string, userId: string, reason?: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      status: 'REJECTED',
      rejectionReason: reason || null,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CHECK_IN_REJECT,
      resource: 'check_ins',
      resourceId: id,
      details: { status: 'REJECTED', reason },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
