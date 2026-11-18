import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { DelegationsService } from './delegations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateDelegationSchema,
  CreateDelegationInput,
  UpdateDelegationSchema,
  UpdateDelegationInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('delegations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DelegationsController {
  constructor(private readonly delegationsService: DelegationsService) {}

  @Get()
  @RequirePermissions(PermissionCode.APPROVAL_READ)
  async getDelegations(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.delegationsService.getDelegations(user.organizationId, user.id);
  }

  @Post()
  @RequirePermissions(PermissionCode.APPROVAL_DELEGATE)
  async createDelegation(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateDelegationSchema)) body: CreateDelegationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.delegationsService.createDelegation(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.APPROVAL_DELEGATE)
  async updateDelegation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateDelegationSchema)) body: UpdateDelegationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.delegationsService.updateDelegation(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.APPROVAL_DELEGATE)
  async cancelDelegation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.delegationsService.cancelDelegation(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
