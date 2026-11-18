import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PayrollExceptionsRepository } from './payroll-exceptions.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class PayrollExceptionsService {
  constructor(
    private readonly repo: PayrollExceptionsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findByRun(payrollRunId: string, organizationId: string) {
    return this.repo.findByRun(payrollRunId, organizationId);
  }

  async resolve(
    id: string,
    organizationId: string,
    resolutionNotes: string,
    userId: string,
    ipAddress?: string,
  ) {
    const exception = await this.repo.findById(id, organizationId);
    if (!exception) {
      throw new NotFoundException(`Payroll exception '${id}' not found`);
    }

    const resolved = await this.repo.resolve(id, organizationId, userId, resolutionNotes);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.PAYROLL_EXCEPTION_RESOLVE,
      entityType: 'PayrollException',
      entityId: id,
      newValues: { isResolved: true, resolutionNotes },
      ipAddress,
    });

    return resolved;
  }

  async override(
    id: string,
    organizationId: string,
    overrideReason: string,
    userId: string,
    ipAddress?: string,
  ) {
    const exception = await this.repo.findById(id, organizationId);
    if (!exception) {
      throw new NotFoundException(`Payroll exception '${id}' not found`);
    }

    const overridden = await this.repo.override(id, organizationId, userId, overrideReason);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.PAYROLL_EXCEPTION_OVERRIDE,
      entityType: 'PayrollException',
      entityId: id,
      newValues: { isOverridden: true, overrideReason },
      ipAddress,
    });

    return overridden;
  }
}
