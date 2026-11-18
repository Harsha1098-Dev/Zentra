import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OkrsRepository } from './okrs.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class OkrsService {
  constructor(
    private readonly repository: OkrsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // --- Objectives ---

  async findAllObjectives(organizationId: string, filters: any = {}, userId?: string, roles: string[] = []) {
    if (roles.includes('EMPLOYEE') && !roles.includes('SUPER_ADMIN') && !roles.includes('HR_ADMIN') && !roles.includes('MANAGER')) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) {
        filters.ownerId = emp.id;
      }
    }
    return this.repository.findAllObjectives(organizationId, filters);
  }

  async findObjectiveById(id: string, organizationId: string) {
    const obj = await this.repository.findObjectiveById(id, organizationId);
    if (!obj) {
      throw new NotFoundException(`Objective '${id}' not found`);
    }
    return obj;
  }

  async createObjective(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    if (new Date(data.periodStartDate) > new Date(data.periodEndDate)) {
      throw new BadRequestException('Period start date cannot be after end date');
    }

    if (data.parentObjectiveId) {
      await this.validateParentObjective(data.parentObjectiveId, organizationId);
    }

    const obj = await this.repository.createObjective(organizationId, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OBJECTIVE_CREATE,
      resource: 'objectives',
      resourceId: obj.id,
      details: { title: obj.title, ownerType: obj.ownerType, ownerId: obj.ownerId },
      ipAddress: ip,
      userAgent: ua,
    });

    return obj;
  }

  async updateObjective(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.findObjectiveById(id, organizationId);

    if (data.periodStartDate && data.periodEndDate) {
      if (new Date(data.periodStartDate) > new Date(data.periodEndDate)) {
        throw new BadRequestException('Period start date cannot be after end date');
      }
    }

    if (data.parentObjectiveId) {
      await this.detectCircularObjectiveAlignment(id, data.parentObjectiveId, organizationId);
    }

    const updated = await this.repository.updateObjective(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OBJECTIVE_UPDATE,
      resource: 'objectives',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async alignObjective(
    id: string,
    organizationId: string,
    parentObjectiveId: string,
    alignmentType: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findObjectiveById(id, organizationId);
    await this.detectCircularObjectiveAlignment(id, parentObjectiveId, organizationId);

    const updated = await this.repository.updateObjective(id, organizationId, {
      parentObjectiveId,
      alignmentType,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OBJECTIVE_ALIGN,
      resource: 'objectives',
      resourceId: id,
      details: { parentObjectiveId, alignmentType },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async approveObjective(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findObjectiveById(id, organizationId);
    return this.repository.updateObjective(id, organizationId, { status: 'ACTIVE' });
  }

  async rejectObjective(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findObjectiveById(id, organizationId);
    return this.repository.updateObjective(id, organizationId, { status: 'CLOSED' });
  }

  async deleteObjective(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findObjectiveById(id, organizationId);
    const deleted = await this.repository.softDeleteObjective(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OBJECTIVE_DELETE,
      resource: 'objectives',
      resourceId: id,
      details: { deleted: true },
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  // --- Key Results ---

  async findAllKeyResults(organizationId: string, objectiveId?: string) {
    return this.repository.findAllKeyResults(organizationId, objectiveId);
  }

  async findKeyResultById(id: string, organizationId: string) {
    const kr = await this.repository.findKeyResultById(id, organizationId);
    if (!kr) {
      throw new NotFoundException(`Key result '${id}' not found`);
    }
    return kr;
  }

  async createKeyResult(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const objective = await this.findObjectiveById(data.objectiveId, organizationId);

    const progressPercentage = this.calculateKeyResultProgress(
      data.metricType || 'PERCENTAGE',
      data.startValue ?? 0,
      data.targetValue,
      data.currentValue ?? data.startValue ?? 0,
    );

    const kr = await this.repository.createKeyResult(
      organizationId,
      { ...data, progressPercentage },
      userId,
    );

    // Recalculate parent objective progress
    await this.recalculateObjectiveProgress(objective.id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KEY_RESULT_CREATE,
      resource: 'key_results',
      resourceId: kr.id,
      details: { title: kr.title, objectiveId: kr.objectiveId },
      ipAddress: ip,
      userAgent: ua,
    });

    return kr;
  }

  async updateKeyResult(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.findKeyResultById(id, organizationId);

    let progressPercentage = data.progressPercentage;
    if (progressPercentage === undefined && (data.currentValue !== undefined || data.targetValue !== undefined)) {
      const metricType = data.metricType || existing.metricType;
      const startVal = data.startValue !== undefined ? data.startValue : existing.startValue;
      const targetVal = data.targetValue !== undefined ? data.targetValue : existing.targetValue;
      const currentVal = data.currentValue !== undefined ? data.currentValue : existing.currentValue;

      progressPercentage = this.calculateKeyResultProgress(metricType, startVal, targetVal, currentVal);
    }

    const payload = {
      ...data,
      ...(progressPercentage !== undefined ? { progressPercentage } : {}),
    };

    const updated = await this.repository.updateKeyResult(id, organizationId, payload);

    // Recalculate parent objective progress
    await this.recalculateObjectiveProgress(existing.objectiveId, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KEY_RESULT_UPDATE,
      resource: 'key_results',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async deleteKeyResult(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const existing = await this.findKeyResultById(id, organizationId);
    const deleted = await this.repository.softDeleteKeyResult(id, organizationId);

    await this.recalculateObjectiveProgress(existing.objectiveId, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KEY_RESULT_DELETE,
      resource: 'key_results',
      resourceId: id,
      details: { deleted: true },
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  // --- Helper Progress Calculations ---

  calculateKeyResultProgress(metricType: string, startValue: number, targetValue: number, currentValue: number): number {
    if (metricType === 'BOOLEAN') {
      return currentValue >= 1 ? 100 : 0;
    }
    const range = targetValue - startValue;
    if (range === 0) return 100;

    const raw = ((currentValue - startValue) / range) * 100;
    return Math.min(100, Math.max(0, Math.round(raw)));
  }

  async recalculateObjectiveProgress(objectiveId: string, organizationId: string) {
    const keyResults = await this.prisma.keyResult.findMany({
      where: { objectiveId, organizationId, deletedAt: null },
    });

    if (keyResults.length === 0) {
      await this.prisma.objective.update({
        where: { id: objectiveId },
        data: { progressPercentage: 0 },
      });
      return 0;
    }

    let totalWeightage = 0;
    let weightedProgress = 0;

    for (const kr of keyResults) {
      const weight = kr.weightage > 0 ? kr.weightage : 1;
      totalWeightage += weight;
      weightedProgress += kr.progressPercentage * weight;
    }

    const avg = totalWeightage > 0 ? Math.round(weightedProgress / totalWeightage) : 0;
    const finalProgress = Math.min(100, Math.max(0, avg));

    await this.prisma.objective.update({
      where: { id: objectiveId },
      data: { progressPercentage: finalProgress },
    });

    return finalProgress;
  }

  private async validateParentObjective(parentId: string, organizationId: string) {
    const parent = await this.prisma.objective.findFirst({
      where: { id: parentId, organizationId, deletedAt: null },
    });
    if (!parent) {
      throw new NotFoundException(`Parent objective '${parentId}' not found`);
    }
  }

  private async detectCircularObjectiveAlignment(sourceId: string, targetParentId: string, organizationId: string) {
    if (sourceId === targetParentId) {
      throw new BadRequestException('An objective cannot be aligned to itself');
    }

    await this.validateParentObjective(targetParentId, organizationId);

    let currentId: string | null = targetParentId;
    const visited = new Set<string>([sourceId]);

    while (currentId) {
      if (visited.has(currentId)) {
        throw new BadRequestException('Circular objective alignment detected. Operation rejected');
      }
      visited.add(currentId);

      const parent: any = await this.prisma.objective.findFirst({
        where: { id: currentId, organizationId, deletedAt: null },
        select: { parentObjectiveId: true },
      });

      currentId = parent?.parentObjectiveId || null;
    }
  }
}
