import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaxProfileRepository } from './tax-profile.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction, TaxRegime, PanVerificationStatus } from '@zentra/shared-types';

@Injectable()
export class TaxProfileService {
  constructor(
    private readonly repository: TaxProfileRepository,
    private readonly auditService: AuditService,
  ) {}

  async getMyTaxProfile(organizationId: string, userId: string, email?: string, financialYear?: string) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not linked to current user');
    }

    const fy = financialYear || '2025-2026';
    let profile = await this.repository.findByEmployeeAndYear(organizationId, employee.id, fy);
    if (!profile) {
      // Auto-create default profile under New Regime
      profile = await this.repository.upsert(organizationId, employee.id, fy, {
        selectedRegime: TaxRegime.NEW_REGIME,
        panVerificationStatus: PanVerificationStatus.UNVERIFIED,
        isPfEligible: true,
        isEsiEligible: true,
        isPtEligible: true,
        isLwfEligible: true,
      });
    }

    return profile;
  }

  async switchMyTaxRegime(
    organizationId: string,
    userId: string,
    selectedRegime: TaxRegime,
    financialYear?: string,
    email?: string,
    ip?: string,
    ua?: string,
  ) {
    const employee = await this.repository.findEmployeeByUserId(organizationId, userId, email);
    if (!employee) {
      throw new NotFoundException('Employee record not linked to current user');
    }

    const fy = financialYear || '2025-2026';
    const profile = await this.repository.upsert(organizationId, employee.id, fy, {
      selectedRegime,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TAX_REGIME_CHANGE,
      resource: 'employee_tax_profiles',
      resourceId: profile.id,
      details: { selectedRegime, financialYear: fy, employeeId: employee.id },
      ipAddress: ip,
      userAgent: ua,
    });

    return profile;
  }

  async getEmployeeTaxProfile(organizationId: string, employeeId: string, financialYear?: string) {
    const fy = financialYear || '2025-2026';
    let profile = await this.repository.findByEmployeeAndYear(organizationId, employeeId, fy);
    if (!profile) {
      profile = await this.repository.upsert(organizationId, employeeId, fy, {
        selectedRegime: TaxRegime.NEW_REGIME,
        panVerificationStatus: PanVerificationStatus.UNVERIFIED,
        isPfEligible: true,
        isEsiEligible: true,
        isPtEligible: true,
        isLwfEligible: true,
      });
    }
    return profile;
  }

  async updateEmployeeTaxProfile(
    organizationId: string,
    employeeId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const fy = data.financialYear || '2025-2026';
    const profile = await this.repository.upsert(organizationId, employeeId, fy, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.TAX_PROFILE_UPDATE,
      resource: 'employee_tax_profiles',
      resourceId: profile.id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return profile;
  }
}
