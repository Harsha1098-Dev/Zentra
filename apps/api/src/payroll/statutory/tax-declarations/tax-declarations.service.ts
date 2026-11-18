import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaxDeclarationsRepository } from './tax-declarations.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, DeclarationStatus } from '@zentra/shared-types';

@Injectable()
export class TaxDeclarationsService {
  constructor(
    private readonly repository: TaxDeclarationsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getMyDeclarations(organizationId: string, userId: string, email?: string, financialYear?: string) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not found for user');
    }
    return this.repository.findAllByEmployee(organizationId, employee.id, financialYear);
  }

  async createMyDeclaration(
    organizationId: string,
    userId: string,
    data: any,
    email?: string,
    ip?: string,
    ua?: string,
  ) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not found for user');
    }

    const created = await this.repository.create(organizationId, employee.id, {
      ...data,
      status: DeclarationStatus.DRAFT,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TAX_DECLARATION_CREATE,
      resource: 'employee_tax_declarations',
      resourceId: created.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return created;
  }

  async updateMyDeclaration(
    id: string,
    organizationId: string,
    userId: string,
    data: any,
    email?: string,
    ip?: string,
    ua?: string,
  ) {
    const declaration = await this.repository.findById(id, organizationId);
    if (!declaration) {
      throw new NotFoundException(`Declaration '${id}' not found`);
    }

    if (declaration.status === DeclarationStatus.APPROVED) {
      throw new BadRequestException('Cannot modify an already approved tax declaration');
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TAX_DECLARATION_UPDATE,
      resource: 'employee_tax_declarations',
      resourceId: updated.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async submitMyDeclarations(
    organizationId: string,
    userId: string,
    financialYear: string,
    email?: string,
    ip?: string,
    ua?: string,
  ) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not found for user');
    }

    const result = await this.repository.submitAllDrafts(organizationId, employee.id, financialYear);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TAX_DECLARATION_SUBMIT,
      resource: 'employee_tax_declarations',
      details: { financialYear, count: result.count },
      ipAddress: ip,
      userAgent: ua,
    });

    return { submittedCount: result.count };
  }

  async findAllDeclarations(
    organizationId: string,
    filters: { financialYear?: string; status?: string; employeeId?: string } = {},
  ) {
    return this.repository.findAll(organizationId, filters);
  }

  async reviewDeclaration(
    id: string,
    organizationId: string,
    reviewData: { status: DeclarationStatus; approvedAmount?: number; rejectionReason?: string | null },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const declaration = await this.repository.findById(id, organizationId);
    if (!declaration) {
      throw new NotFoundException(`Declaration '${id}' not found`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: reviewData.status,
      approvedAmount:
        reviewData.status === DeclarationStatus.APPROVED
          ? (reviewData.approvedAmount !== undefined ? reviewData.approvedAmount : declaration.declaredAmount)
          : null,
      rejectionReason: reviewData.status === DeclarationStatus.REJECTED ? reviewData.rejectionReason : null,
      reviewedBy: userId,
      reviewedAt: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action:
        reviewData.status === DeclarationStatus.APPROVED
          ? AuditAction.TAX_DECLARATION_APPROVE
          : AuditAction.TAX_DECLARATION_REJECT,
      resource: 'employee_tax_declarations',
      resourceId: updated.id,
      details: reviewData,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
