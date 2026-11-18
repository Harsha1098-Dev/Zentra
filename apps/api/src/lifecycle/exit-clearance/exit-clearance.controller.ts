import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ExitClearanceService } from './exit-clearance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateExitClearanceSchema,
  CompleteExitClearanceSchema,
  ReassignExitClearanceSchema,
} from '@zentra/shared-types';

@Controller('exit-clearances')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExitClearanceController {
  constructor(private readonly service: ExitClearanceService) {}

  @Get()
  @RequirePermissions(PermissionCode.EXIT_CLEARANCE_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('resignationRequestId') resignationRequestId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, {
      status,
      employeeId,
      resignationRequestId,
    });
  }

  @Post()
  @RequirePermissions(PermissionCode.EXIT_CLEARANCE_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateExitClearanceSchema.parse(body);
    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.EXIT_CLEARANCE_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Post(':id/complete')
  @RequirePermissions(PermissionCode.EXIT_CLEARANCE_COMPLETE)
  async complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CompleteExitClearanceSchema.parse(body || {});
    return this.service.complete(
      id,
      user.organizationId,
      {
        comments: validated.comments || undefined,
        attachmentUrl: validated.attachmentUrl || undefined,
        status: validated.status,
      },
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/reassign')
  @RequirePermissions(PermissionCode.EXIT_CLEARANCE_REASSIGN)
  async reassign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = ReassignExitClearanceSchema.parse(body);
    return this.service.reassign(
      id,
      user.organizationId,
      validated.assignedTo,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
