import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OneOnOneRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.managerId) where.managerId = filters.managerId;
    if (filters.status) where.status = filters.status;

    return this.prisma.oneOnOneMeeting.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { meetingDate: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.oneOnOneMeeting.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
        manager: true,
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.oneOnOneMeeting.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        managerId: data.managerId,
        meetingDate: new Date(data.meetingDate),
        agenda: data.agenda,
        discussionNotes: data.discussionNotes || null,
        actionItems: data.actionItems || null,
        nextMeetingDate: data.nextMeetingDate ? new Date(data.nextMeetingDate) : null,
        status: data.status || 'SCHEDULED',
        createdBy: userId,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.meetingDate) updateData.meetingDate = new Date(updateData.meetingDate);
    if (updateData.nextMeetingDate) updateData.nextMeetingDate = new Date(updateData.nextMeetingDate);

    return this.prisma.oneOnOneMeeting.update({
      where: { id },
      data: updateData,
    });
  }
}
