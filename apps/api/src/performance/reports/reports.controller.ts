import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('performance-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('my-summary')
  @RequirePermissions(PermissionCode.PERFORMANCE_READ_OWN)
  async getMySummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMySummary(user.organizationId, user.id);
  }

  @Get('team-summary')
  @RequirePermissions(PermissionCode.PERFORMANCE_READ_TEAM)
  async getTeamSummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getTeamSummary(user.organizationId, user.id);
  }

  @Get('department-summary')
  @RequirePermissions(PermissionCode.PERFORMANCE_READ_ALL)
  async getDepartmentSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getDepartmentSummary(user.organizationId, departmentId);
  }

  @Get('organization-summary')
  @RequirePermissions(PermissionCode.PERFORMANCE_READ_ALL)
  async getOrganizationSummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getOrganizationSummary(user.organizationId);
  }

  @Get('goal-completion')
  @RequirePermissions(PermissionCode.PERFORMANCE_REPORT_VIEW)
  async getGoalCompletion(
    @CurrentUser() user: AuthenticatedUser,
    @Query('employeeId') employeeId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getGoalCompletion(user.organizationId, employeeId);
  }

  @Get('okr-progress')
  @RequirePermissions(PermissionCode.PERFORMANCE_REPORT_VIEW)
  async getOkrProgress(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getOkrProgress(user.organizationId);
  }

  @Get('rating-distribution')
  @RequirePermissions(PermissionCode.PERFORMANCE_REPORT_VIEW)
  async getRatingDistribution(
    @CurrentUser() user: AuthenticatedUser,
    @Query('performanceCycleId') performanceCycleId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getRatingDistribution(user.organizationId, performanceCycleId);
  }

  @Post('export')
  @RequirePermissions(PermissionCode.PERFORMANCE_REPORT_EXPORT)
  async exportReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body('reportType') reportType: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.exportReport(
      user.organizationId,
      reportType || 'GOALS',
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
