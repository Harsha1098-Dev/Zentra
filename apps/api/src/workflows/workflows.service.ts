import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WorkflowsRepository } from './workflows.repository';
import { WorkflowEngineService } from './workflow-engine.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateWorkflowRuleInput,
  UpdateWorkflowRuleInput,
  WorkflowQueryFilterInput,
  WorkflowRuleDto,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowsRepo: WorkflowsRepository,
    private readonly workflowEngine: WorkflowEngineService,
    private readonly auditService: AuditService,
  ) {}

  async createRule(
    organizationId: string,
    input: CreateWorkflowRuleInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<WorkflowRuleDto> {
    const created = await this.workflowsRepo.createRule({
      organizationId,
      name: input.name,
      description: input.description,
      module: input.module || 'people',
      entityType: input.entityType,
      triggerEvent: input.triggerEvent,
      conditions: input.conditions || [],
      conditionMatchType: input.conditionMatchType || 'ALL',
      isActive: input.isActive !== undefined ? input.isActive : true,
      priority: input.priority || 0,
      createdBy: actorUserId,
      actions: input.actions || [],
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.WORKFLOW_CREATE,
      entityType: 'WorkflowRule',
      entityId: created.id,
      newValues: {
        name: created.name,
        entityType: created.entityType,
        triggerEvent: created.triggerEvent,
        actionsCount: created.actions.length,
      },
      ipAddress,
      userAgent,
    });

    return this.mapRuleToDto(created);
  }

  async getRuleById(id: string, organizationId: string): Promise<WorkflowRuleDto> {
    const rule = await this.workflowsRepo.findRuleById(id, organizationId);
    if (!rule) {
      throw new NotFoundException(`Workflow rule with ID ${id} not found`);
    }
    return this.mapRuleToDto(rule);
  }

  async listRules(organizationId: string, filter: WorkflowQueryFilterInput) {
    const result = await this.workflowsRepo.listRules(organizationId, filter);
    return {
      ...result,
      data: result.data.map((r) => this.mapRuleToDto(r)),
    };
  }

  async updateRule(
    id: string,
    organizationId: string,
    input: UpdateWorkflowRuleInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<WorkflowRuleDto> {
    const existing = await this.workflowsRepo.findRuleById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Workflow rule with ID ${id} not found`);
    }

    const updated = await this.workflowsRepo.updateRule(id, organizationId, input);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.WORKFLOW_UPDATE,
      entityType: 'WorkflowRule',
      entityId: id,
      oldValues: {
        name: existing.name,
        isActive: existing.isActive,
      },
      newValues: {
        name: updated.name,
        isActive: updated.isActive,
      },
      ipAddress,
      userAgent,
    });

    return this.mapRuleToDto(updated);
  }

  async deleteRule(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const existing = await this.workflowsRepo.findRuleById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Workflow rule with ID ${id} not found`);
    }

    await this.workflowsRepo.softDeleteRule(id, organizationId);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.WORKFLOW_DELETE,
      entityType: 'WorkflowRule',
      entityId: id,
      oldValues: { name: existing.name },
      ipAddress,
      userAgent,
    });
  }

  async activateRule(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<WorkflowRuleDto> {
    return this.updateRule(
      id,
      organizationId,
      { isActive: true },
      actorUserId,
      ipAddress,
      userAgent,
    );
  }

  async deactivateRule(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<WorkflowRuleDto> {
    return this.updateRule(
      id,
      organizationId,
      { isActive: false },
      actorUserId,
      ipAddress,
      userAgent,
    );
  }

  async testRule(
    id: string,
    organizationId: string,
    context: Record<string, any>,
  ): Promise<{
    matched: boolean;
    ruleName: string;
    conditionResults: Array<{ field: string; operator: string; expected: any; actual: any; passed: boolean }>;
    simulatedActions: Array<{ actionType: string; actionConfig: any }>;
  }> {
    const rule = await this.workflowsRepo.findRuleById(id, organizationId);
    if (!rule) {
      throw new NotFoundException(`Workflow rule with ID ${id} not found`);
    }

    const conditions = (rule.conditions as any) || [];
    const matchType = (rule.conditionMatchType as any) || 'ALL';

    const evalResult = this.workflowEngine.evaluateConditions(
      conditions,
      matchType,
      context,
    );

    return {
      matched: evalResult.matched,
      ruleName: rule.name,
      conditionResults: evalResult.results,
      simulatedActions: rule.actions.map((a) => ({
        actionType: a.actionType,
        actionConfig: a.actionConfig,
      })),
    };
  }

  async listExecutions(id: string, organizationId: string) {
    const rule = await this.workflowsRepo.findRuleById(id, organizationId);
    if (!rule) {
      throw new NotFoundException(`Workflow rule with ID ${id} not found`);
    }
    return this.workflowsRepo.listExecutions(id, organizationId);
  }

  private mapRuleToDto(rule: any): WorkflowRuleDto {
    return {
      id: rule.id,
      organizationId: rule.organizationId,
      name: rule.name,
      description: rule.description,
      module: rule.module,
      entityType: rule.entityType,
      triggerEvent: rule.triggerEvent,
      conditions: (rule.conditions as any) || [],
      conditionMatchType: rule.conditionMatchType,
      isActive: rule.isActive,
      priority: rule.priority,
      createdBy: rule.createdBy,
      actions: (rule.actions || []).map((a: any) => ({
        id: a.id,
        workflowRuleId: a.workflowRuleId,
        actionType: a.actionType,
        actionConfig: a.actionConfig,
        executionOrder: a.executionOrder,
        isActive: a.isActive,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
        updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
      })),
      createdAt: rule.createdAt instanceof Date ? rule.createdAt.toISOString() : rule.createdAt,
      updatedAt: rule.updatedAt instanceof Date ? rule.updatedAt.toISOString() : rule.updatedAt,
    };
  }
}
