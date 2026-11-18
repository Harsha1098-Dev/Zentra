import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateOnboardingFlowSchema,
  UpdateOnboardingFlowSchema,
  CreateOnboardingRunSchema,
  CompleteOnboardingTaskSchema,
  ReassignOnboardingTaskSchema,
} from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get('onboarding-flows')
  @RequirePermissions(PermissionCode.ONBOARDING_READ)
  async findAllFlows(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllFlows(user.organizationId);
  }

  @Post('onboarding-flows')
  @RequirePermissions(PermissionCode.ONBOARDING_CREATE)
  async createFlow(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateOnboardingFlowSchema.parse(body);
    return this.service.createFlow(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('onboarding-flows/:id')
  @RequirePermissions(PermissionCode.ONBOARDING_READ)
  async findFlowById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findFlowById(id, user.organizationId);
  }

  @Patch('onboarding-flows/:id')
  @RequirePermissions(PermissionCode.ONBOARDING_UPDATE)
  async updateFlow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateOnboardingFlowSchema.parse(body);
    return this.service.updateFlow(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete('onboarding-flows/:id')
  @RequirePermissions(PermissionCode.ONBOARDING_DELETE)
  async deleteFlow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deleteFlow(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('onboarding-flows/:id/activate')
  @RequirePermissions(PermissionCode.ONBOARDING_UPDATE)
  async activateFlow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.setFlowActive(
      id,
      user.organizationId,
      true,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('onboarding-flows/:id/deactivate')
  @RequirePermissions(PermissionCode.ONBOARDING_UPDATE)
  async deactivateFlow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.setFlowActive(
      id,
      user.organizationId,
      false,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // Runs
  @Get('onboarding-runs')
  @RequirePermissions(PermissionCode.ONBOARDING_READ)
  async findAllRuns(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllRuns(user.organizationId, { status, employeeId });
  }

  @Post('onboarding-runs')
  @RequirePermissions(PermissionCode.ONBOARDING_EXECUTE)
  async createRun(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateOnboardingRunSchema.parse(body);
    return this.service.createRun(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('onboarding-runs/:id')
  @RequirePermissions(PermissionCode.ONBOARDING_READ)
  async findRunById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findRunById(id, user.organizationId);
  }

  @Patch('onboarding-runs/:id')
  @RequirePermissions(PermissionCode.ONBOARDING_UPDATE)
  async updateRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.updateRun(id, user.organizationId, body);
  }

  @Post('onboarding-runs/:id/complete')
  @RequirePermissions(PermissionCode.ONBOARDING_UPDATE)
  async completeRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('overrideMandatory') overrideMandatory: boolean,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.completeRun(
      id,
      user.organizationId,
      user.id,
      overrideMandatory,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // Employee Self-Service Tasks
  @Get('me/onboarding-tasks')
  async getMyTasks(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyOnboardingTasks(
      user.organizationId,
      user.id,
      user.email,
    );
  }

  @Patch('me/onboarding-tasks/:id/complete')
  @RequirePermissions(PermissionCode.ONBOARDING_TASK_COMPLETE)
  async completeTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const validated = CompleteOnboardingTaskSchema.parse(body);
    return this.service.completeTask(
      id,
      user.id,
      validated,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('onboarding-tasks/:id/reassign')
  @RequirePermissions(PermissionCode.ONBOARDING_TASK_REASSIGN)
  async reassignTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = ReassignOnboardingTaskSchema.parse(body);
    return this.service.reassignTask(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
