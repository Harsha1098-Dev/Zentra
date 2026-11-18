import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { LeaveCalendarService } from './leave-calendar.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PermissionCode } from '@zentra/shared-types';

@Controller('leave-calendar')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveCalendarController {
  constructor(private readonly calendarService: LeaveCalendarService) {}

  @Get()
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getCalendarEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('locationId') locationId?: string,
    @Query('scope') scope?: 'me' | 'team' | 'department' | 'all',
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }

    // Default to current month if no dates provided
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    return this.calendarService.getCalendarEvents(
      user.id,
      user.organizationId,
      {
        startDate: start,
        endDate: end,
        departmentId,
        locationId,
        scope,
      },
      user.roles || [],
    );
  }
}
