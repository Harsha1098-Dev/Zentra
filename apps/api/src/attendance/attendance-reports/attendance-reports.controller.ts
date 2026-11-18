import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AttendanceReportsService } from './attendance-reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('attendance-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceReportsController {
  constructor(private readonly service: AttendanceReportsService) {}

  @Get('my-summary')
  @RequirePermissions(PermissionCode.ATTENDANCE_REPORT_VIEW)
  async getMyReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyReport(user.id, user.organizationId, startDate, endDate);
  }

  @Get('team')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_TEAM)
  async getTeamReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getTeamReport(user.id, user.organizationId, startDate, endDate);
  }

  @Get('organization')
  @RequirePermissions(PermissionCode.ATTENDANCE_REPORT_VIEW)
  async getOrganizationReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getOrganizationReport(user.organizationId, filter);
  }

  @Get('late-arrivals')
  @RequirePermissions(PermissionCode.ATTENDANCE_REPORT_VIEW)
  async getLateArrivalsReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getLateArrivalsReport(user.organizationId, filter);
  }

  @Get('early-departures')
  @RequirePermissions(PermissionCode.ATTENDANCE_REPORT_VIEW)
  async getEarlyDeparturesReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getEarlyDeparturesReport(user.organizationId, filter);
  }

  @Get('overtime')
  @RequirePermissions(PermissionCode.ATTENDANCE_REPORT_VIEW)
  async getOvertimeReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getOvertimeReport(user.organizationId, filter);
  }

  @Get('exceptions')
  @RequirePermissions(PermissionCode.ATTENDANCE_REPORT_VIEW)
  async getExceptionsReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getExceptionsReport(user.organizationId, filter);
  }

  @Get('export')
  @RequirePermissions(PermissionCode.ATTENDANCE_REPORT_EXPORT)
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query('reportType') reportType: string,
    @Query() filter: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const csv = await this.service.exportCsv(
      user.organizationId,
      reportType || 'organization',
      filter,
      user.id,
      req.ip,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${reportType || 'report'}-${Date.now()}.csv"`);
    res.send(csv);
  }
}
