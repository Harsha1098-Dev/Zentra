import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { LeaveTypesRepository } from './leave-types.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  LeaveTypeQueryFilterInput,
  LeaveTypeDto,
  LeaveCategory,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class LeaveTypesService {
  constructor(
    private readonly leaveTypesRepo: LeaveTypesRepository,
    private readonly auditService: AuditService,
  ) {}

  async createLeaveType(
    organizationId: string,
    input: CreateLeaveTypeInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveTypeDto> {
    const existingCode = await this.leaveTypesRepo.findByCode(input.code, organizationId);
    if (existingCode) {
      throw new ConflictException(`Leave type with code "${input.code}" already exists in this organization`);
    }

    const existingName = await this.leaveTypesRepo.findByName(input.name, organizationId);
    if (existingName) {
      throw new ConflictException(`Leave type with name "${input.name}" already exists in this organization`);
    }

    const created = await this.leaveTypesRepo.create({
      organizationId,
      ...input,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_TYPE_CREATE,
      entityType: 'LeaveType',
      entityId: created.id,
      newValues: {
        name: created.name,
        code: created.code,
        category: created.category,
        isPaid: created.isPaid,
      },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(created);
  }

  async getLeaveTypes(
    organizationId: string,
    filter: LeaveTypeQueryFilterInput,
  ) {
    const result = await this.leaveTypesRepo.list(organizationId, filter);
    return {
      ...result,
      data: result.data.map((item) => this.mapToDto(item)),
    };
  }

  async getLeaveTypeById(id: string, organizationId: string): Promise<LeaveTypeDto> {
    const item = await this.leaveTypesRepo.findById(id, organizationId);
    if (!item) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }
    return this.mapToDto(item);
  }

  async updateLeaveType(
    id: string,
    organizationId: string,
    input: UpdateLeaveTypeInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveTypeDto> {
    const existing = await this.leaveTypesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }

    if (input.code && input.code.toUpperCase() !== existing.code) {
      const codeCheck = await this.leaveTypesRepo.findByCode(input.code, organizationId);
      if (codeCheck && codeCheck.id !== id) {
        throw new ConflictException(`Leave type with code "${input.code}" already exists`);
      }
    }

    if (input.name && input.name !== existing.name) {
      const nameCheck = await this.leaveTypesRepo.findByName(input.name, organizationId);
      if (nameCheck && nameCheck.id !== id) {
        throw new ConflictException(`Leave type with name "${input.name}" already exists`);
      }
    }

    const updated = await this.leaveTypesRepo.update(id, organizationId, input);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_TYPE_UPDATE,
      entityType: 'LeaveType',
      entityId: id,
      oldValues: { name: existing.name, code: existing.code, isActive: existing.isActive },
      newValues: { name: updated.name, code: updated.code, isActive: updated.isActive },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async activateLeaveType(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveTypeDto> {
    const existing = await this.leaveTypesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }

    const updated = await this.leaveTypesRepo.update(id, organizationId, { isActive: true });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_TYPE_ACTIVATE,
      entityType: 'LeaveType',
      entityId: id,
      newValues: { isActive: true },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deactivateLeaveType(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveTypeDto> {
    const existing = await this.leaveTypesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }

    const updated = await this.leaveTypesRepo.update(id, organizationId, { isActive: false });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_TYPE_DEACTIVATE,
      entityType: 'LeaveType',
      entityId: id,
      newValues: { isActive: false },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deleteLeaveType(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const existing = await this.leaveTypesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }

    const hasRecords = await this.leaveTypesRepo.hasAssociatedRecords(id, organizationId);
    if (hasRecords) {
      throw new BadRequestException(
        'Cannot delete leave type because leave requests or balances exist for it. Please deactivate the leave type instead.',
      );
    }

    await this.leaveTypesRepo.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_TYPE_DELETE,
      entityType: 'LeaveType',
      entityId: id,
      oldValues: { name: existing.name, code: existing.code },
      ipAddress,
      userAgent,
    });
  }

  private mapToDto(entity: any): LeaveTypeDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      code: entity.code,
      description: entity.description,
      category: entity.category as LeaveCategory,
      isPaid: entity.isPaid,
      isActive: entity.isActive,
      color: entity.color,
      icon: entity.icon,
      requiresAttachment: entity.requiresAttachment,
      attachmentRequiredDays: entity.attachmentRequiredDays,
      allowsHalfDay: entity.allowsHalfDay,
      allowsQuarterDay: entity.allowsQuarterDay,
      allowsHourly: entity.allowsHourly,
      allowsNegativeBalance: entity.allowsNegativeBalance,
      requiresApproval: entity.requiresApproval,
      isCompOff: entity.isCompOff,
      isLossOfPay: entity.isLossOfPay,
      isRestrictedHoliday: entity.isRestrictedHoliday,
      applicableProbation: entity.applicableProbation,
      applicableContract: entity.applicableContract,
      applicableIntern: entity.applicableIntern,
      customFields: entity.customFields,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
    };
  }
}
