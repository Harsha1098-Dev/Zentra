import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalaryStructure } from '@prisma/client';

@Injectable()
export class SalaryStructuresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filter?: { status?: string }): Promise<any[]> {
    const where: any = {
      organizationId,
      deletedAt: null,
    };
    if (filter?.status) {
      where.status = filter.status;
    }

    return this.prisma.salaryStructure.findMany({
      where,
      include: {
        components: {
          include: {
            salaryComponent: true,
          },
          orderBy: { payslipDisplayOrder: 'asc' },
        },
        _count: {
          select: { salaryAssignments: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    return this.prisma.salaryStructure.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        components: {
          include: {
            salaryComponent: true,
          },
          orderBy: { payslipDisplayOrder: 'asc' },
        },
        _count: {
          select: { salaryAssignments: true },
        },
      },
    });
  }

  async findByName(name: string, organizationId: string): Promise<SalaryStructure | null> {
    return this.prisma.salaryStructure.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findDefault(organizationId: string): Promise<SalaryStructure | null> {
    return this.prisma.salaryStructure.findFirst({
      where: {
        organizationId,
        isDefault: true,
        deletedAt: null,
      },
    });
  }

  async clearDefault(organizationId: string): Promise<void> {
    await this.prisma.salaryStructure.updateMany({
      where: { organizationId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async create(organizationId: string, data: any): Promise<any> {
    const { components, ...structureData } = data;

    return this.prisma.salaryStructure.create({
      data: {
        ...structureData,
        organizationId,
        monthlyCtc: structureData.annualCtc ? Number((structureData.annualCtc / 12).toFixed(2)) : 0,
        components: {
          create: (components || []).map((c: any) => ({
            salaryComponentId: c.salaryComponentId,
            calculationType: c.calculationType,
            amount: c.amount || 0,
            percentage: c.percentage || 0,
            formula: c.formula || null,
            payslipDisplayOrder: c.payslipDisplayOrder || 0,
            isMandatory: c.isMandatory !== false,
            isEditable: c.isEditable !== false,
          })),
        },
      },
      include: {
        components: {
          include: { salaryComponent: true },
          orderBy: { payslipDisplayOrder: 'asc' },
        },
      },
    });
  }

  async update(id: string, organizationId: string, data: any): Promise<any> {
    const { components, ...structureData } = data;

    return this.prisma.$transaction(async (tx) => {
      if (components) {
        // Delete existing components and recreate
        await tx.salaryStructureComponent.deleteMany({
          where: { salaryStructureId: id },
        });

        await tx.salaryStructureComponent.createMany({
          data: components.map((c: any) => ({
            salaryStructureId: id,
            salaryComponentId: c.salaryComponentId,
            calculationType: c.calculationType,
            amount: c.amount || 0,
            percentage: c.percentage || 0,
            formula: c.formula || null,
            payslipDisplayOrder: c.payslipDisplayOrder || 0,
            isMandatory: c.isMandatory !== false,
            isEditable: c.isEditable !== false,
          })),
        });
      }

      const updateData: any = { ...structureData };
      if (structureData.annualCtc !== undefined) {
        updateData.monthlyCtc = Number((structureData.annualCtc / 12).toFixed(2));
      }

      return tx.salaryStructure.update({
        where: { id },
        data: updateData,
        include: {
          components: {
            include: { salaryComponent: true },
            orderBy: { payslipDisplayOrder: 'asc' },
          },
        },
      });
    });
  }

  async softDelete(id: string, organizationId: string): Promise<SalaryStructure> {
    return this.prisma.salaryStructure.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
  }

  async findAssignments(salaryStructureId: string, organizationId: string): Promise<any[]> {
    return this.prisma.employeeSalaryAssignment.findMany({
      where: {
        salaryStructureId,
        organizationId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
