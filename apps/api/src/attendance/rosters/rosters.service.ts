import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RostersRepository } from './rosters.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateRosterInput,
  UpdateRosterInput,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class RostersService {
  constructor(
    private readonly repo: RostersRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(organizationId: string, input: CreateRosterInput, userId: string, ipAddress?: string) {
    const code = input.code || input.name.toUpperCase().replace(/\s+/g, '_');
    const existing = await this.repo.findByCode(organizationId, code);
    if (existing) {
      throw new ConflictException(`Roster with code '${code}' already exists`);
    }

    if (new Date(input.startDate) > new Date(input.endDate)) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    const roster = await this.repo.create(organizationId, { ...input, code });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ROSTER_CREATED,
      entityType: 'roster',
      entityId: roster.id,
      newValues: { code: roster.code, name: roster.name, startDate: roster.startDate, endDate: roster.endDate },
      ipAddress,
    });

    return roster;
  }

  async findById(organizationId: string, id: string) {
    const roster = await this.repo.findById(organizationId, id);
    if (!roster) {
      throw new NotFoundException('Roster not found');
    }
    return roster;
  }

  async findAll(organizationId: string, status?: string) {
    return this.repo.findAll(organizationId, status);
  }

  async update(organizationId: string, id: string, input: UpdateRosterInput, userId: string, ipAddress?: string) {
    await this.findById(organizationId, id);

    if (input.code) {
      const existing = await this.repo.findByCode(organizationId, input.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Roster with code '${input.code}' already exists`);
      }
    }

    if (input.startDate && input.endDate && new Date(input.startDate) > new Date(input.endDate)) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    const updated = await this.repo.update(organizationId, id, input, userId);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: input.status === 'PUBLISHED' ? AuditAction.ROSTER_PUBLISHED : AuditAction.ROSTER_UPDATED,
      entityType: 'roster',
      entityId: updated.id,
      newValues: { code: updated.code, name: updated.name, status: updated.status },
      ipAddress,
    });

    return updated;
  }

  async delete(organizationId: string, id: string, userId: string, ipAddress?: string) {
    const roster = await this.findById(organizationId, id);

    const deleted = await this.repo.delete(organizationId, id);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ROSTER_DELETED,
      entityType: 'roster',
      entityId: id,
      newValues: { code: roster.code, name: roster.name },
      ipAddress,
    });

    return deleted;
  }
}
