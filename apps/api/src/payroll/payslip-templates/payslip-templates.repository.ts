import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayslipTemplate } from '@prisma/client';

@Injectable()
export class PayslipTemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<PayslipTemplate[]> {
    return this.prisma.payslipTemplate.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string, organizationId: string): Promise<PayslipTemplate | null> {
    return this.prisma.payslipTemplate.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findDefault(organizationId: string): Promise<PayslipTemplate | null> {
    return this.prisma.payslipTemplate.findFirst({
      where: {
        organizationId,
        isDefault: true,
        deletedAt: null,
      },
    });
  }

  async clearDefault(organizationId: string): Promise<void> {
    await this.prisma.payslipTemplate.updateMany({
      where: { organizationId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async create(organizationId: string, data: any): Promise<PayslipTemplate> {
    return this.prisma.payslipTemplate.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any): Promise<PayslipTemplate> {
    return this.prisma.payslipTemplate.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(id: string, organizationId: string): Promise<PayslipTemplate> {
    return this.prisma.payslipTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
  }
}
