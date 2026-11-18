import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendancePolicyInput, UpdateAttendancePolicyInput } from '@zentra/shared-types';

@Injectable()
export class AttendancePoliciesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, input: CreateAttendancePolicyInput) {
    if (input.isDefault) {
      await this.prisma.attendancePolicy.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.attendancePolicy.create({
      data: {
        organizationId,
        name: input.name,
        code: input.code || input.name.toUpperCase().replace(/\s+/g, '_'),
        description: input.description,
        isDefault: input.isDefault ?? false,
        mode: input.mode ?? 'STRICT',
        workHoursPerDay: input.workHoursPerDay ?? 8.0,
        minHoursHalfDay: input.minHoursHalfDay ?? 4.0,
        minHoursFullDay: input.minHoursFullDay ?? 8.0,
        gracePeriodLateCheckIn: input.gracePeriodLateCheckIn ?? 15,
        gracePeriodEarlyCheckOut: input.gracePeriodEarlyCheckOut ?? 15,
        maxGraceOccurrencesPerMonth: input.maxGraceOccurrencesPerMonth ?? 3,
        lateCheckInPenaltyType: input.lateCheckInPenaltyType ?? 'HALF_DAY',
        lateCheckInPenaltyDeductionDays: input.lateCheckInPenaltyDeductionDays ?? 0.5,
        allowOvertime: input.allowOvertime ?? false,
        minOvertimeMinutes: input.minOvertimeMinutes ?? 30,
        maxOvertimeMinutesPerDay: input.maxOvertimeMinutesPerDay ?? 240,
        overtimeRequiresApproval: input.overtimeRequiresApproval ?? true,
        allowRegularisation: input.allowRegularisation ?? true,
        regularisationDeadlineDays: input.regularisationDeadlineDays ?? 7,
        maxRegularisationsPerMonth: input.maxRegularisationsPerMonth ?? 3,
        allowSelfCheckIn: input.allowSelfCheckIn ?? true,
        allowWebPunch: input.allowWebPunch ?? true,
        allowMobilePunch: input.allowMobilePunch ?? false,
        ipRestrictions: (input.ipRestrictions as any) ?? [],
        geofencingEnabled: input.geofencingEnabled ?? false,
        geofenceRadiusMeters: input.geofenceRadiusMeters,
        autoCheckoutEnabled: input.autoCheckoutEnabled ?? false,
        autoCheckoutTime: input.autoCheckoutTime,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.attendancePolicy.findFirst({
      where: { id, organizationId },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.attendancePolicy.findFirst({
      where: { code, organizationId },
    });
  }

  async findDefault(organizationId: string) {
    return this.prisma.attendancePolicy.findFirst({
      where: { organizationId, isDefault: true },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.attendancePolicy.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async update(organizationId: string, id: string, input: UpdateAttendancePolicyInput) {
    if (input.isDefault) {
      await this.prisma.attendancePolicy.updateMany({
        where: { organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const data: any = { ...input };
    if (input.effectiveFrom) data.effectiveFrom = new Date(input.effectiveFrom);
    if (input.effectiveTo !== undefined) data.effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

    return this.prisma.attendancePolicy.update({
      where: { id },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.attendancePolicy.delete({
      where: { id },
    });
  }
}
