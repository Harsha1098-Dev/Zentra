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
import { KnowledgeBaseService } from './knowledge-base.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import {
  PermissionCode,
  CreateKnowledgeBaseCategorySchema,
  CreateKnowledgeBaseArticleSchema,
  UpdateKnowledgeBaseArticleSchema,
} from '@zentra/shared-types';

@Controller('helpdesk/knowledge-base')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  @Get('categories')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_READ)
  async findAllCategories(@CurrentUser() user: AuthenticatedUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllCategories(user.organizationId);
  }

  @Post('categories')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_CREATE)
  async createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateKnowledgeBaseCategorySchema.parse(body);
    return this.service.createCategory(user.organizationId, validated, user.id);
  }

  @Get('articles')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_READ)
  async findAllArticles(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: any,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findAllArticles(user.organizationId, query);
  }

  @Get('articles/:id')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_READ)
  async findArticleById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.findArticleById(user.organizationId, id, true);
  }

  @Post('articles')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_CREATE)
  async createArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = CreateKnowledgeBaseArticleSchema.parse(body);
    return this.service.createArticle(
      user.organizationId,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch('articles/:id')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_UPDATE)
  async updateArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    const validated = UpdateKnowledgeBaseArticleSchema.parse(body);
    return this.service.updateArticle(
      user.organizationId,
      id,
      validated,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('articles/:id/publish')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_PUBLISH)
  async publishArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.publishArticle(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('articles/:id/archive')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_ARCHIVE)
  async archiveArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.archiveArticle(
      user.organizationId,
      id,
      user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('articles/:id/feedback')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_READ)
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

  @Delete('articles/:id')
  @RequirePermissions(PermissionCode.KNOWLEDGE_BASE_DELETE)
  async deleteArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('No active organization selected');
    }
    return this.service.deleteArticle(user.organizationId, id);
  }
}
