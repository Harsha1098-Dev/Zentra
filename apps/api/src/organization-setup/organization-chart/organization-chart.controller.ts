import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { OrganizationChartService } from './organization-chart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('organization-chart')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationChartController {
  constructor(private readonly orgChartService: OrganizationChartService) {}

  @Get()
  @RequirePermissions(PermissionCode.ORGANIZATION_CHART_READ)
  async getOrganizationChart(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.orgChartService.getOrganizationChart(user.organizationId);
  }
}
