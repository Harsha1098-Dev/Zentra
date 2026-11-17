import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';

@Controller('organizations/:organizationId/members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @RequirePermissions('user.read')
  async getMembers(
    @Param('organizationId') organizationIdParam: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId || user.organizationId !== organizationIdParam) {
      throw new ForbiddenException(
        'Forbidden: Operation is strictly scoped to your active authenticated organization',
      );
    }
    return this.membershipsService.getOrganizationMembers(user.organizationId);
  }
}
