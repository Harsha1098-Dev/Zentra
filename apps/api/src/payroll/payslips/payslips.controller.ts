import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PayslipsService } from './payslips.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayslipsController {
  constructor(private readonly service: PayslipsService) {}

  // Run Operations: Generate and Publish
  @Post('payroll/runs/:id/generate-payslips')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_GENERATE)
  async generatePayslips(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') runId: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.generatePayslips(runId, user.organizationId, user.id, req.ip);
  }

  @Post('payroll/runs/:id/publish-payslips')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_PUBLISH)
  async publishPayslips(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') runId: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.publishPayslips(runId, user.organizationId, user.id, req.ip);
  }

  // Employee Self-Service Endpoints
  @Get('me/payslips')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_READ)
  async getMyPayslips(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.service.getMyPayslips(user.id, user.organizationId, yearNum);
  }

  @Get('me/payslips/:id')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_READ)
  async getMyPayslip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyPayslip(id, user.id, user.organizationId, req.ip);
  }

  @Get('me/payslips/:id/download')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_DOWNLOAD)
  async downloadMyPayslip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const result = await this.service.downloadMyPayslip(id, user.id, user.organizationId, req.ip);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.html);
  }

  // Admin Payslip Repository Endpoints
  @Get('payroll/payslips')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_READ)
  async getAdminPayslips(
    @CurrentUser() user: AuthenticatedUser,
    @Query('payrollRunId') payrollRunId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getAdminPayslips(user.organizationId, {
      payrollRunId,
      status,
      search,
    });
  }

  @Get('payroll/payslips/:id')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_READ)
  async getAdminPayslip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getAdminPayslip(id, user.organizationId, user.id, req.ip);
  }

  @Get('payroll/payslips/:id/download')
  @RequirePermissions(PermissionCode.PAYROLL_PAYSLIP_DOWNLOAD)
  async downloadAdminPayslip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const result = await this.service.downloadAdminPayslip(
      id,
      user.organizationId,
      user.id,
      req.ip,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.html);
  }
}
