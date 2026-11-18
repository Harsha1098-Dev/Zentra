import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRosterInput, UpdateRosterInput } from '@zentra/shared-types';

@Injectable()
export class RostersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, input: CreateRosterInput) {
    return this.prisma.roster.create({
      data: {
        organizationId,
        name: input.name,
        code: input.code || input.name.toUpperCase().replace(/\s+/g, '_'),
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: input.status ?? 'DRAFT',
      },
      include: {
        shiftAssignments: {
          include: {
            employee: true,
            shift: true,
          },
        },
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.roster.findFirst({
      where: { id, organizationId },
      include: {
        shiftAssignments: {
          include: {
            employee: true,
            shift: true,
          },
        },
      },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.roster.findFirst({
      where: { code, organizationId },
    });
  }

  async findAll(organizationId: string, status?: string) {
    return this.prisma.roster.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      include: {
        _count: {
          select: { shiftAssignments: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(organizationId: string, id: string, input: UpdateRosterInput, publishedBy?: string) {
    const data: any = { ...input };
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);
    if (input.status === 'PUBLISHED') {
      data.publishedAt = new Date();
      if (publishedBy) data.publishedBy = publishedBy;
    }

    return this.prisma.roster.update({
      where: { id },
      data,
      include: {
        shiftAssignments: {
          include: {
            employee: true,
            shift: true,
          },
        },
      },
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.roster.delete({
      where: { id },
    });
  }
}
