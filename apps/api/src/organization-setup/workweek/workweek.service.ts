import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { WorkweekRepository } from './workweek.repository';
import { LocationsRepository } from '../locations/locations.repository';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  CreateHolidayInput,
  DayOfWeek,
  HolidayDto,
  HolidayType,
  UpdateHolidayInput,
  UpdateWorkweekInput,
  WorkweekDto,
} from '@zentra/shared-types';

const DEFAULT_WORKING_DAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

const DEFAULT_WEEKEND_DAYS = [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];

@Injectable()
export class WorkweekService {
  constructor(
    private readonly workweekRepo: WorkweekRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly auditService: AuditService,
  ) {}

  private mapWorkweekDto(ww: any): WorkweekDto {
    return {
      id: ww.id,
      organizationId: ww.organizationId,
      weeklyWorkingDays: ww.weeklyWorkingDays as DayOfWeek[],
      weekendDays: ww.weekendDays as DayOfWeek[],
      dailyStartTime: ww.dailyStartTime,
      dailyEndTime: ww.dailyEndTime,
      breakDurationMinutes: ww.breakDurationMinutes,
      timezone: ww.timezone,
      effectiveFrom: ww.effectiveFrom.toISOString(),
      updatedAt: ww.updatedAt.toISOString(),
    };
  }

  private mapHolidayDto(h: any): HolidayDto {
    return {
      id: h.id,
      organizationId: h.organizationId,
      name: h.name,
      date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : h.date,
      type: h.type as HolidayType,
      locationId: h.locationId,
      locationName: h.location?.name || null,
      description: h.description,
      isRecurring: h.isRecurring,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    };
  }

  // Workweek operations
  async getWorkweek(organizationId: string): Promise<WorkweekDto> {
    let config = await this.workweekRepo.findWorkweekConfig(organizationId);

    if (!config) {
      config = await this.workweekRepo.upsertWorkweekConfig(organizationId, {
        weeklyWorkingDays: DEFAULT_WORKING_DAYS,
        weekendDays: DEFAULT_WEEKEND_DAYS,
        dailyStartTime: '09:00',
        dailyEndTime: '18:00',
        breakDurationMinutes: 60,
        timezone: 'UTC',
      });
    }

    return this.mapWorkweekDto(config);
  }

  async updateWorkweek(
    organizationId: string,
    data: UpdateWorkweekInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<WorkweekDto> {
    if (data.dailyEndTime <= data.dailyStartTime) {
      throw new BadRequestException('Daily end time must be after daily start time');
    }

    const current = await this.getWorkweek(organizationId);
    const updated = await this.workweekRepo.upsertWorkweekConfig(organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.WORKWEEK_UPDATE,
      entityType: 'WorkweekConfig',
      entityId: updated.id,
      oldValues: current,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapWorkweekDto(updated);
  }

  // Holiday operations
  async getHolidays(
    organizationId: string,
    year?: number,
    locationId?: string,
  ): Promise<HolidayDto[]> {
    const list = await this.workweekRepo.findHolidays(organizationId, year, locationId);
    return list.map((h) => this.mapHolidayDto(h));
  }

  async createHoliday(
    organizationId: string,
    data: CreateHolidayInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<HolidayDto> {
    const holidayDate = new Date(data.date);

    if (data.locationId) {
      const loc = await this.locationsRepo.findById(data.locationId, organizationId);
      if (!loc) {
        throw new NotFoundException(`Location with ID ${data.locationId} not found in this organization`);
      }
    }

    // Check duplicate holiday for same date & location
    const existing = await this.workweekRepo.findHolidayByDateAndLocation(
      organizationId,
      holidayDate,
      data.locationId,
    );
    if (existing) {
      throw new ConflictException(
        `A holiday ("${existing.name}") is already scheduled for ${data.date} in this calendar`,
      );
    }

    const created = await this.workweekRepo.createHoliday(organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.HOLIDAY_CREATE,
      entityType: 'Holiday',
      entityId: created.id,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapHolidayDto(created);
  }

  async updateHoliday(
    id: string,
    organizationId: string,
    data: UpdateHolidayInput,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<HolidayDto> {
    const existing = await this.workweekRepo.findHolidayById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Holiday with ID ${id} not found in this organization`);
    }

    if (data.locationId && data.locationId !== existing.locationId) {
      const loc = await this.locationsRepo.findById(data.locationId, organizationId);
      if (!loc) {
        throw new NotFoundException(`Location with ID ${data.locationId} not found in this organization`);
      }
    }

    if (data.date) {
      const holidayDate = new Date(data.date);
      const targetLocationId = data.locationId !== undefined ? data.locationId : existing.locationId;
      const conflict = await this.workweekRepo.findHolidayByDateAndLocation(
        organizationId,
        holidayDate,
        targetLocationId,
      );
      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          `A holiday ("${conflict.name}") is already scheduled for ${data.date} in this calendar`,
        );
      }
    }

    const updated = await this.workweekRepo.updateHoliday(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.HOLIDAY_UPDATE,
      entityType: 'Holiday',
      entityId: id,
      oldValues: existing,
      newValues: data,
      ipAddress,
      userAgent,
    });

    return this.mapHolidayDto(updated);
  }

  async deleteHoliday(
    id: string,
    organizationId: string,
    actorUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.workweekRepo.findHolidayById(id, organizationId);
    if (!existing) {
      throw new NotFoundException(`Holiday with ID ${id} not found in this organization`);
    }

    await this.workweekRepo.deleteHoliday(id);

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.HOLIDAY_DELETE,
      entityType: 'Holiday',
      entityId: id,
      oldValues: existing,
      ipAddress,
      userAgent,
    });

    return { success: true };
  }
}
