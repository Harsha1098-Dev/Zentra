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
import { PayrollRunsService } from './payroll-runs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreatePayrollRunSchema,
  UpdatePayrollRunSchema,
} from '@zentra/shared-types';

@Controller('payroll/runs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollRunsController {
  constructor(private readonly service: PayrollRunsService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_RUN_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.service.findAll(user.organizationId, { status, year: yearNum });
  }

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_RUN_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreatePayrollRunSchema.parse(body);
    return this.service.create(user.organizationId, validated, user.id, req.ip);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_CREATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdatePayrollRunSchema.parse(body);
    return this.service.update(id, user.organizationId, validated, user.id, req.ip);
  }

  @Post(':id/calculate')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_CALCULATE)
  async calculate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.calculate(id, user.organizationId, user.id, req.ip);
  }

  @Post(':id/submit')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_SUBMIT)
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.submit(id, user.organizationId, user.id, req.ip);
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_APPROVE)
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.approve(id, user.organizationId, user.id, req.ip);
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_REJECT)
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.reject(id, user.organizationId, reason, user.id, req.ip);
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_CANCEL)
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.cancel(id, user.organizationId, user.id, req.ip);
  }

  @Post(':id/lock')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_LOCK)
  async lock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.lock(id, user.organizationId, user.id, req.ip);
  }

  @Get(':id/employees')
  @RequirePermissions(PermissionCode.PAYROLL_RUN_READ)
  async getEmployeeRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getEmployeeRecords(id, user.organizationId, {
      departmentId,
      search,
    });
  }

  @Get(':id/register')
  @RequirePermissions(PermissionCode.PAYROLL_REPORT_VIEW)
  async getRegister(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getRegister(id, user.organizationId);
  }
}
