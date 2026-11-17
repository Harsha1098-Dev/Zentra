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
} from '@nestjs/common';
import { Request } from 'express';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateDepartmentSchema,
  CreateDepartmentInput,
  UpdateDepartmentSchema,
  UpdateDepartmentInput,
  PermissionCode,
} from '@zentra/shared-types';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get('tree')
  @RequirePermissions(PermissionCode.DEPARTMENT_READ)
  async getDepartmentTree(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.departmentsService.getDepartmentTree(user.organizationId);
  }

  @Get()
  @RequirePermissions(PermissionCode.DEPARTMENT_READ)
  async getDepartments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.departmentsService.getDepartments(user.organizationId, status, search);
  }

  @Post()
  @RequirePermissions(PermissionCode.DEPARTMENT_CREATE)
  async createDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateDepartmentSchema)) body: CreateDepartmentInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.departmentsService.createDepartment(
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.DEPARTMENT_READ)
  async getDepartmentById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.departmentsService.getDepartmentById(id, user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.DEPARTMENT_UPDATE)
  async updateDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDepartmentSchema)) body: UpdateDepartmentInput,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.departmentsService.updateDepartment(
      id,
      user.organizationId,
      body,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/activate')
  @RequirePermissions(PermissionCode.DEPARTMENT_DEACTIVATE)
  async activateDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.departmentsService.activateDepartment(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PermissionCode.DEPARTMENT_DEACTIVATE)
  async deactivateDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.departmentsService.deactivateDepartment(
      id,
      user.organizationId,
      user.id,
      ipAddress,
      userAgent,
    );
  }
}
