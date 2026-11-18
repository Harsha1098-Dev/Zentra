import {
  Controller,
  Get,
  Put,
  Query,
  Body,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PfService } from './pf.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import { PermissionCode, UpdatePfConfigSchema } from '@zentra/shared-types';

@Controller('payroll/statutory/pf')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PfController {
  constructor(private readonly service: PfService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_PF_READ)
  async getConfig(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getConfig(user.organizationId);
  }

  @Put()
  @RequirePermissions(PermissionCode.PAYROLL_PF_CONFIGURE)
  async updateConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdatePfConfigSchema.parse(body);
    return this.service.updateConfig(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('report')
  @RequirePermissions(PermissionCode.PAYROLL_PF_REPORT_VIEW)
  async getReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') monthStr?: string,
    @Query('year') yearStr?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const month = monthStr ? parseInt(monthStr, 10) : new Date().getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month or year');
    }

    return this.service.getEcrReport(user.organizationId, month, year);
  }

  @Get('report/export')
  @RequirePermissions(PermissionCode.PAYROLL_PF_REPORT_EXPORT)
  async exportReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') monthStr: string | undefined,
    @Query('year') yearStr: string | undefined,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const month = monthStr ? parseInt(monthStr, 10) : new Date().getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    const csvData = await this.service.exportEcrReport(user.organizationId, month, year, user.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="PF_ECR_${year}_${month}.csv"`,
    );
    res.status(200).send(csvData);
  }
}
