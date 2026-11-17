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
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateGradeSchema,
  CreateGradeInput,
  UpdateGradeSchema,
  UpdateGradeInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('grades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @RequirePermissions(PermissionCode.GRADE_READ)
  async getGrades(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.gradesService.getGrades(user.organizationId, status);
  }

  @Post()
  @RequirePermissions(PermissionCode.GRADE_CREATE)
  async createGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateGradeSchema)) body: CreateGradeInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.gradesService.createGrade(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.GRADE_READ)
  async getGradeById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.gradesService.getGradeById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.GRADE_UPDATE)
  async updateGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateGradeSchema)) body: UpdateGradeInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.gradesService.updateGrade(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/activate')
  @RequirePermissions(PermissionCode.GRADE_DEACTIVATE)
  async activateGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.gradesService.activateGrade(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PermissionCode.GRADE_DEACTIVATE)
  async deactivateGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.gradesService.deactivateGrade(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
