import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Form16Service } from './form16.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  Form16PrepareSchema,
  Form16PublishSchema,
} from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class Form16Controller {
  constructor(private readonly service: Form16Service) {}

  @Post('payroll/form16/prepare')
  @RequirePermissions(PermissionCode.PAYROLL_FORM16_PREPARE)
  async prepareForm16(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = Form16PrepareSchema.parse(body);
    return this.service.prepareForm16(
      user.organizationId,
      validated.financialYear,
      validated.assessmentYear,
      validated.employeeIds,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('payroll/form16/publish')
  @RequirePermissions(PermissionCode.PAYROLL_FORM16_PUBLISH)
  async publishForm16(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = Form16PublishSchema.parse(body);
    return this.service.publishForm16(
      user.organizationId,
      validated.recordIds,
      validated.financialYear,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('payroll/form16')
  @RequirePermissions(PermissionCode.PAYROLL_FORM16_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('financialYear') financialYear?: string,
    @Query('status') status?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, { financialYear, status });
  }

  @Get('payroll/form16/:id')
  @RequirePermissions(PermissionCode.PAYROLL_FORM16_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Get('me/form16')
  async getMyForm16(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyForm16(user.organizationId, user.id, user.email);
  }

  @Get('me/form16/:id/download')
  async downloadForm16(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.downloadForm16(id, user.organizationId, user.id);
  }
}
