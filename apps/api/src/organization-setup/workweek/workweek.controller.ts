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
import { WorkweekService } from './workweek.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  UpdateWorkweekSchema,
  UpdateWorkweekInput,
  CreateHolidaySchema,
  CreateHolidayInput,
  UpdateHolidaySchema,
  UpdateHolidayInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('workweek')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkweekController {
  constructor(private readonly workweekService: WorkweekService) {}

  @Get()
  @RequirePermissions(PermissionCode.WORKWEEK_READ)
  async getWorkweek(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.workweekService.getWorkweek(user.organizationId);
  }

  @Patch()
  @RequirePermissions(PermissionCode.WORKWEEK_UPDATE)
  async updateWorkweek(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateWorkweekSchema)) body: UpdateWorkweekInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.workweekService.updateWorkweek(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}

@Controller('holidays')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HolidaysController {
  constructor(private readonly workweekService: WorkweekService) {}

  @Get()
  @RequirePermissions(PermissionCode.HOLIDAY_READ)
  async getHolidays(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') yearStr?: string,
    @Query('locationId') locationId?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    return this.workweekService.getHolidays(user.organizationId, year, locationId);
  }

  @Post()
  @RequirePermissions(PermissionCode.HOLIDAY_CREATE)
  async createHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateHolidaySchema)) body: CreateHolidayInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.workweekService.createHoliday(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.HOLIDAY_UPDATE)
  async updateHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateHolidaySchema)) body: UpdateHolidayInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.workweekService.updateHoliday(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.HOLIDAY_DELETE)
  async deleteHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.workweekService.deleteHoliday(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
