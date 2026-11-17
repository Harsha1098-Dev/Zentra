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
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateEmployeeSchema,
  CreateEmployeeInput,
  UpdateEmployeeSchema,
  UpdateEmployeeInput,
  ChangeEmployeeStatusSchema,
  ChangeEmployeeStatusInput,
  ChangeReportingManagerSchema,
  ChangeReportingManagerInput,
  ChangeDepartmentSchema,
  ChangeDepartmentInput,
  ChangeDesignationSchema,
  ChangeDesignationInput,
  ChangeLocationSchema,
  ChangeLocationInput,
  ChangeEmploymentTypeSchema,
  ChangeEmploymentTypeInput,
  EmployeeQueryFilterSchema,
  EmployeeQueryFilterInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions(PermissionCode.EMPLOYEE_READ_BASIC)
  async getEmployees(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(EmployeeQueryFilterSchema)) query: EmployeeQueryFilterInput,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getEmployees(
      user.organizationId,
      query,
      user.roles || [],
      user.id,
    );
  }

  @Post()
  @RequirePermissions(PermissionCode.EMPLOYEE_CREATE)
  async createEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateEmployeeSchema)) body: CreateEmployeeInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.createEmployee(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('next-code')
  @RequirePermissions(PermissionCode.EMPLOYEE_CREATE)
  async getNextCode(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getNextEmployeeCode(user.organizationId);
  }

  @Get('me')
  @RequirePermissions(PermissionCode.EMPLOYEE_READ_BASIC)
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const employee = await this.employeesService.getEmployeeByUserId(
      user.id,
      user.organizationId,
    );
    if (!employee) {
      return null;
    }
    return this.employeesService.getEmployeeProfile(
      employee.id,
      user.organizationId,
      user.roles || [],
      user.id,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.EMPLOYEE_READ_BASIC)
  async getEmployeeById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getEmployeeById(
      id,
      user.organizationId,
      user.roles || [],
      user.id,
    );
  }

  @Get(':id/profile')
  @RequirePermissions(PermissionCode.EMPLOYEE_READ_BASIC)
  async getEmployeeProfile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getEmployeeProfile(
      id,
      user.organizationId,
      user.roles || [],
      user.id,
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.EMPLOYEE_UPDATE)
  async updateEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateEmployeeSchema)) body: UpdateEmployeeInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.updateEmployee(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.EMPLOYEE_DELETE)
  async deleteEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.deleteEmployee(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id/timeline')
  @RequirePermissions(PermissionCode.EMPLOYEE_TIMELINE_READ)
  async getTimeline(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getTimeline(id, user.organizationId);
  }

  @Get(':id/employment-history')
  @RequirePermissions(PermissionCode.EMPLOYEE_EMPLOYMENT_HISTORY_READ)
  async getEmploymentHistory(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getEmploymentHistory(id, user.organizationId);
  }

  @Get(':id/reportees')
  @RequirePermissions(PermissionCode.EMPLOYEE_READ_BASIC)
  async getReportees(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getReportees(id, user.organizationId);
  }

  @Get(':id/reporting-structure')
  @RequirePermissions(PermissionCode.EMPLOYEE_READ_BASIC)
  async getReportingStructure(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.employeesService.getReportingStructure(id, user.organizationId);
  }

  @Patch(':id/status')
  @RequirePermissions(PermissionCode.EMPLOYEE_STATUS_MANAGE)
  async changeStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChangeEmployeeStatusSchema)) body: ChangeEmployeeStatusInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.changeStatus(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/reporting-manager')
  @RequirePermissions(PermissionCode.EMPLOYEE_REPORTING_MANAGER_MANAGE)
  async changeReportingManager(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChangeReportingManagerSchema)) body: ChangeReportingManagerInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.changeReportingManager(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/department')
  @RequirePermissions(PermissionCode.EMPLOYEE_DEPARTMENT_MANAGE)
  async changeDepartment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChangeDepartmentSchema)) body: ChangeDepartmentInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.changeDepartment(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/designation')
  @RequirePermissions(PermissionCode.EMPLOYEE_DESIGNATION_MANAGE)
  async changeDesignation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChangeDesignationSchema)) body: ChangeDesignationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.changeDesignation(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/location')
  @RequirePermissions(PermissionCode.EMPLOYEE_LOCATION_MANAGE)
  async changeLocation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChangeLocationSchema)) body: ChangeLocationInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.changeLocation(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/employment-type')
  @RequirePermissions(PermissionCode.EMPLOYEE_EMPLOYMENT_TYPE_MANAGE)
  async changeEmploymentType(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChangeEmploymentTypeSchema)) body: ChangeEmploymentTypeInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.employeesService.changeEmploymentType(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
