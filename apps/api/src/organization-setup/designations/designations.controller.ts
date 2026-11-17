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
import { DesignationsService } from './designations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateDesignationSchema,
  CreateDesignationInput,
  UpdateDesignationSchema,
  UpdateDesignationInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('designations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Get()
  @RequirePermissions(PermissionCode.DESIGNATION_READ)
  async getDesignations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.designationsService.getDesignations(user.organizationId, status, search);
  }

  @Post()
  @RequirePermissions(PermissionCode.DESIGNATION_CREATE)
  async createDesignation(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateDesignationSchema)) body: CreateDesignationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.designationsService.createDesignation(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.DESIGNATION_READ)
  async getDesignationById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.designationsService.getDesignationById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.DESIGNATION_UPDATE)
  async updateDesignation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDesignationSchema)) body: UpdateDesignationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.designationsService.updateDesignation(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/activate')
  @RequirePermissions(PermissionCode.DESIGNATION_DEACTIVATE)
  async activateDesignation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.designationsService.activateDesignation(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PermissionCode.DESIGNATION_DEACTIVATE)
  async deactivateDesignation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.designationsService.deactivateDesignation(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
