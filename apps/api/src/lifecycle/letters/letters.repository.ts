import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LettersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters: { employeeId?: string; letterType?: string } = {}) {
    return this.prisma.lifecycleLetter.findMany({
      where: {
        organizationId,
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.letterType ? { letterType: filters.letterType } : {}),
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.lifecycleLetter.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
          },
        },
        organization: true,
      },
    });
  }

  async create(organizationId: string, data: any, userId: string) {
    return this.prisma.lifecycleLetter.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        letterType: data.letterType,
        title: data.title,
        content: data.content,
        pdfUrl: data.pdfUrl || null,
        issuedDate: data.issuedDate ? new Date(data.issuedDate) : new Date(),
        isSharedWithEmployee: data.isSharedWithEmployee !== undefined ? data.isSharedWithEmployee : true,
        generatedBy: userId,
        referenceId: data.referenceId || null,
      },
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.lifecycleLetter.update({
      where: { id },
      data,
      include: {
        employee: true,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    return this.prisma.lifecycleLetter.delete({
      where: { id },
    });
  }
}
