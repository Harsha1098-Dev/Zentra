import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DelegationsRepository } from './delegations.repository';
import { UsersRepository } from '../users/users.repository';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import {
  CreateDelegationInput,
  UpdateDelegationInput,
  DelegationDto,
  DelegationStatus,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class DelegationsService {
  constructor(
    private readonly delegationsRepo: DelegationsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async createDelegation(
    organizationId: string,
    input: CreateDelegationInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DelegationDto> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (input.delegateToUserId === actorUserId) {
      throw new BadRequestException('Cannot delegate approvals to yourself');
    }

    const targetUser = await this.usersRepo.findById(input.delegateToUserId);
    if (!targetUser) {
      throw new NotFoundException('Delegate user not found');
    }

    const delegation = await this.delegationsRepo.create({
      organizationId,
      delegateFromUserId: actorUserId,
      delegateToUserId: input.delegateToUserId,
      module: input.module || null,
      requestType: input.requestType || null,
      startDate,
      endDate,
      status: DelegationStatus.ACTIVE,
      createdBy: actorUserId,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DELEGATION_CREATE,
      entityType: 'Delegation',
      entityId: delegation.id,
      newValues: {
        delegateFromUserId: actorUserId,
        delegateToUserId: input.delegateToUserId,
        delegateToName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim(),
        startDate,
        endDate,
        module: input.module,
        requestType: input.requestType,
      },
      ipAddress,
      userAgent,
    });

    // Notify the delegate
    if (targetUser.email) {
      await this.emailService.sendNotification(
        targetUser.email,
        'Approval Delegation Assigned',
        `You have been designated as an approval delegate by your colleague from ${startDate.toDateString()} to ${endDate.toDateString()}.`,
      );
    }

    return this.mapToDto(delegation, targetUser);
  }

  async getDelegations(organizationId: string, userId?: string): Promise<DelegationDto[]> {
    const items = await this.delegationsRepo.list(organizationId, userId);
    return Promise.all(items.map((item) => this.mapToDto(item)));
  }

  async getDelegationById(id: string, organizationId: string): Promise<DelegationDto> {
    const item = await this.delegationsRepo.findById(id, organizationId);
    if (!item) {
      throw new NotFoundException(`Delegation with ID ${id} not found`);
    }
    return this.mapToDto(item);
  }

  async updateDelegation(
    id: string,
    organizationId: string,
    input: UpdateDelegationInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DelegationDto> {
    const existing = await this.delegationsRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Delegation with ID ${id} not found`);
    }

    const updateData: any = {};
    if (input.startDate) updateData.startDate = new Date(input.startDate);
    if (input.endDate) updateData.endDate = new Date(input.endDate);
    if (input.module !== undefined) updateData.module = input.module;
    if (input.requestType !== undefined) updateData.requestType = input.requestType;
    if (input.delegateToUserId) {
      if (input.delegateToUserId === existing.delegateFromUserId) {
        throw new BadRequestException('Cannot delegate to self');
      }
      updateData.delegateToUserId = input.delegateToUserId;
    }

    const updated = await this.delegationsRepo.update(id, organizationId, updateData);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DELEGATION_UPDATE,
      entityType: 'Delegation',
      entityId: id,
      oldValues: {
        delegateToUserId: existing.delegateToUserId,
        startDate: existing.startDate,
        endDate: existing.endDate,
      },
      newValues: updateData,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async cancelDelegation(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.delegationsRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Delegation with ID ${id} not found`);
    }

    await this.delegationsRepo.update(id, organizationId, {
      status: DelegationStatus.CANCELLED,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DELEGATION_CANCEL,
      entityType: 'Delegation',
      entityId: id,
      newValues: { status: DelegationStatus.CANCELLED },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Delegation cancelled successfully' };
  }

  async resolveActiveApprover(
    primaryApproverUserId: string,
    organizationId: string,
    module?: string | null,
    requestType?: string | null,
  ): Promise<{ effectiveUserId: string; originalUserId: string; isDelegated: boolean }> {
    const delegation = await this.delegationsRepo.findActiveDelegation(
      primaryApproverUserId,
      organizationId,
      module,
      requestType,
    );

    if (delegation && delegation.status === DelegationStatus.ACTIVE) {
      return {
        effectiveUserId: delegation.delegateToUserId,
        originalUserId: primaryApproverUserId,
        isDelegated: true,
      };
    }

    return {
      effectiveUserId: primaryApproverUserId,
      originalUserId: primaryApproverUserId,
      isDelegated: false,
    };
  }

  private async mapToDto(item: any, knownDelegate?: any): Promise<DelegationDto> {
    let delegateToName = '';
    let delegateFromName = '';

    if (knownDelegate) {
      delegateToName = `${knownDelegate.firstName || ''} ${knownDelegate.lastName || ''}`.trim();
    } else {
      const target = await this.usersRepo.findById(item.delegateToUserId);
      if (target) {
        delegateToName = `${target.firstName || ''} ${target.lastName || ''}`.trim() || target.email;
      }
    }

    const source = await this.usersRepo.findById(item.delegateFromUserId);
    if (source) {
      delegateFromName = `${source.firstName || ''} ${source.lastName || ''}`.trim() || source.email;
    }

    return {
      id: item.id,
      organizationId: item.organizationId,
      delegateFromUserId: item.delegateFromUserId,
      delegateFromName,
      delegateToUserId: item.delegateToUserId,
      delegateToName,
      module: item.module,
      requestType: item.requestType,
      startDate: item.startDate instanceof Date ? item.startDate.toISOString() : item.startDate,
      endDate: item.endDate instanceof Date ? item.endDate.toISOString() : item.endDate,
      status: item.status as DelegationStatus,
      createdBy: item.createdBy,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
  }
}
