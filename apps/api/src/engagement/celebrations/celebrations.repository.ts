import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CelebrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, celebrationType?: string, fromDate?: Date, toDate?: Date) {
    const where: any = { organizationId };
    if (celebrationType) where.celebrationType = celebrationType;
    if (fromDate || toDate) {
      where.eventDate = {};
      if (fromDate) where.eventDate.gte = fromDate;
      if (toDate) where.eventDate.lte = toDate;
    }

    return this.prisma.celebration.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.celebration.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.celebration.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        employee: true,
      },
    });
  }

  async incrementWishes(organizationId: string, id: string) {
    return this.prisma.celebration.update({
      where: { id },
      data: {
        wishesCount: { increment: 1 },
      },
    });
  }

  async findExistingCelebration(
    organizationId: string,
    employeeId: string,
    celebrationType: string,
    year: number,
  ) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    return this.prisma.celebration.findFirst({
      where: {
        organizationId,
        employeeId,
        celebrationType,
        eventDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });
  }
}
