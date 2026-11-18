import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BadgesRepository } from './badges.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class BadgesService {
  constructor(
    private readonly repository: BadgesRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, isActiveOnly = true) {
    return this.repository.findAll(organizationId, isActiveOnly);
  }

  async findById(organizationId: string, id: string) {
    const badge = await this.repository.findById(organizationId, id);
    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`);
    }
    return badge;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.repository.findByName(organizationId, data.name);
    if (existing) {
      throw new ConflictException(`Badge with name '${data.name}' already exists`);
    }

    const badge = await this.repository.create(organizationId, {
      name: data.name,
      description: data.description,
      category: data.category || 'GENERAL',
      icon: data.icon || 'Award',
      color: data.color || '#1E3A8A',
      pointsAward: data.pointsAward ?? 50,
      isActive: data.isActive ?? true,
    });

    await this.auditService.log({
      action: AuditAction.BADGE_CREATE,
      entityType: 'Badge',
      entityId: badge.id,
      organizationId,
      actorUserId: userId,
      details: { name: badge.name, pointsAward: badge.pointsAward },
      ipAddress,
      userAgent,
    });

    return badge;
  }

  async update(organizationId: string, id: string, data: any) {
    await this.findById(organizationId, id);
    return this.repository.update(organizationId, id, data);
  }

  async delete(organizationId: string, id: string) {
    await this.findById(organizationId, id);
    return this.repository.delete(organizationId, id);
  }

  async findEmployeeBadges(organizationId: string, employeeId: string) {
    return this.repository.findEmployeeBadges(organizationId, employeeId);
  }

  async awardBadge(
    organizationId: string,
    badgeId: string,
    employeeId: string,
    reason?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const badge = await this.findById(organizationId, badgeId);

    const employeeBadge = await this.repository.awardBadge(organizationId, {
      badgeId,
      employeeId,
      reason,
    });

    if (userId) {
      await this.auditService.log({
        action: AuditAction.BADGE_AWARD,
        entityType: 'EmployeeBadge',
        entityId: employeeBadge.id,
        organizationId,
        actorUserId: userId,
        details: { badgeId, badgeName: badge.name, employeeId, reason },
        ipAddress,
        userAgent,
      });
    }

    return employeeBadge;
  }
}
