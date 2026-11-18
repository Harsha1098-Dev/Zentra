import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OffersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters.candidateId) {
      where.candidateId = filters.candidateId;
    }
    if (filters.jobOpeningId) {
      where.jobOpeningId = filters.jobOpeningId;
    }
    if (filters.offerStatus) {
      where.offerStatus = filters.offerStatus;
    }

    return this.prisma.offer.findMany({
      where,
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        jobOpening: { select: { id: true, title: true, jobCode: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, city: true } },
        approver: { select: { id: true, firstName: true, lastName: true, workEmail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.offer.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        candidate: true,
        jobOpening: true,
        jobApplication: {
          include: {
            interviews: true,
            stageHistory: { orderBy: { changedAt: 'desc' } },
          },
        },
        department: true,
        designation: true,
        location: true,
        approver: true,
      },
    });
  }

  async findActiveOfferForApplication(jobApplicationId: string, organizationId: string) {
    return this.prisma.offer.findFirst({
      where: {
        organizationId,
        jobApplicationId,
        offerStatus: { notIn: ['REJECTED', 'WITHDRAWN', 'EXPIRED', 'CANCELLED'] },
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: any, createdBy: string) {
    const monthlyCtc = data.monthlyCtc || Math.round((data.annualCtc / 12) * 100) / 100;
    return this.prisma.offer.create({
      data: {
        organizationId,
        jobApplicationId: data.jobApplicationId,
        candidateId: data.candidateId,
        jobOpeningId: data.jobOpeningId,
        offerDate: data.offerDate ? new Date(data.offerDate) : new Date(),
        joiningDate: new Date(data.joiningDate),
        designationId: data.designationId,
        departmentId: data.departmentId,
        locationId: data.locationId,
        employmentType: data.employmentType || 'FULL_TIME',
        workMode: data.workMode || 'HYBRID',
        annualCtc: data.annualCtc,
        monthlyCtc,
        currency: data.currency || 'INR',
        salaryStructureId: data.salaryStructureId,
        offerStatus: 'DRAFT',
        offerLetterTemplateId: data.offerLetterTemplateId,
        expiryDate: new Date(data.expiryDate),
        createdBy,
      },
      include: {
        candidate: true,
        jobOpening: true,
        department: true,
        designation: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData = { ...data };
    if (updateData.joiningDate) updateData.joiningDate = new Date(updateData.joiningDate);
    if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
    delete updateData.id;
    delete updateData.organizationId;

    return this.prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        candidate: true,
        jobOpening: true,
      },
    });
  }
}
