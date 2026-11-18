import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AttendancePoliciesRepository } from './attendance-policies.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateAttendancePolicyInput,
  UpdateAttendancePolicyInput,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class AttendancePoliciesService {
  constructor(
    private readonly repo: AttendancePoliciesRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(organizationId: string, input: CreateAttendancePolicyInput, userId: string, ipAddress?: string) {
    const code = input.code || input.name.toUpperCase().replace(/\s+/g, '_');
    const existing = await this.repo.findByCode(organizationId, code);
    if (existing) {
      throw new ConflictException(`Attendance policy with code '${code}' already exists`);
    }

    const policy = await this.repo.create(organizationId, { ...input, code });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ATTENDANCE_POLICY_CREATED,
      entityType: 'attendance_policy',
      entityId: policy.id,
      newValues: { code: policy.code, name: policy.name, mode: policy.mode },
      ipAddress,
    });

    return policy;
  }

  async findById(organizationId: string, id: string) {
    const policy = await this.repo.findById(organizationId, id);
    if (!policy) {
      throw new NotFoundException(`Attendance policy not found`);
    }
    return policy;
  }

  async findAll(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async findDefault(organizationId: string) {
    return this.repo.findDefault(organizationId);
  }

  async update(organizationId: string, id: string, input: UpdateAttendancePolicyInput, userId: string, ipAddress?: string) {
    await this.findById(organizationId, id);

    if (input.code) {
      const existing = await this.repo.findByCode(organizationId, input.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Attendance policy with code '${input.code}' already exists`);
      }
    }

    const updated = await this.repo.update(organizationId, id, input);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ATTENDANCE_POLICY_UPDATED,
      entityType: 'attendance_policy',
      entityId: updated.id,
      newValues: { code: updated.code, name: updated.name },
      ipAddress,
    });

    return updated;
  }

  async delete(organizationId: string, id: string, userId: string, ipAddress?: string) {
    const policy = await this.findById(organizationId, id);

    const deleted = await this.repo.delete(organizationId, id);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ATTENDANCE_POLICY_DELETED,
      entityType: 'attendance_policy',
      entityId: id,
      newValues: { code: policy.code, name: policy.name },
      ipAddress,
    });

    return deleted;
  }
}
