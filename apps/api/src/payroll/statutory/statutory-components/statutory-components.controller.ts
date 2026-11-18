import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { StatutoryComponentsService } from './statutory-components.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  StatutoryComponentSchema,
  UpdateStatutoryComponentSchema,
} from '@zentra/shared-types';

@Controller('payroll/statutory-components')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatutoryComponentsController {
  constructor(private readonly service: StatutoryComponentsService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('statutoryType') statutoryType?: string,
    @Query('isActive') isActive?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, {
      statutoryType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(id, user.organizationId);
  }

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_CONFIGURE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = StatutoryComponentSchema.parse(body);
    return this.service.create(user.organizationId, validated, user.id, req.ip, req.headers['user-agent']);
  }

  @Put(':id')
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_CONFIGURE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateStatutoryComponentSchema.parse(body);
    return this.service.update(id, user.organizationId, validated, user.id, req.ip, req.headers['user-agent']);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PAYROLL_STATUTORY_CONFIGURE)
  async toggleActive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.toggleActive(id, user.organizationId, user.id, req.ip, req.headers['user-agent']);
  }
}
