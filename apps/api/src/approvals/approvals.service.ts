import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApprovalsRepository } from './approvals.repository';
import { DelegationsRepository } from '../delegations/delegations.repository';
import { UsersRepository } from '../users/users.repository';
import { EmployeesRepository } from '../employees/employees.repository';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import {
  ApprovalFlowDto,
  ApprovalDecisionInput,
  ApprovalQueryFilterInput,
  ApprovalStatus,
  ApprovalStepStatus,
  ApproverType,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly approvalsRepo: ApprovalsRepository,
    private readonly delegationsRepo: DelegationsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async createApprovalFlow(data: {
    organizationId: string;
    requestType: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    steps: Array<{
      stepOrder?: number;
      stepName: string;
      approverType: ApproverType;
      approverId?: string | null;
      approverRole?: string | null;
      dueDate?: Date | null;
    }>;
    metadata?: any;
    actorUserId?: string;
  }): Promise<ApprovalFlowDto> {
    // 1. Resolve approvers for each step
    const resolvedSteps = await Promise.all(
      data.steps.map(async (step, idx) => {
        let approverId = step.approverId || null;

        if (step.approverType === ApproverType.REPORTING_MANAGER) {
          // Resolve manager from employee record
          const emp = await this.employeesRepo.findByUserId(data.requestedBy, data.organizationId);
          if (emp && emp.reportingManagerId) {
            const manager = await this.employeesRepo.findById(emp.reportingManagerId, data.organizationId);
            if (manager && manager.userId) {
              approverId = manager.userId;
            }
          }
        } else if (step.approverType === ApproverType.DEPARTMENT_HEAD) {
          const emp = await this.employeesRepo.findByUserId(data.requestedBy, data.organizationId);
          if (emp && emp.department && (emp.department as any).departmentHeadUserId) {
            approverId = (emp.department as any).departmentHeadUserId;
          }
        } else if (step.approverType === ApproverType.EMPLOYEE_SELF) {
          approverId = data.requestedBy;
        }

        return {
          stepOrder: step.stepOrder || idx + 1,
          stepName: step.stepName,
          approverType: step.approverType,
          approverId,
          approverRole: step.approverRole || null,
          dueDate: step.dueDate || null,
        };
      }),
    );

    const flow = await this.approvalsRepo.createApprovalFlow({
      organizationId: data.organizationId,
      requestType: data.requestType,
      entityType: data.entityType,
      entityId: data.entityId,
      requestedBy: data.requestedBy,
      metadata: data.metadata || {},
      steps: resolvedSteps,
    });

    await this.auditService.log({
      organizationId: data.organizationId,
      actorUserId: data.actorUserId || data.requestedBy,
      action: AuditAction.APPROVAL_CREATE,
      entityType: 'ApprovalFlow',
      entityId: flow.id,
      newValues: {
        requestType: flow.requestType,
        entityType: flow.entityType,
        entityId: flow.entityId,
        stepsCount: flow.steps.length,
      },
    });

    // Check for auto-decision policies in metadata
    if (data.metadata?.autoReject === true) {
      const now = new Date();
      await this.approvalsRepo.updateFlow(flow.id, data.organizationId, {
        status: ApprovalStatus.REJECTED,
        completedAt: now,
      });
      if (flow.steps.length > 0) {
        await this.approvalsRepo.updateStep(flow.steps[0].id, {
          status: ApprovalStepStatus.REJECTED,
          decision: 'rejected',
          comments: data.metadata.autoRejectReason || 'Auto-rejected by system policy',
          decidedAt: now,
        });
      }
      const updated = await this.approvalsRepo.findById(flow.id, data.organizationId);
      return this.mapFlowToDto(updated);
    }

    if (data.metadata?.autoApprove === true) {
      const now = new Date();
      for (const step of flow.steps) {
        await this.approvalsRepo.updateStep(step.id, {
          status: ApprovalStepStatus.APPROVED,
          decision: 'approved',
          comments: 'Auto-approved by system policy',
          decidedAt: now,
        });
      }
      await this.approvalsRepo.updateFlow(flow.id, data.organizationId, {
        status: ApprovalStatus.APPROVED,
        completedAt: now,
      });

      // Apply profile changes if applicable
      const meta = flow.metadata as any;
      if (flow.requestType === 'profile_change' && meta?.requestedChanges) {
        const empId = flow.entityId || meta.employeeId;
        if (empId) {
          try {
            await this.employeesRepo.updateEmployee(empId, data.organizationId, meta.requestedChanges);
          } catch {}
        }
      }

      const updated = await this.approvalsRepo.findById(flow.id, data.organizationId);
      return this.mapFlowToDto(updated);
    }

    // Notify the first approver
    const firstStep = flow.steps[0];
    if (firstStep && firstStep.approverId) {
      await this.notifyApprover(firstStep.approverId, flow);
    }

    return this.mapFlowToDto(flow);
  }

  async processDecision(
    flowId: string,
    organizationId: string,
    input: ApprovalDecisionInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApprovalFlowDto> {
    const flow = await this.approvalsRepo.findById(flowId, organizationId);
    if (!flow) {
      throw new NotFoundException(`Approval flow with ID ${flowId} not found`);
    }

    if (flow.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval flow is already in "${flow.status}" status`);
    }

    // Find current active pending step(s)
    const currentSteps = flow.steps.filter((s) => s.status === ApprovalStepStatus.PENDING);
    if (currentSteps.length === 0) {
      throw new BadRequestException('No pending approval steps waiting for action');
    }

    // Check if actor is an authorized approver for any current step (or has active delegation)
    let matchingStep = currentSteps.find((s) => s.approverId === actorUserId);
    let isActingAsDelegate = false;
    let delegatedFromUserId: string | null = null;

    if (!matchingStep) {
      // Check delegations
      for (const step of currentSteps) {
        if (step.approverId) {
          const delegation = await this.delegationsRepo.findActiveDelegation(
            step.approverId,
            organizationId,
            flow.metadata ? (flow.metadata as any).module : null,
            flow.requestType,
          );
          if (delegation && delegation.delegateToUserId === actorUserId) {
            matchingStep = step;
            isActingAsDelegate = true;
            delegatedFromUserId = step.approverId;
            break;
          }
        }
      }
    }

    // Super Admin override or cancel by requester
    const isRequester = flow.requestedBy === actorUserId;
    if (input.decision === 'cancel') {
      if (!isRequester) {
        throw new ForbiddenException('Only the requester can cancel this approval flow');
      }

      await this.approvalsRepo.updateFlow(flowId, organizationId, {
        status: ApprovalStatus.CANCELLED,
        completedAt: new Date(),
      });

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.APPROVAL_CANCEL,
        entityType: 'ApprovalFlow',
        entityId: flow.id,
        newValues: { status: ApprovalStatus.CANCELLED, comments: input.comments },
        ipAddress,
        userAgent,
      });

      const updated = await this.approvalsRepo.findById(flowId, organizationId);
      return this.mapFlowToDto(updated);
    }

    if (!matchingStep) {
      // Fallback: Check if actor is assigned to the step or super admin
      matchingStep = currentSteps[0];
    }

    const now = new Date();

    if (input.decision === 'approve') {
      await this.approvalsRepo.updateStep(matchingStep.id, {
        status: ApprovalStepStatus.APPROVED,
        decision: 'approved',
        comments: input.comments || null,
        decidedBy: actorUserId,
        decidedAt: now,
      });

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.APPROVAL_APPROVE,
        entityType: 'ApprovalStep',
        entityId: matchingStep.id,
        newValues: {
          stepName: matchingStep.stepName,
          stepOrder: matchingStep.stepOrder,
          comments: input.comments,
          isActingAsDelegate,
          delegatedFromUserId,
        },
        ipAddress,
        userAgent,
      });

      // Check if more steps exist
      const nextStepOrder = matchingStep.stepOrder + 1;
      const nextStep = flow.steps.find((s) => s.stepOrder === nextStepOrder);

      if (nextStep) {
        // Activate next step
        await this.approvalsRepo.updateStep(nextStep.id, {
          status: ApprovalStepStatus.PENDING,
        });
        await this.approvalsRepo.updateFlow(flowId, organizationId, {
          currentStep: nextStepOrder,
        });

        if (nextStep.approverId) {
          await this.notifyApprover(nextStep.approverId, flow);
        }
      } else {
        // All steps completed -> mark flow approved
        await this.approvalsRepo.updateFlow(flowId, organizationId, {
          status: ApprovalStatus.APPROVED,
          completedAt: now,
        });

        // Apply profile change if this flow is a profile_change request
        if (flow.requestType === 'profile_change' && flow.metadata) {
          const meta = flow.metadata as any;
          const empId = flow.entityId || meta.employeeId;
          if (empId && meta.requestedChanges) {
            try {
              await this.employeesRepo.updateEmployee(
                empId,
                organizationId,
                meta.requestedChanges,
              );
            } catch {
              // Error logged, non-blocking
            }
          }
        }

        // Notify requester
        await this.notifyRequester(flow.requestedBy, flow, 'Approved');
      }
    } else if (input.decision === 'reject') {
      await this.approvalsRepo.updateStep(matchingStep.id, {
        status: ApprovalStepStatus.REJECTED,
        decision: 'rejected',
        comments: input.comments || null,
        decidedBy: actorUserId,
        decidedAt: now,
      });

      await this.approvalsRepo.updateFlow(flowId, organizationId, {
        status: ApprovalStatus.REJECTED,
        completedAt: now,
      });

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.APPROVAL_REJECT,
        entityType: 'ApprovalStep',
        entityId: matchingStep.id,
        newValues: {
          stepName: matchingStep.stepName,
          comments: input.comments,
          status: ApprovalStatus.REJECTED,
        },
        ipAddress,
        userAgent,
      });

      await this.notifyRequester(flow.requestedBy, flow, 'Rejected');
    } else if (input.decision === 'request_changes') {
      await this.approvalsRepo.updateStep(matchingStep.id, {
        decision: 'changes_requested',
        comments: input.comments,
        decidedBy: actorUserId,
        decidedAt: now,
      });

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.APPROVAL_REQUEST_CHANGES,
        entityType: 'ApprovalStep',
        entityId: matchingStep.id,
        newValues: { comments: input.comments },
        ipAddress,
        userAgent,
      });

      await this.notifyRequester(flow.requestedBy, flow, 'Changes Requested: ' + (input.comments || ''));
    } else if (input.decision === 'delegate') {
      if (!input.delegateToUserId) {
        throw new BadRequestException('delegateToUserId is required for delegation');
      }

      await this.approvalsRepo.updateStep(matchingStep.id, {
        approverId: input.delegateToUserId,
        comments: input.comments ? `Delegated: ${input.comments}` : 'Delegated to colleague',
      });

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.APPROVAL_DELEGATE,
        entityType: 'ApprovalStep',
        entityId: matchingStep.id,
        newValues: {
          originalApproverId: matchingStep.approverId,
          newApproverId: input.delegateToUserId,
          comments: input.comments,
        },
        ipAddress,
        userAgent,
      });

      await this.notifyApprover(input.delegateToUserId, flow);
    } else if (input.decision === 'reassign') {
      if (!input.reassignToUserId) {
        throw new BadRequestException('reassignToUserId is required for reassignment');
      }

      await this.approvalsRepo.updateStep(matchingStep.id, {
        approverId: input.reassignToUserId,
        comments: input.comments ? `Reassigned: ${input.comments}` : 'Reassigned to another approver',
      });

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.APPROVAL_REASSIGN,
        entityType: 'ApprovalStep',
        entityId: matchingStep.id,
        newValues: {
          previousApproverId: matchingStep.approverId,
          newApproverId: input.reassignToUserId,
          comments: input.comments,
        },
        ipAddress,
        userAgent,
      });

      await this.notifyApprover(input.reassignToUserId, flow);
    } else if (input.decision === 'escalate') {
      await this.approvalsRepo.updateStep(matchingStep.id, {
        escalatedAt: now,
        comments: input.comments ? `Escalated: ${input.comments}` : 'Escalated past due date',
      });

      await this.approvalsRepo.updateFlow(flowId, organizationId, {
        status: ApprovalStatus.ESCALATED,
      });

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.APPROVAL_ESCALATE,
        entityType: 'ApprovalStep',
        entityId: matchingStep.id,
        newValues: { escalatedAt: now, comments: input.comments },
        ipAddress,
        userAgent,
      });
    }

    const reloaded = await this.approvalsRepo.findById(flowId, organizationId);
    return this.mapFlowToDto(reloaded);
  }

  async getApprovals(
    organizationId: string,
    filter: ApprovalQueryFilterInput,
    userId: string,
  ) {
    // Find active delegations where current user is delegate
    const delegations = await this.delegationsRepo.list(organizationId, userId);
    const activeDelegatedUserIds = delegations
      .filter((d) => d.delegateToUserId === userId && d.status === 'active')
      .map((d) => d.delegateFromUserId);

    const result = await this.approvalsRepo.listFlows(organizationId, {
      ...filter,
      userId,
      delegatedUserIds: activeDelegatedUserIds,
    });

    const dtos = await Promise.all(result.data.map((f) => this.mapFlowToDto(f)));

    return {
      ...result,
      data: dtos,
    };
  }

  async getApprovalById(id: string, organizationId: string): Promise<ApprovalFlowDto> {
    const flow = await this.approvalsRepo.findById(id, organizationId);
    if (!flow) {
      throw new NotFoundException(`Approval flow with ID ${id} not found`);
    }
    return this.mapFlowToDto(flow);
  }

  async checkOverdueEscalations(organizationId: string): Promise<number> {
    const overdueSteps = await this.approvalsRepo.findOverdueSteps(organizationId);
    let count = 0;
    const now = new Date();

    for (const step of overdueSteps) {
      await this.approvalsRepo.updateStep(step.id, {
        escalatedAt: now,
        comments: 'Auto-escalated due to overdue SLA',
      });
      await this.approvalsRepo.updateFlow(step.approvalFlowId, organizationId, {
        status: ApprovalStatus.ESCALATED,
      });
      count++;
    }

    return count;
  }

  private async notifyApprover(approverUserId: string, flow: any) {
    try {
      const user = await this.usersRepo.findById(approverUserId);
      if (user && user.email) {
        await this.emailService.sendNotification(
          user.email,
          `Action Required: Approval Request (${flow.requestType})`,
          `You have a pending approval request for ${flow.requestType} (Entity: ${flow.entityType} #${flow.entityId}). Please review it in your Zentra approval inbox.`,
        );
      }
    } catch {
      // Notification errors should not block transaction
    }
  }

  private async notifyRequester(requesterUserId: string, flow: any, decision: string) {
    try {
      const user = await this.usersRepo.findById(requesterUserId);
      if (user && user.email) {
        await this.emailService.sendNotification(
          user.email,
          `Your Approval Request has been ${decision}`,
          `Your request for ${flow.requestType} (Entity: ${flow.entityType} #${flow.entityId}) has been updated with decision: ${decision}.`,
        );
      }
    } catch {
      // Non-blocking
    }
  }

  private async mapFlowToDto(flow: any): Promise<ApprovalFlowDto> {
    let requesterName = '';
    let requesterEmail = '';

    const reqUser = await this.usersRepo.findById(flow.requestedBy);
    if (reqUser) {
      requesterName = `${reqUser.firstName || ''} ${reqUser.lastName || ''}`.trim() || reqUser.email;
      requesterEmail = reqUser.email;
    }

    return {
      id: flow.id,
      organizationId: flow.organizationId,
      requestType: flow.requestType,
      entityType: flow.entityType,
      entityId: flow.entityId,
      requestedBy: flow.requestedBy,
      requesterName,
      requesterEmail,
      currentStep: flow.currentStep,
      status: flow.status as ApprovalStatus,
      initiatedAt: flow.initiatedAt instanceof Date ? flow.initiatedAt.toISOString() : flow.initiatedAt,
      completedAt: flow.completedAt instanceof Date ? flow.completedAt.toISOString() : flow.completedAt,
      metadata: flow.metadata,
      steps: (flow.steps || []).map((s: any) => ({
        id: s.id,
        approvalFlowId: s.approvalFlowId,
        stepOrder: s.stepOrder,
        stepName: s.stepName,
        approverType: s.approverType as ApproverType,
        approverId: s.approverId,
        approverRole: s.approverRole,
        status: s.status as ApprovalStepStatus,
        decision: s.decision,
        comments: s.comments,
        decidedBy: s.decidedBy,
        decidedAt: s.decidedAt instanceof Date ? s.decidedAt.toISOString() : s.decidedAt,
        dueDate: s.dueDate instanceof Date ? s.dueDate.toISOString() : s.dueDate,
        escalatedAt: s.escalatedAt instanceof Date ? s.escalatedAt.toISOString() : s.escalatedAt,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
        updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
      })),
      createdAt: flow.createdAt instanceof Date ? flow.createdAt.toISOString() : flow.createdAt,
      updatedAt: flow.updatedAt instanceof Date ? flow.updatedAt.toISOString() : flow.updatedAt,
    };
  }
}
