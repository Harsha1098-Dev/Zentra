import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { PayslipTemplatesService } from './payslip-templates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreatePayslipTemplateSchema,
  UpdatePayslipTemplateSchema,
} from '@zentra/shared-types';

@Controller('payroll/payslip-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayslipTemplatesController {
  constructor(private readonly service: PayslipTemplatesService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_TEMPLATE_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId);
  }

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_TEMPLATE_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreatePayslipTemplateSchema.parse(body);
    return this.service.create(user.organizationId, validated, user.id, req.ip);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYROLL_TEMPLATE_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PAYROLL_TEMPLATE_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdatePayslipTemplateSchema.parse(body);
    return this.service.update(id, user.organizationId, validated, user.id, req.ip);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PAYROLL_TEMPLATE_DELETE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(id, user.organizationId, user.id, req.ip);
  }

  @Post(':id/preview')
  @RequirePermissions(PermissionCode.PAYROLL_TEMPLATE_READ)
  async preview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.preview(id, user.organizationId, body);
  }
}
