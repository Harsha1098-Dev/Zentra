import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayrollInputsRepository } from './payroll-inputs.repository';
import { PayrollExceptionsRepository } from '../payroll-exceptions/payroll-exceptions.repository';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  PayrollInputType,
  PayrollRunStatus,
} from '@zentra/shared-types';

@Injectable()
export class PayrollInputsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PayrollInputsRepository,
    private readonly exceptionsRepo: PayrollExceptionsRepository,
    private readonly auditService: AuditService,
  ) { }

  async findByRun(payrollRunId: string, organizationId: string) {
    return this.repo.findByRun(payrollRunId, organizationId);
  }

  async createManualInput(
    payrollRunId: string,
    organizationId: string,
    input: any,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
    });
    if (!run) {
      throw new NotFoundException(`Payroll run '${payrollRunId}' not found`);
    }

    if ([PayrollRunStatus.APPROVED, PayrollRunStatus.PAID, PayrollRunStatus.LOCKED].includes(run.status as any)) {
      throw new BadRequestException(`Cannot add inputs to a payroll run with status '${run.status}'`);
    }

    const created = await this.repo.create(organizationId, {
      ...input,
      payrollRunId,
      source: 'MANUAL',
      isApproved: true,
      approvedBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_INPUT_CREATE,
      entityType: 'PayrollInput',
      entityId: created.id,
      newValues: created,
      ipAddress,
    });

    return created;
  }

  async updateManualInput(
    id: string,
    payrollRunId: string,
    organizationId: string,
    input: any,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');

    if ([PayrollRunStatus.APPROVED, PayrollRunStatus.PAID, PayrollRunStatus.LOCKED].includes(run.status as any)) {
      throw new BadRequestException('Cannot edit inputs of approved or locked payroll run');
    }

    const existing = await this.repo.findById(id, organizationId);
    if (!existing || existing.payrollRunId !== payrollRunId) {
      throw new NotFoundException('Payroll input not found');
    }

    const updated = await this.repo.update(id, organizationId, input);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_INPUT_UPDATE,
      entityType: 'PayrollInput',
      entityId: id,
      prevValues: existing,
      newValues: updated,
      ipAddress,
    });

    return updated;
  }

  async deleteManualInput(
    id: string,
    payrollRunId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');

    if ([PayrollRunStatus.APPROVED, PayrollRunStatus.PAID, PayrollRunStatus.LOCKED].includes(run.status as any)) {
      throw new BadRequestException('Cannot delete inputs of approved or locked payroll run');
    }

    const existing = await this.repo.findById(id, organizationId);
    if (!existing || existing.payrollRunId !== payrollRunId) {
      throw new NotFoundException('Payroll input not found');
    }

    await this.repo.delete(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYROLL_INPUT_DELETE,
      entityType: 'PayrollInput',
      entityId: id,
      prevValues: existing,
      ipAddress,
    });

    return { success: true, message: 'Payroll input deleted' };
  }

  /**
   * Imports approved attendance and leave records, populates payroll inputs, and detects exceptions.
   */
  async importAttendanceAndLeave(
    payrollRunId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
      include: { payrollPeriod: true },
    });
    if (!run) throw new NotFoundException('Payroll run not found');

    if ([PayrollRunStatus.APPROVED, PayrollRunStatus.PAID, PayrollRunStatus.LOCKED].includes(run.status as any)) {
      throw new BadRequestException('Cannot re-import inputs for approved or locked payroll run');
    }

    const { periodStartDate, periodEndDate } = run.payrollPeriod;

    // Fetch all employees in organization
    const employees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        bankDetail: true,
        salaryAssignments: {
          where: { status: 'ACTIVE' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    // Clear old auto-synced inputs and old exceptions
    await this.repo.deleteAutoSyncedInputs(payrollRunId, organizationId);
    await this.exceptionsRepo.clearExceptions(payrollRunId, organizationId);

    const inputsToCreate: any[] = [];
    const exceptionsToCreate: any[] = [];

    // Bank accounts tracking to detect duplicates
    const accountNumbersSeen: Record<string, string[]> = {};

    for (const emp of employees) {
      // 1. Eligibility Check:
      // Exclude employees who joined after period end date
      if (new Date(emp.dateOfJoining) > new Date(periodEndDate)) {
        continue;
      }
      // Exclude employees who exited before period start date
      if (emp.dateOfExit && new Date(emp.dateOfExit) < new Date(periodStartDate)) {
        continue;
      }

      // Check exceptions:
      // A. Missing salary structure
      if (!emp.salaryAssignments || emp.salaryAssignments.length === 0) {
        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'MISSING_SALARY_STRUCTURE',
          severity: 'CRITICAL',
          message: `Employee ${emp.firstName} ${emp.lastName} (${emp.employeeCode}) has no active salary structure assigned.`,
        });
      }

      // B. Missing bank details
      if (!emp.bankDetail || !emp.bankDetail.accountNumber) {
        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'MISSING_BANK_ACCOUNT',
          severity: 'WARNING',
          message: `Employee ${emp.firstName} ${emp.lastName} (${emp.employeeCode}) has no bank account configured.`,
        });
      } else {
        const acc = emp.bankDetail.accountNumber;
        if (!accountNumbersSeen[acc]) {
          accountNumbersSeen[acc] = [emp.employeeCode];
        } else {
          accountNumbersSeen[acc].push(emp.employeeCode);
        }
      }

      // C. Missing PAN
      if (!emp.bankDetail || !emp.bankDetail.panNumber) {
        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'MISSING_PAN',
          severity: 'INFO',
          message: `Employee ${emp.firstName} ${emp.lastName} has no PAN registered.`,
        });
      }

      // D. Joined or Exited mid-period
      if (
        new Date(emp.dateOfJoining) >= new Date(periodStartDate) &&
        new Date(emp.dateOfJoining) <= new Date(periodEndDate)
      ) {
        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'JOINED_MID_PERIOD',
          severity: 'INFO',
          message: `Employee joined on ${new Date(emp.dateOfJoining).toLocaleDateString()}. Salary will be prorated.`,
        });
      }

      if (
        emp.dateOfExit &&
        new Date(emp.dateOfExit) >= new Date(periodStartDate) &&
        new Date(emp.dateOfExit) <= new Date(periodEndDate)
      ) {
        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'EXITED_MID_PERIOD',
          severity: 'WARNING',
          message: `Employee exited on ${new Date(emp.dateOfExit).toLocaleDateString()}. Final settlement required.`,
        });
      }

      // 2. Fetch approved attendance records
      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          organizationId,
          employeeId: emp.id,
          attendanceDate: {
            gte: new Date(periodStartDate),
            lte: new Date(periodEndDate),
          },
        },
      });

      const totalOvertimeMinutes = attendanceRecords.reduce(
        (acc, r) => acc + (r.approvedOvertimeMinutes || 0),
        0,
      );

      // Check unapproved regularisations
      const unapprovedRegCount = await this.prisma.attendanceRegularisation.count({
        where: {
          organizationId,
          employeeId: emp.id,
          status: 'PENDING_APPROVAL',
        },
      });
      if (unapprovedRegCount > 0) {
        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'UNAPPROVED_ATTENDANCE',
          severity: 'WARNING',
          message: `Employee has ${unapprovedRegCount} unapproved attendance regularisation(s).`,
        });
      }

      // 3. Fetch approved leave requests
      const approvedLeaves = await this.prisma.leaveRequest.findMany({
        where: {
          organizationId,
          employeeId: emp.id,
          status: 'APPROVED',
          fromDate: { lte: new Date(periodEndDate) },
          toDate: { gte: new Date(periodStartDate) },
        },
        include: { leaveType: true },
      });

      let unpaidLeaveDays = 0;
      let paidLeaveDays = 0;

      for (const leave of approvedLeaves) {
        const days = Number(leave.numberOfDays || 0);
        if (leave.leaveType?.isPaid === false) {
          unpaidLeaveDays += days;
        } else {
          paidLeaveDays += days;
        }
      }

      // Check pending leave requests
      const pendingLeaveCount = await this.prisma.leaveRequest.count({
        where: {
          organizationId,
          employeeId: emp.id,
          status: 'PENDING',
          fromDate: { lte: new Date(periodEndDate) },
          toDate: { gte: new Date(periodStartDate) },
        },
      });
      if (pendingLeaveCount > 0) {
        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'PENDING_LEAVE',
          severity: 'WARNING',
          message: `Employee has ${pendingLeaveCount} pending leave request(s) during this period.`,
        });
      }

      // If LOP days exist, create input and warning exception
      if (unpaidLeaveDays > 0) {
        inputsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          inputType: PayrollInputType.LOP,
          amount: 0,
          units: unpaidLeaveDays,
          description: `Loss of Pay (Unpaid Leave) - ${unpaidLeaveDays} days`,
          reason: 'System imported from approved unpaid leave requests',
          source: 'AUTO_SYNC',
          isApproved: true,
          approvedBy: userId,
        });

        exceptionsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          exceptionCode: 'LOP_PRESENT',
          severity: 'INFO',
          message: `Employee has ${unpaidLeaveDays} LOP day(s) imported from leave.`,
        });
      }

      // If Overtime exists, create input
      if (totalOvertimeMinutes > 0) {
        inputsToCreate.push({
          organizationId,
          payrollRunId,
          employeeId: emp.id,
          inputType: PayrollInputType.OVERTIME,
          amount: 0,
          units: totalOvertimeMinutes,
          description: `Approved overtime - ${totalOvertimeMinutes} minutes`,
          reason: 'System imported from approved attendance records',
          source: 'AUTO_SYNC',
          isApproved: true,
          approvedBy: userId,
        });
      }
    }

    // Check duplicate bank accounts
    for (const [acc, emps] of Object.entries(accountNumbersSeen)) {
      if (emps.length > 1) {
        for (const empCode of emps) {
          const emp = employees.find((e) => e.employeeCode === empCode);
          if (emp) {
            exceptionsToCreate.push({
              organizationId,
              payrollRunId,
              employeeId: emp.id,
              exceptionCode: 'DUPLICATE_BANK_ACCOUNT',
              severity: 'WARNING',
              message: `Bank account ending in ${acc.slice(-4)} is shared with employee(s): ${emps.filter((c) => c !== empCode).join(', ')}`,
            });
          }
        }
      }
    }

    // Persist inputs and exceptions
    await this.repo.bulkCreate(inputsToCreate);
    await this.exceptionsRepo.bulkCreate(exceptionsToCreate);

    // Update payroll run status to PENDING_INPUTS if DRAFT
    if (run.status === PayrollRunStatus.DRAFT) {
      await this.prisma.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: PayrollRunStatus.PENDING_INPUTS },
      });
    }

    return {
      success: true,
      importedInputsCount: inputsToCreate.length,
      flaggedExceptionsCount: exceptionsToCreate.length,
    };
  }
}

