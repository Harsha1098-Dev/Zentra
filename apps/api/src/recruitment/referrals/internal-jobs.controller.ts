import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('recruitment/internal-jobs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InternalJobsController {
  constructor(private readonly service: ReferralsService) {}

  @Get()
  @RequirePermissions(PermissionCode.JOB_OPENING_READ)
  async findInternalJobs(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findInternalJobs(user.organizationId);
  }

  @Post(':id/apply')
  @RequirePermissions(PermissionCode.APPLICATION_CREATE)
  async applyInternalJob(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.applyInternalJob(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
