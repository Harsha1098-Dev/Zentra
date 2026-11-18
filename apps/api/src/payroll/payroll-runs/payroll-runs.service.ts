import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PayrollRunsRepository } from './payroll-runs.repository';
import { PayrollPeriodsRepository } from '../payroll-periods/payroll-periods.repository';
import { PayrollExceptionsRepository } from '../payroll-exceptions/payroll-exceptions.repository';
import { PayrollCalculatorService } from '../payroll-engine/payroll-calculator.service';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  PayrollRunStatus,
  PayrollRunType,
  PayrollPeriodStatus,
} from '@zentra/shared-types';

@Injectable()
export class PayrollRunsService {
  constructor(
    private readonly repo: PayrollRunsRepository,
    private readonly periodsRepo: PayrollPeriodsRepository,
    private readonly exceptionsRepo: PayrollExceptionsRepository,
    private readonly calculatorService: PayrollCalculatorService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filter?: { status?: string; year?: number }) {
    return this.repo.findAll(organizationId, filter);
  }

  async findById(id: string, organizationId: string) {
    const run = await this.repo.findById(id, organizationId);
    if (!run) {
      throw new NotFoundException(`Payroll run '${id}' not found`);
    }
    return run;
  }

  async create(organizationId: string, input: any, userId: string, ipAddress?: string) {
    const period = await this.periodsRepo.findById(input.payrollPeriodId, organizationId);
    if (!period) {
      throw new NotFoundException(`Payroll period '${input.payrollPeriodId}' not found`);
    }

    if (period.status === PayrollPeriodStatus.LOCKED) {
      throw new BadRequestException('Cannot create a payroll run in a locked payroll period');
    }

    // Check duplicate run of same type
    const existingRun = await this.repo.findByPeriodAndType(
      input.payrollPeriodId,
      input.runType || PayrollRunType.REGULAR,
      organizationId,
    );
    if (existingRun && existingRun.status !== PayrollRunStatus.CANCELLED) {
      throw new ConflictException(
        `A ${input.runType || 'REGULAR'} payroll run already exists for this period`,
      );
    }

    const created = await this.repo.create(organizationId, {
      payrollPeriodId: input.payrollPeriodId,
      runName: input.runName,
      runType: input.runType || PayrollRunType.REGULAR,
      status: PayrollRunStatus.DRAFT,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_RUN_CREATE,
      entityType: 'PayrollRun',
      entityId: created.id,
      newValues: created,
      ipAddress,
    });

    return created;
  }

  async update(id: string, organizationId: string, input: any, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);
    if ([PayrollRunStatus.APPROVED, PayrollRunStatus.PAID, PayrollRunStatus.LOCKED].includes(existing.status)) {
      throw new BadRequestException(`Cannot update payroll run in '${existing.status}' status`);
    }

