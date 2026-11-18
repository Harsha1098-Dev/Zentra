import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobOpeningsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters.jobStatus) {
      where.jobStatus = filters.jobStatus;
    }
    if (filters.publishedStatus) {
      where.publishedStatus = filters.publishedStatus;
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.hiringManagerId) {
      where.hiringManagerId = filters.hiringManagerId;
    }
    if (filters.recruiterId) {
      where.recruiterId = filters.recruiterId;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { jobCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.jobOpening.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        designation: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, city: true } },
        hiringManager: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
        recruiter: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.jobOpening.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        department: true,
        designation: true,
        location: true,
        hiringManager: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
        recruiter: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
        applications: {
          include: {
            candidate: true,
          },
        },
        _count: {
          select: { applications: true, offers: true },
        },
      },
    });
  }

  async findByTitle(title: string, organizationId: string) {
    return this.prisma.jobOpening.findFirst({
      where: {
        organizationId,
        title: { equals: title, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async findByCode(jobCode: string, organizationId: string) {
    return this.prisma.jobOpening.findFirst({
      where: {
        organizationId,
        jobCode: { equals: jobCode, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: any, stagesData: any[] = [], createdBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const jobOpening = await tx.jobOpening.create({
        data: {
          organizationId,
          title: data.title,
          jobCode: data.jobCode,
          description: data.description,
          departmentId: data.departmentId,
          designationId: data.designationId,
          locationId: data.locationId,
          employmentType: data.employmentType || 'FULL_TIME',
          workMode: data.workMode || 'HYBRID',
          experienceMinYears: data.experienceMinYears ?? 0,
          experienceMaxYears: data.experienceMaxYears ?? 5,
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          currency: data.currency || 'INR',
          numberOfOpenings: data.numberOfOpenings || 1,
          filledOpenings: 0,
          hiringManagerId: data.hiringManagerId,
          recruiterId: data.recruiterId,
          pipelineId: data.pipelineId,
          jobStatus: data.jobStatus || 'DRAFT',
          publishedStatus: data.publishedStatus || 'NOT_PUBLISHED',
          externalJobUrl: data.externalJobUrl,
          applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
          responsibilities: data.responsibilities || [],
          requirements: data.requirements || [],
          skills: data.skills || [],
          benefits: data.benefits || [],
          createdBy,
        },
      });

      if (stagesData && stagesData.length > 0) {
        await tx.jobOpeningStage.createMany({
          data: stagesData.map((s, idx) => ({
            organizationId,
            jobOpeningId: jobOpening.id,
            stageName: s.stageName,
            stageType: s.stageType,
            stageOrder: s.stageOrder ?? idx,
            isMandatory: s.isMandatory ?? true,
            interviewerIds: s.interviewerIds || [],
            assessmentRequired: s.assessmentRequired ?? false,
          })),
        });
      }

      return tx.jobOpening.findUniqueOrThrow({
        where: { id: jobOpening.id },
        include: {
          department: true,
          designation: true,
          location: true,
          stages: { orderBy: { stageOrder: 'asc' } },
        },
      });
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.applicationDeadline) {
      updateData.applicationDeadline = new Date(updateData.applicationDeadline);
    }
    delete updateData.id;
    delete updateData.organizationId;

    return this.prisma.jobOpening.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        designation: true,
        location: true,
        stages: { orderBy: { stageOrder: 'asc' } },
      },
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.jobOpening.update({
      where: { id },
      data: { deletedAt: new Date(), jobStatus: 'CANCELLED' },
    });
  }
}
