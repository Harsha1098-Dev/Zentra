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
import { SalaryComponentsService } from './salary-components.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateSalaryComponentSchema,
  UpdateSalaryComponentSchema,
} from '@zentra/shared-types';

@Controller('payroll/salary-components')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalaryComponentsController {
  constructor(private readonly service: SalaryComponentsService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_COMPONENT_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('componentType') componentType?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, {
      componentType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      searchTerm: search,
    });
  }

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_COMPONENT_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateSalaryComponentSchema.parse(body);
    return this.service.create(user.organizationId, validated, user.id, req.ip);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_COMPONENT_READ)
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_COMPONENT_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateSalaryComponentSchema.parse(body);
    return this.service.update(id, user.organizationId, validated, user.id, req.ip);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_COMPONENT_DELETE)
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

  @Patch(':id/activate')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_COMPONENT_UPDATE)
  async activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.activate(id, user.organizationId, user.id, req.ip);
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PermissionCode.PAYROLL_SALARY_COMPONENT_UPDATE)
  async deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deactivate(id, user.organizationId, user.id, req.ip);
  }
}
