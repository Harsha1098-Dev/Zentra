import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { EmployeeSalaryService } from './employee-salary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateSalaryRevisionSchema,
  AssignSalaryStructureSchema,
} from '@zentra/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeeSalaryController {
  constructor(private readonly service: EmployeeSalaryService) {}

  // Employee Self-Service
  @Get('me/salary-structure')
  @RequirePermissions(PermissionCode.PAYROLL_READ_OWN)
  async getMySalaryStructure(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMySalaryStructure(user.id, user.organizationId);
  }

  @Get('me/salary-revisions')
  @RequirePermissions(PermissionCode.PAYROLL_READ_OWN)
  async getMySalaryRevisions(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getMySalaryRevisions(user.id, user.organizationId);
  }

  // All Employee Salary Assignments (for Admin overview table)
  @Get('payroll/employee-salaries')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_READ)
  async getAllAssignments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getAllAssignments(user.organizationId, { search });
  }

  // HR / Admin Employee Specific Endpoints
  @Get('employees/:id/salary-structure')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_READ)
  async getEmployeeSalaryStructure(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getActiveStructure(employeeId, user.organizationId);
  }

  @Get('employees/:id/salary-revisions')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_READ)
  async getEmployeeSalaryRevisions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getRevisions(employeeId, user.organizationId);
  }

  @Post('employees/:id/salary-revisions')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_REVISION_CREATE)
  async createSalaryRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateSalaryRevisionSchema.parse(body);
    return this.service.createRevision(
      employeeId,
      user.organizationId,
      validated,
      user.id,
      req.ip,
    );
  }

  @Post('employees/:id/salary-revisions/:revisionId/approve')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_REVISION_APPROVE)
  async approveSalaryRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
    @Param('revisionId') revisionId: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.approveRevision(revisionId, user.organizationId, user.id, req.ip);
  }

  @Post('employees/:id/salary-revisions/:revisionId/reject')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_REVISION_APPROVE)
  async rejectSalaryRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
    @Param('revisionId') revisionId: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.rejectRevision(revisionId, user.organizationId, reason, user.id, req.ip);
  }
}
