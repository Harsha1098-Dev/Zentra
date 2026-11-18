import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceLocksService } from './attendance-locks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  LockAttendancePeriodSchema,
  LockAttendancePeriodInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('attendance-locks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceLocksController {
  constructor(private readonly service: AttendanceLocksService) {}

  @Get()
  @RequirePermissions(PermissionCode.ATTENDANCE_LOCK)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_LOCK)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PermissionCode.ATTENDANCE_LOCK)
  async lockPeriod(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(LockAttendancePeriodSchema)) input: LockAttendancePeriodInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.lockPeriod(user.organizationId, input, user.id, req.ip);
  }

  @Patch(':id/unlock')
  @RequirePermissions(PermissionCode.ATTENDANCE_LOCK)
  async unlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.unlock(user.organizationId, id, user.id, req.ip);
  }
}
