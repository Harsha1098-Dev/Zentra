import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DesignationsRepository } from './designations.repository';
import { GradesRepository } from '../grades/grades.repository';
import { DepartmentsRepository } from '../departments/departments.repository';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  CreateDesignationInput,
  DesignationDto,
  RecordStatus,
  UpdateDesignationInput,
} from '@zentra/shared-types';

@Injectable()
export class DesignationsService {
  constructor(
    private readonly designationsRepo: DesignationsRepository,
    private readonly gradesRepo: GradesRepository,
    private readonly deptsRepo: DepartmentsRepository,
    private readonly auditService: AuditService,
  ) {}

  private mapToDto(desig: any): DesignationDto {
    return {
      id: desig.id,
      organizationId: desig.organizationId,
      name: desig.name,
      code: desig.code,
      gradeId: desig.gradeId,
      gradeName: desig.grade?.name || null,
      gradeLevel: desig.grade?.level || null,
      departmentId: desig.departmentId,
      departmentName: desig.department?.name || null,
      description: desig.description,
      status: desig.status as RecordStatus,
      createdAt: desig.createdAt.toISOString(),
      updatedAt: desig.updatedAt.toISOString(),
    };
  }

  async getDesignations(
    organizationId: string,
    status?: string,
    search?: string,
  ): Promise<DesignationDto[]> {
    const list = await this.designationsRepo.findAll(organizationId, status, search);
    return list.map((d) => this.mapToDto(d));
  }

  async getDesignationById(id: string, organizationId: string): Promise<DesignationDto> {
    const desig = await this.designationsRepo.findById(id, organizationId);
    if (!desig) {
      throw new NotFoundException(`Designation with ID ${id} not found in this organization`);
    }
    return this.mapToDto(desig);
  }

  async createDesignation(
    organizationId: string,
    data: CreateDesignationInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DesignationDto> {
    const existingName = await this.designationsRepo.findByName(organizationId, data.name);
    if (existingName) {
      throw new ConflictException(`A designation with the name "${data.name}" already exists`);
    }

    const existingCode = await this.designationsRepo.findByCode(organizationId, data.code);
    if (existingCode) {
      throw new ConflictException(`A designation with the code "${data.code}" already exists`);
    }

    if (data.gradeId) {
      const grade = await this.gradesRepo.findById(data.gradeId, organizationId);
      if (!grade) {
        throw new NotFoundException(`Grade with ID ${data.gradeId} not found in this organization`);
      }
    }

    if (data.departmentId) {
      const dept = await this.deptsRepo.findById(data.departmentId, organizationId);
      if (!dept) {
        throw new NotFoundException(`Department with ID ${data.departmentId} not found in this organization`);
      }
    }

    const created = await this.designationsRepo.create(organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DESIGNATION_CREATE,
      entityType: 'Designation',
      entityId: created.id,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(created);
  }

  async updateDesignation(
    id: string,
    organizationId: string,
    data: UpdateDesignationInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DesignationDto> {
    const existing = await this.getDesignationById(id, organizationId);

    if (data.name && data.name !== existing.name) {
      const conflict = await this.designationsRepo.findByName(organizationId, data.name);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A designation with the name "${data.name}" already exists`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const conflict = await this.designationsRepo.findByCode(organizationId, data.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A designation with the code "${data.code}" already exists`);
      }
    }

    if (data.gradeId) {
      const grade = await this.gradesRepo.findById(data.gradeId, organizationId);
      if (!grade) {
        throw new NotFoundException(`Grade with ID ${data.gradeId} not found in this organization`);
      }
    }

    if (data.departmentId) {
      const dept = await this.deptsRepo.findById(data.departmentId, organizationId);
      if (!dept) {
        throw new NotFoundException(`Department with ID ${data.departmentId} not found in this organization`);
      }
    }

    const updated = await this.designationsRepo.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DESIGNATION_UPDATE,
      entityType: 'Designation',
      entityId: id,
      oldValues: existing,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async activateDesignation(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DesignationDto> {
    await this.getDesignationById(id, organizationId);
    const updated = await this.designationsRepo.setStatus(id, organizationId, 'ACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DESIGNATION_ACTIVATE,
      entityType: 'Designation',
      entityId: id,
      newValues: { status: 'ACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deactivateDesignation(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DesignationDto> {
    await this.getDesignationById(id, organizationId);
    const updated = await this.designationsRepo.setStatus(id, organizationId, 'INACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DESIGNATION_DEACTIVATE,
      entityType: 'Designation',
      entityId: id,
      newValues: { status: 'INACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }
}
