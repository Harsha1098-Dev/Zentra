import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OffboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.prisma.offboardingRequest.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true, code: true } },
            status: true,
            dateOfExit: true,
          },
        },
        resignation: {
          include: {
            exitClearances: true,
            exitInterview: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.offboardingRequest.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            reportingManager: true,
            reportees: {
              where: { status: 'ACTIVE', deletedAt: null },
            },
            assignedAssets: true,
          },
        },
        resignation: {
          include: {
            exitClearances: true,
            exitInterview: true,
          },
        },
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.offboardingRequest.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        resignationRequestId: data.resignationRequestId || null,
        exitType: data.exitType || 'RESIGNATION',
        lastWorkingDate: new Date(data.lastWorkingDate),
        status: data.status || 'PENDING_CLEARANCE',
        createdBy: userId,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.offboardingRequest.update({
      where: { id },
      data,
      include: {
        employee: true,
      },
    });
  }

  async saveExitInterview(organizationId: string, data: any) {
    const existing = await this.prisma.exitInterview.findFirst({
      where: {
        organizationId,
        employeeId: data.employeeId,
        ...(data.resignationRequestId ? { resignationRequestId: data.resignationRequestId } : {}),
      },
    });

    if (existing) {
      return this.prisma.exitInterview.update({
        where: { id: existing.id },
        data: {
          interviewDate: data.interviewDate ? new Date(data.interviewDate) : existing.interviewDate,
          interviewerId: data.interviewerId || existing.interviewerId,
          exitReason: data.exitReason !== undefined ? data.exitReason : existing.exitReason,
          employeeFeedback: data.employeeFeedback !== undefined ? data.employeeFeedback : existing.employeeFeedback,
          managerFeedback: data.managerFeedback !== undefined ? data.managerFeedback : existing.managerFeedback,
          hrFeedback: data.hrFeedback !== undefined ? data.hrFeedback : existing.hrFeedback,
          rehireRecommendation: data.rehireRecommendation !== undefined ? data.rehireRecommendation : existing.rehireRecommendation,
          status: data.status || existing.status,
        },
      });
    }

    return this.prisma.exitInterview.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        resignationRequestId: data.resignationRequestId || null,
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : new Date(),
        interviewerId: data.interviewerId || null,
        exitReason: data.exitReason || null,
        employeeFeedback: data.employeeFeedback || {},
        managerFeedback: data.managerFeedback || {},
        hrFeedback: data.hrFeedback || {},
        rehireRecommendation: data.rehireRecommendation || null,
        status: data.status || 'SCHEDULED',
        createdBy: data.createdBy || 'SYSTEM',
      },
    });
  }
}
