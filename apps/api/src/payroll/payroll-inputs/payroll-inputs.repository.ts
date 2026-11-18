import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayrollInput } from '@prisma/client';

@Injectable()
export class PayrollInputsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRun(payrollRunId: string, organizationId: string): Promise<any[]> {
    return this.prisma.payrollInput.findMany({
      where: {
        payrollRunId,
        organizationId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        salaryComponent: {
          select: { id: true, name: true, componentCode: true, componentType: true },
        },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    return this.prisma.payrollInput.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        salaryComponent: true,
      },
    });
  }

  async create(organizationId: string, data: any): Promise<PayrollInput> {
    return this.prisma.payrollInput.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any): Promise<PayrollInput> {
    return this.prisma.payrollInput.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string): Promise<PayrollInput> {
    return this.prisma.payrollInput.delete({
      where: { id },
    });
  }

  async deleteAutoSyncedInputs(payrollRunId: string, organizationId: string): Promise<void> {
    await this.prisma.payrollInput.deleteMany({
      where: {
        payrollRunId,
        organizationId,
        source: 'AUTO_SYNC',
      },
    });
  }

  async bulkCreate(inputs: any[]): Promise<void> {
    if (inputs.length === 0) return;
    await this.prisma.payrollInput.createMany({
      data: inputs,
    });
  }
}
