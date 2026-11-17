import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateLocationSchema,
  CreateLocationInput,
  UpdateLocationSchema,
  UpdateLocationInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('locations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequirePermissions(PermissionCode.LOCATION_READ)
  async getLocations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.locationsService.getLocations(user.organizationId, status, search);
  }

  @Post()
  @RequirePermissions(PermissionCode.LOCATION_CREATE)
  async createLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateLocationSchema)) body: CreateLocationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.locationsService.createLocation(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.LOCATION_READ)
  async getLocationById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.locationsService.getLocationById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.LOCATION_UPDATE)
  async updateLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateLocationSchema)) body: UpdateLocationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.locationsService.updateLocation(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/activate')
  @RequirePermissions(PermissionCode.LOCATION_DEACTIVATE)
  async activateLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.locationsService.activateLocation(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PermissionCode.LOCATION_DEACTIVATE)
  async deactivateLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.locationsService.deactivateLocation(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
