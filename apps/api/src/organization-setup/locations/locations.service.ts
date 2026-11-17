import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  CreateLocationInput,
  LocationDto,
  RecordStatus,
  UpdateLocationInput,
} from '@zentra/shared-types';

@Injectable()
export class LocationsService {
  constructor(
    private readonly locationsRepo: LocationsRepository,
    private readonly auditService: AuditService,
  ) {}

  private mapToDto(loc: any): LocationDto {
    return {
      id: loc.id,
      organizationId: loc.organizationId,
      name: loc.name,
      code: loc.code,
      country: loc.country,
      state: loc.state,
      city: loc.city,
      address: loc.address,
      postalCode: loc.postalCode,
      timezone: loc.timezone,
      phone: loc.phone,
      email: loc.email,
      isHeadquarters: loc.isHeadquarters,
      status: loc.status as RecordStatus,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
    };
  }

  async getLocations(organizationId: string, status?: string, search?: string): Promise<LocationDto[]> {
    const list = await this.locationsRepo.findAll(organizationId, status, search);
    return list.map((loc) => this.mapToDto(loc));
  }

  async getLocationById(id: string, organizationId: string): Promise<LocationDto> {
    const loc = await this.locationsRepo.findById(id, organizationId);
    if (!loc) {
      throw new NotFoundException(`Location with ID ${id} not found in this organization`);
    }
    return this.mapToDto(loc);
  }

  async createLocation(
    organizationId: string,
    data: CreateLocationInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LocationDto> {
    // Enforce name uniqueness within organization
    const existingName = await this.locationsRepo.findByName(organizationId, data.name);
    if (existingName) {
      throw new ConflictException(`A location with the name "${data.name}" already exists`);
    }

    // Enforce code uniqueness within organization
    const existingCode = await this.locationsRepo.findByCode(organizationId, data.code);
    if (existingCode) {
      throw new ConflictException(`A location with the code "${data.code}" already exists`);
    }

    const created = await this.locationsRepo.create(organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LOCATION_CREATE,
      entityType: 'Location',
      entityId: created.id,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(created);
  }

  async updateLocation(
    id: string,
    organizationId: string,
    data: UpdateLocationInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LocationDto> {
    const existing = await this.getLocationById(id, organizationId);

    if (data.name && data.name !== existing.name) {
      const conflict = await this.locationsRepo.findByName(organizationId, data.name);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A location with the name "${data.name}" already exists`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const conflict = await this.locationsRepo.findByCode(organizationId, data.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A location with the code "${data.code}" already exists`);
      }
    }

    const updated = await this.locationsRepo.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LOCATION_UPDATE,
      entityType: 'Location',
      entityId: id,
      oldValues: existing,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async activateLocation(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LocationDto> {
    await this.getLocationById(id, organizationId);
    const updated = await this.locationsRepo.setStatus(id, organizationId, 'ACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LOCATION_ACTIVATE,
      entityType: 'Location',
      entityId: id,
      newValues: { status: 'ACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deactivateLocation(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LocationDto> {
    await this.getLocationById(id, organizationId);
    const updated = await this.locationsRepo.setStatus(id, organizationId, 'INACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.LOCATION_DEACTIVATE,
      entityType: 'Location',
      entityId: id,
      newValues: { status: 'INACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }
}
