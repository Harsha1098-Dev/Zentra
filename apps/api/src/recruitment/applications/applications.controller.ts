import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateJobApplicationSchema,
  MoveApplicationStageSchema,
  ScreenApplicationSchema,
  RejectApplicationSchema,
} from '@zentra/shared-types';

@Controller('recruitment/applications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  @RequirePermissions(PermissionCode.APPLICATION_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, query);
  }

  @Post()
  @RequirePermissions(PermissionCode.APPLICATION_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateJobApplicationSchema.parse(body);
    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.APPLICATION_READ)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Post(':id/move-stage')
  @RequirePermissions(PermissionCode.APPLICATION_STAGE_CHANGE)
  async moveStage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = MoveApplicationStageSchema.parse(body);
    return this.service.moveStage(
      id,
      user.organizationId,
      validated.toStageId,
      validated.comments,
      { id: user.id, roles: user.roles || [] },
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/screen')
  @RequirePermissions(PermissionCode.APPLICATION_SCREEN)
  async screen(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = ScreenApplicationSchema.parse(body);
    return this.service.screen(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.APPLICATION_REJECT)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = RejectApplicationSchema.parse(body);
    return this.service.reject(
      id,
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/hire')
  @RequirePermissions(PermissionCode.APPLICATION_HIRE)
  async hire(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.hire(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
