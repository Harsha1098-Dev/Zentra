import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LeaveRequestUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.leaveRequest.create({
      data,
      include: {
        leaveType: true,
        leavePolicy: true,
        employee: {
          include: {
            user: true,
            department: true,
            designation: true,
            location: true,
          },
        },
        coveringEmployee: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findById(id: string, organizationId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.leaveRequest.findFirst({
      where: { id, organizationId },
      include: {
        leaveType: true,
        leavePolicy: true,
        employee: {
          include: {
            user: true,
            department: true,
            designation: true,
            location: true,
          },
        },
        coveringEmployee: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findOverlappingRequests(
    employeeId: string,
    organizationId: string,
    fromDate: Date,
    toDate: Date,
    excludeRequestId?: string,
  ) {
    const where: any = {
      organizationId,
      employeeId,
      status: {
        in: ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'],
      },
      fromDate: { lte: toDate },
      toDate: { gte: fromDate },
    };

    if (excludeRequestId) {
      where.id = { not: excludeRequestId };
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: Prisma.LeaveRequestUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.leaveRequest.update({
      where: { id },
      data,
      include: {
        leaveType: true,
        leavePolicy: true,
        employee: {
          include: {
            user: true,
            department: true,
            designation: true,
            location: true,
          },
        },
        coveringEmployee: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async list(organizationId: string, filter: any) {
    const where: any = { organizationId };

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.leaveTypeId) where.leaveTypeId = filter.leaveTypeId;
    if (filter.status) where.status = filter.status;
    if (filter.fromDate && filter.toDate) {
      where.fromDate = { gte: new Date(filter.fromDate) };
      where.toDate = { lte: new Date(filter.toDate) };
    } else if (filter.fromDate) {
      where.toDate = { gte: new Date(filter.fromDate) };
    } else if (filter.toDate) {
      where.fromDate = { lte: new Date(filter.toDate) };
    }

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
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedOn: 'desc' },
        include: {
          leaveType: true,
          leavePolicy: true,
          employee: {
            include: {
              user: true,
              department: true,
              designation: true,
              location: true,
            },
          },
          coveringEmployee: {
            include: {
              user: true,
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

  async listByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      departmentId?: string;
      locationId?: string;
      employeeId?: string;
      statuses?: string[];
    },
  ) {
    const where: any = {
      organizationId,
      status: {
        in: options?.statuses || ['APPROVED', 'PENDING_APPROVAL'],
      },
      fromDate: { lte: endDate },
      toDate: { gte: startDate },
    };

    if (options?.employeeId) {
      where.employeeId = options.employeeId;
    }
    if (options?.departmentId || options?.locationId) {
      where.employee = {};
      if (options.departmentId) where.employee.departmentId = options.departmentId;
      if (options.locationId) where.employee.locationId = options.locationId;
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
          },
        },
      },
      orderBy: { fromDate: 'asc' },
    });
  }
}
