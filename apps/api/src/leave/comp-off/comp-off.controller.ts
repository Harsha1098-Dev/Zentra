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
import { CompOffService } from './comp-off.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateCompOffRequestSchema,
  CreateCompOffRequestInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('comp-off')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompOffController {
  constructor(private readonly compOffService: CompOffService) {}

  @Post()
  @RequirePermissions(PermissionCode.LEAVE_COMPOFF_APPLY)
  async createCompOffRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateCompOffRequestSchema)) input: CreateCompOffRequestInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.compOffService.createCompOffRequest(
      user.organizationId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('me')
  @RequirePermissions(PermissionCode.LEAVE_COMPOFF_APPLY)
  async getMyCompOffRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.compOffService.getMyCompOffRequests(user.id, user.organizationId, query);
  }

  @Get('team')
  @RequirePermissions(PermissionCode.LEAVE_COMPOFF_APPROVE)
  async getTeamCompOffRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.compOffService.getTeamCompOffRequests(user.id, user.organizationId, query);
  }

  @Get()
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getAllCompOffRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.compOffService.getAllCompOffRequests(user.organizationId, query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getCompOffById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.compOffService.getCompOffById(id, user.organizationId);
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.LEAVE_COMPOFF_APPROVE)
  async approveCompOffRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.compOffService.approveCompOffRequest(
      id,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PermissionCode.LEAVE_COMPOFF_APPROVE)
  async rejectCompOffRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('rejectionReason') rejectionReason: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.compOffService.rejectCompOffRequest(
      id,
      user.organizationId,
      rejectionReason || 'Rejected by manager',
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
