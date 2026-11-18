import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LeaveReportsService } from './leave-reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('leave-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveReportsController {
  constructor(private readonly reportsService: LeaveReportsService) {}

  @Get('my-summary')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getMySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.reportsService.getMySummary(user.id, user.organizationId, targetYear);
  }

  @Get('team-summary')
  @RequirePermissions(PermissionCode.LEAVE_APPROVE)
  async getTeamSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.reportsService.getTeamSummary(user.id, user.organizationId, targetYear);
  }

  @Get('department-summary')
  @RequirePermissions(PermissionCode.LEAVE_REPORT_VIEW)
  async getDepartmentSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.reportsService.getDepartmentSummary(user.organizationId, targetYear);
  }

  @Get('organization-summary')
  @RequirePermissions(PermissionCode.LEAVE_REPORT_VIEW)
  async getOrganizationSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.reportsService.getOrganizationSummary(user.organizationId, targetYear);
  }

  @Get('export')
  @RequirePermissions(PermissionCode.LEAVE_REPORT_EXPORT)
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type: 'balances' | 'requests',
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const csvContent = await this.reportsService.exportReportCsv(
      user.organizationId,
      type || 'balances',
      targetYear,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zentra-leave-${type || 'balances'}-${targetYear}.csv"`,
    );
    res.send(csvContent);
  }
}