    const updated = await this.repo.update(id, organizationId, input);
    return updated;
  }

  async calculate(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const calculated = await this.calculatorService.calculateRun(id, organizationId, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_RUN_CALCULATE,
      entityType: 'PayrollRun',
      entityId: id,
      newValues: {
        totalEmployees: calculated.totalEmployeeCount,
        totalNetPay: calculated.totalNetPay,
      },
      ipAddress,
    });

    return calculated;
  }

  async submit(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const run = await this.findById(id, organizationId);

    if (run.status !== PayrollRunStatus.CALCULATED) {
      throw new BadRequestException(
        `Only payroll runs in CALCULATED status can be submitted for approval (current: ${run.status})`,
      );
    }

    // Check critical unresolved exceptions
    const criticalExceptionsCount = await this.exceptionsRepo.countUnresolvedCritical(id, organizationId);
    if (criticalExceptionsCount > 0) {
      throw new BadRequestException(
        `Cannot submit payroll for approval: There are ${criticalExceptionsCount} unresolved critical exception(s) that must be resolved or overridden first.`,
      );
    }

    const submitted = await this.repo.updateStatus(id, organizationId, PayrollRunStatus.UNDER_REVIEW, {
      submittedBy: userId,
      submittedAt: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_RUN_SUBMIT,
      entityType: 'PayrollRun',
      entityId: id,
      newValues: { status: PayrollRunStatus.UNDER_REVIEW, submittedBy: userId },
      ipAddress,
    });

    return submitted;
  }

  async approve(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const run = await this.findById(id, organizationId);

    if (run.status !== PayrollRunStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Only payroll runs in UNDER_REVIEW status can be approved (current: ${run.status})`,
      );
    }

    const approved = await this.repo.updateStatus(id, organizationId, PayrollRunStatus.APPROVED, {
      approvedBy: userId,
      approvedAt: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_RUN_APPROVE,
      entityType: 'PayrollRun',
      entityId: id,
      newValues: { status: PayrollRunStatus.APPROVED, approvedBy: userId },
      ipAddress,
    });

    return approved;
  }

  async reject(
    id: string,
    organizationId: string,
    reason: string,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.findById(id, organizationId);

    if (run.status !== PayrollRunStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Only payroll runs in UNDER_REVIEW status can be rejected (current: ${run.status})`,
      );
    }

    const rejected = await this.repo.updateStatus(id, organizationId, PayrollRunStatus.REJECTED, {
      rejectedBy: userId,
      rejectedAt: new Date(),
      rejectionReason: reason || 'Payroll run rejected by reviewer',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_RUN_REJECT,
      entityType: 'PayrollRun',
      entityId: id,
      newValues: { status: PayrollRunStatus.REJECTED, rejectedBy: userId, rejectionReason: reason },
      ipAddress,
    });

    return rejected;
  }

  async cancel(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const run = await this.findById(id, organizationId);

    if ([PayrollRunStatus.PAID, PayrollRunStatus.LOCKED].includes(run.status)) {
      throw new BadRequestException(`Cannot cancel a payroll run in '${run.status}' status`);
    }

    const cancelled = await this.repo.updateStatus(id, organizationId, PayrollRunStatus.CANCELLED);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_RUN_CANCEL,
      entityType: 'PayrollRun',
      entityId: id,
      newValues: { status: PayrollRunStatus.CANCELLED },
      ipAddress,
    });

    return cancelled;
  }

  async lock(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const run = await this.findById(id, organizationId);

    if (![PayrollRunStatus.PAID, PayrollRunStatus.PUBLISHED].includes(run.status)) {
      throw new BadRequestException(
        `Only payroll runs that are PAID or PUBLISHED can be locked (current: ${run.status})`,
      );
    }

    const locked = await this.repo.updateStatus(id, organizationId, PayrollRunStatus.LOCKED);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_RUN_LOCK,
      entityType: 'PayrollRun',
      entityId: id,
      newValues: { status: PayrollRunStatus.LOCKED },
      ipAddress,
    });

    return locked;
  }

  async getEmployeeRecords(
    id: string,
    organizationId: string,
    filter?: { departmentId?: string; search?: string },
  ) {
    await this.findById(id, organizationId);
    return this.repo.findEmployeeRecords(id, organizationId, filter);
  }

  async getRegister(id: string, organizationId: string) {
    const run = await this.findById(id, organizationId);
    const records = await this.repo.findEmployeeRecords(id, organizationId);

    return {
      run: {
        id: run.id,
        runName: run.runName,
        runType: run.runType,
        status: run.status,
        period: run.payrollPeriod,
        totalEmployeeCount: run.totalEmployeeCount,
        totalGrossEarnings: run.totalGrossEarnings,
        totalDeductions: run.totalDeductions,
        totalEmployerContributions: run.totalEmployerContributions,
        totalNetPay: run.totalNetPay,
        totalCtcCost: run.totalCtcCost,
      },
      records,
    };
  }
}

