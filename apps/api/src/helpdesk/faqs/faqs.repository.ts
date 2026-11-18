import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FaqsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.categoryId) {
      where.helpdeskCategoryId = filters.categoryId;
    }
    if (filters.search) {
      where.OR = [
        { question: { contains: filters.search, mode: 'insensitive' } },
        { answer: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.faq.findMany({
      where,
      include: {
        helpdeskCategory: true,
        helpdeskSubCategory: true,
      },
      orderBy: { helpfulCount: 'desc' },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.faq.findFirst({
      where: { id, organizationId },
      include: {
        helpdeskCategory: true,
        helpdeskSubCategory: true,
      },
    });
  }

  async suggest(organizationId: string, categoryId?: string, query?: string) {
    const where: any = {
      organizationId,
      status: 'ACTIVE',
    };

    if (categoryId) {
      where.helpdeskCategoryId = categoryId;
    }

    if (query && query.trim()) {
      where.OR = [
        { question: { contains: query.trim(), mode: 'insensitive' } },
        { answer: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.faq.findMany({
      where,
      include: {
        helpdeskCategory: true,
      },
      take: 5,
      orderBy: { helpfulCount: 'desc' },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.faq.create({
      data: {
        organizationId,
        ...data,
      },
      include: {
        helpdeskCategory: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.faq.update({
      where: { id },
      data,
      include: {
        helpdeskCategory: true,
      },
    });
  }

  async voteHelpfulness(id: string, isHelpful: boolean) {
    return this.prisma.faq.update({
      where: { id },
      data: isHelpful
        ? { helpfulCount: { increment: 1 } }
        : { notHelpfulCount: { increment: 1 } },
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.faq.delete({
      where: { id },
    });
  }
}
