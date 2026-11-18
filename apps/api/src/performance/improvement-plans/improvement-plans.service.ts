import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ImprovementPlansRepository } from './improvement-plans.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class ImprovementPlansService {
  constructor(
    private readonly repository: ImprovementPlansRepository,
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
    const plan = await this.repository.findById(id, organizationId);
    if (!plan) {
      throw new NotFoundException(`Improvement plan '${id}' not found`);
    }
    return plan;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    let managerId = data.managerId;
    if (!managerId) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: data.employeeId, organizationId, deletedAt: null },
      });
      if (emp && emp.reportingManagerId) {
        managerId = emp.reportingManagerId;
      } else {
        const mgrUser = await this.prisma.employee.findFirst({
          where: { organizationId, userId, deletedAt: null },
        });
        if (mgrUser) managerId = mgrUser.id;
      }
    }

    if (!managerId) {
      throw new BadRequestException('Manager must be assigned to the improvement plan');
    }

    const plan = await this.repository.create(
      organizationId,
      { ...data, managerId },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.IMPROVEMENT_PLAN_CREATE,
      resource: 'improvement_plans',
      resourceId: plan.id,
      details: { title: plan.title, employeeId: plan.employeeId, managerId },
      ipAddress: ip,
      userAgent: ua,
    });

    return plan;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.IMPROVEMENT_PLAN_UPDATE,
      resource: 'improvement_plans',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async complete(id: string, organizationId: string, status: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const finalStatus = status === 'FAILED' ? 'FAILED' : 'COMPLETED';

    const updated = await this.repository.update(id, organizationId, {
      status: finalStatus,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.IMPROVEMENT_PLAN_COMPLETE,
      resource: 'improvement_plans',
      resourceId: id,
      details: { status: finalStatus },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
