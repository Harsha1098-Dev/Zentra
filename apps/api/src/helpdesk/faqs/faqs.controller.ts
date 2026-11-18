import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { FaqsService } from './faqs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateFaqSchema,
  UpdateFaqSchema,
} from '@zentra/shared-types';

@Controller('helpdesk/faqs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FaqsController {
  constructor(private readonly service: FaqsService) {}

  @Get()
  @RequirePermissions(PermissionCode.FAQ_READ)
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAll(user.organizationId, query);
  }

  @Get('suggest')
  @RequirePermissions(PermissionCode.FAQ_READ)
  async suggest(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: string,
    @Query('query') query?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.suggest(user.organizationId, category, query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.FAQ_READ)
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
  @RequirePermissions(PermissionCode.FAQ_CREATE)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateFaqSchema.parse(body);
    return this.service.create(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.FAQ_UPDATE)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateFaqSchema.parse(body);
    return this.service.update(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':id/feedback')
  @RequirePermissions(PermissionCode.FAQ_READ)
  async voteHelpfulness(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { isHelpful: boolean },
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.voteHelpfulness(user.organizationId, id, body.isHelpful);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.FAQ_DELETE)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.delete(user.organizationId, id);
  }
}
