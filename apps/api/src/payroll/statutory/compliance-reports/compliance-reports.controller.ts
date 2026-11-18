import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ComplianceReportsService } from './compliance-reports.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('payroll/compliance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplianceReportsController {
  constructor(private readonly service: ComplianceReportsService) {}

  @Get('dashboard')
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_READ)
  async getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('financialYear') financialYear?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getDashboard(user.organizationId, financialYear || '2025-2026');
  }

  @Get('tds-24q')
  @RequirePermissions(PermissionCode.PAYROLL_TDS_REPORT_VIEW)
  async getTds24QReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('quarter') quarterStr?: string,
    @Query('financialYear') financialYear?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const quarter = quarterStr ? parseInt(quarterStr, 10) : 1;
    if (isNaN(quarter) || quarter < 1 || quarter > 4) {
      throw new BadRequestException('Invalid quarter (must be 1-4)');
    }
    return this.service.getTds24QReport(user.organizationId, quarter, financialYear || '2025-2026');
  }

  @Get('tds-24q/export')
  @RequirePermissions(PermissionCode.PAYROLL_TDS_REPORT_EXPORT)
  async exportTds24QReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('quarter') quarterStr: string | undefined,
    @Query('financialYear') financialYear: string | undefined,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const quarter = quarterStr ? parseInt(quarterStr, 10) : 1;
    const fy = financialYear || '2025-2026';

    const csvData = await this.service.exportTds24QReport(user.organizationId, quarter, fy, user.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="TDS_24Q_Q${quarter}_${fy}.csv"`,
    );
    res.status(200).send(csvData);
  }
}
