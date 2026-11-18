import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class EmployeeSalaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveAssignment(employeeId: string, organizationId: string): Promise<any | null> {
    return this.prisma.employeeSalaryAssignment.findFirst({
      where: {
        employeeId,
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        salaryStructure: {
          include: {
            components: {
              include: { salaryComponent: true },
              orderBy: { payslipDisplayOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findAssignmentById(id: string, organizationId: string): Promise<any | null> {
    return this.prisma.employeeSalaryAssignment.findFirst({
      where: { id, organizationId },
      include: {
        salaryStructure: {
          include: {
            components: {
              include: { salaryComponent: true },
            },
          },
        },
        employee: true,
      },
    });
  }

  async findAssignmentsByEmployee(employeeId: string, organizationId: string): Promise<any[]> {
    return this.prisma.employeeSalaryAssignment.findMany({
      where: {
        employeeId,
        organizationId,
      },
      include: {
        salaryStructure: {
          select: { id: true, name: true, currency: true },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findAllAssignments(organizationId: string, filter?: { search?: string }): Promise<any[]> {
    const where: any = {
      organizationId,
      status: 'ACTIVE',
    };
    if (filter?.search) {
      where.employee = {
        OR: [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { employeeCode: { contains: filter.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.employeeSalaryAssignment.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            dateOfJoining: true,
            status: true,
          },
        },
        salaryStructure: {
          select: { id: true, name: true, currency: true },
        },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { effectiveFrom: 'desc' }],
    });
  }

  async createAssignment(organizationId: string, data: any): Promise<any> {
    return this.prisma.employeeSalaryAssignment.create({
      data: {
        ...data,
        organizationId,
        monthlyCtc: Number((data.annualCtc / 12).toFixed(2)),
        monthlyGross: Number((data.annualCtc / 12).toFixed(2)), // Initial gross estimate
      },
      include: {
        salaryStructure: true,
        employee: true,
      },
    });
  }

  async updateAssignmentStatus(
    id: string,
    organizationId: string,
    status: string,
    extraData: any = {},
  ): Promise<any> {
    return this.prisma.employeeSalaryAssignment.update({
      where: { id },
      data: {
        status,
        ...extraData,
      },
    });
  }

  async supersedePriorAssignments(
    employeeId: string,
    organizationId: string,
    effectiveFrom: Date,
    currentAssignmentId: string,
  ): Promise<void> {
    // End earlier active assignments
    await this.prisma.employeeSalaryAssignment.updateMany({
      where: {
        employeeId,
        organizationId,
        id: { not: currentAssignmentId },
        status: 'ACTIVE',
        effectiveFrom: { lte: effectiveFrom },
      },
      data: {
        effectiveTo: new Date(effectiveFrom.getTime() - 24 * 60 * 60 * 1000),
        status: 'SUPERSEDED',
      },
    });
  }

  async findBankDetail(employeeId: string, organizationId: string): Promise<any | null> {
    return this.prisma.employeeBankDetail.findFirst({
      where: { employeeId, organizationId },
    });
  }

  async upsertBankDetail(organizationId: string, employeeId: string, data: any): Promise<any> {
    return this.prisma.employeeBankDetail.upsert({
      where: { employeeId },
      create: {
        ...data,
        organizationId,
        employeeId,
      },
      update: {
        ...data,
      },
    });
  }
}
