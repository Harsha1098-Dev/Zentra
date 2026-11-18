import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EngagementReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('engagement/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EngagementReportsController {
  constructor(
    private readonly service: EngagementReportsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getEmployeeId(organizationId: string, userId: string): Promise<string> {
    const employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId },
      select: { id: true },
    });
    if (!employee) {
      throw new BadRequestException('Current user is not mapped to an active employee record');
    }
    return employee.id;
  }

  @Get('hub')
  @RequirePermissions(PermissionCode.ENGAGEMENT_READ)
  async getEmployeeHub(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.getEmployeeHub(user.organizationId, employeeId);
  }

  @Get('team')
  @RequirePermissions(PermissionCode.ENGAGEMENT_REPORT_VIEW)
  async getManagerTeam(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.getManagerTeamEngagement(user.organizationId, employeeId);
  }

  @Get('summary')
  @RequirePermissions(PermissionCode.ENGAGEMENT_REPORT_VIEW)
  async getOrgSummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getOrgSummary(user.organizationId);
  }

  @Get('export')
  @RequirePermissions(PermissionCode.ENGAGEMENT_REPORT_EXPORT)
  async exportData(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') exportType: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const csv = await this.service.exportData(
      user.organizationId,
      exportType || 'enps',
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="engagement-${exportType || 'enps'}-${Date.now()}.csv"`,
    );
    return res.send(csv);
  }
}
