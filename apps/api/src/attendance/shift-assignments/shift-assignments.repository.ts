import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftAssignmentInput, UpdateShiftAssignmentInput } from '@zentra/shared-types';

@Injectable()
export class ShiftAssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, input: CreateShiftAssignmentInput) {
    return this.prisma.shiftAssignment.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        shiftId: input.shiftId,
        rosterId: input.rosterId,
        startDate: new Date(input.startDate || input.effectiveFrom || Date.now()),
        endDate: (input.endDate || input.effectiveTo) ? new Date(input.endDate || input.effectiveTo!) : null,
        isRecurring: input.isRecurring ?? false,
        recurrencePattern: input.recurrencePattern,
        isOverride: input.isOverride ?? false,
      },
      include: {
        employee: true,
        shift: {
          include: { policy: true },
        },
        roster: true,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.shiftAssignment.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        shift: {
          include: { policy: true },
        },
        roster: true,
      },
    });
  }

  async findActiveAssignment(organizationId: string, employeeId: string, date: Date) {
    // 1. Check for specific override on this date
    const override = await this.prisma.shiftAssignment.findFirst({
      where: {
        organizationId,
        employeeId,
        isOverride: true,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
      include: {
        shift: { include: { policy: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (override) return override;

    // 2. Check for standard range assignment
    return this.prisma.shiftAssignment.findFirst({
      where: {
        organizationId,
        employeeId,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
      include: {
        shift: { include: { policy: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOverlaps(
    organizationId: string,
    employeeId: string,
    startDate: Date,
    endDate?: Date | null,
    excludeId?: string,
  ) {
    return this.prisma.shiftAssignment.findMany({
      where: {
        organizationId,
        employeeId,
        isOverride: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        AND: [
          {
            startDate: endDate ? { lte: endDate } : undefined,
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });
  }

  async findAll(organizationId: string, employeeId?: string, rosterId?: string) {
    return this.prisma.shiftAssignment.findMany({
      where: {
        organizationId,
        ...(employeeId ? { employeeId } : {}),
        ...(rosterId ? { rosterId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
        shift: true,
        roster: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(organizationId: string, id: string, input: UpdateShiftAssignmentInput) {
    const data: any = { ...input };
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;

    return this.prisma.shiftAssignment.update({
      where: { id },
      data,
      include: {
        employee: true,
        shift: true,
        roster: true,
      },
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.shiftAssignment.delete({
      where: { id },
    });
  }
}
