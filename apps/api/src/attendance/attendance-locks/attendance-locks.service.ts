import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceLocksRepository } from './attendance-locks.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { LockAttendancePeriodInput, AuditAction } from '@zentra/shared-types';

@Injectable()
export class AttendanceLocksService {
  constructor(
    private readonly repo: AttendanceLocksRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async lockPeriod(organizationId: string, input: LockAttendancePeriodInput, userId: string, ipAddress?: string) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    // Atomic transaction: create lock and mark records locked
    const lock = await this.prisma.$transaction(async (tx) => {
      const createdLock = await tx.attendanceLock.create({
        data: {
          organizationId,
          name: input.name || 'Cutoff Lock',
          startDate,
          endDate,
          remarks: input.remarks || input.reason || null,
          status: 'LOCKED',
          lockedBy: userId,
        },
      });

      await tx.attendanceRecord.updateMany({
        where: {
          organizationId,
          attendanceDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        data: {
          isLocked: true,
        },
      });

      return createdLock;
    });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ATTENDANCE_LOCK,
      entityType: 'attendance_lock',
      entityId: lock.id,
      newValues: { name: lock.name, startDate: lock.startDate, endDate: lock.endDate },
      ipAddress,
    });

    return lock;
  }

  async isPeriodLocked(organizationId: string, date: Date): Promise<boolean> {
    return this.repo.isPeriodLocked(organizationId, date);
  }

  async findAll(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async findById(organizationId: string, id: string) {
    const lock = await this.repo.findById(organizationId, id);
    if (!lock) {
      throw new NotFoundException('Attendance lock not found');
    }
    return lock;
  }

  async unlock(organizationId: string, id: string, userId: string, ipAddress?: string) {
    const lock = await this.findById(organizationId, id);

    if (lock.status === 'UNLOCKED') {
      throw new BadRequestException('Attendance lock is already unlocked');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const unlocked = await tx.attendanceLock.update({
        where: { id },
        data: {
          status: 'UNLOCKED',
          unlockedBy: userId,
          unlockedAt: new Date(),
        },
      });

      // Unlock records unless another active lock covers them
      await tx.attendanceRecord.updateMany({
        where: {
          organizationId,
          attendanceDate: {
            gte: lock.startDate,
            lte: lock.endDate,
          },
        },
        data: {
          isLocked: false,
        },
      });

      return unlocked;
    });

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.ATTENDANCE_LOCK,
      entityType: 'attendance_lock',
      entityId: updated.id,
      newValues: { action: 'UNLOCKED', name: lock.name },
      ipAddress,
    });

    return updated;
  }
}
