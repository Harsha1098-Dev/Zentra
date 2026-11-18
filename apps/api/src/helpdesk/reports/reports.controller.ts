import {
  Controller,
  Get,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HelpdeskReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('helpdesk/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HelpdeskReportsController {
  constructor(private readonly service: HelpdeskReportsService) {}

  @Get('summary')
  @RequirePermissions(PermissionCode.HELPDESK_REPORT_VIEW)
  async getSummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getSummary(user.organizationId);
  }

  @Get('workbench')
  @RequirePermissions(PermissionCode.HELPDESK_READ)
  async getWorkbenchSummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getWorkbenchSummary(user.organizationId, user.id);
  }

  @Get('export')
  @RequirePermissions(PermissionCode.HELPDESK_REPORT_EXPORT)
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const csvData = await this.service.exportCsv(
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="helpdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    return res.send(csvData);
  }
}
