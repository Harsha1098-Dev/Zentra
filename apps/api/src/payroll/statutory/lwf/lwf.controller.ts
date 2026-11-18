import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LwfService } from './lwf.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  LwfRuleSchema,
  UpdateLwfRuleSchema,
} from '@zentra/shared-types';

@Controller('payroll/statutory/lwf')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LwfController {
  constructor(private readonly service: LwfService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_LWF_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllRules(user.organizationId);
  }

  @Get('report')
  @RequirePermissions(PermissionCode.PAYROLL_LWF_REPORT_VIEW)
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

    return this.service.getLwfReport(user.organizationId, month, year);
  }

  @Get('report/export')
  @RequirePermissions(PermissionCode.PAYROLL_LWF_REPORT_EXPORT)
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

    const csvData = await this.service.exportLwfReport(user.organizationId, month, year, user.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="LWF_Report_${year}_${month}.csv"`,
    );
    res.status(200).send(csvData);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYROLL_LWF_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findRuleById(id, user.organizationId);
  }

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_LWF_CONFIGURE)
  async createRule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = LwfRuleSchema.parse(body);
    return this.service.createRule(user.organizationId, validated, user.id, req.ip, req.headers['user-agent']);
  }

  @Put(':id')
  @RequirePermissions(PermissionCode.PAYROLL_LWF_CONFIGURE)
  async updateRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateLwfRuleSchema.parse(body);
    return this.service.updateRule(id, user.organizationId, validated, user.id, req.ip, req.headers['user-agent']);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PAYROLL_LWF_CONFIGURE)
  async deleteRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deleteRule(id, user.organizationId, user.id, req.ip, req.headers['user-agent']);
  }
}
