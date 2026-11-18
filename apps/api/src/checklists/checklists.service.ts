import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ChecklistsRepository } from './checklists.repository';
import { TasksService } from '../tasks/tasks.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import {
  CreateChecklistInput,
  UpdateChecklistInput,
  ExecuteChecklistInput,
  UpdateChecklistRunItemInput,
  ChecklistDto,
  ChecklistRunDto,
  ChecklistRunStatus,
  TaskPriority,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class ChecklistsService {
  constructor(
    private readonly checklistsRepo: ChecklistsRepository,
    private readonly tasksService: TasksService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async createChecklist(
    organizationId: string,
    input: CreateChecklistInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ChecklistDto> {
    const checklist = await this.checklistsRepo.createChecklist({
      organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      module: input.module || 'people',
      entityType: input.entityType,
      triggerEvent: input.triggerEvent || null,
      isActive: input.isActive !== undefined ? input.isActive : true,
      createdBy: actorUserId,
      items: input.items || [],
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.CHECKLIST_CREATE,
      entityType: 'Checklist',
      entityId: checklist.id,
      newValues: {
        name: checklist.name,
        module: checklist.module,
        itemsCount: checklist.items.length,
      },
      ipAddress,
      userAgent,
    });

    return this.mapChecklistToDto(checklist);
  }

  async getChecklists(organizationId: string, entityType?: string): Promise<ChecklistDto[]> {
    const list = await this.checklistsRepo.listChecklists(organizationId, entityType);
    return list.map((c) => this.mapChecklistToDto(c));
  }

  async getChecklistById(id: string, organizationId: string): Promise<ChecklistDto> {
    const checklist = await this.checklistsRepo.findChecklistById(id, organizationId);
    if (!checklist) {
      throw new NotFoundException(`Checklist with ID ${id} not found`);
    }
    return this.mapChecklistToDto(checklist);
  }

  async updateChecklist(
    id: string,
    organizationId: string,
    input: UpdateChecklistInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ChecklistDto> {
    const existing = await this.checklistsRepo.findChecklistById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Checklist with ID ${id} not found`);
    }

    const updated = await this.checklistsRepo.updateChecklist(id, organizationId, input);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.CHECKLIST_UPDATE,
      entityType: 'Checklist',
      entityId: id,
      newValues: input,
      ipAddress,
      userAgent,
    });

    return this.mapChecklistToDto(updated);
  }

  async deleteChecklist(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.checklistsRepo.findChecklistById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Checklist with ID ${id} not found`);
    }

    await this.checklistsRepo.softDeleteChecklist(id, organizationId);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.CHECKLIST_DELETE,
      entityType: 'Checklist',
      entityId: id,
      newValues: { isActive: false, deleted: true },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Checklist deleted successfully' };
  }

  async executeChecklist(
    id: string,
    organizationId: string,
    input: ExecuteChecklistInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ChecklistRunDto> {
    const checklist = await this.checklistsRepo.findChecklistById(id, organizationId);
    if (!checklist) {
      throw new NotFoundException(`Checklist with ID ${id} not found`);
    }

    const now = new Date();
    const runItems = checklist.items.map((item) => {
      let itemDueDate: Date | null = null;
      if (item.dueOffsetDays) {
        itemDueDate = new Date(now.getTime() + item.dueOffsetDays * 24 * 60 * 60 * 1000);
      }
      return {
        checklistItemId: item.id,
        title: item.title,
        ownerType: item.ownerType,
        ownerId: item.ownerId || null,
        dueDate: itemDueDate,
      };
    });

    const run = await this.checklistsRepo.createChecklistRun({
      organizationId,
      checklistId: checklist.id,
      entityType: input.entityType,
      entityId: input.entityId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      createdBy: actorUserId,
      items: runItems,
    });

    // Also auto-create Tasks for owners if ownerId is specified
    for (const runItem of run.items) {
      if (runItem.ownerId) {
        await this.tasksService.createTask(organizationId, {
          title: `[Checklist: ${checklist.name}] ${runItem.title}`,
          description: `Part of checklist "${checklist.name}" for ${input.entityType} #${input.entityId}`,
          priority: TaskPriority.MEDIUM,
          assignedTo: runItem.ownerId,
          dueDate: runItem.dueDate ? runItem.dueDate.toISOString() : undefined,
          sourceType: 'checklist',
          sourceId: run.id,
        });
      }
    }

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.CHECKLIST_EXECUTE,
      entityType: 'ChecklistRun',
      entityId: run.id,
      newValues: {
        checklistId: checklist.id,
        checklistName: checklist.name,
        entityType: input.entityType,
        entityId: input.entityId,
        itemsCount: run.items.length,
      },
      ipAddress,
      userAgent,
    });

    return this.mapChecklistRunToDto(run);
  }

  async getChecklistRuns(
    organizationId: string,
    entityType?: string,
    entityId?: string,
  ): Promise<ChecklistRunDto[]> {
    const runs = await this.checklistsRepo.listChecklistRuns(organizationId, entityType, entityId);
    return runs.map((r) => this.mapChecklistRunToDto(r));
  }

  async getChecklistRunById(id: string, organizationId: string): Promise<ChecklistRunDto> {
    const run = await this.checklistsRepo.findChecklistRunById(id, organizationId);
    if (!run) {
      throw new NotFoundException(`Checklist run with ID ${id} not found`);
    }
    return this.mapChecklistRunToDto(run);
  }

  async updateChecklistRunItem(
    runId: string,
    itemId: string,
    organizationId: string,
    input: UpdateChecklistRunItemInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ChecklistRunDto> {
    const run = await this.checklistsRepo.findChecklistRunById(runId, organizationId);
    if (!run) {
      throw new NotFoundException(`Checklist run with ID ${runId} not found`);
    }

    const existingItem = run.items.find((i) => i.id === itemId);
    if (!existingItem) {
      throw new NotFoundException(`Checklist run item ${itemId} not found`);
    }

    const isCompleted = input.status === 'completed';
    await this.checklistsRepo.updateChecklistRunItem(itemId, runId, {
      status: input.status,
      completedBy: isCompleted ? actorUserId : null,
      completedAt: isCompleted ? new Date() : null,
      comments: input.comments,
    });

    // Re-fetch run to check overall completion status
    const updatedRun = await this.checklistsRepo.findChecklistRunById(runId, organizationId);
    if (updatedRun) {
      const allDone = updatedRun.items.every((i) => i.status === 'completed' || i.status === 'skipped');
      const newRunStatus = allDone ? ChecklistRunStatus.COMPLETED : ChecklistRunStatus.IN_PROGRESS;

      if (updatedRun.status !== newRunStatus) {
        await this.checklistsRepo.updateChecklistRunStatus(runId, newRunStatus);
        updatedRun.status = newRunStatus;
      }
    }

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.CHECKLIST_ITEM_COMPLETE,
      entityType: 'ChecklistRunItem',
      entityId: itemId,
      newValues: {
        runId,
        status: input.status,
        comments: input.comments,
      },
      ipAddress,
      userAgent,
    });

    return this.mapChecklistRunToDto(updatedRun || run);
  }

  private mapChecklistToDto(c: any): ChecklistDto {
    return {
      id: c.id,
      organizationId: c.organizationId,
      name: c.name,
      description: c.description,
      module: c.module,
      entityType: c.entityType,
      triggerEvent: c.triggerEvent,
      isActive: c.isActive,
      createdBy: c.createdBy,
      items: (c.items || []).map((i: any) => ({
        id: i.id,
        checklistId: i.checklistId,
        title: i.title,
        description: i.description,
        ownerType: i.ownerType,
        ownerId: i.ownerId,
        ownerRole: i.ownerRole,
        dueOffsetDays: i.dueOffsetDays,
        isMandatory: i.isMandatory,
        executionOrder: i.executionOrder,
        createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
        updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : i.updatedAt,
      })),
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    };
  }

  private mapChecklistRunToDto(r: any): ChecklistRunDto {
    return {
      id: r.id,
      organizationId: r.organizationId,
      checklistId: r.checklistId,
      checklistName: r.checklist?.name,
      entityType: r.entityType,
      entityId: r.entityId,
      status: r.status as ChecklistRunStatus,
      dueDate: r.dueDate instanceof Date ? r.dueDate.toISOString() : r.dueDate,
      createdBy: r.createdBy,
      items: (r.items || []).map((i: any) => ({
        id: i.id,
        checklistRunId: i.checklistRunId,
        checklistItemId: i.checklistItemId,
        title: i.title,
        ownerType: i.ownerType,
        ownerId: i.ownerId,
        dueDate: i.dueDate instanceof Date ? i.dueDate.toISOString() : i.dueDate,
        status: i.status,
        completedBy: i.completedBy,
        completedAt: i.completedAt instanceof Date ? i.completedAt.toISOString() : i.completedAt,
        comments: i.comments,
        createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
        updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : i.updatedAt,
      })),
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    };
  }
}
