import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecognitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string, category?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    if (category) where.category = category;

    return this.prisma.recognition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        badge: true,
        program: true,
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.recognition.findFirst({
      where: { id, organizationId },
      include: {
        sender: true,
        receiver: true,
        badge: true,
        program: true,
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.recognition.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        sender: true,
        receiver: true,
        badge: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.recognition.update({
      where: { id },
      data,
    });
  }

  async incrementLikes(organizationId: string, id: string) {
    return this.prisma.recognition.update({
      where: { id },
      data: {
        likesCount: { increment: 1 },
      },
    });
  }

  async findAllPrograms(organizationId: string) {
    return this.prisma.recognitionProgram.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProgram(organizationId: string, data: any) {
    return this.prisma.recognitionProgram.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async findProgramById(organizationId: string, id: string) {
    return this.prisma.recognitionProgram.findFirst({
      where: { id, organizationId },
    });
  }

  async getEmployeePointsBalance(organizationId: string, employeeId: string): Promise<number> {
    // Points earned from approved recognitions
    const recognitions = await this.prisma.recognition.aggregate({
      where: {
        organizationId,
        receiverId: employeeId,
        status: 'APPROVED',
      },
      _sum: {
        pointsAwarded: true,
      },
    });

    // Points earned from completed wellness activities
    const wellness = await this.prisma.wellnessParticipation.aggregate({
      where: {
        organizationId,
        employeeId,
        status: 'COMPLETED',
      },
      _sum: {
        pointsAwarded: true,
      },
    });

    // Points spent on redemptions
    const redemptions = await this.prisma.rewardRedemption.aggregate({
      where: {
        organizationId,
        employeeId,
        status: { in: ['PENDING', 'APPROVED', 'FULFILLED'] },
      },
      _sum: {
        pointsSpent: true,
      },
    });

    const earned = (recognitions._sum.pointsAwarded || 0) + (wellness._sum.pointsAwarded || 0);
    const spent = redemptions._sum.pointsSpent || 0;

    return Math.max(0, earned - spent);
  }
}
