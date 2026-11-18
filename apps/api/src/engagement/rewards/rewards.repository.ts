import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RewardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, isActiveOnly = true) {
    const where: any = { organizationId };
    if (isActiveOnly) where.isActive = true;

    return this.prisma.reward.findMany({
      where,
      orderBy: { pointsCost: 'asc' },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.reward.findFirst({
      where: { id, organizationId },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.reward.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.reward.update({
      where: { id },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.reward.delete({
      where: { id },
    });
  }

  async findRedemptions(organizationId: string, employeeId?: string, status?: string) {
    const where: any = { organizationId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    return this.prisma.rewardRedemption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reward: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
          },
        },
      },
    });
  }

  async findRedemptionById(organizationId: string, id: string) {
    return this.prisma.rewardRedemption.findFirst({
      where: { id, organizationId },
      include: {
        reward: true,
        employee: true,
      },
    });
  }

  async countEmployeeRedemptionsForReward(
    organizationId: string,
    rewardId: string,
    employeeId: string,
  ) {
    return this.prisma.rewardRedemption.count({
      where: {
        organizationId,
        rewardId,
        employeeId,
        status: { in: ['PENDING', 'APPROVED', 'FULFILLED'] },
      },
    });
  }

  async createRedemption(
    organizationId: string,
    rewardId: string,
    employeeId: string,
    pointsSpent: number,
    notes?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const redemption = await tx.rewardRedemption.create({
        data: {
          organizationId,
          rewardId,
          employeeId,
          pointsSpent,
          status: 'PENDING',
          notes,
        },
      });

      const reward = await tx.reward.findUnique({
        where: { id: rewardId },
      });

      if (reward && reward.quantityAvailable > 0) {
        await tx.reward.update({
          where: { id: rewardId },
          data: {
            quantityAvailable: { decrement: 1 },
          },
        });
      }

      return redemption;
    });
  }

  async updateRedemptionStatus(
    organizationId: string,
    id: string,
    status: string,
    approverUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.rewardRedemption.findUnique({
        where: { id },
        include: { reward: true },
      });

      const updateData: any = { status };
      if (status === 'APPROVED') {
        updateData.approvedById = approverUserId;
        updateData.approvedAt = new Date();
      } else if (status === 'FULFILLED') {
        updateData.fulfilledAt = new Date();
      } else if (status === 'REJECTED') {
        // If rejected and reward quantity was decremented, increment back
        if (existing?.reward && existing.reward.quantityAvailable >= 0) {
          await tx.reward.update({
            where: { id: existing.rewardId },
            data: { quantityAvailable: { increment: 1 } },
          });
        }
      }

      return tx.rewardRedemption.update({
        where: { id },
        data: updateData,
        include: {
          reward: true,
          employee: true,
        },
      });
    });
  }
}
