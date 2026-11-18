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
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceRequestsService } from './attendance-requests.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateAttendanceRequestSchema,
  CreateAttendanceRequestInput,
  AttendanceRequestDecisionSchema,
  AttendanceRequestDecisionInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('attendance-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceRequestsController {
  constructor(
    private readonly service: AttendanceRequestsService,
    private readonly employeesRepo: EmployeesRepository,
  ) {}

  private async getEmployeeId(organizationId: string, userId: string): Promise<string> {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('No employee record found for current user');
    }
    return employee.id;
  }

  @Post()
  @RequirePermissions(PermissionCode.ATTENDANCE_ONDUTY_APPLY)
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateAttendanceRequestSchema)) input: CreateAttendanceRequestInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employeeId = await this.getEmployeeId(user.organizationId, user.id);
    return this.service.submit(user.organizationId, employeeId, input, req.ip);
  }

  @Get()
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_OWN)
  async findMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query('employeeId') employeeId?: string,
    @Query('requestType') requestType?: string,
    @Query('status') status?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findMany(user.organizationId, { employeeId, requestType, status });
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ_OWN)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Patch(':id/decision')
  @RequirePermissions(PermissionCode.ATTENDANCE_ONDUTY_APPROVE)
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AttendanceRequestDecisionSchema)) decision: AttendanceRequestDecisionInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.decide(user.organizationId, id, decision, user.id, req.ip);
  }
}
