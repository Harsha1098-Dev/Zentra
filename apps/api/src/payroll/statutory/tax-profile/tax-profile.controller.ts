import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TaxProfileService } from './tax-profile.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  UpdateEmployeeTaxProfileSchema,
  UpdateEmployeeTaxRegimeSchema,
} from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaxProfileController {
  constructor(private readonly service: TaxProfileService) {}

  @Get('me/tax-profile')
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Query('financialYear') financialYear?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMyTaxProfile(user.organizationId, user.id, user.email, financialYear);
  }

  @Put('me/tax-regime')
  async switchMyRegime(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateEmployeeTaxRegimeSchema.parse(body);
    return this.service.switchMyTaxRegime(
      user.organizationId,
      user.id,
      validated.selectedRegime,
      validated.financialYear,
      user.email,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('employees/:id/tax-profile')
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_READ)
  async getEmployeeProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('financialYear') financialYear?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getEmployeeTaxProfile(user.organizationId, id, financialYear);
  }

  @Put('employees/:id/tax-profile')
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_CONFIGURE)
  async updateEmployeeProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateEmployeeTaxProfileSchema.parse(body);
    return this.service.updateEmployeeTaxProfile(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Put('employees/:id/tax-regime')
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_CONFIGURE)
  async updateEmployeeRegime(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateEmployeeTaxRegimeSchema.parse(body);
    return this.service.updateEmployeeTaxProfile(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
