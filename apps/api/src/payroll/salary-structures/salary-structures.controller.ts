import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SalaryStructuresService } from './salary-structures.service';
import { EmployeeSalaryService } from '../employee-salary/employee-salary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateSalaryStructureSchema,
  UpdateSalaryStructureSchema,
  AssignSalaryStructureSchema,
} from '@zentra/shared-types';

@Controller('payroll/salary-structures')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalaryStructuresController {
  constructor(
    private readonly service: SalaryStructuresService,
    private readonly employeeSalaryService: EmployeeSalaryService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, { status });
  }

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateSalaryStructureSchema.parse(body);
    return this.service.create(user.organizationId, validated, user.id, req.ip);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateSalaryStructureSchema.parse(body);
    return this.service.update(id, user.organizationId, validated, user.id, req.ip);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_DELETE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(id, user.organizationId, user.id, req.ip);
  }

  @Post(':id/assign')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_ASSIGN)
  async assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = AssignSalaryStructureSchema.parse({
      ...body,
      salaryStructureId: id,
    });
    return this.employeeSalaryService.assignStructure(user.organizationId, validated, user.id, req.ip);
  }

  @Get(':id/assignments')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_STRUCTURE_READ)
  async getAssignments(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.getAssignments(id, user.organizationId);
  }
}
