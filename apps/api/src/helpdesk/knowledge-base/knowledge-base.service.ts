import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { KnowledgeBaseRepository } from './knowledge-base.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, ArticleStatus } from '@zentra/shared-types';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    private readonly repository: KnowledgeBaseRepository,
    private readonly auditService: AuditService,
  ) {}

  // Categories
  async findAllCategories(organizationId: string) {
    return this.repository.findAllCategories(organizationId);
  }

  async createCategory(
    organizationId: string,
    data: any,
    userId: string,
  ) {
    return this.repository.createCategory(organizationId, {
      ...data,
      createdBy: userId,
    });
  }

  // Articles
  async findAllArticles(organizationId: string, filters: any = {}) {
    return this.repository.findAllArticles(organizationId, filters);
  }

  async findArticleById(organizationId: string, id: string, incrementView = false) {
    const article = await this.repository.findArticleById(organizationId, id);
    if (!article) {
      throw new NotFoundException(`Article with identifier '${id}' not found`);
    }

    if (incrementView) {
      await this.repository.incrementViews(article.id);
      article.viewCount += 1;
    }

    return article;
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const rand = Math.random().toString(36).substring(2, 6);
    return `${base}-${rand}`;
  }

  async createArticle(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const category = await this.repository.findCategoryById(organizationId, data.knowledgeBaseCategoryId);
    if (!category) {
      throw new BadRequestException('Specified knowledge base category not found');
    }

    let slug = data.slug;
    if (!slug) {
      slug = this.generateSlug(data.title);
    }

    const existingSlug = await this.repository.findArticleBySlug(organizationId, slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const article = await this.repository.createArticle(organizationId, {
      ...data,
      slug,
      authorId: userId,
      publishedAt: data.articleStatus === ArticleStatus.PUBLISHED ? new Date() : null,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KNOWLEDGE_BASE_ARTICLE_CREATE,
      resource: 'KnowledgeBaseArticle',
      resourceId: article.id,
      ipAddress,
      userAgent,
      details: { title: article.title, slug: article.slug, status: article.articleStatus },
    });

    return article;
  }

  async updateArticle(
    organizationId: string,
    id: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findArticleById(organizationId, id);

    if (data.knowledgeBaseCategoryId) {
      const category = await this.repository.findCategoryById(organizationId, data.knowledgeBaseCategoryId);
      if (!category) {
        throw new BadRequestException('Specified knowledge base category not found');
      }
    }

    const updated = await this.repository.updateArticle(organizationId, id, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KNOWLEDGE_BASE_ARTICLE_UPDATE,
      resource: 'KnowledgeBaseArticle',
      resourceId: id,
      ipAddress,
      userAgent,
      details: data,
    });

    return updated;
  }

  async publishArticle(
    organizationId: string,
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const updated = await this.repository.updateArticle(organizationId, id, {
      articleStatus: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KNOWLEDGE_BASE_ARTICLE_PUBLISH,
      resource: 'KnowledgeBaseArticle',
      resourceId: id,
      ipAddress,
      userAgent,
      details: { status: ArticleStatus.PUBLISHED },
    });

    return updated;
  }

  async archiveArticle(
    organizationId: string,
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const updated = await this.repository.updateArticle(organizationId, id, {
      articleStatus: ArticleStatus.ARCHIVED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.KNOWLEDGE_BASE_ARTICLE_ARCHIVE,
      resource: 'KnowledgeBaseArticle',
      resourceId: id,
      ipAddress,
      userAgent,
      details: { status: ArticleStatus.ARCHIVED },
    });

    return updated;
  }

  async voteHelpfulness(organizationId: string, id: string, isHelpful: boolean) {
    const article = await this.findArticleById(organizationId, id);
    return this.repository.voteHelpfulness(article.id, isHelpful);
  }

  async deleteArticle(organizationId: string, id: string) {
    await this.findArticleById(organizationId, id);
    return this.repository.deleteArticle(organizationId, id);
  }
}
