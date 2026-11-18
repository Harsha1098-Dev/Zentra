import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceRecordsService } from './attendance-records.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CheckInSchema,
  CheckInInput,
  CheckOutSchema,
  CheckOutInput,
  ManualAttendanceSchema,
  ManualAttendanceInput,
  AttendanceRecordQueryFilterSchema,
  AttendanceRecordQueryFilterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceRecordsController {
  constructor(
    private readonly service: AttendanceRecordsService,
    private readonly employeesRepo: EmployeesRepository,
  ) {}

  private async getEmployeeId(organizationId: string, userId: string): Promise<string> {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('No employee record found for current user');
    }
    return employee.id;
  }

  @Post('check-in')
  @RequirePermissions(PermissionCode.ATTENDANCE_CHECK_IN)
  async checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CheckInSchema)) input: CheckInInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.checkIn(user.organizationId, employeeId, input, req.ip);
  }

  @Post('check-out')
  @RequirePermissions(PermissionCode.ATTENDANCE_CHECK_OUT)
  async checkOut(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CheckOutSchema)) input: CheckOutInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.checkOut(user.organizationId, employeeId, input, req.ip);
  }

  @Post('manual')
  @RequirePermissions(PermissionCode.ATTENDANCE_REGULARISE_OVERRIDE)
  async recordManual(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ManualAttendanceSchema)) input: ManualAttendanceInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.recordManual(user.organizationId, input, user.id, req.ip);
  }

  @Get('today')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_OWN)
  async getTodayStatus(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.getTodayStatus(user.organizationId, employeeId);
  }

  @Get('my-summary')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_OWN)
  async getMySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.getMySummary(
      user.organizationId,
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('my-records')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_OWN)
  async getMyRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(AttendanceRecordQueryFilterSchema)) filter: AttendanceRecordQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.getMyRecords(user.organizationId, employeeId, filter);
  }

  @Get('team')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_TEAM)
  async getTeamAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') date?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.getTeamAttendance(user.organizationId, employeeId, date ? new Date(date) : undefined);
  }

  @Get('organization')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_ALL)
  async getOrganizationAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(AttendanceRecordQueryFilterSchema)) filter: AttendanceRecordQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getOrganizationAttendance(user.organizationId, filter);
  }
}
