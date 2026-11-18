import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WellnessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string, category?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    if (category) where.category = category;

    return this.prisma.wellnessActivity.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        _count: {
          select: { participations: true },
        },
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.wellnessActivity.findFirst({
      where: { id, organizationId },
      include: {
        participations: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                workEmail: true,
              },
            },
          },
        },
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.wellnessActivity.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.wellnessActivity.update({
      where: { id },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.wellnessActivity.delete({
      where: { id },
    });
  }

  async findParticipation(
    organizationId: string,
    wellnessActivityId: string,
    employeeId: string,
  ) {
    return this.prisma.wellnessParticipation.findFirst({
      where: {
        organizationId,
        wellnessActivityId,
        employeeId,
      },
    });
  }

  async joinActivity(
    organizationId: string,
    wellnessActivityId: string,
    employeeId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const participation = await tx.wellnessParticipation.create({
        data: {
          organizationId,
          wellnessActivityId,
          employeeId,
          status: 'REGISTERED',
        },
      });

      await tx.wellnessActivity.update({
        where: { id: wellnessActivityId },
        data: {
          enrolledCount: { increment: 1 },
        },
      });

      return participation;
    });
  }

  async completeActivity(
    organizationId: string,
    wellnessActivityId: string,
    employeeId: string,
    pointsAwarded: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const participation = await tx.wellnessParticipation.update({
        where: {
          organizationId_wellnessActivityId_employeeId: {
            organizationId,
            wellnessActivityId,
            employeeId,
          },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          pointsAwarded,
        },
      });

      await tx.wellnessActivity.update({
        where: { id: wellnessActivityId },
        data: {
          completedCount: { increment: 1 },
        },
      });

      return participation;
    });
  }

  async findEmployeeParticipations(organizationId: string, employeeId: string) {
    return this.prisma.wellnessParticipation.findMany({
      where: { organizationId, employeeId },
      include: {
        wellnessActivity: true,
      },
      orderBy: { joinedAt: 'desc' },
    });
  }
}
