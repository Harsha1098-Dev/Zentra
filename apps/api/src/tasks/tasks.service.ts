import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { UsersRepository } from '../users/users.repository';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ReassignTaskInput,
  TaskQueryFilterInput,
  TaskDto,
  TaskStatus,
  TaskPriority,
  AuditAction,
  RoleCode,
} from '@zentra/shared-types';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepo: TasksRepository,
    private readonly usersRepo: UsersRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async createTask(
    organizationId: string,
    input: CreateTaskInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TaskDto> {
    const dueDate = input.dueDate ? new Date(input.dueDate) : null;

    const task = await this.tasksRepo.create({
      organizationId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assignedTo: input.assignedTo || null,
      assignedBy: actorUserId || null,
      dueDate,
      priority: input.priority || TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      sourceType: input.sourceType || 'manual',
      sourceId: input.sourceId || null,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.TASK_CREATE,
      entityType: 'Task',
      entityId: task.id,
      newValues: {
        title: task.title,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        priority: task.priority,
      },
      ipAddress,
      userAgent,
    });

    // Send task assigned notification
    if (task.assignedTo) {
      const assignee = await this.usersRepo.findById(task.assignedTo);
      if (assignee && assignee.email) {
        await this.emailService.sendNotification(
          assignee.email,
          'New Task Assigned: ' + task.title,
          `You have been assigned a new task: "${task.title}". Priority: ${task.priority}. Due: ${task.dueDate ? task.dueDate.toDateString() : 'None'}.`,
        );
      }
    }

    return this.mapToDto(task);
  }

  async getTasks(
    organizationId: string,
    filter: TaskQueryFilterInput,
    userRoles: string[],
    userId?: string,
  ) {
    const isManager =
      userRoles.includes(RoleCode.SUPER_ADMIN) ||
      userRoles.includes(RoleCode.HR_ADMIN) ||
      userRoles.includes(RoleCode.MANAGER);

    const result = await this.tasksRepo.list(organizationId, filter, userId, isManager);
    const dtos = await Promise.all(result.data.map((t) => this.mapToDto(t)));

    return {
      ...result,
      data: dtos,
    };
  }

  async getTaskById(id: string, organizationId: string): Promise<TaskDto> {
    const task = await this.tasksRepo.findById(id, organizationId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return this.mapToDto(task);
  }

  async updateTask(
    id: string,
    organizationId: string,
    input: UpdateTaskInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TaskDto> {
    const existing = await this.tasksRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const updateData: any = {};
    if (input.title) updateData.title = input.title.trim();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.priority) updateData.priority = input.priority;
    if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;

    const updated = await this.tasksRepo.update(id, organizationId, updateData);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.TASK_UPDATE,
      entityType: 'Task',
      entityId: id,
      oldValues: {
        title: existing.title,
        priority: existing.priority,
        dueDate: existing.dueDate,
        assignedTo: existing.assignedTo,
      },
      newValues: updateData,
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async completeTask(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TaskDto> {
    const existing = await this.tasksRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const updated = await this.tasksRepo.update(id, organizationId, {
      status: TaskStatus.COMPLETED,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.TASK_COMPLETE,
      entityType: 'Task',
      entityId: id,
      newValues: { status: TaskStatus.COMPLETED },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async reassignTask(
    id: string,
    organizationId: string,
    input: ReassignTaskInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TaskDto> {
    const existing = await this.tasksRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const newAssignee = await this.usersRepo.findById(input.assignedTo);
    if (!newAssignee) {
      throw new NotFoundException('Target assignee user not found');
    }

    const updated = await this.tasksRepo.update(id, organizationId, {
      assignedTo: input.assignedTo,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.TASK_REASSIGN,
      entityType: 'Task',
      entityId: id,
      oldValues: { assignedTo: existing.assignedTo },
      newValues: { assignedTo: input.assignedTo, comments: input.comments },
      ipAddress,
      userAgent,
    });

    if (newAssignee.email) {
      await this.emailService.sendNotification(
        newAssignee.email,
        'Task Reassigned: ' + updated.title,
        `Task "${updated.title}" has been reassigned to you. ${input.comments ? 'Comments: ' + input.comments : ''}`,
      );
    }

    return this.mapToDto(updated, newAssignee);
  }

  private async mapToDto(task: any, knownAssignee?: any): Promise<TaskDto> {
    let assignedToName = null;
    let assignedByName = null;

    if (task.assignedTo) {
      if (knownAssignee) {
        assignedToName = `${knownAssignee.firstName || ''} ${knownAssignee.lastName || ''}`.trim();
      } else {
        const user = await this.usersRepo.findById(task.assignedTo);
        if (user) {
          assignedToName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        }
      }
    }

    if (task.assignedBy) {
      const creator = await this.usersRepo.findById(task.assignedBy);
      if (creator) {
        assignedByName = `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email;
      }
    }

    return {
      id: task.id,
      organizationId: task.organizationId,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      assignedToName,
      assignedBy: task.assignedBy,
      dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate,
      priority: task.priority as TaskPriority,
      status: task.status as TaskStatus,
      sourceType: task.sourceType,
      sourceId: task.sourceId,
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
      updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
    };
  }
}
