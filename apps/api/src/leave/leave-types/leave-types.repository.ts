import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    name: string;
    code: string;
    description?: string | null;
    category?: string;
    isPaid?: boolean;
    isActive?: boolean;
    color?: string | null;
    icon?: string | null;
    requiresAttachment?: boolean;
    attachmentRequiredDays?: number | null;
    allowsHalfDay?: boolean;
    allowsQuarterDay?: boolean;
    allowsHourly?: boolean;
    allowsNegativeBalance?: boolean;
    requiresApproval?: boolean;
    isCompOff?: boolean;
    isLossOfPay?: boolean;
    isRestrictedHoliday?: boolean;
    applicableProbation?: boolean;
    applicableContract?: boolean;
    applicableIntern?: boolean;
    customFields?: any;
  }) {
    return this.prisma.leaveType.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        category: data.category || 'earned_leave',
        isPaid: data.isPaid !== undefined ? data.isPaid : true,
        isActive: data.isActive !== undefined ? data.isActive : true,
        color: data.color || '#1E3A8A',
        icon: data.icon || 'calendar',
        requiresAttachment: data.requiresAttachment || false,
        attachmentRequiredDays: data.attachmentRequiredDays || 0,
        allowsHalfDay: data.allowsHalfDay !== undefined ? data.allowsHalfDay : true,
        allowsQuarterDay: data.allowsQuarterDay || false,
        allowsHourly: data.allowsHourly || false,
        allowsNegativeBalance: data.allowsNegativeBalance || false,
        requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : true,
        isCompOff: data.isCompOff || false,
        isLossOfPay: data.isLossOfPay || false,
        isRestrictedHoliday: data.isRestrictedHoliday || false,
        applicableProbation: data.applicableProbation !== undefined ? data.applicableProbation : true,
        applicableContract: data.applicableContract !== undefined ? data.applicableContract : true,
        applicableIntern: data.applicableIntern !== undefined ? data.applicableIntern : true,
        customFields: data.customFields || {},
      },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.leaveType.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async findByCode(code: string, organizationId: string) {
    return this.prisma.leaveType.findFirst({
      where: { code: code.toUpperCase(), organizationId, deletedAt: null },
    });
  }

  async findByName(name: string, organizationId: string) {
    return this.prisma.leaveType.findFirst({
      where: { name, organizationId, deletedAt: null },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.leaveType.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.leaveType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async list(organizationId: string, filter: any) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filter.category) where.category = filter.category;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.leaveType.count({ where }),
      this.prisma.leaveType.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPaid: 'desc' }, { name: 'asc' }],
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

  async listActive(organizationId: string) {
    return this.prisma.leaveType.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ isPaid: 'desc' }, { name: 'asc' }],
    });
  }

  async hasAssociatedRecords(id: string, organizationId: string): Promise<boolean> {
    const [reqCount, balCount] = await Promise.all([
      this.prisma.leaveRequest.count({ where: { leaveTypeId: id, organizationId } }),
      this.prisma.leaveBalance.count({ where: { leaveTypeId: id, organizationId } }),
    ]);
    return reqCount > 0 || balCount > 0;
  }
}
