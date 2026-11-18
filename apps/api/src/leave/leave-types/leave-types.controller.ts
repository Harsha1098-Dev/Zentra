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
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { LeaveTypesService } from './leave-types.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateLeaveTypeSchema,
  CreateLeaveTypeInput,
  UpdateLeaveTypeSchema,
  UpdateLeaveTypeInput,
  LeaveTypeQueryFilterSchema,
  LeaveTypeQueryFilterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('leave-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get()
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getLeaveTypes(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(LeaveTypeQueryFilterSchema)) filter: LeaveTypeQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveTypesService.getLeaveTypes(user.organizationId, filter);
  }

  @Post()
  @RequirePermissions(PermissionCode.LEAVE_TYPE_CREATE)
  async createLeaveType(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateLeaveTypeSchema)) input: CreateLeaveTypeInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveTypesService.createLeaveType(
      user.organizationId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getLeaveTypeById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveTypesService.getLeaveTypeById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.LEAVE_TYPE_UPDATE)
  async updateLeaveType(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateLeaveTypeSchema)) input: UpdateLeaveTypeInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveTypesService.updateLeaveType(
      id,
      user.organizationId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id/activate')
  @RequirePermissions(PermissionCode.LEAVE_TYPE_UPDATE)
  async activateLeaveType(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveTypesService.activateLeaveType(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PermissionCode.LEAVE_TYPE_UPDATE)
  async deactivateLeaveType(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveTypesService.deactivateLeaveType(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PermissionCode.LEAVE_TYPE_DELETE)
  async deleteLeaveType(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    await this.leaveTypesService.deleteLeaveType(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
