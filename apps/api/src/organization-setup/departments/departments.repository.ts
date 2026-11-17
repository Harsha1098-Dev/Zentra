import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentInput, UpdateDepartmentInput } from '@zentra/shared-types';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string, search?: string) {
    return this.prisma.department.findMany({
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
        parentDepartment: {
          select: { id: true, name: true, code: true },
        },
        departmentHeadUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: {
            childDepartments: true,
            designations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.department.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        parentDepartment: {
          select: { id: true, name: true, code: true },
        },
        childDepartments: {
          where: { deletedAt: null },
          select: { id: true, name: true, code: true, status: true },
        },
        departmentHeadUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: {
            childDepartments: true,
            designations: true,
          },
        },
      },
    });
  }

  async findByName(organizationId: string, name: string) {
    return this.prisma.department.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.department.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: CreateDepartmentInput) {
    return this.prisma.department.create({
      data: {
        organizationId,
        name: data.name,
        code: data.code,
        parentDepartmentId: data.parentDepartmentId || null,
        departmentHeadUserId: data.departmentHeadUserId || null,
        description: data.description || null,
        status: 'ACTIVE',
      },
      include: {
        parentDepartment: {
          select: { id: true, name: true, code: true },
        },
        departmentHeadUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async update(id: string, organizationId: string, data: UpdateDepartmentInput) {
    return this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.code ? { code: data.code } : {}),
        ...(data.parentDepartmentId !== undefined
          ? { parentDepartmentId: data.parentDepartmentId || null }
          : {}),
        ...(data.departmentHeadUserId !== undefined
          ? { departmentHeadUserId: data.departmentHeadUserId || null }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description || null }
          : {}),
      },
      include: {
        parentDepartment: {
          select: { id: true, name: true, code: true },
        },
        departmentHeadUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async setStatus(id: string, organizationId: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.prisma.department.update({
      where: { id },
      data: { status },
      include: {
        parentDepartment: {
          select: { id: true, name: true, code: true },
        },
        departmentHeadUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
