import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EmployeeQueryFilterInput, PaginatedResult } from '@zentra/shared-types';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEmployee(
    data: Prisma.EmployeeUncheckedCreateInput,
    historyData: Prisma.EmploymentHistoryUncheckedCreateInput,
    txClient?: Prisma.TransactionClient,
  ) {
    if (txClient) {
      const employee = await txClient.employee.create({
        data,
        include: {
          location: true,
          department: true,
          designation: true,
          grade: true,
          reportingManager: true,
        },
      });

      const history = await txClient.employmentHistory.create({
        data: {
          ...historyData,
          employeeId: employee.id,
        },
      });

      return { employee, history };
    }

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data,
        include: {
          location: true,
          department: true,
          designation: true,
          grade: true,
          reportingManager: true,
        },
      });

      const history = await tx.employmentHistory.create({
        data: {
          ...historyData,
          employeeId: employee.id,
        },
      });

      return { employee, history };
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.employee.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        location: true,
        department: {
          include: {
            departmentHeadUser: true,
          },
        },
        designation: true,
        grade: true,
        reportingManager: {
          include: {
            designation: true,
            department: true,
          },
        },
        user: true,
      },
    });
  }

  async findByWorkEmail(workEmail: string, organizationId: string) {
    return this.prisma.employee.findFirst({
      where: {
        workEmail: workEmail.toLowerCase().trim(),
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findByCode(employeeCode: string, organizationId: string) {
    return this.prisma.employee.findFirst({
      where: {
        employeeCode: employeeCode.trim().toUpperCase(),
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findByUserId(userId: string, organizationId: string) {
    return this.prisma.employee.findFirst({
      where: {
        userId,
        organizationId,
        deletedAt: null,
      },
      include: {
        location: true,
        department: true,
        designation: true,
        grade: true,
        reportingManager: true,
      },
    });
  }

  async updateEmployee(
    id: string,
    organizationId: string,
    updateData: Prisma.EmployeeUncheckedUpdateInput,
    historyData?: Prisma.EmploymentHistoryUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.update({
        where: { id },
        data: updateData,
        include: {
          location: true,
          department: true,
          designation: true,
          grade: true,
          reportingManager: true,
        },
      });

      let history = null;
      if (historyData) {
        history = await tx.employmentHistory.create({
          data: {
            ...historyData,
            employeeId: employee.id,
            organizationId,
          },
        });
      }

      return { employee, history };
    });
  }

  async softDeleteEmployee(
    id: string,
    organizationId: string,
    changedByUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: {
          status: 'INACTIVE',
          deletedAt: new Date(),
        },
      });

      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId: id,
          eventType: 'STATUS_CHANGED',
          effectiveFrom: new Date(),
          employeeStatus: 'INACTIVE',
          remarks: 'Employee record deactivated / soft deleted',
          changedByUserId,
        },
      });

      return updated;
    });
  }

  async listEmployees(
    organizationId: string,
    filter: EmployeeQueryFilterInput,
  ): Promise<PaginatedResult<any>> {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filter.search && filter.search.trim()) {
      const search = filter.search.trim();
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { workEmail: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter.departmentId) {
      where.departmentId = filter.departmentId;
    }

    if (filter.locationId) {
      where.locationId = filter.locationId;
    }

    if (filter.designationId) {
      where.designationId = filter.designationId;
    }

    if (filter.gradeId) {
      where.gradeId = filter.gradeId;
    }

    if (filter.employmentType) {
      where.employmentType = filter.employmentType;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.reportingManagerId) {
      where.reportingManagerId = filter.reportingManagerId;
    }

    // Sorting
    let orderBy: Prisma.EmployeeOrderByWithRelationInput = { createdAt: 'desc' };
    const sortOrder = filter.sortOrder === 'asc' ? 'asc' : 'desc';

    if (filter.sortBy === 'name') {
      orderBy = { firstName: sortOrder };
    } else if (filter.sortBy === 'dateOfJoining') {
      orderBy = { dateOfJoining: sortOrder };
    } else if (filter.sortBy === 'employeeCode') {
      orderBy = { employeeCode: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const [total, items] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          location: true,
          department: true,
          designation: true,
          grade: true,
          reportingManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getEmploymentHistory(employeeId: string, organizationId: string) {
    return this.prisma.employmentHistory.findMany({
      where: {
        employeeId,
        organizationId,
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
      include: {
        location: true,
        department: true,
        designation: true,
        grade: true,
      },
    });
  }

  async getDirectReportees(managerEmployeeId: string, organizationId: string) {
    return this.prisma.employee.findMany({
      where: {
        reportingManagerId: managerEmployeeId,
        organizationId,
        deletedAt: null,
      },
      include: {
        location: true,
        department: true,
        designation: true,
        grade: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async getNextEmployeeCode(
    organizationId: string,
    customPrefix = 'ZEN-',
    padding = 4,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      let seq = await tx.employeeCodeSequence.findUnique({
        where: { organizationId },
      });

      if (!seq) {
        seq = await tx.employeeCodeSequence.create({
          data: {
            organizationId,
            prefix: customPrefix,
            nextNumber: 1,
            padding,
          },
        });
      }

      let generatedCode = '';
      let isUnique = false;
      let curNum = seq.nextNumber;

      while (!isUnique) {
        generatedCode = `${seq.prefix}${curNum.toString().padStart(seq.padding, '0')}`;
        const existing = await tx.employee.findFirst({
          where: {
            organizationId,
            employeeCode: generatedCode,
          },
        });

        if (!existing) {
          isUnique = true;
        } else {
          curNum++;
        }
      }

      await tx.employeeCodeSequence.update({
        where: { organizationId },
        data: {
          nextNumber: curNum + 1,
        },
      });

      return generatedCode;
    });
  }

  async createImportJob(
    organizationId: string,
    fileName: string,
    userId: string,
    totalRows: number,
  ) {
    return this.prisma.employeeImportJob.create({
      data: {
        organizationId,
        fileName,
        createdByUserId: userId,
        totalRows,
        status: 'PENDING',
      },
    });
  }

  async updateImportJob(
    id: string,
    updateData: Prisma.EmployeeImportJobUpdateInput,
  ) {
    return this.prisma.employeeImportJob.update({
      where: { id },
      data: updateData,
    });
  }

  async getImportJob(id: string, organizationId: string) {
    return this.prisma.employeeImportJob.findFirst({
      where: { id, organizationId },
    });
  }

  async createExportJob(
    organizationId: string,
    fileName: string,
    fileContent: string,
    totalRecords: number,
    userId: string,
  ) {
    return this.prisma.employeeExportJob.create({
      data: {
        organizationId,
        fileName,
        fileContent,
        totalRecords,
        createdByUserId: userId,
        status: 'COMPLETED',
      },
    });
  }

  async getExportJob(id: string, organizationId: string) {
    return this.prisma.employeeExportJob.findFirst({
      where: { id, organizationId },
    });
  }
}
