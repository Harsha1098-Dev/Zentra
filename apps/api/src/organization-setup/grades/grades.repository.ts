import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGradeInput, UpdateGradeInput } from '@zentra/shared-types';

@Injectable()
export class GradesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string) {
    return this.prisma.grade.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      include: {
        _count: {
          select: { designations: true },
        },
      },
      orderBy: { level: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.grade.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        designations: {
          where: { deletedAt: null },
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async findByName(organizationId: string, name: string) {
    return this.prisma.grade.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.grade.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async findByLevel(organizationId: string, level: number) {
    return this.prisma.grade.findFirst({
      where: {
        organizationId,
        level,
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: CreateGradeInput) {
    return this.prisma.grade.create({
      data: {
        organizationId,
        name: data.name,
        code: data.code,
        level: data.level,
        description: data.description || null,
        status: 'ACTIVE',
      },
    });
  }

  async update(id: string, organizationId: string, data: UpdateGradeInput) {
    return this.prisma.grade.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.code ? { code: data.code } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
      },
    });
  }

  async setStatus(id: string, organizationId: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.prisma.grade.update({
      where: { id },
      data: { status },
    });
  }
}
