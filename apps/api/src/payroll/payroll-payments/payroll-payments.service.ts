import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PayrollPaymentsRepository } from './payroll-payments.repository';
import { PayrollRunsRepository } from '../payroll-runs/payroll-runs.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, PayrollRunStatus } from '@zentra/shared-types';

@Injectable()
export class PayrollPaymentsService {
  constructor(
    private readonly repo: PayrollPaymentsRepository,
    private readonly runsRepo: PayrollRunsRepository,
    private readonly auditService: AuditService,
  ) {}

  async markRunPaid(
    payrollRunId: string,
    organizationId: string,
    input: any,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.runsRepo.findById(payrollRunId, organizationId);
    if (!run) throw new NotFoundException('Payroll run not found');

    if (![PayrollRunStatus.APPROVED, PayrollRunStatus.PAYMENT_IN_PROGRESS].includes(run.status as any)) {
      throw new BadRequestException(
        `Cannot mark payroll run as paid unless it has been APPROVED (current: ${run.status})`,
      );
    }

    const payDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
    const updated = await this.repo.markRunPaid(
      payrollRunId,
      organizationId,
      payDate,
      input.paymentReference,
      input.paymentNotes,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_PAYMENT_MARK_PAID,
      entityType: 'PayrollRun',
      entityId: payrollRunId,
      newValues: {
        paymentDate: payDate,
        paymentReference: input.paymentReference,
        status: 'PAID',
      },
      ipAddress,
    });

    return updated;
  }

  async markEmployeePaid(
    payrollRunId: string,
    employeeId: string,
    organizationId: string,
    input: any,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.runsRepo.findById(payrollRunId, organizationId);
    if (!run) throw new NotFoundException('Payroll run not found');

    if (![PayrollRunStatus.APPROVED, PayrollRunStatus.PAYMENT_IN_PROGRESS, PayrollRunStatus.PAID].includes(run.status as any)) {
      throw new BadRequestException(
        `Payroll must be approved before marking individual employees as paid (current: ${run.status})`,
      );
    }

    const payDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
    const updated = await this.repo.markEmployeePaid(
      payrollRunId,
      employeeId,
      organizationId,
      payDate,
      input.paymentReference,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_PAYMENT_MARK_PAID,
      entityType: 'PayrollEmployeeRecord',
      entityId: `${payrollRunId}_${employeeId}`,
      newValues: {
        employeeId,
        paymentDate: payDate,
        paymentReference: input.paymentReference,
      },
      ipAddress,
    });

    return updated;
  }

  async uploadPaymentProof(
    payrollRunId: string,
    organizationId: string,
    input: any,
    userId: string,
    ipAddress?: string,
  ) {
    await this.runsRepo.findById(payrollRunId, organizationId);

    const updated = await this.repo.uploadPaymentProof(
      payrollRunId,
      organizationId,
      input.paymentProofUrl,
      input.paymentReference,
      input.paymentNotes,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_PAYMENT_PROOF_UPLOAD,
      entityType: 'PayrollRun',
      entityId: payrollRunId,
      newValues: { paymentProofUrl: input.paymentProofUrl },
      ipAddress,
    });

    return updated;
  }

  async getPaymentStatus(payrollRunId: string, organizationId: string) {
    return this.repo.getPaymentStatus(payrollRunId, organizationId);
  }
}

