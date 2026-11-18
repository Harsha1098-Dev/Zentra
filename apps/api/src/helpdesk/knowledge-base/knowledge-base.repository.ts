import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KnowledgeBaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Categories
  async findAllCategories(organizationId: string) {
    return this.prisma.knowledgeBaseCategory.findMany({
      where: { organizationId },
      include: {
        parentCategory: true,
        subCategories: true,
        _count: {
          select: {
            articles: {
              where: { articleStatus: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(organizationId: string, id: string) {
    return this.prisma.knowledgeBaseCategory.findFirst({
      where: { id, organizationId },
      include: {
        parentCategory: true,
        subCategories: true,
        articles: {
          where: { articleStatus: 'PUBLISHED' },
        },
      },
    });
  }

  async createCategory(organizationId: string, data: any) {
    return this.prisma.knowledgeBaseCategory.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  // Articles
  async findAllArticles(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };

    if (filters.status) {
      where.articleStatus = filters.status;
    }
    if (filters.categoryId) {
      where.knowledgeBaseCategoryId = filters.categoryId;
    }
    if (filters.visibility) {
      where.visibility = filters.visibility;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: filters.limit ? Number(filters.limit) : 50,
        skip: filters.offset ? Number(filters.offset) : 0,
      }),
      this.prisma.knowledgeBaseArticle.count({ where }),
    ]);

    return { items, total };
  }

  async findArticleById(organizationId: string, id: string) {
    return this.prisma.knowledgeBaseArticle.findFirst({
      where: {
        organizationId,
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findArticleBySlug(organizationId: string, slug: string) {
    return this.prisma.knowledgeBaseArticle.findFirst({
      where: { organizationId, slug },
    });
  }

  async createArticle(organizationId: string, data: any) {
    return this.prisma.knowledgeBaseArticle.create({
      data: {
        organizationId,
        ...data,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateArticle(organizationId: string, id: string, data: any) {
    return this.prisma.knowledgeBaseArticle.update({
      where: { id },
      data,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async incrementViews(id: string) {
    return this.prisma.knowledgeBaseArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async voteHelpfulness(id: string, isHelpful: boolean) {
    return this.prisma.knowledgeBaseArticle.update({
      where: { id },
      data: isHelpful
        ? { helpfulCount: { increment: 1 } }
        : { notHelpfulCount: { increment: 1 } },
    });
  }

  async deleteArticle(organizationId: string, id: string) {
    return this.prisma.knowledgeBaseArticle.delete({
      where: { id },
    });
  }
}
