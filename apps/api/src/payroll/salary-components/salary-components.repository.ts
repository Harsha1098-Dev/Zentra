import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalaryComponent } from '@prisma/client';

@Injectable()
export class SalaryComponentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filter?: {
      componentType?: string;
      isActive?: boolean;
      searchTerm?: string;
    },
  ): Promise<SalaryComponent[]> {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filter?.componentType) {
      where.componentType = filter.componentType;
    }
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    if (filter?.searchTerm) {
      where.OR = [
        { name: { contains: filter.searchTerm, mode: 'insensitive' } },
        { componentCode: { contains: filter.searchTerm, mode: 'insensitive' } },
        { payslipLabel: { contains: filter.searchTerm, mode: 'insensitive' } },
      ];
    }

    return this.prisma.salaryComponent.findMany({
      where,
      orderBy: [{ payslipDisplayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string, organizationId: string): Promise<SalaryComponent | null> {
    return this.prisma.salaryComponent.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findByCode(componentCode: string, organizationId: string): Promise<SalaryComponent | null> {
    return this.prisma.salaryComponent.findFirst({
      where: {
        componentCode: componentCode.toUpperCase(),
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findByName(name: string, organizationId: string): Promise<SalaryComponent | null> {
    return this.prisma.salaryComponent.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        organizationId,
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: any): Promise<SalaryComponent> {
    return this.prisma.salaryComponent.create({
      data: {
        ...data,
        organizationId,
        componentCode: data.componentCode.toUpperCase(),
      },
    });
  }

  async update(id: string, organizationId: string, data: any): Promise<SalaryComponent> {
    return this.prisma.salaryComponent.update({
      where: { id },
      data: {
        ...data,
        componentCode: data.componentCode ? data.componentCode.toUpperCase() : undefined,
      },
    });
  }

  async softDelete(id: string, organizationId: string): Promise<SalaryComponent> {
    return this.prisma.salaryComponent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async setActive(id: string, organizationId: string, isActive: boolean): Promise<SalaryComponent> {
    return this.prisma.salaryComponent.update({
      where: { id },
      data: { isActive },
    });
  }
}
