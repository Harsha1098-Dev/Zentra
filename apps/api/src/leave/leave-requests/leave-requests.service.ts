import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaveRequestsRepository } from './leave-requests.repository';
import { LeaveTypesRepository } from '../leave-types/leave-types.repository';
import { LeavePoliciesRepository } from '../leave-policies/leave-policies.repository';
import { LeavePoliciesService } from '../leave-policies/leave-policies.service';
import { LeaveBalancesRepository } from '../leave-balances/leave-balances.repository';
import { LeaveBalancesService } from '../leave-balances/leave-balances.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { ApprovalsService } from '../../approvals/approvals.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateLeaveRequestInput,
  CancelLeaveRequestInput,
  LeaveRequestQueryFilterInput,
  LeaveRequestDto,
  LeaveRequestStatus,
  LeaveDurationType,
  ApproverType,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestsRepo: LeaveRequestsRepository,
    private readonly leaveTypesRepo: LeaveTypesRepository,
    private readonly policiesRepo: LeavePoliciesRepository,
    private readonly policiesService: LeavePoliciesService,
    private readonly balancesRepo: LeaveBalancesRepository,
    private readonly balancesService: LeaveBalancesService,
    private readonly employeesRepo: EmployeesRepository,
    private readonly approvalsService: ApprovalsService,
    private readonly auditService: AuditService,
  ) {}

  async calculateLeaveDays(
    organizationId: string,
    employee: any,
    policy: any | null,
    fromDate: Date,
    toDate: Date,
    durationType: LeaveDurationType,
    workedHours?: number | null,
  ): Promise<number> {
    if (durationType === LeaveDurationType.HALF_DAY) return 0.5;
    if (durationType === LeaveDurationType.QUARTER_DAY) return 0.25;
    if (durationType === LeaveDurationType.HOURLY) {
      const hours = workedHours && workedHours > 0 ? workedHours : 1;
      return Number((hours / 8).toFixed(2));
    }

    // FULL_DAY: calculate days excluding weekends and holidays if policy disallows
    const [workweekConfig, holidays] = await Promise.all([
      this.prisma.workweekConfig.findUnique({
        where: { organizationId },
      }),
      this.prisma.holiday.findMany({
        where: {
          organizationId,
          date: {
            gte: new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()),
            lte: new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59),
          },
        },
      }),
    ]);

    const weekendDays: string[] = (workweekConfig?.weekendDays as string[]) || ['SATURDAY', 'SUNDAY'];
    const holidayDateStrings = new Set(
      holidays
        .filter((h) => !h.locationId || h.locationId === employee.locationId)
        .map((h) => h.date.toISOString().slice(0, 10)),
    );

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    let count = 0;
    const current = new Date(fromDate);
    current.setHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);

    const allowWeekends = policy?.allowWeekendLeave ?? false;
    const allowHolidays = policy?.allowHolidayLeave ?? false;

    while (current <= end) {
      const dayName = dayNames[current.getDay()];
      const dateStr = current.toISOString().slice(0, 10);

      const isWeekend = weekendDays.includes(dayName);
      const isHoliday = holidayDateStrings.has(dateStr);

      let skip = false;
      if (!allowWeekends && isWeekend) skip = true;
      if (!allowHolidays && isHoliday) skip = true;

      if (!skip) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  async createLeaveRequest(
    organizationId: string,
    input: CreateLeaveRequestInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveRequestDto> {
    // 1. Resolve employee
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

    // 2. Validate leave type
    const leaveType = await this.leaveTypesRepo.findById(input.leaveTypeId, organizationId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID "${input.leaveTypeId}" not found`);
    }
    if (!leaveType.isActive) {
      throw new BadRequestException(`Leave type "${leaveType.name}" is currently inactive`);
    }

    // 3. Resolve applicable policy
    const policy = await this.policiesService.getApplicablePolicyForEmployee(
      employee,
      input.leaveTypeId,
      organizationId,
    );

    // 4. Validate dates
    const fromDate = new Date(input.fromDate);
    const toDate = new Date(input.toDate);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date format for fromDate or toDate');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('fromDate cannot be after toDate');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDateOnly = new Date(fromDate);
    fromDateOnly.setHours(0, 0, 0, 0);

    // Past / Future constraints
    if (policy) {
      if (!policy.allowPastDates && fromDateOnly < today) {
        throw new BadRequestException('Past dates are not allowed for this leave type under current policy');
      }
      if (!policy.allowFutureDates && fromDateOnly > today) {
        throw new BadRequestException('Future dates are not allowed for this leave type under current policy');
      }
      if (policy.maxFutureDays && policy.maxFutureDays > 0) {
        const maxFutureDate = new Date(today);
        maxFutureDate.setDate(maxFutureDate.getDate() + policy.maxFutureDays);
        if (fromDateOnly > maxFutureDate) {
          throw new BadRequestException(`Leave cannot be applied more than ${policy.maxFutureDays} days in advance`);
        }
      }
      if (policy.minimumNoticeDays && policy.minimumNoticeDays > 0 && fromDateOnly > today) {
        const minNoticeDate = new Date(today);
        minNoticeDate.setDate(minNoticeDate.getDate() + policy.minimumNoticeDays);
        if (fromDateOnly < minNoticeDate) {
          throw new BadRequestException(`Minimum notice period of ${policy.minimumNoticeDays} day(s) required`);
        }
      }
    }

    // 5. Overlapping check
    const allowOverlapping = policy?.allowOverlappingRequests ?? false;
    if (!allowOverlapping) {
      const overlapping = await this.requestsRepo.findOverlappingRequests(
        employee.id,
        organizationId,
        fromDate,
        toDate,
      );
      if (overlapping.length > 0) {
        throw new BadRequestException(
          `Overlapping leave request already exists from ${overlapping[0].fromDate.toISOString().slice(0, 10)} to ${overlapping[0].toDate.toISOString().slice(0, 10)} (${overlapping[0].leaveType.name})`,
        );
      }
    }

    // 6. Calculate effective leave days
    let workedHours: number | null = null;
    if (input.startTime && input.endTime) {
      // Rough duration calculation if hourly
      const [sh, sm] = input.startTime.split(':').map(Number);
      const [eh, em] = input.endTime.split(':').map(Number);
      workedHours = Math.max(0.5, eh - sh + (em - sm) / 60);
    }
    const numberOfDays = await this.calculateLeaveDays(
      organizationId,
      employee,
      policy,
      fromDate,
      toDate,
      input.durationType,
      workedHours,
    );

    if (numberOfDays <= 0) {
      throw new BadRequestException('No working days found in selected date range (all days fall on weekends or holidays)');
    }

    // 7. Policy threshold constraints
    if (policy) {
      if (policy.maxDaysPerRequest && numberOfDays > Number(policy.maxDaysPerRequest)) {
        throw new BadRequestException(
          `Maximum allowed days per request is ${policy.maxDaysPerRequest} day(s). Requested: ${numberOfDays}`,
        );
      }
      if (policy.requiresAttachment && numberOfDays >= policy.attachmentRequiredDays && !input.attachmentUrl) {
        throw new BadRequestException(
          `An attachment is mandatory for leave requests exceeding ${policy.attachmentRequiredDays} day(s)`,
        );
      }
    }

    // 8. Balance check
    const leaveYear = fromDate.getFullYear();
    // Ensure balance initialized
    const balances = await this.balancesService.getBalancesForEmployee(employee.id, leaveYear, organizationId);
    const balance = balances.find((b) => b.leaveTypeId === input.leaveTypeId);
    const available = balance ? balance.availableBalance : 0;

    const allowsNegative = leaveType.allowsNegativeBalance || (policy && policy.allowNegativeBalance);
    if (!allowsNegative && available < numberOfDays) {
      throw new BadRequestException(
        `Insufficient leave balance for ${leaveType.name}. Available: ${available}, Requested: ${numberOfDays}`,
      );
    }

    // 9. Determine approval necessity
    const requiresApproval =
      (policy ? policy.requiresApproval : true) && leaveType.requiresApproval;

    // 10. Execute application in database transaction
    return this.prisma.$transaction(async (tx) => {
      const initialStatus = requiresApproval
        ? LeaveRequestStatus.PENDING_APPROVAL
        : LeaveRequestStatus.APPROVED;

      const created = await this.requestsRepo.create(
        {
          organizationId,
          employeeId: employee.id,
          leaveTypeId: input.leaveTypeId,
          leavePolicyId: policy?.id || null,
          fromDate,
          toDate,
          numberOfDays,
          durationType: input.durationType,
          halfDayType: input.halfDayType || null,
          quarterDayType: input.quarterDayType || null,
          startTime: input.startTime || null,
          endTime: input.endTime || null,
          reason: input.reason,
          attachmentUrl: input.attachmentUrl || null,
          coveringEmployeeId: input.coveringEmployeeId || null,
          contactNumber: input.contactNumber || null,
          status: initialStatus,
          idempotencyKey: input.idempotencyKey || null,
          approvedAt: !requiresApproval ? new Date() : null,
          approvedBy: !requiresApproval ? 'SYSTEM_AUTO_APPROVED' : null,
        },
        tx,
      );

      // Reserve balance
      const balanceRecord = await this.balancesRepo.findSpecificBalance(
        employee.id,
        input.leaveTypeId,
        leaveYear,
        organizationId,
        tx,
      );

      if (balanceRecord) {
        if (requiresApproval) {
          const newPending = Number(balanceRecord.pending) + numberOfDays;
          await this.balancesRepo.upsertBalance(
            {
              organizationId,
              employeeId: employee.id,
              leaveTypeId: input.leaveTypeId,
              year: leaveYear,
              pending: newPending,
            },
            tx,
          );
        } else {
          // Immediately committed as used
          const newUsed = Number(balanceRecord.used) + numberOfDays;
          await this.balancesRepo.upsertBalance(
            {
              organizationId,
              employeeId: employee.id,
              leaveTypeId: input.leaveTypeId,
              year: leaveYear,
              used: newUsed,
            },
            tx,
          );
        }

        await this.balancesRepo.createHistory(
          {
            organizationId,
            leaveBalanceId: balanceRecord.id,
            employeeId: employee.id,
            leaveTypeId: input.leaveTypeId,
            action: requiresApproval ? 'leave_applied' : 'leave_approved',
            amount: -numberOfDays,
            previousBalance: available,
            newBalance: available - numberOfDays,
            reason: `Leave request for ${numberOfDays} day(s) (${input.fromDate} to ${input.toDate})`,
            referenceId: created.id,
            actorUserId,
          },
          tx,
        );
      }

      // If approval required, initiate approval flow
      let approvalFlowId: string | null = null;
      if (requiresApproval && employee.userId) {
        try {
          const flow = await this.approvalsService.createApprovalFlow({
            organizationId,
            requestType: 'LEAVE_REQUEST',
            entityType: 'LeaveRequest',
            entityId: created.id,
            requestedBy: employee.userId,
            steps: [
              {
                stepName: 'Manager Approval',
                approverType: ApproverType.REPORTING_MANAGER,
              },
            ],
            metadata: {
              leaveTypeName: leaveType.name,
              numberOfDays,
              fromDate: input.fromDate,
              toDate: input.toDate,
              reason: input.reason,
            },
            actorUserId,
          });
          approvalFlowId = flow.id;
          await this.requestsRepo.update(created.id, organizationId, { approvalFlowId }, tx);
        } catch {
          // In case approval engine fallback or mock in tests
        }
      }

      await this.auditService.log({
        organizationId,
        actorUserId,
        action: AuditAction.LEAVE_REQUEST_CREATE,
        entityType: 'LeaveRequest',
        entityId: created.id,
        newValues: {
          leaveTypeId: input.leaveTypeId,
          numberOfDays,
          fromDate: input.fromDate,
          toDate: input.toDate,
          status: initialStatus,
        },
        ipAddress,
        userAgent,
      });

      return this.mapToDto(created);
    });
  }

  async approveLeaveRequest(
    id: string,
    organizationId: string,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveRequestDto> {
    const request = await this.requestsRepo.findById(id, organizationId);
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }

    if (
      request.status !== LeaveRequestStatus.PENDING_APPROVAL &&
      request.status !== LeaveRequestStatus.CANCEL_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot approve request in status "${request.status}". Must be PENDING_APPROVAL or CANCEL_REQUESTED`,
      );
    }

    const leaveYear = request.fromDate.getFullYear();
    const days = Number(request.numberOfDays);

    return this.prisma.$transaction(async (tx) => {
      const balanceRecord = await this.balancesRepo.findSpecificBalance(
        request.employeeId,
        request.leaveTypeId,
        leaveYear,
        organizationId,
        tx,
      );

      if (request.status === LeaveRequestStatus.PENDING_APPROVAL) {
        // Normal approval: pending -> used
        const updated = await this.requestsRepo.update(
          id,
          organizationId,
          {
            status: LeaveRequestStatus.APPROVED,
            approvedBy: actorUserId,
            approvedAt: new Date(),
          },
          tx,
        );

        if (balanceRecord) {
          const newPending = Math.max(0, Number(balanceRecord.pending) - days);
          const newUsed = Number(balanceRecord.used) + days;
          await this.balancesRepo.upsertBalance(
            {
              organizationId,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year: leaveYear,
              pending: newPending,
              used: newUsed,
            },
            tx,
          );

          await this.balancesRepo.createHistory(
            {
              organizationId,
              leaveBalanceId: balanceRecord.id,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              action: 'leave_approved',
              amount: days,
              previousBalance: Number(balanceRecord.used),
              newBalance: newUsed,
              reason: 'Leave request approved',
              referenceId: id,
              actorUserId,
            },
            tx,
          );
        }

        await this.auditService.log({
          organizationId,
          actorUserId,
          action: AuditAction.LEAVE_REQUEST_APPROVE,
          entityType: 'LeaveRequest',
          entityId: id,
          newValues: { status: LeaveRequestStatus.APPROVED, approvedBy: actorUserId },
          ipAddress,
          userAgent,
        });

        return this.mapToDto(updated);
      } else {
        // CANCEL_REQUESTED approval: cancel the approved leave, revert used balance
        const updated = await this.requestsRepo.update(
          id,
          organizationId,
          {
            status: LeaveRequestStatus.CANCELLED_AFTER_APPROVAL,
            cancelledBy: actorUserId,
            cancelledAt: new Date(),
          },
          tx,
        );

        if (balanceRecord) {
          const newUsed = Math.max(0, Number(balanceRecord.used) - days);
          await this.balancesRepo.upsertBalance(
            {
              organizationId,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year: leaveYear,
              used: newUsed,
            },
            tx,
          );

          await this.balancesRepo.createHistory(
            {
              organizationId,
              leaveBalanceId: balanceRecord.id,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              action: 'leave_cancelled',
              amount: days,
              previousBalance: Number(balanceRecord.used),
              newBalance: newUsed,
              reason: 'Cancellation after approval approved',
              referenceId: id,
              actorUserId,
            },
            tx,
          );
        }

        await this.auditService.log({
          organizationId,
          actorUserId,
          action: AuditAction.LEAVE_REQUEST_CANCEL,
          entityType: 'LeaveRequest',
          entityId: id,
          newValues: { status: LeaveRequestStatus.CANCELLED_AFTER_APPROVAL, cancelledBy: actorUserId },
          ipAddress,
          userAgent,
        });

        return this.mapToDto(updated);
      }
    });
  }

  async rejectLeaveRequest(
    id: string,
    organizationId: string,
    rejectionReason: string,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveRequestDto> {
    const request = await this.requestsRepo.findById(id, organizationId);
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }

    if (
      request.status !== LeaveRequestStatus.PENDING_APPROVAL &&
      request.status !== LeaveRequestStatus.CANCEL_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot reject request in status "${request.status}". Must be PENDING_APPROVAL or CANCEL_REQUESTED`,
      );
    }

    const leaveYear = request.fromDate.getFullYear();
    const days = Number(request.numberOfDays);

    return this.prisma.$transaction(async (tx) => {
      if (request.status === LeaveRequestStatus.PENDING_APPROVAL) {
        const updated = await this.requestsRepo.update(
          id,
          organizationId,
          {
            status: LeaveRequestStatus.REJECTED,
            rejectedBy: actorUserId,
            rejectedAt: new Date(),
            rejectionReason,
          },
          tx,
        );

        // Release pending balance
        const balanceRecord = await this.balancesRepo.findSpecificBalance(
          request.employeeId,
          request.leaveTypeId,
          leaveYear,
          organizationId,
          tx,
        );

        if (balanceRecord) {
          const newPending = Math.max(0, Number(balanceRecord.pending) - days);
          await this.balancesRepo.upsertBalance(
            {
              organizationId,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year: leaveYear,
              pending: newPending,
            },
            tx,
          );

          await this.balancesRepo.createHistory(
            {
              organizationId,
              leaveBalanceId: balanceRecord.id,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              action: 'leave_rejected',
              amount: days,
              previousBalance: Number(balanceRecord.pending),
              newBalance: newPending,
              reason: `Leave request rejected: ${rejectionReason}`,
              referenceId: id,
              actorUserId,
            },
            tx,
          );
        }

        await this.auditService.log({
          organizationId,
          actorUserId,
          action: AuditAction.LEAVE_REQUEST_REJECT,
          entityType: 'LeaveRequest',
          entityId: id,
          newValues: { status: LeaveRequestStatus.REJECTED, rejectionReason },
          ipAddress,
          userAgent,
        });

        return this.mapToDto(updated);
      } else {
        // Rejection of cancellation request reverts status to APPROVED
        const updated = await this.requestsRepo.update(
          id,
          organizationId,
          {
            status: LeaveRequestStatus.APPROVED,
            rejectionReason,
          },
          tx,
        );

        await this.auditService.log({
          organizationId,
          actorUserId,
          action: AuditAction.LEAVE_REQUEST_REJECT,
          entityType: 'LeaveRequest',
          entityId: id,
          newValues: { status: LeaveRequestStatus.APPROVED, cancelRejectionReason: rejectionReason },
          ipAddress,
          userAgent,
        });

        return this.mapToDto(updated);
      }
    });
  }

  async cancelLeaveRequest(
    id: string,
    organizationId: string,
    input: CancelLeaveRequestInput,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LeaveRequestDto> {
    const request = await this.requestsRepo.findById(id, organizationId);
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }

    const employee = await this.employeesRepo.findByUserId(actorUserId, organizationId);
    const isOwner = employee && employee.id === request.employeeId;

    const leaveYear = request.fromDate.getFullYear();
    const days = Number(request.numberOfDays);

    if (request.status === LeaveRequestStatus.PENDING_APPROVAL) {
      // Pending request can be cancelled immediately by requester or manager
      return this.prisma.$transaction(async (tx) => {
        const updated = await this.requestsRepo.update(
          id,
          organizationId,
          {
            status: LeaveRequestStatus.CANCELLED,
            cancelledBy: actorUserId,
            cancelledAt: new Date(),
            cancellationReason: input.cancellationReason,
          },
          tx,
        );

        // Release pending balance
        const balanceRecord = await this.balancesRepo.findSpecificBalance(
          request.employeeId,
          request.leaveTypeId,
          leaveYear,
          organizationId,
          tx,
        );

        if (balanceRecord) {
          const newPending = Math.max(0, Number(balanceRecord.pending) - days);
          await this.balancesRepo.upsertBalance(
            {
              organizationId,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year: leaveYear,
              pending: newPending,
            },
            tx,
          );

          await this.balancesRepo.createHistory(
            {
              organizationId,
              leaveBalanceId: balanceRecord.id,
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              action: 'leave_cancelled',
              amount: days,
              previousBalance: Number(balanceRecord.pending),
              newBalance: newPending,
              reason: `Leave request cancelled: ${input.cancellationReason}`,
              referenceId: id,
              actorUserId,
            },
            tx,
          );
        }

        await this.auditService.log({
          organizationId,
          actorUserId,
          action: AuditAction.LEAVE_REQUEST_CANCEL,
          entityType: 'LeaveRequest',
          entityId: id,
          newValues: { status: LeaveRequestStatus.CANCELLED, reason: input.cancellationReason },
          ipAddress,
          userAgent,
        });

        return this.mapToDto(updated);
      });
    }

    if (request.status === LeaveRequestStatus.APPROVED) {
      // If approved, an employee creates a cancellation request (requires approval)
      // If an HR Admin / Super Admin is cancelling directly, we can process immediately
      if (isOwner) {
        const updated = await this.requestsRepo.update(id, organizationId, {
          status: LeaveRequestStatus.CANCEL_REQUESTED,
          cancellationReason: input.cancellationReason,
        });

        await this.auditService.log({
          organizationId,
          actorUserId,
          action: AuditAction.LEAVE_REQUEST_CANCEL,
          entityType: 'LeaveRequest',
          entityId: id,
          newValues: { status: LeaveRequestStatus.CANCEL_REQUESTED, reason: input.cancellationReason },
          ipAddress,
          userAgent,
        });

        return this.mapToDto(updated);
      } else {
        // Direct cancellation by admin/manager
        return this.prisma.$transaction(async (tx) => {
          const updated = await this.requestsRepo.update(
            id,
            organizationId,
            {
              status: LeaveRequestStatus.CANCELLED_AFTER_APPROVAL,
              cancelledBy: actorUserId,
              cancelledAt: new Date(),
              cancellationReason: input.cancellationReason,
            },
            tx,
          );

          // Revert used balance
          const balanceRecord = await this.balancesRepo.findSpecificBalance(
            request.employeeId,
            request.leaveTypeId,
            leaveYear,
            organizationId,
            tx,
          );

          if (balanceRecord) {
            const newUsed = Math.max(0, Number(balanceRecord.used) - days);
            await this.balancesRepo.upsertBalance(
              {
                organizationId,
                employeeId: request.employeeId,
                leaveTypeId: request.leaveTypeId,
                year: leaveYear,
                used: newUsed,
              },
              tx,
            );

            await this.balancesRepo.createHistory(
              {
                organizationId,
                leaveBalanceId: balanceRecord.id,
                employeeId: request.employeeId,
                leaveTypeId: request.leaveTypeId,
                action: 'leave_cancelled',
                amount: days,
                previousBalance: Number(balanceRecord.used),
                newBalance: newUsed,
                reason: `Leave cancelled after approval: ${input.cancellationReason}`,
                referenceId: id,
                actorUserId,
              },
              tx,
            );
          }

          await this.auditService.log({
            organizationId,
            actorUserId,
            action: AuditAction.LEAVE_REQUEST_CANCEL,
            entityType: 'LeaveRequest',
            entityId: id,
            newValues: { status: LeaveRequestStatus.CANCELLED_AFTER_APPROVAL, reason: input.cancellationReason },
            ipAddress,
            userAgent,
          });

          return this.mapToDto(updated);
        });
      }
    }

    throw new BadRequestException(`Cannot cancel request in status "${request.status}"`);
  }

  async getLeaveRequestById(id: string, organizationId: string): Promise<LeaveRequestDto> {
    const item = await this.requestsRepo.findById(id, organizationId);
    if (!item) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }
    return this.mapToDto(item);
  }

  async getMyLeaveRequests(
    userId: string,
    organizationId: string,
    filter: LeaveRequestQueryFilterInput,
  ) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    const result = await this.requestsRepo.list(organizationId, {
      ...filter,
      employeeId: employee.id,
    });

    return {
      ...result,
      data: result.data.map((item) => this.mapToDto(item)),
    };
  }

  async getTeamLeaveRequests(
    userId: string,
    organizationId: string,
    filter: LeaveRequestQueryFilterInput,
  ) {
    const manager = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!manager) {
      throw new NotFoundException('Manager profile not found for current user');
    }

    // Find direct reports
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
    if (filter.leaveTypeId) where.leaveTypeId = filter.leaveTypeId;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedOn: 'desc' },
        include: {
          leaveType: true,
          leavePolicy: true,
          employee: {
            include: {
              user: true,
              department: true,
              designation: true,
              location: true,
            },
          },
          coveringEmployee: {
            include: {
              user: true,
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

  async getAllLeaveRequests(
    organizationId: string,
    filter: LeaveRequestQueryFilterInput,
  ) {
    const result = await this.requestsRepo.list(organizationId, filter);
    return {
      ...result,
      data: result.data.map((item) => this.mapToDto(item)),
    };
  }

  private mapToDto(entity: any): LeaveRequestDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      employeeId: entity.employeeId,
      employeeName: entity.employee ? `${entity.employee.firstName} ${entity.employee.lastName}` : undefined,
      employeeCode: entity.employee?.employeeCode,
      departmentName: entity.employee?.department?.name,
      leaveTypeId: entity.leaveTypeId,
      leaveTypeName: entity.leaveType?.name,
      leaveTypeCode: entity.leaveType?.code,
      leaveTypeColor: entity.leaveType?.color,
      leavePolicyId: entity.leavePolicyId,
      fromDate: entity.fromDate instanceof Date ? entity.fromDate.toISOString() : entity.fromDate,
      toDate: entity.toDate instanceof Date ? entity.toDate.toISOString() : entity.toDate,
      numberOfDays: Number(entity.numberOfDays),
      durationType: entity.durationType as LeaveDurationType,
      halfDayType: entity.halfDayType,
      quarterDayType: entity.quarterDayType,
      startTime: entity.startTime,
      endTime: entity.endTime,
      reason: entity.reason,
      attachmentUrl: entity.attachmentUrl,
      coveringEmployeeId: entity.coveringEmployeeId,
      coveringEmployeeName: entity.coveringEmployee
        ? `${entity.coveringEmployee.firstName} ${entity.coveringEmployee.lastName}`
        : undefined,
      contactNumber: entity.contactNumber,
      status: entity.status as LeaveRequestStatus,
      approvalFlowId: entity.approvalFlowId,
      appliedOn: entity.appliedOn instanceof Date ? entity.appliedOn.toISOString() : entity.appliedOn,
      approvedBy: entity.approvedBy,
      approvedAt: entity.approvedAt instanceof Date ? entity.approvedAt.toISOString() : entity.approvedAt,
      rejectedBy: entity.rejectedBy,
      rejectedAt: entity.rejectedAt instanceof Date ? entity.rejectedAt.toISOString() : entity.rejectedAt,
      rejectionReason: entity.rejectionReason,
      cancelledBy: entity.cancelledBy,
      cancelledAt: entity.cancelledAt instanceof Date ? entity.cancelledAt.toISOString() : entity.cancelledAt,
      cancellationReason: entity.cancellationReason,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
    };
  }
}
