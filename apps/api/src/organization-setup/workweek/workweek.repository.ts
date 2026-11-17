import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateHolidayInput,
  DayOfWeek,
  UpdateHolidayInput,
  UpdateWorkweekInput,
} from '@zentra/shared-types';

@Injectable()
export class WorkweekRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Workweek
  async findWorkweekConfig(organizationId: string) {
    return this.prisma.workweekConfig.findUnique({
      where: { organizationId },
    });
  }

  async upsertWorkweekConfig(organizationId: string, data: UpdateWorkweekInput) {
    return this.prisma.workweekConfig.upsert({
      where: { organizationId },
      update: {
        weeklyWorkingDays: data.weeklyWorkingDays,
        weekendDays: data.weekendDays,
        dailyStartTime: data.dailyStartTime,
        dailyEndTime: data.dailyEndTime,
        breakDurationMinutes: data.breakDurationMinutes,
        timezone: data.timezone,
        ...(data.effectiveFrom ? { effectiveFrom: new Date(data.effectiveFrom) } : {}),
      },
      create: {
        organizationId,
        weeklyWorkingDays: data.weeklyWorkingDays,
        weekendDays: data.weekendDays,
        dailyStartTime: data.dailyStartTime,
        dailyEndTime: data.dailyEndTime,
        breakDurationMinutes: data.breakDurationMinutes,
        timezone: data.timezone,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      },
    });
  }

  // Holidays
  async findHolidays(organizationId: string, year?: number, locationId?: string) {
    let dateFilter: any = undefined;
    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      dateFilter = { gte: startOfYear, lte: endOfYear };
    }

    return this.prisma.holiday.findMany({
      where: {
        organizationId,
        ...(dateFilter ? { date: dateFilter } : {}),
        ...(locationId ? { locationId } : {}),
      },
      include: {
        location: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findHolidayById(id: string, organizationId: string) {
    return this.prisma.holiday.findFirst({
      where: { id, organizationId },
      include: {
        location: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async findHolidayByDateAndLocation(organizationId: string, date: Date, locationId?: string | null) {
    return this.prisma.holiday.findFirst({
      where: {
        organizationId,
        date,
        locationId: locationId || null,
      },
    });
  }

  async createHoliday(organizationId: string, data: CreateHolidayInput) {
    return this.prisma.holiday.create({
      data: {
        organizationId,
        name: data.name,
        date: new Date(data.date),
        type: data.type,
        locationId: data.locationId || null,
        description: data.description || null,
        isRecurring: data.isRecurring || false,
      },
      include: {
        location: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async updateHoliday(id: string, organizationId: string, data: UpdateHolidayInput) {
    return this.prisma.holiday.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.locationId !== undefined ? { locationId: data.locationId || null } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.isRecurring !== undefined ? { isRecurring: data.isRecurring } : {}),
      },
      include: {
        location: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async deleteHoliday(id: string) {
    return this.prisma.holiday.delete({
      where: { id },
    });
  }
}
