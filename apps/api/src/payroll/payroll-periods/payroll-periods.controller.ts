import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { PayrollPeriodsService } from './payroll-periods.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreatePayrollPeriodSchema,
  UpdatePayrollPeriodSchema,
} from '@zentra/shared-types';

@Controller('payroll/periods')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollPeriodsController {
  constructor(private readonly service: PayrollPeriodsService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_PERIOD_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('year') year?: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.service.findAll(user.organizationId, yearNum);
  }

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_PERIOD_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreatePayrollPeriodSchema.parse(body);
    return this.service.create(user.organizationId, validated, user.id, req.ip);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYROLL_PERIOD_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PAYROLL_PERIOD_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdatePayrollPeriodSchema.parse(body);
    return this.service.update(id, user.organizationId, validated, user.id, req.ip);
  }

  @Post(':id/open')
  @RequirePermissions(PermissionCode.PAYROLL_PERIOD_UPDATE)
  async open(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.openPeriod(id, user.organizationId, user.id, req.ip);
  }

  @Post(':id/lock')
  @RequirePermissions(PermissionCode.PAYROLL_PERIOD_LOCK)
  async lock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.lockPeriod(id, user.organizationId, user.id, req.ip);
  }
}
