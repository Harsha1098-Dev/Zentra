import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeavePoliciesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    leaveTypeId: string;
    name: string;
    description?: string | null;
    applicableLocations?: string[];
    applicableDepartments?: string[];
    applicableDesignations?: string[];
    applicableGrades?: string[];
    applicableEmploymentTypes?: string[];
    applicableEmployeeStatuses?: string[];
    entitlementType?: string;
    annualEntitlement: number;
    monthlyEntitlement?: number | null;
    accrualFrequency?: string;
    accrualStartDate?: string | null;
    prorateNewJoiners?: boolean;
    probationEligibility?: boolean;
    minimumServicePeriodDays?: number;
    maxDaysPerRequest?: number | null;
    maxConsecutiveDays?: number | null;
    minimumNoticeDays?: number;
    allowPastDates?: boolean;
    allowFutureDates?: boolean;
    maxFutureDays?: number | null;
    allowHalfDay?: boolean;
    allowQuarterDay?: boolean;
    allowHourly?: boolean;
    allowNegativeBalance?: boolean;
    allowCarryForward?: boolean;
    carryForwardLimit?: number | null;
    carryForwardExpiryDays?: number | null;
    allowEncashment?: boolean;
    encashmentLimit?: number | null;
    minBalanceForEncashment?: number | null;
    allowWeekendLeave?: boolean;
    allowHolidayLeave?: boolean;
    allowOverlappingRequests?: boolean;
    requiresApproval?: boolean;
    approvalWorkflowId?: string | null;
    requiresAttachment?: boolean;
    attachmentRequiredDays?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
    status?: string;
  }) {
    return this.prisma.leavePolicy.create({
      data: {
        organizationId: data.organizationId,
        leaveTypeId: data.leaveTypeId,
        name: data.name,
        description: data.description || null,
        applicableLocations: data.applicableLocations || ['ALL'],
        applicableDepartments: data.applicableDepartments || ['ALL'],
        applicableDesignations: data.applicableDesignations || ['ALL'],
        applicableGrades: data.applicableGrades || ['ALL'],
        applicableEmploymentTypes: data.applicableEmploymentTypes || ['ALL'],
        applicableEmployeeStatuses: data.applicableEmployeeStatuses || ['ALL'],
        entitlementType: data.entitlementType || 'fixed',
        annualEntitlement: data.annualEntitlement,
        monthlyEntitlement: data.monthlyEntitlement || null,
        accrualFrequency: data.accrualFrequency || 'yearly',
        accrualStartDate: data.accrualStartDate || null,
        prorateNewJoiners: data.prorateNewJoiners !== undefined ? data.prorateNewJoiners : true,
        probationEligibility: data.probationEligibility !== undefined ? data.probationEligibility : true,
        minimumServicePeriodDays: data.minimumServicePeriodDays || 0,
        maxDaysPerRequest: data.maxDaysPerRequest || null,
        maxConsecutiveDays: data.maxConsecutiveDays || null,
        minimumNoticeDays: data.minimumNoticeDays || 0,
        allowPastDates: data.allowPastDates !== undefined ? data.allowPastDates : true,
        allowFutureDates: data.allowFutureDates !== undefined ? data.allowFutureDates : true,
        maxFutureDays: data.maxFutureDays || null,
        allowHalfDay: data.allowHalfDay !== undefined ? data.allowHalfDay : true,
        allowQuarterDay: data.allowQuarterDay || false,
        allowHourly: data.allowHourly || false,
        allowNegativeBalance: data.allowNegativeBalance || false,
        allowCarryForward: data.allowCarryForward || false,
        carryForwardLimit: data.carryForwardLimit || null,
        carryForwardExpiryDays: data.carryForwardExpiryDays || null,
        allowEncashment: data.allowEncashment || false,
        encashmentLimit: data.encashmentLimit || null,
        minBalanceForEncashment: data.minBalanceForEncashment || null,
        allowWeekendLeave: data.allowWeekendLeave || false,
        allowHolidayLeave: data.allowHolidayLeave || false,
        allowOverlappingRequests: data.allowOverlappingRequests || false,
        requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : true,
        approvalWorkflowId: data.approvalWorkflowId || null,
        requiresAttachment: data.requiresAttachment || false,
        attachmentRequiredDays: data.attachmentRequiredDays || 0,
        effectiveFrom: data.effectiveFrom || new Date(),
        effectiveTo: data.effectiveTo || null,
        status: data.status || 'active',
      },
      include: {
        leaveType: true,
      },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.leavePolicy.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { leaveType: true },
    });
  }

  async findByName(name: string, organizationId: string) {
    return this.prisma.leavePolicy.findFirst({
      where: { name, organizationId, deletedAt: null },
    });
  }

  async findActivePoliciesForType(leaveTypeId: string, organizationId: string) {
    return this.prisma.leavePolicy.findMany({
      where: {
        organizationId,
        leaveTypeId,
        status: 'active',
        deletedAt: null,
      },
      include: { leaveType: true },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.leavePolicy.update({
      where: { id },
      data,
      include: { leaveType: true },
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.leavePolicy.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
  }

  async list(organizationId: string, filter: any) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filter.leaveTypeId) where.leaveTypeId = filter.leaveTypeId;
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.leavePolicy.count({ where }),
      this.prisma.leavePolicy.findMany({
        where,
        skip,
        take: limit,
        include: { leaveType: true },
        orderBy: { createdAt: 'desc' },
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
