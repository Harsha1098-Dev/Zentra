import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LockAttendancePeriodInput } from '@zentra/shared-types';

@Injectable()
export class AttendanceLocksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, input: LockAttendancePeriodInput, lockedBy: string) {
    return this.prisma.attendanceLock.create({
      data: {
        organizationId,
        name: input.name || 'Cutoff Lock',
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        remarks: input.remarks || input.reason || null,
        status: 'LOCKED',
        lockedBy,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.attendanceLock.findFirst({
      where: { id, organizationId },
    });
  }

  async isPeriodLocked(organizationId: string, date: Date): Promise<boolean> {
    const lock = await this.prisma.attendanceLock.findFirst({
      where: {
        organizationId,
        status: 'LOCKED',
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
    return !!lock;
  }

  async findAll(organizationId: string) {
    return this.prisma.attendanceLock.findMany({
      where: { organizationId },
      orderBy: { startDate: 'desc' },
    });
  }

  async unlock(organizationId: string, id: string, unlockedBy: string) {
    return this.prisma.attendanceLock.update({
      where: { id },
      data: {
        status: 'UNLOCKED',
        unlockedBy,
        unlockedAt: new Date(),
      },
    });
  }
}
