import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CandidatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: any = {}) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters.candidateStatus) {
      where.candidateStatus = filters.candidateStatus;
    }
    if (filters.talentPoolStatus) {
      where.talentPoolStatus = filters.talentPoolStatus;
    }
    if (filters.sourceType) {
      where.sourceType = filters.sourceType;
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { currentCompany: { contains: filters.search, mode: 'insensitive' } },
        { currentDesignation: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.candidate.findMany({
      where,
      include: {
        referralEmployee: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
        applications: {
          include: {
            jobOpening: { select: { id: true, title: true, jobCode: true } },
          },
        },
        _count: {
          select: { applications: true, documents: true, notes: true, interviews: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.candidate.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        referralEmployee: {
          select: { id: true, firstName: true, lastName: true, workEmail: true },
        },
        applications: {
          include: {
            jobOpening: true,
            stageHistory: { orderBy: { changedAt: 'desc' } },
            offer: true,
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        notes: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        interviews: {
          include: {
            feedbacks: {
              include: {
                interviewer: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { interviewDate: 'asc' },
        },
        offers: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByEmail(email: string, organizationId: string) {
    return this.prisma.candidate.findFirst({
      where: {
        organizationId,
        email: { equals: email, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: any, createdBy: string) {
    const { dateOfBirth, ...rest } = data;
    return this.prisma.candidate.create({
      data: {
        ...rest,
        organizationId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        createdBy,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    const updateData = { ...data };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    delete updateData.id;
    delete updateData.organizationId;

    return this.prisma.candidate.update({
      where: { id },
      data: updateData,
    });
  }

  async addDocument(organizationId: string, candidateId: string, data: any, uploadedBy: string) {
    return this.prisma.candidateDocument.create({
      data: {
        organizationId,
        candidateId,
        jobApplicationId: data.jobApplicationId,
        documentType: data.documentType,
        documentName: data.documentName,
        fileUrl: data.fileUrl,
        fileType: data.fileType || 'application/pdf',
        fileSize: data.fileSize || 0,
        uploadedBy,
      },
    });
  }

  async addNote(organizationId: string, candidateId: string, data: any, authorId: string) {
    return this.prisma.recruitmentNote.create({
      data: {
        organizationId,
        candidateId,
        jobApplicationId: data.jobApplicationId,
        authorId,
        noteType: data.noteType || 'GENERAL',
        note: data.note,
        isInternal: data.isInternal ?? true,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.candidate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
