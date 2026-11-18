import { Injectable, NotFoundException } from '@nestjs/common';
import { StatutorySettingsRepository } from './statutory-settings.repository';
import { AuditService } from '../../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class StatutorySettingsService {
  constructor(
    private readonly repository: StatutorySettingsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getSettings(organizationId: string) {
    let settings = await this.repository.findByOrganizationId(organizationId);
    if (!settings) {
      // Auto-initialize default statutory setting if none exists
      settings = await this.repository.upsert(organizationId, {
        financialYear: '2025-2026',
        defaultTaxRegime: 'NEW_REGIME',
        pfEnabled: true,
        esiEnabled: true,
        ptEnabled: true,
        lwfEnabled: true,
        isDeclarationWindowOpen: true,
        isProofSubmissionOpen: false,
      });
    }
    return settings;
  }

  async updateSettings(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const updated = await this.repository.upsert(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.STATUTORY_SETTING_UPDATE,
      resource: 'statutory_settings',
      resourceId: updated.id,
      details: data,
      ipAddress,
      userAgent,
    });

    return updated;
  }
}
