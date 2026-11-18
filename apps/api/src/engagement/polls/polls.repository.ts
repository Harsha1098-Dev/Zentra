import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PollsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;

    return this.prisma.poll.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findById(organizationId: string, id: string) {
    return this.prisma.poll.findFirst({
      where: { id, organizationId },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async create(
    organizationId: string,
    data: {
      title: string;
      question: string;
      pollType?: string;
      status?: string;
      startDate?: Date | null;
      endDate?: Date | null;
      isAnonymous?: boolean;
      audienceType?: string;
      audienceFilter?: any;
      createdBy?: string;
      options: string[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const poll = await tx.poll.create({
        data: {
          organizationId,
          title: data.title,
          question: data.question,
          pollType: data.pollType || 'SINGLE_CHOICE',
          status: data.status || 'ACTIVE',
          startDate: data.startDate || new Date(),
          endDate: data.endDate || null,
          isAnonymous: data.isAnonymous ?? true,
          audienceType: data.audienceType || 'ALL',
          audienceFilter: data.audienceFilter || null,
          createdBy: data.createdBy,
        },
      });

      if (data.options && data.options.length > 0) {
        await tx.pollOption.createMany({
          data: data.options.map((opt, idx) => ({
            organizationId,
            pollId: poll.id,
            optionText: opt,
            displayOrder: idx + 1,
          })),
        });
      }

      return poll;
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return this.prisma.poll.update({
      where: { id },
      data,
    });
  }

  async delete(organizationId: string, id: string) {
    return this.prisma.poll.delete({
      where: { id },
    });
  }

  async findVote(organizationId: string, pollId: string, employeeId: string) {
    return this.prisma.pollVote.findFirst({
      where: { organizationId, pollId, employeeId },
    });
  }

  async castVote(
    organizationId: string,
    pollId: string,
    employeeId: string,
    pollOptionId?: string,
    ratingValue?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const vote = await tx.pollVote.create({
        data: {
          organizationId,
          pollId,
          employeeId,
          pollOptionId,
          ratingValue,
        },
      });

      if (pollOptionId) {
        await tx.pollOption.update({
          where: { id: pollOptionId },
          data: { votesCount: { increment: 1 } },
        });
      }

      await tx.poll.update({
        where: { id: pollId },
        data: { totalVotesCount: { increment: 1 } },
      });

      return vote;
    });
  }
}
