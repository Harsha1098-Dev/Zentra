import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompOffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CompOffRequestUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.compOffRequest.create({
      data,
      include: {
        employee: {
          include: {
            user: true,
            department: true,
            designation: true,
          },
        },
      },
    });
  }

  async findById(id: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.compOffRequest.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
            designation: true,
          },
        },
      },
    });
  }

  async findByEmployeeAndDate(employeeId: string, workedDate: Date, organizationId: string) {
    return this.prisma.compOffRequest.findFirst({
      where: {
        organizationId,
        employeeId,
        workedDate,
      },
    });
  }

  async update(id: string, organizationId: string, data: Prisma.CompOffRequestUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.compOffRequest.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            user: true,
            department: true,
            designation: true,
          },
        },
      },
    });
  }

  async list(organizationId: string, filter: any) {
    const where: any = { organizationId };

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { reason: { contains: filter.search, mode: 'insensitive' } },
        { employee: { firstName: { contains: filter.search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.compOffRequest.count({ where }),
      this.prisma.compOffRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { workedDate: 'desc' },
        include: {
          employee: {
            include: {
              user: true,
              department: true,
              designation: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
