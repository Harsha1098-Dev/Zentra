import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SalaryStructuresRepository } from './salary-structures.repository';
import { SalaryComponentsRepository } from '../salary-components/salary-components.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, SalaryComponentType } from '@zentra/shared-types';
import { SafeFormulaEvaluator } from '../payroll-engine/safe-evaluator';

@Injectable()
export class SalaryStructuresService {
  constructor(
    private readonly repo: SalaryStructuresRepository,
    private readonly componentsRepo: SalaryComponentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filter?: { status?: string }) {
    return this.repo.findAll(organizationId, filter);
  }

  async findById(id: string, organizationId: string) {
    const struct = await this.repo.findById(id, organizationId);
    if (!struct) {
      throw new NotFoundException(`Salary structure '${id}' not found`);
    }
    return struct;
  }

  async create(organizationId: string, input: any, userId: string, ipAddress?: string) {
    const existingName = await this.repo.findByName(input.name, organizationId);
    if (existingName) {
      throw new ConflictException(`A salary structure with name '${input.name}' already exists`);
    }

    // Validate components
    await this.validateStructureComponents(organizationId, input.components);

    // If default, clear previous default
    if (input.isDefault) {
      await this.repo.clearDefault(organizationId);
    }

    const created = await this.repo.create(organizationId, {
      ...input,
      createdBy: userId,
    });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_STRUCTURE_CREATE,
      entityType: 'SalaryStructure',
      entityId: created.id,
      newValues: created,
      ipAddress,
    });

    return created;
  }

  async update(id: string, organizationId: string, input: any, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);

    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicateName = await this.repo.findByName(input.name, organizationId);
      if (duplicateName && duplicateName.id !== id) {
        throw new ConflictException(`A salary structure with name '${input.name}' already exists`);
      }
    }

    if (input.components) {
      await this.validateStructureComponents(organizationId, input.components);
    }

    if (input.isDefault && !existing.isDefault) {
      await this.repo.clearDefault(organizationId);
    }

    const updated = await this.repo.update(id, organizationId, input);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_STRUCTURE_UPDATE,
      entityType: 'SalaryStructure',
      entityId: id,
      oldValues: existing,
      newValues: updated,
      ipAddress,
    });

    return updated;
  }

  async delete(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);

    // Check if there are active assignments
    const assignments = await this.repo.findAssignments(id, organizationId);
    const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');
    if (activeAssignments.length > 0) {
      throw new BadRequestException(
        `Cannot delete salary structure '${existing.name}' because it is assigned to ${activeAssignments.length} active employee(s)`,
      );
    }

    await this.repo.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_STRUCTURE_DELETE,
      entityType: 'SalaryStructure',
      entityId: id,
      oldValues: existing,
      ipAddress,
    });

    return { success: true, message: `Salary structure '${existing.name}' deleted` };
  }

  async getAssignments(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.repo.findAssignments(id, organizationId);
  }

  private async validateStructureComponents(
    organizationId: string,
    components: any[],
  ): Promise<void> {
    if (!components || components.length === 0) {
      throw new BadRequestException('A salary structure must contain at least one component');
    }

    // Load actual components to verify existence and check for earning component
    const formulaMap: Record<string, string> = {};
    let hasEarning = false;

    for (const c of components) {
      const comp = await this.componentsRepo.findById(c.salaryComponentId, organizationId);
      if (!comp) {
        throw new BadRequestException(`Salary component '${c.salaryComponentId}' not found`);
      }
      if (comp.componentType === SalaryComponentType.EARNING) {
        hasEarning = true;
      }
      if (c.formula || comp.formula) {
        formulaMap[comp.componentCode] = c.formula || comp.formula;
      }
    }

    if (!hasEarning) {
      throw new BadRequestException(
        'A salary structure must contain at least one earning component (e.g. Basic Salary)',
      );
    }

    // Circular dependency check
    const cycle = SafeFormulaEvaluator.detectCircularDependencies(formulaMap);
    if (cycle) {
      throw new BadRequestException(
        `Circular formula reference detected among components: ${cycle.join(' -> ')}`,
      );
    }
  }
}
