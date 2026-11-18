import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { LeaveRequestsService } from './leave-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateLeaveRequestSchema,
  CreateLeaveRequestInput,
  CancelLeaveRequestSchema,
  CancelLeaveRequestInput,
  LeaveRequestQueryFilterSchema,
  LeaveRequestQueryFilterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Post()
  @RequirePermissions(PermissionCode.LEAVE_APPLY)
  async createLeaveRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateLeaveRequestSchema)) input: CreateLeaveRequestInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.createLeaveRequest(
      user.organizationId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('me')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getMyLeaveRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(LeaveRequestQueryFilterSchema)) filter: LeaveRequestQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.getMyLeaveRequests(user.id, user.organizationId, filter);
  }

  @Get('team')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getTeamLeaveRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(LeaveRequestQueryFilterSchema)) filter: LeaveRequestQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.getTeamLeaveRequests(user.id, user.organizationId, filter);
  }

  @Get()
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getAllLeaveRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(LeaveRequestQueryFilterSchema)) filter: LeaveRequestQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.getAllLeaveRequests(user.organizationId, filter);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getLeaveRequestById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.getLeaveRequestById(id, user.organizationId);
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.LEAVE_APPROVE)
  async approveLeaveRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.approveLeaveRequest(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.LEAVE_APPROVE)
  async rejectLeaveRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('rejectionReason') rejectionReason: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.rejectLeaveRequest(
      id,
      user.organizationId,
      rejectionReason || 'Rejected by manager',
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionCode.LEAVE_CANCEL)
  async cancelLeaveRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CancelLeaveRequestSchema)) input: CancelLeaveRequestInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveRequestsService.cancelLeaveRequest(
      id,
      user.organizationId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
