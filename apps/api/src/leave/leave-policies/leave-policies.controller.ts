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
import { LeavePoliciesService } from './leave-policies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateLeavePolicySchema,
  CreateLeavePolicyInput,
  UpdateLeavePolicySchema,
  UpdateLeavePolicyInput,
  LeavePolicyQueryFilterSchema,
  LeavePolicyQueryFilterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('leave-policies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeavePoliciesController {
  constructor(private readonly leavePoliciesService: LeavePoliciesService) {}

  @Get()
  @RequirePermissions(PermissionCode.LEAVE_POLICY_READ)
  async getLeavePolicies(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(LeavePolicyQueryFilterSchema)) filter: LeavePolicyQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leavePoliciesService.getLeavePolicies(user.organizationId, filter);
  }

  @Post()
  @RequirePermissions(PermissionCode.LEAVE_POLICY_CREATE)
  async createLeavePolicy(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateLeavePolicySchema)) input: CreateLeavePolicyInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leavePoliciesService.createLeavePolicy(
      user.organizationId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.LEAVE_POLICY_READ)
  async getLeavePolicyById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leavePoliciesService.getLeavePolicyById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.LEAVE_POLICY_UPDATE)
  async updateLeavePolicy(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateLeavePolicySchema)) input: UpdateLeavePolicyInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leavePoliciesService.updateLeavePolicy(
      id,
      user.organizationId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id/activate')
  @RequirePermissions(PermissionCode.LEAVE_POLICY_UPDATE)
  async activateLeavePolicy(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leavePoliciesService.activateLeavePolicy(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PermissionCode.LEAVE_POLICY_UPDATE)
  async deactivateLeavePolicy(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leavePoliciesService.deactivateLeavePolicy(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PermissionCode.LEAVE_POLICY_DELETE)
  async deleteLeavePolicy(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    await this.leavePoliciesService.deleteLeavePolicy(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
