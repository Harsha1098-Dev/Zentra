import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyProfileRepository } from './company-profile.repository';
import { StorageService } from '../storage.service';
import { AuditService } from '../../audit/audit.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import {
  AuditAction,
  CompanyProfileDto,
  UpdateCompanyProfileInput,
} from '@zentra/shared-types';

@Injectable()
export class CompanyProfileService {
  constructor(
    private readonly profileRepo: CompanyProfileRepository,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  private mapToDto(profile: any, orgName: string): CompanyProfileDto {
    return {
      id: profile.id,
      organizationId: profile.organizationId,
      name: orgName,
      legalName: profile.legalName,
      logoUrl: profile.logoUrl,
      website: profile.website,
      industry: profile.industry,
      companySize: profile.companySize,
      registrationNumber: profile.registrationNumber,
      taxIdNumber: profile.taxIdNumber,
      country: profile.country,
      state: profile.state,
      city: profile.city,
      address: profile.address,
      timezone: profile.timezone,
      defaultCurrency: profile.defaultCurrency,
      primaryContactName: profile.primaryContactName,
      primaryContactEmail: profile.primaryContactEmail,
      primaryContactPhone: profile.primaryContactPhone,
      description: profile.description,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async getProfile(organizationId: string): Promise<CompanyProfileDto> {
    const org = await this.orgsService.getOrganizationById(organizationId);
    let profile = await this.profileRepo.findByOrganizationId(organizationId);

    if (!profile) {
      profile = await this.profileRepo.upsertProfile(organizationId, {});
    }

    return this.mapToDto(profile, profile.organization?.name || org.name);
  }

  async updateProfile(
    organizationId: string,
    data: UpdateCompanyProfileInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CompanyProfileDto> {
    const current = await this.getProfile(organizationId);
    const updated = await this.profileRepo.upsertProfile(organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.COMPANY_PROFILE_UPDATE,
      entityType: 'CompanyProfile',
      entityId: updated.id,
      oldValues: current,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated, updated.organization?.name || current.name);
  }

  async uploadLogo(
    organizationId: string,
    file: Express.Multer.File,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ logoUrl: string }> {
    const profile = await this.getProfile(organizationId);

    // If an existing logo exists, delete previous file
    if (profile.logoUrl) {
      await this.storageService.deleteLogo(profile.logoUrl);
    }

    const logoUrl = await this.storageService.saveLogo(organizationId, file);
    await this.profileRepo.updateLogoUrl(organizationId, logoUrl);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.COMPANY_LOGO_UPLOAD,
      entityType: 'CompanyProfile',
      entityId: profile.id,
      newValues: { logoUrl },
      ipAddress,
      userAgent,
    });

    return { logoUrl };
  }

  async removeLogo(
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    const profile = await this.getProfile(organizationId);

    if (profile.logoUrl) {
      await this.storageService.deleteLogo(profile.logoUrl);
      await this.profileRepo.updateLogoUrl(organizationId, null);

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.COMPANY_LOGO_REMOVE,
        entityType: 'CompanyProfile',
        entityId: profile.id,
        oldValues: { logoUrl: profile.logoUrl },
        newValues: { logoUrl: null },
        ipAddress,
        userAgent,
      });
    }

    return { success: true };
  }
}
