import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CelebrationsService } from './celebrations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('engagement/celebrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CelebrationsController {
  constructor(private readonly service: CelebrationsService) {}

  @Get()
  @RequirePermissions(PermissionCode.CELEBRATION_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') celebrationType?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, celebrationType, fromDate, toDate);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.CELEBRATION_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PermissionCode.CELEBRATION_MANAGE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.create(
      user.organizationId,
      body,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('sync')
  @RequirePermissions(PermissionCode.CELEBRATION_MANAGE)
  async sync(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { year?: number },
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.syncCelebrations(
      user.organizationId,
      body.year,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/wish')
  @RequirePermissions(PermissionCode.CELEBRATION_WISH)
  async wish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.wish(user.organizationId, id);
  }
}
