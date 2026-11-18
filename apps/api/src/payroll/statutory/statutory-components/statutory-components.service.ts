import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { StatutoryComponentsRepository } from './statutory-components.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class StatutoryComponentsService {
  constructor(
    private readonly repository: StatutoryComponentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters: { statutoryType?: string; isActive?: boolean } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const comp = await this.repository.findById(id, organizationId);
    if (!comp) {
      throw new NotFoundException(`Statutory component '${id}' not found`);
    }
    return comp;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.repository.findByCode(organizationId, data.code);
    if (existing) {
      throw new ConflictException(`Statutory component with code '${data.code}' already exists`);
    }

    const created = await this.repository.create(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.STATUTORY_COMPONENT_CREATE,
      resource: 'statutory_components',
      resourceId: created.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return created;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);

    if (data.code) {
      const existing = await this.repository.findByCode(organizationId, data.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Statutory component with code '${data.code}' already exists`);
      }
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.STATUTORY_COMPONENT_UPDATE,
      resource: 'statutory_components',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async toggleActive(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const existing = await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      isActive: !existing.isActive,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: updated.isActive
        ? AuditAction.STATUTORY_COMPONENT_ACTIVATE
        : AuditAction.STATUTORY_COMPONENT_DEACTIVATE,
      resource: 'statutory_components',
      resourceId: updated.id,
      details: { isActive: updated.isActive },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
