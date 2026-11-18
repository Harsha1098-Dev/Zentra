import { Injectable, Logger } from '@nestjs/common';
import { WorkflowsRepository } from './workflows.repository';
import { ApprovalsService } from '../approvals/approvals.service';
import { TasksService } from '../tasks/tasks.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConditionMatchType,
  ConditionOperator,
  WorkflowActionType,
  WorkflowExecutionStatus,
  WorkflowConditionInput,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    private readonly workflowsRepo: WorkflowsRepository,
    private readonly approvalsService: ApprovalsService,
    private readonly tasksService: TasksService,
    private readonly checklistsService: ChecklistsService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Evaluates if conditions match the context payload
   */
  evaluateConditions(
    conditions: WorkflowConditionInput[] | any[],
    matchType: ConditionMatchType = ConditionMatchType.ALL,
    context: Record<string, any>,
  ): { matched: boolean; results: Array<{ field: string; operator: string; expected: any; actual: any; passed: boolean }> } {
    if (!conditions || conditions.length === 0) {
      return { matched: true, results: [] };
    }

    const results = conditions.map((cond) => {
      const actualVal = this.getNestedValue(context, cond.field);
      const passed = this.compareValues(actualVal, cond.operator, cond.value);
      return {
        field: cond.field,
        operator: cond.operator,
        expected: cond.value,
        actual: actualVal,
        passed,
      };
    });

    let matched = false;
    if (matchType === ConditionMatchType.ANY) {
      matched = results.some((r) => r.passed);
    } else {
      // Default ALL
      matched = results.every((r) => r.passed);
    }

    return { matched, results };
  }

  /**
   * Resolves nested dot-notation paths (e.g. "employee.department.name")
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }

  /**
   * Compares actual vs expected values based on ConditionOperator
   */
  private compareValues(actual: any, operator: ConditionOperator | string, expected: any): boolean {
    const op = String(operator).toLowerCase();

    switch (op) {
      case 'equals':
      case 'equal':
      case 'eq':
        return String(actual).toLowerCase() === String(expected).toLowerCase();

      case 'not_equals':
      case 'not_equal':
      case 'ne':
        return String(actual).toLowerCase() !== String(expected).toLowerCase();

      case 'contains':
        if (actual === null || actual === undefined) return false;
        return String(actual).toLowerCase().includes(String(expected).toLowerCase());

      case 'not_contains':
        if (actual === null || actual === undefined) return true;
        return !String(actual).toLowerCase().includes(String(expected).toLowerCase());

      case 'starts_with':
        if (actual === null || actual === undefined) return false;
        return String(actual).toLowerCase().startsWith(String(expected).toLowerCase());

      case 'ends_with':
        if (actual === null || actual === undefined) return false;
        return String(actual).toLowerCase().endsWith(String(expected).toLowerCase());

      case 'greater_than':
      case 'gt':
        return Number(actual) > Number(expected);

      case 'greater_than_or_equal':
      case 'gte':
        return Number(actual) >= Number(expected);

      case 'less_than':
      case 'lt':
        return Number(actual) < Number(expected);

      case 'less_than_or_equal':
      case 'lte':
        return Number(actual) <= Number(expected);

      case 'in':
        if (!Array.isArray(expected)) {
          expected = String(expected).split(',').map((s) => s.trim());
        }
        return expected.map((v: any) => String(v).toLowerCase()).includes(String(actual).toLowerCase());

      case 'not_in':
        if (!Array.isArray(expected)) {
          expected = String(expected).split(',').map((s) => s.trim());
        }
        return !expected.map((v: any) => String(v).toLowerCase()).includes(String(actual).toLowerCase());

      case 'is_empty':
        return actual === null || actual === undefined || actual === '' || (Array.isArray(actual) && actual.length === 0);

      case 'is_not_empty':
        return actual !== null && actual !== undefined && actual !== '' && (!Array.isArray(actual) || actual.length > 0);

      default:
        return false;
    }
  }

  /**
   * Main entry point to evaluate and trigger workflow rules for an event
   */
  async trigger(params: {
    organizationId: string;
    entityType: string;
    entityId: string;
    triggerEvent: string;
    context: Record<string, any>;
    actorUserId?: string;
  }): Promise<Array<{ ruleId: string; ruleName: string; status: string; executionId?: string; error?: string }>> {
    const { organizationId, entityType, entityId, triggerEvent, context, actorUserId } = params;

    const rules = await this.workflowsRepo.findMatchingRules(
      organizationId,
      entityType,
      triggerEvent,
    );

    const outcomes: Array<{ ruleId: string; ruleName: string; status: string; executionId?: string; error?: string }> = [];

    for (const rule of rules) {
      const conditions = (rule.conditions as any) || [];
      const matchType = (rule.conditionMatchType as ConditionMatchType) || ConditionMatchType.ALL;

      const evalResult = this.evaluateConditions(conditions, matchType, context);
      if (!evalResult.matched) {
        continue;
      }

      // Record execution
      const execution = await this.workflowsRepo.createExecution({
        organizationId,
        workflowRuleId: rule.id,
        entityType,
        entityId,
        triggerEvent,
        status: WorkflowExecutionStatus.RUNNING,
        context,
        startedAt: new Date(),
      });

      try {
        // Execute rule actions
        for (const action of rule.actions) {
          if (!action.isActive) continue;
          await this.executeAction(action.actionType, action.actionConfig, {
            organizationId,
            entityType,
            entityId,
            actorUserId,
            context,
            ruleId: rule.id,
          });
        }

        await this.prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: WorkflowExecutionStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        outcomes.push({
          ruleId: rule.id,
          ruleName: rule.name,
          status: WorkflowExecutionStatus.COMPLETED,
          executionId: execution.id,
        });
      } catch (err: any) {
        this.logger.error(`Error executing workflow rule ${rule.id}: ${err.message}`, err.stack);

        await this.prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: WorkflowExecutionStatus.FAILED,
            errorMessage: err.message || 'Workflow execution error',
            completedAt: new Date(),
          },
        });

        outcomes.push({
          ruleId: rule.id,
          ruleName: rule.name,
          status: WorkflowExecutionStatus.FAILED,
          executionId: execution.id,
          error: err.message,
        });
      }
    }

    return outcomes;
  }

  /**
   * Executes an individual workflow action
   */
  async executeAction(
    actionType: string,
    actionConfig: any,
    ctx: {
      organizationId: string;
      entityType: string;
      entityId: string;
      actorUserId?: string;
      context: Record<string, any>;
      ruleId: string;
    },
  ): Promise<any> {
    const config = actionConfig || {};

    switch (actionType) {
      case WorkflowActionType.SEND_NOTIFICATION:
      case 'send_notification': {
        const title = this.interpolate(config.title || 'Notification', ctx.context);
        const message = this.interpolate(config.message || '', ctx.context);
        const recipientUserId = config.recipientUserId || ctx.actorUserId;

        if (recipientUserId) {
          try {
            await this.emailService.sendNotification(
              recipientUserId,
              title,
              message,
            );
          } catch {
            // Notification dispatch
          }
        }
        return { delivered: true };
      }

      case WorkflowActionType.SEND_EMAIL:
      case 'send_email': {
        const to = this.interpolate(config.to || '', ctx.context);
        const subject = this.interpolate(config.subject || 'Zentra Notification', ctx.context);
        const body = this.interpolate(config.body || config.html || '', ctx.context);

        if (to) {
          await this.emailService.sendNotification(to, subject, body);
        }
        return { sent: true, to };
      }

      case WorkflowActionType.CREATE_TASK:
      case 'create_task': {
        const title = this.interpolate(config.title || 'New Task', ctx.context);
        const description = this.interpolate(config.description || '', ctx.context);
        const assignedTo = config.assignedTo || ctx.actorUserId;

        return this.tasksService.createTask(
          ctx.organizationId,
          {
            title,
            description,
            assignedTo,
            priority: (config.priority || 'medium') as any,
            sourceType: ctx.entityType,
            sourceId: ctx.entityId,
            dueDate: config.dueDate ? String(config.dueDate) : undefined,
          },
          ctx.actorUserId,
        );
      }

      case WorkflowActionType.CREATE_CHECKLIST_RUN:
      case 'create_checklist_run': {
        if (!config.checklistId) {
          throw new Error('checklistId is required to create a checklist run');
        }

        return this.checklistsService.executeChecklist(
          config.checklistId,
          ctx.organizationId,
          {
            entityType: ctx.entityType,
            entityId: ctx.entityId,
            dueDate: config.dueDate ? String(config.dueDate) : undefined,
          },
          ctx.actorUserId,
        );
      }

      case WorkflowActionType.CREATE_APPROVAL_FLOW:
      case 'create_approval_flow': {
        return this.approvalsService.createApprovalFlow({
          organizationId: ctx.organizationId,
          requestType: config.requestType || 'workflow_request',
          entityType: ctx.entityType,
          entityId: ctx.entityId,
          requestedBy: ctx.actorUserId || ctx.context.requestedBy || 'system',
          steps: config.steps || [
            {
              stepName: 'Manager Approval',
              approverType: 'reporting_manager' as any,
            },
          ],
          metadata: {
            ...config.metadata,
            ruleId: ctx.ruleId,
            context: ctx.context,
          },
          actorUserId: ctx.actorUserId,
        });
      }

      case WorkflowActionType.UPDATE_FIELD:
      case 'update_field': {
        const fieldName = config.field;
        const fieldValue = config.value;

        if (!fieldName) {
          throw new Error('Field name is required for update_field action');
        }

        // Generic update for supported entity types
        if (ctx.entityType.toLowerCase() === 'employee') {
          await (this.prisma as any).employee.update({
            where: { id: ctx.entityId },
            data: { [fieldName]: fieldValue },
          });
        }
        return { updated: true, field: fieldName, value: fieldValue };
      }

      case WorkflowActionType.CHANGE_STATUS:
      case 'change_status': {
        const status = config.status;
        if (!status) {
          throw new Error('Status value is required for change_status action');
        }

        if (ctx.entityType.toLowerCase() === 'employee') {
          await (this.prisma as any).employee.update({
            where: { id: ctx.entityId },
            data: { employmentStatus: status },
          });
        }
        return { changed: true, status };
      }

      case WorkflowActionType.ADD_AUDIT_LOG:
      case 'add_audit_log': {
        await this.auditService.log({
          organizationId: ctx.organizationId,
          actorUserId: ctx.actorUserId || 'system',
          action: (config.action as AuditAction) || AuditAction.WORKFLOW_EXECUTE,
          entityType: ctx.entityType,
          entityId: ctx.entityId,
          newValues: {
            message: this.interpolate(config.message || 'Workflow executed', ctx.context),
            ruleId: ctx.ruleId,
          },
        });
        return { logged: true };
      }

      case WorkflowActionType.CALL_WEBHOOK:
      case 'call_webhook': {
        if (!config.url) {
          throw new Error('Webhook URL is required');
        }

        try {
          // Native fetch for webhooks
          await fetch(config.url, {
            method: config.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.headers || {}),
            },
            body: JSON.stringify({
              organizationId: ctx.organizationId,
              entityType: ctx.entityType,
              entityId: ctx.entityId,
              event: ctx.context.event,
              timestamp: new Date().toISOString(),
              data: ctx.context,
            }),
          });
        } catch (err: any) {
          this.logger.warn(`Webhook call to ${config.url} failed: ${err.message}`);
        }
        return { called: true, url: config.url };
      }

      default:
        this.logger.warn(`Unknown workflow action type: ${actionType}`);
        return { skipped: true };
    }
  }

  /**
   * Replaces mustache-like placeholders: {{user.email}} or {{employee.name}}
   */
  private interpolate(template: string, context: Record<string, any>): string {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, path) => {
      const val = this.getNestedValue(context, path);
      return val !== undefined && val !== null ? String(val) : '';
    });
  }
}
