import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { LeavePoliciesRepository } from './leave-policies.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateLeavePolicyInput,
  UpdateLeavePolicyInput,
  LeavePolicyQueryFilterInput,
  LeavePolicyDto,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class LeavePoliciesService {
  constructor(
    private readonly policiesRepo: LeavePoliciesRepository,
    private readonly auditService: AuditService,
  ) {}

  async createLeavePolicy(
    organizationId: string,
    input: CreateLeavePolicyInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeavePolicyDto> {
    const existing = await this.policiesRepo.findByName(input.name, organizationId);
    if (existing) {
      throw new ConflictException(`Leave policy with name "${input.name}" already exists`);
    }

    const created = await this.policiesRepo.create({
      organizationId,
      ...input,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_POLICY_CREATE,
      entityType: 'LeavePolicy',
      entityId: created.id,
      newValues: {
        name: created.name,
        leaveTypeId: created.leaveTypeId,
        annualEntitlement: Number(created.annualEntitlement),
      },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(created);
  }

  async getLeavePolicies(
    organizationId: string,
    filter: LeavePolicyQueryFilterInput,
  ) {
    const result = await this.policiesRepo.list(organizationId, filter);
    return {
      ...result,
      data: result.data.map((item) => this.mapToDto(item)),
    };
  }

  async getLeavePolicyById(id: string, organizationId: string): Promise<LeavePolicyDto> {
    const item = await this.policiesRepo.findById(id, organizationId);
    if (!item) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found`);
    }
    return this.mapToDto(item);
  }

  async updateLeavePolicy(
    id: string,
    organizationId: string,
    input: UpdateLeavePolicyInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeavePolicyDto> {
    const existing = await this.policiesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found`);
    }

    if (input.name && input.name !== existing.name) {
      const nameCheck = await this.policiesRepo.findByName(input.name, organizationId);
      if (nameCheck && nameCheck.id !== id) {
        throw new ConflictException(`Leave policy with name "${input.name}" already exists`);
      }
    }

    const updateData: any = { ...input };
    if (input.effectiveFrom) updateData.effectiveFrom = new Date(input.effectiveFrom);
    if (input.effectiveTo !== undefined) {
      updateData.effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
    }

    const updated = await this.policiesRepo.update(id, organizationId, updateData);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_POLICY_UPDATE,
      entityType: 'LeavePolicy',
      entityId: id,
      oldValues: { name: existing.name, status: existing.status },
      newValues: { name: updated.name, status: updated.status },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async activateLeavePolicy(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeavePolicyDto> {
    const existing = await this.policiesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found`);
    }

    const updated = await this.policiesRepo.update(id, organizationId, { status: 'active' });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_POLICY_ACTIVATE,
      entityType: 'LeavePolicy',
      entityId: id,
      newValues: { status: 'active' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deactivateLeavePolicy(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeavePolicyDto> {
    const existing = await this.policiesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found`);
    }

    const updated = await this.policiesRepo.update(id, organizationId, { status: 'inactive' });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_POLICY_DEACTIVATE,
      entityType: 'LeavePolicy',
      entityId: id,
      newValues: { status: 'inactive' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deleteLeavePolicy(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const existing = await this.policiesRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Leave policy with ID "${id}" not found`);
    }

    await this.policiesRepo.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LEAVE_POLICY_DELETE,
      entityType: 'LeavePolicy',
      entityId: id,
      oldValues: { name: existing.name },
      ipAddress,
      userAgent,
    });
  }

  evaluateEligibility(employee: any, policy: any): boolean {
    if (policy.status !== 'active') return false;

    // Check location
    if (
      policy.applicableLocations &&
      !policy.applicableLocations.includes('ALL') &&
      (!employee.locationId || !policy.applicableLocations.includes(employee.locationId))
    ) {
      return false;
    }

    // Check department
    if (
      policy.applicableDepartments &&
      !policy.applicableDepartments.includes('ALL') &&
      (!employee.departmentId || !policy.applicableDepartments.includes(employee.departmentId))
    ) {
      return false;
    }

    // Check designation
    if (
      policy.applicableDesignations &&
      !policy.applicableDesignations.includes('ALL') &&
      (!employee.designationId || !policy.applicableDesignations.includes(employee.designationId))
    ) {
      return false;
    }

    // Check grade
    if (
      policy.applicableGrades &&
      !policy.applicableGrades.includes('ALL') &&
      (!employee.gradeId || !policy.applicableGrades.includes(employee.gradeId))
    ) {
      return false;
    }

    // Check employment type
    if (
      policy.applicableEmploymentTypes &&
      !policy.applicableEmploymentTypes.includes('ALL') &&
      (!employee.employmentType || !policy.applicableEmploymentTypes.includes(employee.employmentType))
    ) {
      return false;
    }

    // Check employee status
    if (
      policy.applicableEmployeeStatuses &&
      !policy.applicableEmployeeStatuses.includes('ALL') &&
      (!employee.status || !policy.applicableEmployeeStatuses.includes(employee.status))
    ) {
      return false;
    }

    // Check probation
    if (!policy.probationEligibility && employee.status === 'PROBATION') {
      return false;
    }

    // Check minimum service period
    if (policy.minimumServicePeriodDays && policy.minimumServicePeriodDays > 0) {
      if (!employee.joiningDate) return false;
      const joinDate = new Date(employee.joiningDate);
      const diffDays = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < policy.minimumServicePeriodDays) {
        return false;
      }
    }

    return true;
  }

  async getApplicablePolicyForEmployee(
    employee: any,
    leaveTypeId: string,
    organizationId: string,
  ): Promise<any | null> {
    const policies = await this.policiesRepo.findActivePoliciesForType(leaveTypeId, organizationId);
    for (const policy of policies) {
      if (this.evaluateEligibility(employee, policy)) {
        return policy;
      }
    }
    return null;
  }

  private mapToDto(entity: any): LeavePolicyDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      leaveTypeId: entity.leaveTypeId,
      leaveTypeName: entity.leaveType?.name,
      leaveTypeCode: entity.leaveType?.code,
      name: entity.name,
      description: entity.description,
      applicableLocations: entity.applicableLocations || [],
      applicableDepartments: entity.applicableDepartments || [],
      applicableDesignations: entity.applicableDesignations || [],
      applicableGrades: entity.applicableGrades || [],
      applicableEmploymentTypes: entity.applicableEmploymentTypes || [],
      applicableEmployeeStatuses: entity.applicableEmployeeStatuses || [],
      entitlementType: entity.entitlementType,
      annualEntitlement: Number(entity.annualEntitlement),
      monthlyEntitlement: entity.monthlyEntitlement !== null ? Number(entity.monthlyEntitlement) : null,
      accrualFrequency: entity.accrualFrequency,
      accrualStartDate: entity.accrualStartDate,
      prorateNewJoiners: entity.prorateNewJoiners,
      probationEligibility: entity.probationEligibility,
      minimumServicePeriodDays: entity.minimumServicePeriodDays,
      maxDaysPerRequest: entity.maxDaysPerRequest !== null ? Number(entity.maxDaysPerRequest) : null,
      maxConsecutiveDays: entity.maxConsecutiveDays !== null ? Number(entity.maxConsecutiveDays) : null,
      minimumNoticeDays: entity.minimumNoticeDays,
      allowPastDates: entity.allowPastDates,
      allowFutureDates: entity.allowFutureDates,
      maxFutureDays: entity.maxFutureDays,
      allowHalfDay: entity.allowHalfDay,
      allowQuarterDay: entity.allowQuarterDay,
      allowHourly: entity.allowHourly,
      allowNegativeBalance: entity.allowNegativeBalance,
      allowCarryForward: entity.allowCarryForward,
      carryForwardLimit: entity.carryForwardLimit !== null ? Number(entity.carryForwardLimit) : null,
      carryForwardExpiryDays: entity.carryForwardExpiryDays,
      allowEncashment: entity.allowEncashment,
      encashmentLimit: entity.encashmentLimit !== null ? Number(entity.encashmentLimit) : null,
      minBalanceForEncashment: entity.minBalanceForEncashment !== null ? Number(entity.minBalanceForEncashment) : null,
      allowWeekendLeave: entity.allowWeekendLeave,
      allowHolidayLeave: entity.allowHolidayLeave,
      allowOverlappingRequests: entity.allowOverlappingRequests,
      requiresApproval: entity.requiresApproval,
      approvalWorkflowId: entity.approvalWorkflowId,
      requiresAttachment: entity.requiresAttachment,
      attachmentRequiredDays: entity.attachmentRequiredDays,
      effectiveFrom: entity.effectiveFrom instanceof Date ? entity.effectiveFrom.toISOString() : entity.effectiveFrom,
      effectiveTo: entity.effectiveTo instanceof Date ? entity.effectiveTo.toISOString() : entity.effectiveTo,
      status: entity.status,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
    };
  }
}
