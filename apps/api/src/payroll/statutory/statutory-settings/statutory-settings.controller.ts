import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { StatutorySettingsService } from './statutory-settings.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  UpdateStatutorySettingSchema,
} from '@zentra/shared-types';

@Controller('payroll/statutory-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatutorySettingsController {
  constructor(private readonly service: StatutorySettingsService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_READ)
  async getSettings(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getSettings(user.organizationId);
  }

  @Put()
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_CONFIGURE)
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateStatutorySettingSchema.parse(body);
    return this.service.updateSettings(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
