import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PayrollPeriodsRepository } from './payroll-periods.repository';
import { OrganizationsRepository } from '../../organizations/organizations.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, PayrollPeriodStatus } from '@zentra/shared-types';

@Injectable()
export class PayrollPeriodsService {
  constructor(
    private readonly repo: PayrollPeriodsRepository,
    private readonly orgsRepo: OrganizationsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, year?: number) {
    return this.repo.findAll(organizationId, year);
  }

  async findById(id: string, organizationId: string) {
    const period = await this.repo.findById(id, organizationId);
    if (!period) {
      throw new NotFoundException(`Payroll period '${id}' not found`);
    }
    return period;
  }

  async create(organizationId: string, input: any, userId: string, ipAddress?: string) {
    // Check duplicate
    const existing = await this.repo.findByMonthAndYear(
      input.payrollMonth,
      input.payrollYear,
      organizationId,
    );
    if (existing) {
      throw new ConflictException(
        `A payroll period already exists for ${input.payrollMonth}/${input.payrollYear}`,
      );
    }

    const org = await this.orgsRepo.findById(organizationId);
    if (org && new Date(input.periodStartDate) < new Date(org.createdAt)) {
      throw new BadRequestException('Payroll period cannot start before organization creation date');
    }

    const startDate = new Date(input.periodStartDate);
    const endDate = new Date(input.periodEndDate);
    const payDate = new Date(input.payDate);

    if (endDate <= startDate) {
      throw new BadRequestException('Period end date must be after period start date');
    }

    const period = await this.repo.create(organizationId, {
      payrollYear: input.payrollYear,
      payrollMonth: input.payrollMonth,
      periodStartDate: startDate,
      periodEndDate: endDate,
      payDate,
      attendanceCutoffDate: new Date(input.attendanceCutoffDate),
      leaveCutoffDate: new Date(input.leaveCutoffDate),
      payrollCutoffDate: new Date(input.payrollCutoffDate),
      status: PayrollPeriodStatus.UPCOMING,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_PERIOD_CREATE,
      entityType: 'PayrollPeriod',
      entityId: period.id,
      newValues: period,
      ipAddress,
    });

    return period;
  }

  async update(id: string, organizationId: string, input: any, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status === PayrollPeriodStatus.LOCKED) {
      throw new BadRequestException('Locked payroll period cannot be updated');
    }

    const updateData: any = {};
    if (input.periodStartDate) updateData.periodStartDate = new Date(input.periodStartDate);
    if (input.periodEndDate) updateData.periodEndDate = new Date(input.periodEndDate);
    if (input.payDate) updateData.payDate = new Date(input.payDate);
    if (input.attendanceCutoffDate)
      updateData.attendanceCutoffDate = new Date(input.attendanceCutoffDate);
    if (input.leaveCutoffDate) updateData.leaveCutoffDate = new Date(input.leaveCutoffDate);
    if (input.payrollCutoffDate)
      updateData.payrollCutoffDate = new Date(input.payrollCutoffDate);

    const updated = await this.repo.update(id, organizationId, updateData);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_PERIOD_UPDATE,
      entityType: 'PayrollPeriod',
      entityId: id,
      prevValues: existing,
      newValues: updated,
      ipAddress,
    });

    return updated;
  }

  async openPeriod(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);
    if (existing.status === PayrollPeriodStatus.LOCKED) {
      throw new BadRequestException('Locked payroll period cannot be reopened');
    }

    const updated = await this.repo.updateStatus(id, organizationId, PayrollPeriodStatus.OPEN);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_PERIOD_OPEN,
      entityType: 'PayrollPeriod',
      entityId: id,
      newValues: { status: PayrollPeriodStatus.OPEN },
      ipAddress,
    });

    return updated;
  }

  async lockPeriod(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);
    const updated = await this.repo.updateStatus(id, organizationId, PayrollPeriodStatus.LOCKED);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_PERIOD_LOCK,
      entityType: 'PayrollPeriod',
      entityId: id,
      newValues: { status: PayrollPeriodStatus.LOCKED },
      ipAddress,
    });

    return updated;
  }
}

