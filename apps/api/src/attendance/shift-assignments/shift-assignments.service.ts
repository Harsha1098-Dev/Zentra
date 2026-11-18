import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ShiftAssignmentsRepository } from './shift-assignments.repository';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { EmployeesRepository } from '../../employees/employees.repository';
import { AuditService } from '../../audit/audit.service';
import {
  CreateShiftAssignmentInput,
  UpdateShiftAssignmentInput,
  AuditAction,
} from '@zentra/shared-types';

@Injectable()
export class ShiftAssignmentsService {
  constructor(
    private readonly repo: ShiftAssignmentsRepository,
    private readonly shiftsRepo: ShiftsRepository,
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(organizationId: string, input: CreateShiftAssignmentInput, userId: string, ipAddress?: string) {
    const employee = await this.employeesRepo.findById(input.employeeId, organizationId);
    if (!employee) {
      throw new NotFoundException(`Employee not found`);
    }

    const shift = await this.shiftsRepo.findById(organizationId, input.shiftId);
    if (!shift) {
      throw new NotFoundException(`Shift not found`);
    }

    const startDate = new Date(input.startDate || input.effectiveFrom || Date.now());
    const endDate = (input.endDate || input.effectiveTo) ? new Date(input.endDate || input.effectiveTo!) : null;

    if (endDate && startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    if (!input.isOverride) {
      const overlaps = await this.repo.findOverlaps(organizationId, input.employeeId, startDate, endDate);
      if (overlaps.length > 0) {
        throw new ConflictException('Shift assignment overlaps with an existing assignment for this employee. Set isOverride=true if overriding.');
      }
    }

    const assignment = await this.repo.create(organizationId, input);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SHIFT_ASSIGNED,
      entityType: 'shift_assignment',
      entityId: assignment.id,
      newValues: {
        employeeId: input.employeeId,
        shiftId: input.shiftId,
        startDate: input.startDate,
        endDate: input.endDate,
        isOverride: input.isOverride,
      },
      ipAddress,
    });

    return assignment;
  }

  async findById(organizationId: string, id: string) {
    const assignment = await this.repo.findById(organizationId, id);
    if (!assignment) {
      throw new NotFoundException('Shift assignment not found');
    }
    return assignment;
  }

  async findActiveAssignment(organizationId: string, employeeId: string, date: Date) {
    return this.repo.findActiveAssignment(organizationId, employeeId, date);
  }

  async findAll(organizationId: string, employeeId?: string, rosterId?: string) {
    return this.repo.findAll(organizationId, employeeId, rosterId);
  }

  async update(organizationId: string, id: string, input: UpdateShiftAssignmentInput, userId: string, ipAddress?: string) {
    const existing = await this.findById(organizationId, id);

    const startDate = input.startDate ? new Date(input.startDate) : existing.startDate;
    const endDate = input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : existing.endDate;

    if (endDate && startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    if (!input.isOverride && !existing.isOverride) {
      const overlaps = await this.repo.findOverlaps(organizationId, existing.employeeId, startDate, endDate, id);
      if (overlaps.length > 0) {
        throw new ConflictException('Shift assignment overlaps with an existing assignment for this employee');
      }
    }

    const updated = await this.repo.update(organizationId, id, input);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SHIFT_ASSIGN_UPDATED,
      entityType: 'shift_assignment',
      entityId: updated.id,
      newValues: { employeeId: updated.employeeId, shiftId: updated.shiftId },
      ipAddress,
    });

    return updated;
  }

  async delete(organizationId: string, id: string, userId: string, ipAddress?: string) {
    const existing = await this.findById(organizationId, id);

    const deleted = await this.repo.delete(organizationId, id);

    await this.auditService.log({
      organizationId,
      actorUserId: userId,
      action: AuditAction.SHIFT_ASSIGN_DELETED,
      entityType: 'shift_assignment',
      entityId: id,
      newValues: { employeeId: existing.employeeId, shiftId: existing.shiftId },
      ipAddress,
    });

    return deleted;
  }
}
