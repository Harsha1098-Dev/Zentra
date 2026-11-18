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
import { HelpdeskCategoriesService } from './helpdesk-categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateHelpdeskCategorySchema,
  UpdateHelpdeskCategorySchema,
  CreateHelpdeskSubCategorySchema,
  UpdateHelpdeskSubCategorySchema,
} from '@zentra/shared-types';

@Controller('helpdesk/categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HelpdeskCategoriesController {
  constructor(private readonly service: HelpdeskCategoriesService) {}

  @Get()
  @RequirePermissions(PermissionCode.HELPDESK_CATEGORY_READ)
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.HELPDESK_CATEGORY_READ)
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
  @RequirePermissions(PermissionCode.HELPDESK_CATEGORY_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateHelpdeskCategorySchema.parse(body);
    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.HELPDESK_CATEGORY_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateHelpdeskCategorySchema.parse(body);
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
  @RequirePermissions(PermissionCode.HELPDESK_CATEGORY_DELETE)
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

  @Post(':id/subcategories')
  @RequirePermissions(PermissionCode.HELPDESK_CATEGORY_CREATE)
  async createSubCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateHelpdeskSubCategorySchema.parse({
      ...body,
      helpdeskCategoryId: id,
    });
    return this.service.createSubCategory(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id/subcategories/:subId')
  @RequirePermissions(PermissionCode.HELPDESK_CATEGORY_UPDATE)
  async updateSubCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('subId') subId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateHelpdeskSubCategorySchema.parse(body);
    return this.service.updateSubCategory(
      user.organizationId,
      id,
      subId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
