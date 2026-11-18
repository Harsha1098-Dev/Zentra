import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StatutoryComponentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { statutoryType?: string; isActive?: boolean } = {}) {
    const where: any = { organizationId };
    if (filters.statutoryType) {
      where.statutoryType = filters.statutoryType;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.statutoryComponent.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.statutoryComponent.findFirst({
      where: { id, organizationId },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.statutoryComponent.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code,
        },
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.statutoryComponent.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.statutoryComponent.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.statutoryComponent.delete({
      where: { id },
    });
  }
}
