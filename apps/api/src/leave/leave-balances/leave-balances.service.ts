import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaveBalancesRepository } from './leave-balances.repository';
import { LeaveTypesRepository } from '../leave-types/leave-types.repository';
import { LeavePoliciesService } from '../leave-policies/leave-policies.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { AuditService } from '../../audit/audit.service';
import {
  AdjustLeaveBalanceInput,
  LeaveBalanceDto,
  LeaveBalanceHistoryDto,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class LeaveBalancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balancesRepo: LeaveBalancesRepository,
    private readonly leaveTypesRepo: LeaveTypesRepository,
    private readonly leavePoliciesService: LeavePoliciesService,
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
  ) {}

  async getBalancesForEmployee(
    employeeId: string,
    year: number,
    organizationId: string,
  ): Promise<LeaveBalanceDto[]> {
    const employee = await this.employeesRepo.findById(employeeId, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
    }

    // Ensure all active leave types have a balance record for this employee and year
    await this.ensureBalancesInitialized(employee, year, organizationId);

    const balances = await this.balancesRepo.findByEmployeeAndYear(employeeId, year, organizationId);
    return balances.map((b) => this.mapToDto(b));
  }

  async getMyBalances(
    userId: string,
    year: number,
    organizationId: string,
  ): Promise<LeaveBalanceDto[]> {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    return this.getBalancesForEmployee(employee.id, year, organizationId);
  }

  async adjustBalance(
    employeeId: string,
    input: AdjustLeaveBalanceInput,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveBalanceDto> {
    const employee = await this.employeesRepo.findById(employeeId, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
    }

    const leaveType = await this.leaveTypesRepo.findById(input.leaveTypeId, organizationId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID "${input.leaveTypeId}" not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      let balance = await this.balancesRepo.findSpecificBalance(
        employeeId,
        input.leaveTypeId,
        input.year,
        organizationId,
        tx,
      );

      if (!balance) {
        // Initialize balance record
        balance = await this.balancesRepo.upsertBalance(
          {
            organizationId,
            employeeId,
            leaveTypeId: input.leaveTypeId,
            year: input.year,
            openingBalance: 0,
            accrued: 0,
            granted: 0,
            used: 0,
            pending: 0,
            carryForward: 0,
            encashed: 0,
            adjustment: 0,
          },
          tx,
        );
      }

      const prevAdj = Number(balance.adjustment);
      const newAdj = prevAdj + input.adjustmentAmount;

      const prevAvailable =
        Number(balance.openingBalance) +
        Number(balance.accrued) +
        Number(balance.granted) +
        Number(balance.carryForward) +
        prevAdj -
        Number(balance.used) -
        Number(balance.pending) -
        Number(balance.encashed);

      const newAvailable = prevAvailable + input.adjustmentAmount;

      if (!leaveType.allowsNegativeBalance && newAvailable < 0) {
        throw new BadRequestException(
          `Adjustment of ${input.adjustmentAmount} would result in a negative balance (${newAvailable}), which is not permitted for this leave type`,
        );
      }

      const newClosing =
        Number(balance.openingBalance) +
        Number(balance.accrued) +
        Number(balance.granted) +
        Number(balance.carryForward) +
        newAdj -
        Number(balance.used) -
        Number(balance.encashed);

      const updated = await this.balancesRepo.upsertBalance(
        {
          organizationId,
          employeeId,
          leaveTypeId: input.leaveTypeId,
          year: input.year,
          adjustment: newAdj,
          closingBalance: newClosing,
        },
        tx,
      );

      await this.balancesRepo.createHistory(
        {
          organizationId,
          leaveBalanceId: updated.id,
          employeeId,
          leaveTypeId: input.leaveTypeId,
          action: 'manual_adjustment',
          amount: input.adjustmentAmount,
          previousBalance: prevAvailable,
          newBalance: newAvailable,
          reason: input.reason,
          actorUserId,
        },
        tx,
      );

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.LEAVE_BALANCE_ADJUST,
        entityType: 'LeaveBalance',
        entityId: updated.id,
        oldValues: { availableBalance: prevAvailable, adjustment: prevAdj },
        newValues: {
          availableBalance: newAvailable,
          adjustment: newAdj,
          adjustmentAmount: input.adjustmentAmount,
          reason: input.reason,
        },
        ipAddress,
        userAgent,
      });

      return this.mapToDto(updated);
    });
  }

  async getBalanceHistory(
    employeeId: string,
    organizationId: string,
    leaveTypeId?: string,
    limit: number = 50,
  ): Promise<LeaveBalanceHistoryDto[]> {
    const employee = await this.employeesRepo.findById(employeeId, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
    }

    const history = await this.balancesRepo.getHistoryByEmployee(
      employeeId,
      organizationId,
      leaveTypeId,
      limit,
    );

    return history.map((h) => ({
      id: h.id,
      organizationId: h.organizationId,
      leaveBalanceId: h.leaveBalanceId,
      employeeId: h.employeeId,
      leaveTypeId: h.leaveTypeId,
      action: h.action,
      amount: Number(h.amount),
      previousBalance: Number(h.previousBalance),
      newBalance: Number(h.newBalance),
      reason: h.reason,
      referenceId: h.referenceId,
      actorUserId: h.actorUserId,
      createdAt: h.createdAt.toISOString(),
      leaveTypeName: (h.leaveBalance as any)?.leaveType?.name,
    }));
  }

  async getMyBalanceHistory(
    userId: string,
    organizationId: string,
    leaveTypeId?: string,
    limit: number = 50,
  ): Promise<LeaveBalanceHistoryDto[]> {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }
    return this.getBalanceHistory(employee.id, organizationId, leaveTypeId, limit);
  }

  private async ensureBalancesInitialized(
    employee: any,
    year: number,
    organizationId: string,
  ): Promise<void> {
    const leaveTypes = await this.leaveTypesRepo.listActive(organizationId);

    for (const type of leaveTypes) {
      const existing = await this.balancesRepo.findSpecificBalance(
        employee.id,
        type.id,
        year,
        organizationId,
      );

      if (!existing) {
        // Find applicable policy
        const policy = await this.leavePoliciesService.getApplicablePolicyForEmployee(
          employee,
          type.id,
          organizationId,
        );

        let initialEntitlement = 0;
        if (policy) {
          if (policy.entitlementType === 'fixed' || policy.accrualFrequency === 'yearly') {
            initialEntitlement = Number(policy.annualEntitlement);
            // Check proration for new joiners in the current year
            if (policy.prorateNewJoiners && employee.joiningDate) {
              const joinDate = new Date(employee.joiningDate);
              if (joinDate.getFullYear() === year) {
                const joinMonth = joinDate.getMonth(); // 0-indexed
                const remainingMonths = 12 - joinMonth;
                initialEntitlement = Number(((initialEntitlement / 12) * remainingMonths).toFixed(2));
              }
            }
          } else if (policy.accrualFrequency === 'monthly') {
            initialEntitlement = policy.monthlyEntitlement ? Number(policy.monthlyEntitlement) : Number((policy.annualEntitlement / 12).toFixed(2));
          }
        }

        await this.balancesRepo.upsertBalance({
          organizationId,
          employeeId: employee.id,
          leaveTypeId: type.id,
          leavePolicyId: policy?.id || null,
          year,
          openingBalance: initialEntitlement,
          accrued: 0,
          granted: 0,
          used: 0,
          pending: 0,
          carryForward: 0,
          encashed: 0,
          adjustment: 0,
          closingBalance: initialEntitlement,
        });
      }
    }
  }

  private mapToDto(entity: any): LeaveBalanceDto {
    const opening = Number(entity.openingBalance);
    const accrued = Number(entity.accrued);
    const granted = Number(entity.granted);
    const carryForward = Number(entity.carryForward);
    const adjustment = Number(entity.adjustment);
    const used = Number(entity.used);
    const pending = Number(entity.pending);
    const encashed = Number(entity.encashed);

    const availableBalance = opening + accrued + granted + carryForward + adjustment - used - pending - encashed;
    const closingBalance = opening + accrued + granted + carryForward + adjustment - used - encashed;

    return {
      id: entity.id,
      organizationId: entity.organizationId,
      employeeId: entity.employeeId,
      employeeName: entity.employee ? `${entity.employee.firstName} ${entity.employee.lastName}` : undefined,
      employeeCode: entity.employee?.employeeCode,
      leaveTypeId: entity.leaveTypeId,
      leaveTypeName: entity.leaveType?.name,
      leaveTypeCode: entity.leaveType?.code,
      leaveTypeColor: entity.leaveType?.color,
      leavePolicyId: entity.leavePolicyId,
      year: entity.year,
      openingBalance: opening,
      accrued,
      granted,
      used,
      pending,
      carryForward,
      encashed,
      adjustment,
      closingBalance,
      availableBalance,
      status: entity.status,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
    };
  }
}
