import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftInput, UpdateShiftInput } from '@zentra/shared-types';

@Injectable()
export class ShiftsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, input: CreateShiftInput) {
    if (input.isDefault) {
      await this.prisma.shift.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.create({
      data: {
        organizationId,
        name: input.name,
        code: input.code,
        startTime: input.startTime,
        endTime: input.endTime,
        isOvernight: input.isOvernight ?? false,
        breakDurationMinutes: input.breakDurationMinutes ?? 60,
        isPaidBreak: input.isPaidBreak ?? false,
        checkInMarginBeforeMinutes: input.checkInMarginBeforeMinutes ?? 60,
        checkOutMarginAfterMinutes: input.checkOutMarginAfterMinutes ?? 120,
        colorCode: input.colorCode ?? '#3B82F6',
        isDefault: input.isDefault ?? false,
        status: input.status ?? 'ACTIVE',
        policyId: input.policyId,
      },
      include: {
        policy: true,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.shift.findFirst({
      where: { id, organizationId },
      include: { policy: true },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.shift.findFirst({
      where: { code, organizationId },
      include: { policy: true },
    });
  }

  async findDefault(organizationId: string) {
    return this.prisma.shift.findFirst({
      where: { organizationId, isDefault: true, status: 'ACTIVE' },
      include: { policy: true },
    });
  }

  async findAll(organizationId: string, status?: string) {
    return this.prisma.shift.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      include: { policy: true },
      orderBy: [{ isDefault: 'desc' }, { startTime: 'asc' }],
    });
  }

  async update(organizationId: string, id: string, input: UpdateShiftInput) {
    if (input.isDefault) {
      await this.prisma.shift.updateMany({
        where: { organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.update({
      where: { id },
      data: input,
      include: { policy: true },
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.shift.delete({
      where: { id },
    });
  }
}
