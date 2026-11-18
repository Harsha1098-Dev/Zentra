import { Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentProofsRepository } from './investment-proofs.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, ProofVerificationStatus, DeclarationStatus } from '@zentra/shared-types';

@Injectable()
export class InvestmentProofsService {
  constructor(
    private readonly repository: InvestmentProofsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getMyProofs(organizationId: string, userId: string, email?: string) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not found for user');
    }
    return this.repository.findAllByEmployee(organizationId, employee.id);
  }

  async createMyProof(organizationId: string, userId: string, data: any, email?: string, ip?: string, ua?: string) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not found for user');
    }

    const created = await this.repository.create(organizationId, employee.id, {
      ...data,
      verificationStatus: ProofVerificationStatus.PENDING,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.INVESTMENT_PROOF_UPLOAD,
      resource: 'employee_investment_proofs',
      resourceId: created.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return created;
  }

  async findAllProofs(organizationId: string, filters: { verificationStatus?: string; employeeId?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async verifyProof(
    id: string,
    organizationId: string,
    verificationData: { verificationStatus: ProofVerificationStatus; verifiedAmount: number; rejectionReason?: string | null },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const proof = await this.repository.findById(id, organizationId);
    if (!proof) {
      throw new NotFoundException(`Investment proof '${id}' not found`);
    }

    const updated = await this.repository.update(id, organizationId, {
      verificationStatus: verificationData.verificationStatus,
      verifiedAmount:
        verificationData.verificationStatus === ProofVerificationStatus.VERIFIED
          ? verificationData.verifiedAmount
          : 0,
      rejectionReason:
        verificationData.verificationStatus === ProofVerificationStatus.REJECTED
          ? verificationData.rejectionReason
          : null,
      verifiedBy: userId,
      verifiedAt: new Date(),
    });

    // If verified, update the parent declaration approvedAmount
    if (verificationData.verificationStatus === ProofVerificationStatus.VERIFIED && proof.declarationId) {
      await this.prisma.employeeTaxDeclaration.update({
        where: { id: proof.declarationId },
        data: {
          approvedAmount: verificationData.verifiedAmount,
          status: DeclarationStatus.APPROVED,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });
    }

    await this.auditService.log({
      organizationId,
      userId,
      action:
        verificationData.verificationStatus === ProofVerificationStatus.VERIFIED
          ? AuditAction.INVESTMENT_PROOF_VERIFY
          : AuditAction.INVESTMENT_PROOF_REJECT,
      resource: 'employee_investment_proofs',
      resourceId: updated.id,
      details: verificationData,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
