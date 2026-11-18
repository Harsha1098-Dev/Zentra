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
import { AttendanceRegularisationsService } from './attendance-regularisations.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateAttendanceRegularisationSchema,
  CreateAttendanceRegularisationInput,
  RegularisationDecisionSchema,
  RegularisationDecisionInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('attendance-regularisations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceRegularisationsController {
  constructor(
    private readonly service: AttendanceRegularisationsService,
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
  @RequirePermissions(PermissionCode.ATTENDANCE_REGULARISE)
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateAttendanceRegularisationSchema)) input: CreateAttendanceRegularisationInput,
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
    @Query('status') status?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    // If not admin/manager, restrict to own requests
    const filterEmployeeId = employeeId;
    return this.service.findMany(user.organizationId, { employeeId: filterEmployeeId, status });
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
  @RequirePermissions(PermissionCode.ATTENDANCE_REGULARISE_APPROVE)
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RegularisationDecisionSchema)) decision: RegularisationDecisionInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.decide(user.organizationId, id, decision, user.id, req.ip);
  }
}
