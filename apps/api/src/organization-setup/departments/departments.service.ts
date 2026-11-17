import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  CreateDepartmentInput,
  DepartmentDto,
  DepartmentTreeNodeDto,
  RecordStatus,
  UpdateDepartmentInput,
} from '@zentra/shared-types';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly deptsRepo: DepartmentsRepository,
    private readonly auditService: AuditService,
  ) {}

  private mapToDto(dept: any): DepartmentDto {
    const headName = dept.departmentHeadUser
      ? `${dept.departmentHeadUser.firstName || ''} ${dept.departmentHeadUser.lastName || ''}`.trim() ||
        dept.departmentHeadUser.email
      : null;

    return {
      id: dept.id,
      organizationId: dept.organizationId,
      name: dept.name,
      code: dept.code,
      parentDepartmentId: dept.parentDepartmentId,
      parentDepartmentName: dept.parentDepartment?.name || null,
      departmentHeadUserId: dept.departmentHeadUserId,
      departmentHeadName: headName,
      description: dept.description,
      status: dept.status as RecordStatus,
      employeeCount: 0, // Employees not implemented yet
      childCount: dept._count?.childDepartments || dept.childDepartments?.length || 0,
      createdAt: dept.createdAt.toISOString(),
      updatedAt: dept.updatedAt.toISOString(),
    };
  }

  async getDepartments(
    organizationId: string,
    status?: string,
    search?: string,
  ): Promise<DepartmentDto[]> {
    const list = await this.deptsRepo.findAll(organizationId, status, search);
    return list.map((dept) => this.mapToDto(dept));
  }

  async getDepartmentById(id: string, organizationId: string): Promise<DepartmentDto> {
    const dept = await this.deptsRepo.findById(id, organizationId);
    if (!dept) {
      throw new NotFoundException(`Department with ID ${id} not found in this organization`);
    }
    return this.mapToDto(dept);
  }

  async createDepartment(
    organizationId: string,
    data: CreateDepartmentInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DepartmentDto> {
    // Unique name per org
    const existingName = await this.deptsRepo.findByName(organizationId, data.name);
    if (existingName) {
      throw new ConflictException(`A department with the name "${data.name}" already exists`);
    }

    // Unique code per org
    const existingCode = await this.deptsRepo.findByCode(organizationId, data.code);
    if (existingCode) {
      throw new ConflictException(`A department with the code "${data.code}" already exists`);
    }

    // Verify parent exists if provided
    if (data.parentDepartmentId) {
      const parent = await this.deptsRepo.findById(data.parentDepartmentId, organizationId);
      if (!parent) {
        throw new NotFoundException(`Parent department with ID ${data.parentDepartmentId} does not exist`);
      }
    }

    const created = await this.deptsRepo.create(organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DEPARTMENT_CREATE,
      entityType: 'Department',
      entityId: created.id,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(created);
  }

  /**
   * Validates that newParentId is not id, and id is not an ancestor of newParentId
   */
  private async validateNoCircularHierarchy(
    id: string,
    newParentId: string,
    organizationId: string,
  ) {
    if (id === newParentId) {
      throw new BadRequestException('A department cannot be its own parent');
    }

    let currentParentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (currentParentId === id) {
        throw new BadRequestException(
          'Circular department hierarchy detected: a department cannot be a child of its own descendant.',
        );
      }
      if (visited.has(currentParentId)) {
        break;
      }
      visited.add(currentParentId);

      const parentDept = await this.deptsRepo.findById(currentParentId, organizationId);
      currentParentId = parentDept?.parentDepartmentId || null;
    }
  }

  async updateDepartment(
    id: string,
    organizationId: string,
    data: UpdateDepartmentInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DepartmentDto> {
    const existing = await this.getDepartmentById(id, organizationId);

    if (data.name && data.name !== existing.name) {
      const conflict = await this.deptsRepo.findByName(organizationId, data.name);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A department with the name "${data.name}" already exists`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const conflict = await this.deptsRepo.findByCode(organizationId, data.code);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`A department with the code "${data.code}" already exists`);
      }
    }

    if (data.parentDepartmentId) {
      await this.validateNoCircularHierarchy(id, data.parentDepartmentId, organizationId);
    }

    const updated = await this.deptsRepo.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DEPARTMENT_UPDATE,
      entityType: 'Department',
      entityId: id,
      oldValues: existing,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async activateDepartment(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DepartmentDto> {
    await this.getDepartmentById(id, organizationId);
    const updated = await this.deptsRepo.setStatus(id, organizationId, 'ACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DEPARTMENT_ACTIVATE,
      entityType: 'Department',
      entityId: id,
      newValues: { status: 'ACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async deactivateDepartment(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DepartmentDto> {
    const existing = await this.deptsRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if has active child departments
    const activeChildren = existing.childDepartments?.filter((c) => c.status === 'ACTIVE') || [];
    if (activeChildren.length > 0) {
      throw new BadRequestException(
        `Cannot deactivate department because it has ${activeChildren.length} active sub-departments. Deactivate or reassign them first.`,
      );
    }

    const updated = await this.deptsRepo.setStatus(id, organizationId, 'INACTIVE');

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.DEPARTMENT_DEACTIVATE,
      entityType: 'Department',
      entityId: id,
      newValues: { status: 'INACTIVE' },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async getDepartmentTree(organizationId: string): Promise<DepartmentTreeNodeDto[]> {
    const all = await this.deptsRepo.findAll(organizationId);
    const dtos: DepartmentTreeNodeDto[] = all.map((d) => ({
      ...this.mapToDto(d),
      children: [],
    }));

    const map = new Map<string, DepartmentTreeNodeDto>();
    dtos.forEach((d) => map.set(d.id, d));

    const rootNodes: DepartmentTreeNodeDto[] = [];

    dtos.forEach((node) => {
      if (node.parentDepartmentId && map.has(node.parentDepartmentId)) {
        const parent = map.get(node.parentDepartmentId)!;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }
}
