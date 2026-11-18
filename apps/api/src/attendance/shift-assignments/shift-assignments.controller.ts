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
import { ShiftAssignmentsService } from './shift-assignments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateShiftAssignmentSchema,
  CreateShiftAssignmentInput,
  UpdateShiftAssignmentSchema,
  UpdateShiftAssignmentInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('shift-assignments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ShiftAssignmentsController {
  constructor(private readonly service: ShiftAssignmentsService) {}

  @Get()
  @RequirePermissions(PermissionCode.ATTENDANCE_SHIFT_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('employeeId') employeeId?: string,
    @Query('rosterId') rosterId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, employeeId, rosterId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_SHIFT_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PermissionCode.ATTENDANCE_SHIFT_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateShiftAssignmentSchema)) input: CreateShiftAssignmentInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.create(user.organizationId, input, user.id, req.ip);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_SHIFT_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateShiftAssignmentSchema)) input: UpdateShiftAssignmentInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.update(user.organizationId, id, input, user.id, req.ip);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_SHIFT_DELETE)
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
