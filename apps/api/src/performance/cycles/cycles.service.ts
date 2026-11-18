import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CyclesRepository } from './cycles.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class CyclesService {
  constructor(
    private readonly repository: CyclesRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async findById(id: string, organizationId: string) {
    const cycle = await this.repository.findById(id, organizationId);
    if (!cycle) {
      throw new NotFoundException(`Performance cycle '${id}' not found`);
    }
    return cycle;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.repository.findByName(data.name, organizationId);
    if (existing) {
      throw new BadRequestException(`Performance cycle with name '${data.name}' already exists`);
    }

    const cycle = await this.repository.create(organizationId, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PERFORMANCE_CYCLE_CREATE,
      resource: 'performance_cycles',
      resourceId: cycle.id,
      details: { name: cycle.name, cycleType: cycle.cycleType },
      ipAddress: ip,
      userAgent: ua,
    });

    return cycle;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    if (data.name) {
      const existing = await this.repository.findByName(data.name, organizationId);
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Performance cycle with name '${data.name}' already exists`);
      }
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PERFORMANCE_CYCLE_UPDATE,
      resource: 'performance_cycles',
      resourceId: updated.id,
      details: data,
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
      action: AuditAction.PERFORMANCE_CYCLE_UPDATE,
      resource: 'performance_cycles',
      resourceId: id,
      details: { deleted: true },
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  async startCycle(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const cycle = await this.findById(id, organizationId);
    if (cycle.status !== 'DRAFT' && cycle.status !== 'ACTIVE') {
      throw new BadRequestException(`Cycle cannot be started from status '${cycle.status}'`);
    }

    // Auto-create appraisal assignments for active employees
    const employees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'ON_PROBATION'] },
        deletedAt: null,
      },
    });

    let template = await this.prisma.appraisalTemplate.findFirst({
      where: { organizationId, isDefault: true, deletedAt: null },
    });

    if (!template) {
      template = await this.prisma.appraisalTemplate.findFirst({
        where: { organizationId, deletedAt: null },
      });
    }

    if (!template) {
      // Create a default appraisal template if none exists
      template = await this.prisma.appraisalTemplate.create({
        data: {
          organizationId,
          name: 'Standard Annual Appraisal Template',
          description: 'Default template with objectives, goals, and core values',
          appraisalType: 'ANNUAL',
          sections: [
            { name: 'Goals & Objectives', weight: 40 },
            { name: 'Core Competencies', weight: 30 },
            { name: 'Values & Culture', weight: 30 },
          ],
          questions: [
            { id: 'q1', section: 'Goals & Objectives', question: 'How effectively did the employee accomplish key goals?' },
            { id: 'q2', section: 'Core Competencies', question: 'How would you rate the employee technical and functional skills?' },
            { id: 'q3', section: 'Values & Culture', question: 'How consistently did the employee demonstrate teamwork and ownership?' },
          ],
          isDefault: true,
          status: 'ACTIVE',
          createdBy: userId,
        },
      });
    }

    for (const emp of employees) {
      const existing = await this.prisma.appraisalAssignment.findUnique({
        where: {
          performanceCycleId_employeeId: {
            performanceCycleId: id,
            employeeId: emp.id,
          },
        },
      });

      if (!existing) {
        await this.prisma.appraisalAssignment.create({
          data: {
            organizationId,
            performanceCycleId: id,
            employeeId: emp.id,
            appraisalTemplateId: template.id,
            reportingManagerId: emp.reportingManagerId,
            reviewerId: emp.reportingManagerId,
            status: 'IN_PROGRESS',
            selfReviewStatus: 'NOT_STARTED',
            managerReviewStatus: 'NOT_STARTED',
          },
        });
      }
    }

    const updated = await this.repository.update(id, organizationId, {
      status: 'IN_PROGRESS',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PERFORMANCE_CYCLE_START,
      resource: 'performance_cycles',
      resourceId: id,
      details: { employeeCount: employees.length, templateId: template.id },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async publishCycle(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);

    // Update all assignments in this cycle to PUBLISHED
    await this.prisma.appraisalAssignment.updateMany({
      where: {
        performanceCycleId: id,
        organizationId,
      },
      data: {
        status: 'PUBLISHED',
      },
    });

    const updated = await this.repository.update(id, organizationId, {
      status: 'PUBLISHED',
      publishDate: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PERFORMANCE_CYCLE_PUBLISH,
      resource: 'performance_cycles',
      resourceId: id,
      details: { status: 'PUBLISHED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async closeCycle(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);

    await this.prisma.appraisalAssignment.updateMany({
      where: {
        performanceCycleId: id,
        organizationId,
      },
      data: {
        status: 'CLOSED',
      },
    });

    const updated = await this.repository.update(id, organizationId, {
      status: 'CLOSED',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PERFORMANCE_CYCLE_CLOSE,
      resource: 'performance_cycles',
      resourceId: id,
      details: { status: 'CLOSED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
