import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { GradesRepository } from './grades.repository';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  CreateGradeInput,
  GradeDto,
  RecordStatus,
  UpdateGradeInput,
} from '@zentra/shared-types';

@Injectable()
export class GradesService {
  constructor(
    private readonly gradesRepo: GradesRepository,
    private readonly auditService: AuditService,
  ) {}

  private mapToDto(grade: any): GradeDto {
    return {
      id: grade.id,
      organizationId: grade.organizationId,
      name: grade.name,
      code: grade.code,
      level: grade.level,
      description: grade.description,
      status: grade.status as RecordStatus,
      createdAt: grade.createdAt.toISOString(),
      updatedAt: grade.updatedAt.toISOString(),
    };
  }

  async getGrades(organizationId: string, status?: string): Promise<GradeDto[]> {
    const list = await this.gradesRepo.findAll(organizationId, status);
    return list.map((g) => this.mapToDto(g));
  }

  async getGradeById(id: string, organizationId: string): Promise<GradeDto> {
    const grade = await this.gradesRepo.findById(id, organizationId);
    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found in this organization`);
    }
    return this.mapToDto(grade);
  }

  async createGrade(
    organizationId: string,
    data: CreateGradeInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GradeDto> {
    const existingName = await this.gradesRepo.findByName(organizationId, data.name);
    if (existingName) {
      throw new ConflictException(`A grade with the name "${data.name}" already exists`);
    }

    const existingCode = await this.gradesRepo.findByCode(organizationId, data.code);
    if (existingCode) {
      throw new ConflictException(`A grade with the code "${data.code}" already exists`);
    }

    const existingLevel = await this.gradesRepo.findByLevel(organizationId, data.level);
    if (existingLevel) {
      throw new ConflictException(`A grade with level "${data.level}" already exists (${existingLevel.name})`);
    }

    const created = await this.gradesRepo.create(organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.GRADE_CREATE,
      entityType: 'Grade',
      entityId: created.id,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(created);
  }

  async updateGrade(
    id: string,
    organizationId: string,
    data: UpdateGradeInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GradeDto> {
    const existing = await this.getGradeById(id, organizationId);

    if (data.name && data.name !== existing.name) {
      const conflict = await this.gradesRepo.findByName(organizationId, data.name);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A grade with the name "${data.name}" already exists`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const conflict = await this.gradesRepo.findByCode(organizationId, data.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A grade with the code "${data.code}" already exists`);
      }
    }

    if (data.level !== undefined && data.level !== existing.level) {
      const conflict = await this.gradesRepo.findByLevel(organizationId, data.level);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A grade with level "${data.level}" already exists (${conflict.name})`);
      }
    }

    const updated = await this.gradesRepo.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.GRADE_UPDATE,
      entityType: 'Grade',
      entityId: id,
      oldValues: existing,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async activateGrade(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GradeDto> {
    await this.getGradeById(id, organizationId);
    const updated = await this.gradesRepo.setStatus(id, organizationId, 'ACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.GRADE_ACTIVATE,
      entityType: 'Grade',
      entityId: id,
      newValues: { status: 'ACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deactivateGrade(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GradeDto> {
    await this.getGradeById(id, organizationId);
    const updated = await this.gradesRepo.setStatus(id, organizationId, 'INACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.GRADE_DEACTIVATE,
      entityType: 'Grade',
      entityId: id,
      newValues: { status: 'INACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }
}
