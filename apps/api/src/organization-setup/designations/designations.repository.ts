import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDesignationInput, UpdateDesignationInput } from '@zentra/shared-types';

@Injectable()
export class DesignationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string, search?: string) {
    return this.prisma.designation.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        grade: {
          select: { id: true, name: true, code: true, level: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.designation.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        grade: {
          select: { id: true, name: true, code: true, level: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async findByName(organizationId: string, name: string) {
    return this.prisma.designation.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.designation.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: CreateDesignationInput) {
    return this.prisma.designation.create({
      data: {
        organizationId,
        name: data.name,
        code: data.code,
        gradeId: data.gradeId || null,
        departmentId: data.departmentId || null,
        description: data.description || null,
        status: 'ACTIVE',
      },
      include: {
        grade: {
          select: { id: true, name: true, code: true, level: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async update(id: string, organizationId: string, data: UpdateDesignationInput) {
    return this.prisma.designation.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.code ? { code: data.code } : {}),
        ...(data.gradeId !== undefined ? { gradeId: data.gradeId || null } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId || null } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
      },
      include: {
        grade: {
          select: { id: true, name: true, code: true, level: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async setStatus(id: string, organizationId: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.prisma.designation.update({
      where: { id },
      data: { status },
      include: {
        grade: {
          select: { id: true, name: true, code: true, level: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }
}
