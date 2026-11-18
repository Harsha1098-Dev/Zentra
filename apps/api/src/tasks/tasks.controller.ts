import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateTaskSchema,
  CreateTaskInput,
  UpdateTaskSchema,
  UpdateTaskInput,
  ReassignTaskSchema,
  ReassignTaskInput,
  TaskQueryFilterSchema,
  TaskQueryFilterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermissions(PermissionCode.TASK_READ)
  async getTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(TaskQueryFilterSchema)) query: TaskQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.tasksService.getTasks(
      user.organizationId,
      query,
      user.roles || [],
      user.id,
    );
  }

  @Post()
  @RequirePermissions(PermissionCode.TASK_CREATE)
  async createTask(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateTaskSchema)) body: CreateTaskInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.tasksService.createTask(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.TASK_READ)
  async getTaskById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.tasksService.getTaskById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.TASK_UPDATE)
  async updateTask(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateTaskSchema)) body: UpdateTaskInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.tasksService.updateTask(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/complete')
  @RequirePermissions(PermissionCode.TASK_COMPLETE)
  async completeTask(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.tasksService.completeTask(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/reassign')
  @RequirePermissions(PermissionCode.TASK_REASSIGN)
  async reassignTask(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ReassignTaskSchema)) body: ReassignTaskInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.tasksService.reassignTask(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
