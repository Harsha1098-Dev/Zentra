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
import { LeaveBalancesService } from './leave-balances.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AdjustLeaveBalanceSchema,
  AdjustLeaveBalanceInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('leave-balances')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveBalancesController {
  constructor(private readonly leaveBalancesService: LeaveBalancesService) {}

  @Get('me')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getMyBalances(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.leaveBalancesService.getMyBalances(user.id, targetYear, user.organizationId);
  }

  @Get('me/history')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getMyBalanceHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.leaveBalancesService.getMyBalanceHistory(
      user.id,
      user.organizationId,
      leaveTypeId,
      limitNum,
    );
  }

  @Get('employees/:id')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getEmployeeBalances(
    @Param('id') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.leaveBalancesService.getBalancesForEmployee(employeeId, targetYear, user.organizationId);
  }

  @Get('employees/:id/history')
  @RequirePermissions(PermissionCode.LEAVE_READ)
  async getEmployeeBalanceHistory(
    @Param('id') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.leaveBalancesService.getBalanceHistory(
      employeeId,
      user.organizationId,
      leaveTypeId,
      limitNum,
    );
  }

  @Post('employees/:id/adjust')
  @RequirePermissions(PermissionCode.LEAVE_ADJUST_BALANCE)
  async adjustBalance(
    @Param('id') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(AdjustLeaveBalanceSchema)) input: AdjustLeaveBalanceInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.leaveBalancesService.adjustBalance(
      employeeId,
      input,
      user.organizationId,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
