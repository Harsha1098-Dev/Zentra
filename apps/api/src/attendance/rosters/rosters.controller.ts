import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { RostersService } from './rosters.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateRosterSchema,
  CreateRosterInput,
  UpdateRosterSchema,
  UpdateRosterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('rosters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RostersController {
  constructor(private readonly service: RostersService) {}

  @Get()
  @RequirePermissions(PermissionCode.ATTENDANCE_ROSTER_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, status);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_ROSTER_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PermissionCode.ATTENDANCE_ROSTER_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateRosterSchema)) input: CreateRosterInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.create(user.organizationId, input, user.id, req.ip);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_ROSTER_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRosterSchema)) input: UpdateRosterInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.update(user.organizationId, id, input, user.id, req.ip);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_ROSTER_DELETE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(user.organizationId, id, user.id, req.ip);
  }
}
