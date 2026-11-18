import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ChecklistsService } from './checklists.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateChecklistSchema,
  CreateChecklistInput,
  UpdateChecklistSchema,
  UpdateChecklistInput,
  ExecuteChecklistSchema,
  ExecuteChecklistInput,
  UpdateChecklistRunItemSchema,
  UpdateChecklistRunItemInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get('checklists')
  @RequirePermissions(PermissionCode.CHECKLIST_READ)
  async getChecklists(
    @CurrentUser() user: AuthenticatedUser,
    @Query('entityType') entityType?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.checklistsService.getChecklists(user.organizationId, entityType);
  }

  @Post('checklists')
  @RequirePermissions(PermissionCode.CHECKLIST_CREATE)
  async createChecklist(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateChecklistSchema)) body: CreateChecklistInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.checklistsService.createChecklist(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('checklists/:id')
  @RequirePermissions(PermissionCode.CHECKLIST_READ)
  async getChecklistById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.checklistsService.getChecklistById(id, user.organizationId);
  }

  @Patch('checklists/:id')
  @RequirePermissions(PermissionCode.CHECKLIST_UPDATE)
  async updateChecklist(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateChecklistSchema)) body: UpdateChecklistInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.checklistsService.updateChecklist(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Delete('checklists/:id')
  @RequirePermissions(PermissionCode.CHECKLIST_DELETE)
  async deleteChecklist(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.checklistsService.deleteChecklist(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Post('checklists/:id/execute')
  @RequirePermissions(PermissionCode.CHECKLIST_EXECUTE)
  async executeChecklist(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ExecuteChecklistSchema)) body: ExecuteChecklistInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.checklistsService.executeChecklist(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('checklist-runs')
  @RequirePermissions(PermissionCode.CHECKLIST_READ)
  async getChecklistRuns(
    @CurrentUser() user: AuthenticatedUser,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.checklistsService.getChecklistRuns(user.organizationId, entityType, entityId);
  }

  @Get('checklist-runs/:id')
  @RequirePermissions(PermissionCode.CHECKLIST_READ)
  async getChecklistRunById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.checklistsService.getChecklistRunById(id, user.organizationId);
  }

  @Patch('checklist-runs/:id/items/:itemId')
  @RequirePermissions(PermissionCode.CHECKLIST_EXECUTE)
  async updateChecklistRunItem(
    @Param('id') runId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateChecklistRunItemSchema)) body: UpdateChecklistRunItemInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.checklistsService.updateChecklistRunItem(
      runId,
      itemId,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
