import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferralsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = { organizationId };

    if (filters.referringEmployeeId) {
      where.referringEmployeeId = filters.referringEmployeeId;
    }
    if (filters.jobOpeningId) {
      where.jobOpeningId = filters.jobOpeningId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.employeeReferral.findMany({
      where,
      include: {
        referringEmployee: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
        jobOpening: {
          select: { id: true, title: true, jobCode: true, department: { select: { name: true } } },
        },
        candidate: {
          select: { id: true, candidateStatus: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.employeeReferral.findFirst({
      where: { id, organizationId },
      include: {
        referringEmployee: true,
        jobOpening: {
          include: { department: true, location: true },
        },
        candidate: {
          include: { applications: true },
        },
      },
    });
  }

  async create(organizationId: string, data: any) {
    return this.prisma.employeeReferral.create({
      data: {
        organizationId,
        referringEmployeeId: data.referringEmployeeId,
        jobOpeningId: data.jobOpeningId,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        candidatePhone: data.candidatePhone,
        resumeUrl: data.resumeUrl,
        relationship: data.relationship,
        notes: data.notes,
        candidateId: data.candidateId,
        status: 'SUBMITTED',
      },
      include: {
        jobOpening: true,
        referringEmployee: true,
      },
    });
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    return this.prisma.employeeReferral.update({
      where: { id },
      data: { status },
    });
  }
}
