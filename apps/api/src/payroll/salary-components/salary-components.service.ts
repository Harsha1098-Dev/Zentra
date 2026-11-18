import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SalaryComponentsRepository } from './salary-components.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, CalculationType } from '@zentra/shared-types';
import { SafeFormulaEvaluator } from '../payroll-engine/safe-evaluator';

@Injectable()
export class SalaryComponentsService {
  constructor(
    private readonly repo: SalaryComponentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    organizationId: string,
    filter?: { componentType?: string; isActive?: boolean; searchTerm?: string },
  ) {
    return this.repo.findAll(organizationId, filter);
  }

  async findById(id: string, organizationId: string) {
    const comp = await this.repo.findById(id, organizationId);
    if (!comp) {
      throw new NotFoundException(`Salary component '${id}' not found`);
    }
    return comp;
  }

  async create(organizationId: string, input: any, userId: string, ipAddress?: string) {
    // Check unique code
    const existingCode = await this.repo.findByCode(input.componentCode, organizationId);
    if (existingCode) {
      throw new ConflictException(
        `A salary component with code '${input.componentCode.toUpperCase()}' already exists`,
      );
    }

    // Check unique name
    const existingName = await this.repo.findByName(input.name, organizationId);
    if (existingName) {
      throw new ConflictException(
        `A salary component with name '${input.name}' already exists`,
      );
    }

    // Validate formula if formula-based
    if (input.calculationType === CalculationType.FORMULA_BASED && input.formula) {
      try {
        SafeFormulaEvaluator.evaluate(input.formula, {
          BASIC: 50000,
          GROSS: 100000,
          CTC: 120000,
        });
      } catch (err: any) {
        throw new BadRequestException(`Invalid formula syntax: ${err.message}`);
      }
    }

    const component = await this.repo.create(organizationId, input);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_COMPONENT_CREATE,
      entityType: 'SalaryComponent',
      entityId: component.id,
      newValues: component,
      ipAddress,
    });

    return component;
  }

  async update(id: string, organizationId: string, input: any, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);

    if (input.componentCode && input.componentCode.toUpperCase() !== existing.componentCode) {
      const duplicateCode = await this.repo.findByCode(input.componentCode, organizationId);
      if (duplicateCode && duplicateCode.id !== id) {
        throw new ConflictException(
          `A salary component with code '${input.componentCode.toUpperCase()}' already exists`,
        );
      }
    }

    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicateName = await this.repo.findByName(input.name, organizationId);
      if (duplicateName && duplicateName.id !== id) {
        throw new ConflictException(
          `A salary component with name '${input.name}' already exists`,
        );
      }
    }

    if (
      (input.calculationType === CalculationType.FORMULA_BASED || existing.calculationType === CalculationType.FORMULA_BASED) &&
      input.formula
    ) {
      try {
        SafeFormulaEvaluator.evaluate(input.formula, {
          BASIC: 50000,
          GROSS: 100000,
          CTC: 120000,
        });
      } catch (err: any) {
        throw new BadRequestException(`Invalid formula syntax: ${err.message}`);
      }
    }

    const updated = await this.repo.update(id, organizationId, input);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_COMPONENT_UPDATE,
      entityType: 'SalaryComponent',
      entityId: id,
      oldValues: existing,
      newValues: updated,
      ipAddress,
    });

    return updated;
  }

  async delete(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const comp = await this.findById(id, organizationId);
    if (comp.isSystemDefined) {
      throw new BadRequestException(
        'System-defined salary components cannot be deleted. You may deactivate them instead.',
      );
    }

    const deleted = await this.repo.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_COMPONENT_DELETE,
      entityType: 'SalaryComponent',
      entityId: id,
      oldValues: comp,
      ipAddress,
    });

    return { success: true, message: `Salary component '${comp.name}' deleted` };
  }

  async activate(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const comp = await this.findById(id, organizationId);
    const updated = await this.repo.setActive(id, organizationId, true);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_COMPONENT_ACTIVATE,
      entityType: 'SalaryComponent',
      entityId: id,
      newValues: { isActive: true },
      ipAddress,
    });

    return updated;
  }

  async deactivate(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const comp = await this.findById(id, organizationId);
    const updated = await this.repo.setActive(id, organizationId, false);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SALARY_COMPONENT_DEACTIVATE,
      entityType: 'SalaryComponent',
      entityId: id,
      newValues: { isActive: false },
      ipAddress,
    });

    return updated;
  }
}
