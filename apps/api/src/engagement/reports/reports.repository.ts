import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EngagementReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeDirectReports(organizationId: string, managerEmployeeId: string) {
    return this.prisma.employee.findMany({
      where: {
        organizationId,
        reportingManagerId: managerEmployeeId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        workEmail: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });
  }

  async getUpcomingCelebrations(organizationId: string, daysAhead = 14) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return this.prisma.celebration.findMany({
      where: {
        organizationId,
        eventDate: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: { eventDate: 'asc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { name: true } },
          },
        },
      },
      take: 10,
    });
  }

  async getRecentRecognitions(organizationId: string, limit = 10) {
    return this.prisma.recognition.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        badge: true,
      },
    });
  }

  async getActiveSurveys(organizationId: string) {
    return this.prisma.engagementSurvey.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        questions: true,
        responses: {
          select: { employeeId: true },
        },
      },
    });
  }

  async getActivePolls(organizationId: string) {
    return this.prisma.poll.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        options: true,
        votes: {
          select: { employeeId: true },
        },
      },
    });
  }

  async getEnpsSurveys(organizationId: string) {
    return this.prisma.engagementSurvey.findMany({
      where: {
        organizationId,
        surveyType: 'ENPS',
        status: { in: ['ACTIVE', 'CLOSED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}
