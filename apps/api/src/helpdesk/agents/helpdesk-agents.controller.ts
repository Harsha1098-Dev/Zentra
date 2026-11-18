import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { HelpdeskAgentsService } from './helpdesk-agents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateHelpdeskAgentSchema,
  UpdateHelpdeskAgentSchema,
} from '@zentra/shared-types';

@Controller('helpdesk/agents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HelpdeskAgentsController {
  constructor(private readonly service: HelpdeskAgentsService) {}

  @Get()
  @RequirePermissions(PermissionCode.HELPDESK_AGENT_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.HELPDESK_AGENT_READ)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findById(user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PermissionCode.HELPDESK_AGENT_MANAGE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateHelpdeskAgentSchema.parse(body);
    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.HELPDESK_AGENT_MANAGE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateHelpdeskAgentSchema.parse(body);
    return this.service.update(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.HELPDESK_AGENT_MANAGE)
  async deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deactivate(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/categories')
  @RequirePermissions(PermissionCode.HELPDESK_AGENT_MANAGE)
  async assignCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { categoryId: string; isPrimary?: boolean; subCategoryId?: string },
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.assignCategory(
      user.organizationId,
      id,
      body.categoryId,
      body.isPrimary ?? false,
      body.subCategoryId,
    );
  }

  @Delete(':id/categories/:categoryId')
  @RequirePermissions(PermissionCode.HELPDESK_AGENT_MANAGE)
  async removeCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.removeCategory(user.organizationId, id, categoryId);
  }
}
