import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ShiftsRepository } from './shifts.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateShiftInput,
  UpdateShiftInput,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly repo: ShiftsRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(organizationId: string, input: CreateShiftInput, userId: string, ipAddress?: string) {
    const existing = await this.repo.findByCode(organizationId, input.code);
    if (existing) {
      throw new ConflictException(`Shift with code '${input.code}' already exists`);
    }

    // Auto-detect overnight if start time > end time
    let isOvernight = input.isOvernight;
    if (isOvernight === undefined) {
      isOvernight = input.startTime > input.endTime;
    }

    const shift = await this.repo.create(organizationId, {
      ...input,
      isOvernight,
    });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SHIFT_CREATED,
      entityType: 'shift',
      entityId: shift.id,
      newValues: { code: shift.code, name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
      ipAddress,
    });

    return shift;
  }

  async findById(organizationId: string, id: string) {
    const shift = await this.repo.findById(organizationId, id);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async findAll(organizationId: string, status?: string) {
    return this.repo.findAll(organizationId, status);
  }

  async findDefault(organizationId: string) {
    return this.repo.findDefault(organizationId);
  }

  async update(organizationId: string, id: string, input: UpdateShiftInput, userId: string, ipAddress?: string) {
    const current = await this.findById(organizationId, id);

    if (input.code) {
      const existing = await this.repo.findByCode(organizationId, input.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Shift with code '${input.code}' already exists`);
      }
    }

    let isOvernight = input.isOvernight;
    if (isOvernight === undefined && (input.startTime || input.endTime)) {
      const start = input.startTime ?? current.startTime;
      const end = input.endTime ?? current.endTime;
      isOvernight = start > end;
    }

    const updated = await this.repo.update(organizationId, id, {
      ...input,
      ...(isOvernight !== undefined ? { isOvernight } : {}),
    });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SHIFT_UPDATED,
      entityType: 'shift',
      entityId: updated.id,
      newValues: { code: updated.code, name: updated.name },
      ipAddress,
    });

    return updated;
  }

  async delete(organizationId: string, id: string, userId: string, ipAddress?: string) {
    const shift = await this.findById(organizationId, id);

    const deleted = await this.repo.delete(organizationId, id);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SHIFT_DELETED,
      entityType: 'shift',
      entityId: id,
      newValues: { code: shift.code, name: shift.name },
      ipAddress,
    });

    return deleted;
  }
}
