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
import { AttendancePoliciesService } from './attendance-policies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateAttendancePolicySchema,
  CreateAttendancePolicyInput,
  UpdateAttendancePolicySchema,
  UpdateAttendancePolicyInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('attendance-policies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendancePoliciesController {
  constructor(private readonly service: AttendancePoliciesService) {}

  @Get()
  @RequirePermissions(PermissionCode.ATTENDANCE_POLICY_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId);
  }

  @Get('default')
  @RequirePermissions(PermissionCode.ATTENDANCE_POLICY_READ)
  async findDefault(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findDefault(user.organizationId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_POLICY_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PermissionCode.ATTENDANCE_POLICY_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateAttendancePolicySchema)) input: CreateAttendancePolicyInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.create(user.organizationId, input, user.id, req.ip);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_POLICY_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAttendancePolicySchema)) input: UpdateAttendancePolicyInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.update(user.organizationId, id, input, user.id, req.ip);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_POLICY_DELETE)
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
