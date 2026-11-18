import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CalibrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, performanceCycleId?: string) {
    const where: any = { organizationId };
    if (performanceCycleId) where.performanceCycleId = performanceCycleId;

    return this.prisma.calibrationSession.findMany({
      where,
      include: {
        performanceCycle: { select: { id: true, name: true, status: true } },
        department: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        _count: { select: { decisions: true } },
      },
      orderBy: { sessionDate: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.calibrationSession.findFirst({
      where: { id, organizationId },
      include: {
        performanceCycle: true,
        department: true,
        location: true,
        decisions: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
          },
        },
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.calibrationSession.create({
      data: {
        organizationId,
        performanceCycleId: data.performanceCycleId,
        name: data.name,
        description: data.description || null,
        departmentId: data.departmentId || null,
        locationId: data.locationId || null,
        sessionDate: new Date(data.sessionDate),
        facilitatorId: data.facilitatorId || userId,
        participants: data.participants || null,
        status: data.status || 'SCHEDULED',
        createdBy: userId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.sessionDate) updateData.sessionDate = new Date(updateData.sessionDate);

    return this.prisma.calibrationSession.update({
      where: { id },
      data: updateData,
    });
  }

  async recordDecision(organizationId: string, sessionId: string, data: any, userId: string) {
    return this.prisma.calibrationDecision.upsert({
      where: {
        calibrationSessionId_employeeId: {
          calibrationSessionId: sessionId,
          employeeId: data.employeeId,
        },
      },
      create: {
        organizationId,
        calibrationSessionId: sessionId,
        employeeId: data.employeeId,
        originalRating: data.originalRating,
        adjustedRating: data.adjustedRating,
        adjustmentReason: data.adjustmentReason,
        decidedBy: userId,
      },
      update: {
        originalRating: data.originalRating,
        adjustedRating: data.adjustedRating,
        adjustmentReason: data.adjustmentReason,
        decidedBy: userId,
        decidedAt: new Date(),
      },
    });
  }
}
