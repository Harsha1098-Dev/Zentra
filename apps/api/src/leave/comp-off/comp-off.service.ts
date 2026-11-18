import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompOffRepository } from './comp-off.repository';
import { LeaveTypesRepository } from '../leave-types/leave-types.repository';
import { LeaveBalancesRepository } from '../leave-balances/leave-balances.repository';
import { EmployeesRepository } from '../../employees/employees.repository';
import { ApprovalsService } from '../../approvals/approvals.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateCompOffRequestInput,
  CompOffRequestDto,
  CompOffStatus,
  ApproverType,
  AuditAction,
  LeaveCategory,
} from '@zentra/shared-types';

@Injectable()
export class CompOffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compOffRepo: CompOffRepository,
    private readonly leaveTypesRepo: LeaveTypesRepository,
    private readonly balancesRepo: LeaveBalancesRepository,
    private readonly employeesRepo: EmployeesRepository,
    private readonly approvalsService: ApprovalsService,
    private readonly auditService: AuditService,
  ) {}

  async createCompOffRequest(
    organizationId: string,
    input: CreateCompOffRequestInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CompOffRequestDto> {
    let employee: any;
    if (input.employeeId) {
      employee = await this.employeesRepo.findById(input.employeeId, organizationId);
      if (!employee) {
        throw new NotFoundException(`Employee with ID "${input.employeeId}" not found`);
      }
    } else {
      employee = await this.employeesRepo.findByUserId(actorUserId, organizationId);
      if (!employee) {
        throw new NotFoundException('Employee profile not found for current user');
      }
    }

    const workedDate = new Date(input.workedDate);
    if (isNaN(workedDate.getTime())) {
      throw new BadRequestException('Invalid workedDate format');
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (workedDate > today) {
      throw new BadRequestException('Worked date cannot be in the future');
    }

    const existing = await this.compOffRepo.findByEmployeeAndDate(employee.id, workedDate, organizationId);
    if (existing) {
      throw new ConflictException(`A compensatory off request already exists for date ${input.workedDate}`);
    }

    const created = await this.compOffRepo.create({
      organizationId,
      employeeId: employee.id,
      workedDate,
      workedHours: input.workedHours || null,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl || null,
      creditedDays: input.creditedDays || 1.0,
      status: CompOffStatus.PENDING_APPROVAL,
    });

    if (employee.userId) {
      try {
        const flow = await this.approvalsService.createApprovalFlow({
          organizationId,
          requestType: 'COMP_OFF_REQUEST',
          entityType: 'CompOffRequest',
          entityId: created.id,
          requestedBy: employee.userId,
          steps: [
            {
              stepName: 'Manager Approval',
              approverType: ApproverType.REPORTING_MANAGER,
            },
          ],
          metadata: {
            workedDate: input.workedDate,
            reason: input.reason,
            creditedDays: input.creditedDays || 1.0,
          },
          actorUserId,
        });
        await this.compOffRepo.update(created.id, organizationId, { approvalFlowId: flow.id });
      } catch {
        // Approval engine fallback
      }
    }

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.COMP_OFF_REQUEST_CREATE,
      entityType: 'CompOffRequest',
      entityId: created.id,
      newValues: {
        workedDate: input.workedDate,
        creditedDays: input.creditedDays || 1.0,
      },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(created);
  }

  async approveCompOffRequest(
    id: string,
    organizationId: string,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CompOffRequestDto> {
    const request = await this.compOffRepo.findById(id, organizationId);
    if (!request) {
      throw new NotFoundException(`Comp-off request with ID "${id}" not found`);
    }

    if (request.status !== CompOffStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve comp-off request in status "${request.status}"`);
    }

    const year = request.workedDate.getFullYear();
    const daysToCredit = Number(request.creditedDays);

    // Expiry date: 90 days from workedDate
    const expiryDate = new Date(request.workedDate);
    expiryDate.setDate(expiryDate.getDate() + 90);

    return this.prisma.$transaction(async (tx) => {
      // 1. Find or create COMP_OFF leave type
      let compOffType = await tx.leaveType.findFirst({
        where: {
          organizationId,
          OR: [{ isCompOff: true }, { code: 'COMP_OFF' }],
          deletedAt: null,
        },
      });

      if (!compOffType) {
        compOffType = await tx.leaveType.create({
          data: {
            organizationId,
            name: 'Compensatory Off',
            code: 'COMP_OFF',
            description: 'Compensatory off for working on holidays or weekends',
            category: LeaveCategory.COMPENSATORY_OFF,
            isPaid: true,
            isCompOff: true,
            color: '#10B981',
            icon: 'award',
          },
        });
      }

      // 2. Find or create balance
      const balance = await tx.leaveBalance.upsert({
        where: {
          organizationId_employeeId_leaveTypeId_year: {
            organizationId,
            employeeId: request.employeeId,
            leaveTypeId: compOffType.id,
            year,
          },
        },
        create: {
          organizationId,
          employeeId: request.employeeId,
          leaveTypeId: compOffType.id,
          year,
          openingBalance: 0,
          accrued: 0,
          granted: daysToCredit,
          used: 0,
          pending: 0,
          closingBalance: daysToCredit,
        },
        update: {
          granted: { increment: daysToCredit },
          closingBalance: { increment: daysToCredit },
        },
      });

      // 3. Record balance history
      const prevBal = Number(balance.closingBalance) - daysToCredit;
      const newBal = Number(balance.closingBalance);
      await tx.leaveBalanceHistory.create({
        data: {
          organizationId,
          leaveBalanceId: balance.id,
          employeeId: request.employeeId,
          leaveTypeId: compOffType.id,
          action: 'grant',
          amount: daysToCredit,
          previousBalance: prevBal,
          newBalance: newBal,
          reason: `Comp-off credit for working on ${request.workedDate.toISOString().slice(0, 10)}`,
          referenceId: id,
          actorUserId,
        },
      });

      // 4. Update request status
      const updated = await this.compOffRepo.update(
        id,
        organizationId,
        {
          status: CompOffStatus.APPROVED,
          expiryDate,
          approvedBy: actorUserId,
          approvedAt: new Date(),
        },
        tx,
      );

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.COMP_OFF_REQUEST_APPROVE,
        entityType: 'CompOffRequest',
        entityId: id,
        newValues: { status: CompOffStatus.APPROVED, creditedDays: daysToCredit },
        ipAddress,
        userAgent,
      });

      return this.mapToDto(updated);
    });
  }

  async rejectCompOffRequest(
    id: string,
    organizationId: string,
    rejectionReason: string,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CompOffRequestDto> {
    const request = await this.compOffRepo.findById(id, organizationId);
    if (!request) {
      throw new NotFoundException(`Comp-off request with ID "${id}" not found`);
    }

    if (request.status !== CompOffStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot reject comp-off request in status "${request.status}"`);
    }

    const updated = await this.compOffRepo.update(id, organizationId, {
      status: CompOffStatus.REJECTED,
      rejectedBy: actorUserId,
      rejectedAt: new Date(),
      rejectionReason,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.COMP_OFF_REQUEST_REJECT,
      entityType: 'CompOffRequest',
      entityId: id,
      newValues: { status: CompOffStatus.REJECTED, rejectionReason },
      ipAddress,
      userAgent,
    });

    return this.mapToDto(updated);
  }

  async getMyCompOffRequests(
    userId: string,
    organizationId: string,
    filter: any,
  ) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    const result = await this.compOffRepo.list(organizationId, {
      ...filter,
      employeeId: employee.id,
    });

    return {
      ...result,
      data: result.data.map((item) => this.mapToDto(item)),
    };
  }

  async getTeamCompOffRequests(
    userId: string,
    organizationId: string,
    filter: any,
  ) {
    const manager = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!manager) {
      throw new NotFoundException('Manager profile not found for current user');
    }

    const reports = await this.employeesRepo.getDirectReportees(manager.id, organizationId);
    const reportIds = reports.map((r: any) => r.id);
    if (reportIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: filter.limit || 20,
        totalPages: 1,
      };
    }

    const where: any = {
      organizationId,
      employeeId: { in: reportIds },
    };
    if (filter.status) where.status = filter.status;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.compOffRequest.count({ where }),
      this.prisma.compOffRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { workedDate: 'desc' },
        include: {
          employee: {
            include: {
              user: true,
              department: true,
              designation: true,
            },
          },
        },
      }),
    ]);

    return {
      data: data.map((item) => this.mapToDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getAllCompOffRequests(organizationId: string, filter: any) {
    const result = await this.compOffRepo.list(organizationId, filter);
    return {
      ...result,
      data: result.data.map((item) => this.mapToDto(item)),
    };
  }

  async getCompOffById(id: string, organizationId: string): Promise<CompOffRequestDto> {
    const item = await this.compOffRepo.findById(id, organizationId);
    if (!item) {
      throw new NotFoundException(`Comp-off request with ID "${id}" not found`);
    }
    return this.mapToDto(item);
  }

  private mapToDto(entity: any): CompOffRequestDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      employeeId: entity.employeeId,
      employeeName: entity.employee ? `${entity.employee.firstName} ${entity.employee.lastName}` : undefined,
      employeeCode: entity.employee?.employeeCode,
      workedDate: entity.workedDate instanceof Date ? entity.workedDate.toISOString() : entity.workedDate,
      workedHours: entity.workedHours !== null ? Number(entity.workedHours) : null,
      reason: entity.reason,
      attachmentUrl: entity.attachmentUrl,
      status: entity.status as CompOffStatus,
      approvalFlowId: entity.approvalFlowId,
      creditedDays: Number(entity.creditedDays),
      expiryDate: entity.expiryDate instanceof Date ? entity.expiryDate.toISOString() : entity.expiryDate,
      approvedBy: entity.approvedBy,
      approvedAt: entity.approvedAt instanceof Date ? entity.approvedAt.toISOString() : entity.approvedAt,
      rejectedBy: entity.rejectedBy,
      rejectedAt: entity.rejectedAt instanceof Date ? entity.rejectedAt.toISOString() : entity.rejectedAt,
      rejectionReason: entity.rejectionReason,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
    };
  }
}
