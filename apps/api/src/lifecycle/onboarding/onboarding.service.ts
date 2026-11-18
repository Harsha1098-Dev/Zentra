import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OnboardingRepository } from './onboarding.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly repository: OnboardingRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAllFlows(organizationId: string) {
    return this.repository.findAllFlows(organizationId);
  }

  async findFlowById(id: string, organizationId: string) {
    const flow = await this.repository.findFlowById(id, organizationId);
    if (!flow) {
      throw new NotFoundException(`Onboarding flow '${id}' not found`);
    }
    return flow;
  }

  async createFlow(
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const flow = await this.repository.createFlow(organizationId, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONBOARDING_FLOW_CREATE,
      resource: 'onboarding_flows',
      resourceId: flow.id,
      details: { name: flow.name, itemsCount: flow.items?.length || 0 },
      ipAddress: ip,
      userAgent: ua,
    });

    return flow;
  }

  async updateFlow(
    id: string,
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findFlowById(id, organizationId);
    const updated = await this.repository.updateFlow(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONBOARDING_FLOW_UPDATE,
      resource: 'onboarding_flows',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async deleteFlow(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findFlowById(id, organizationId);
    const deleted = await this.repository.softDeleteFlow(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONBOARDING_FLOW_DELETE,
      resource: 'onboarding_flows',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  async setFlowActive(
    id: string,
    organizationId: string,
    isActive: boolean,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findFlowById(id, organizationId);
    const updated = await this.repository.setFlowActive(id, organizationId, isActive);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONBOARDING_FLOW_UPDATE,
      resource: 'onboarding_flows',
      resourceId: id,
      details: { isActive },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  // Runs
  async findAllRuns(
    organizationId: string,
    filters: { status?: string; employeeId?: string } = {},
  ) {
    return this.repository.findAllRuns(organizationId, filters);
  }

  async findRunById(id: string, organizationId: string) {
    const run = await this.repository.findRunById(id, organizationId);
    if (!run) {
      throw new NotFoundException(`Onboarding run '${id}' not found`);
    }
    return run;
  }

  async createRun(
    organizationId: string,
    data: {
      onboardingFlowId: string;
      employeeId: string;
      startDate?: string;
      expectedCompletionDate?: string | null;
    },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const flow = await this.repository.findFlowById(data.onboardingFlowId, organizationId);
    if (!flow) {
      throw new NotFoundException(`Onboarding flow '${data.onboardingFlowId}' not found`);
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${data.employeeId}' not found`);
    }

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const expectedCompletionDate = data.expectedCompletionDate
      ? new Date(data.expectedCompletionDate)
      : null;

    const run = await this.repository.createRun(
      organizationId,
      {
        onboardingFlowId: flow.id,
        employeeId: employee.id,
        startDate,
        expectedCompletionDate,
        createdBy: userId,
      },
      flow.items || [],
    );

    if (!run) {
      throw new BadRequestException('Failed to create onboarding run');
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONBOARDING_RUN_CREATE,
      resource: 'onboarding_runs',
      resourceId: run.id,
      details: { employeeId: employee.id, flowName: flow.name },
      ipAddress: ip,
      userAgent: ua,
    });

    // Notify employee of onboarding initiation
    if (employee.workEmail) {
      await this.emailService.sendNotification(
        employee.workEmail,
        'Welcome to Zentra! Your Onboarding Has Started',
        `Hello ${employee.firstName},\n\nYour onboarding process has begun. Please visit your Employee Portal under My Onboarding to complete your initial tasks.`,
      );
    }

    return run;
  }

  async completeRun(
    id: string,
    organizationId: string,
    userId: string,
    overrideMandatory: boolean = false,
    ip?: string,
    ua?: string,
  ) {
    const run = await this.findRunById(id, organizationId);

    if (run.status === 'COMPLETED') {
      return run;
    }

    // Check mandatory tasks
    if (!overrideMandatory) {
      const pendingMandatory = run.items.filter(
        (i) => i.flowItem?.isMandatory && i.status !== 'COMPLETED',
      );
      if (pendingMandatory.length > 0) {
        throw new BadRequestException(
          `Cannot complete onboarding: ${pendingMandatory.length} mandatory task(s) are still pending.`,
        );
      }
    }

    const completed = await this.repository.updateRun(id, organizationId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      progressPercentage: 100,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONBOARDING_RUN_COMPLETE,
      resource: 'onboarding_runs',
      resourceId: id,
      details: { overrideMandatory },
      ipAddress: ip,
      userAgent: ua,
    });

    return completed;
  }

  async completeTask(
    taskId: string,
    userId: string,
    data: { attachmentUrl?: string | null; comments?: string | null },
    ip?: string,
    ua?: string,
  ) {
    const item = await this.repository.findRunItemById(taskId);
    if (!item) {
      throw new NotFoundException(`Onboarding task '${taskId}' not found`);
    }

    const updatedItem = await this.repository.updateRunItem(taskId, {
      status: 'COMPLETED',
      completedBy: userId,
      completedAt: new Date(),
      attachmentUrl: data.attachmentUrl,
      comments: data.comments,
    });

    // Recalculate parent run progress
    const run = await this.prisma.onboardingRun.findUnique({
      where: { id: item.onboardingRunId },
      include: { items: true },
    });

    if (run && run.items.length > 0) {
      const completedCount = run.items.filter((i) => i.status === 'COMPLETED').length;
      const progressPercentage = Number(
        ((completedCount / run.items.length) * 100).toFixed(1),
      );

      const isAllComplete = completedCount === run.items.length;

      await this.prisma.onboardingRun.update({
        where: { id: run.id },
        data: {
          progressPercentage,
          status: isAllComplete ? 'COMPLETED' : run.status,
          completedAt: isAllComplete ? new Date() : run.completedAt,
        },
      });
    }

    await this.auditService.log({
      organizationId: item.run.organizationId,
      userId,
      action: AuditAction.ONBOARDING_TASK_COMPLETE,
      resource: 'onboarding_run_items',
      resourceId: taskId,
      details: { title: item.title, attachment: !!data.attachmentUrl },
      ipAddress: ip,
      userAgent: ua,
    });

    return updatedItem;
  }

  async reassignTask(
    taskId: string,
    organizationId: string,
    data: { ownerType: string; ownerId?: string | null },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const item = await this.repository.findRunItemById(taskId);
    if (!item || item.run.organizationId !== organizationId) {
      throw new NotFoundException(`Onboarding task '${taskId}' not found`);
    }

    const updated = await this.repository.updateRunItem(taskId, {
      ownerType: data.ownerType,
      ownerId: data.ownerId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.ONBOARDING_TASK_REASSIGN,
      resource: 'onboarding_run_items',
      resourceId: taskId,
      details: { newOwnerType: data.ownerType, newOwnerId: data.ownerId },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async getMyOnboardingTasks(organizationId: string, userId: string, email?: string) {
    let employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!employee && email) {
      employee = await this.prisma.employee.findFirst({
        where: { organizationId, workEmail: email, deletedAt: null },
      });
    }

    if (!employee) {
      return [];
    }

    return this.repository.findEmployeeTasks(organizationId, employee.id, userId);
  }

  async updateRun(id: string, organizationId: string, data: any) {
    await this.findRunById(id, organizationId);
    return this.repository.updateRun(id, organizationId, data);
  }
}
