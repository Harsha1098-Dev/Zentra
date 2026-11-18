import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SalaryRevisionsRepository } from './salary-revisions.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  SalaryRevisionStatus,
  SalaryRevisionType,
} from '@zentra/shared-types';

@Injectable()
export class SalaryRevisionsService {
  constructor(
    private readonly repository: SalaryRevisionsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const revision = await this.repository.findById(id, organizationId);
    if (!revision) {
      throw new NotFoundException(`Salary revision '${id}' not found`);
    }
    return revision;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId, deletedAt: null },
      include: {
        salaryAssignments: {
          where: { status: 'ACTIVE' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee '${data.employeeId}' not found`);
    }

    const currentAssignment = employee.salaryAssignments[0];
    const currentSalaryStructureId = currentAssignment?.salaryStructureId || null;
    const currentAnnualCtc = currentAssignment?.annualCtc ?? 0;

    let targetStructureId = data.newSalaryStructureId || currentSalaryStructureId;
    if (data.newSalaryStructureId) {
      const struct = await this.prisma.salaryStructure.findFirst({
        where: { id: data.newSalaryStructureId, organizationId, status: 'ACTIVE', deletedAt: null },
      });
      if (!struct) {
        throw new BadRequestException('Target salary structure does not exist or is inactive');
      }
      targetStructureId = struct.id;
    }

    const revision = await this.repository.create(
      organizationId,
      {
        employeeId: employee.id,
        currentSalaryStructureId,
        newSalaryStructureId: targetStructureId,
        currentAnnualCtc,
        newAnnualCtc: data.newAnnualCtc,
        revisionType: data.revisionType || SalaryRevisionType.ANNUAL_INCREMENT,
        effectiveFrom: new Date(data.effectiveFrom),
        reason: data.reason,
        remarks: data.remarks || null,
        status: SalaryRevisionStatus.PENDING_APPROVAL,
      },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.SALARY_REVISION_CREATE,
      resource: 'salary_revisions',
      resourceId: revision.id,
      details: {
        employeeId: employee.id,
        currentAnnualCtc,
        newAnnualCtc: data.newAnnualCtc,
        revisionType: revision.revisionType,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return revision;
  }

  async update(
    id: string,
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findById(id, organizationId);
    return this.repository.update(id, organizationId, data);
  }

  async approve(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const revision = await this.findById(id, organizationId);
    if (revision.status !== SalaryRevisionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve salary revision in status '${revision.status}'`);
    }

    const employee = revision.employee;
    const effectiveDate = new Date(revision.effectiveFrom);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update salary revision status
      const updatedRevision = await tx.salaryRevision.update({
        where: { id },
        data: { status: SalaryRevisionStatus.APPROVED },
      });

      // 2. Find and supersede active salary assignment
      const activeAssignments = await tx.employeeSalaryAssignment.findMany({
        where: {
          organizationId,
          employeeId: employee.id,
          status: 'ACTIVE',
        },
      });

      const dayBefore = new Date(effectiveDate);
      dayBefore.setDate(dayBefore.getDate() - 1);

      for (const assignment of activeAssignments) {
        await tx.employeeSalaryAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'SUPERSEDED',
            effectiveTo: dayBefore,
          },
        });
      }

      // 3. Create new salary assignment if structure exists
      let structureId = revision.newSalaryStructureId || revision.currentSalaryStructureId;
      if (!structureId) {
        // Find default or first active salary structure in organization
        const defaultStruct = await tx.salaryStructure.findFirst({
          where: { organizationId, status: 'ACTIVE', deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
        structureId = defaultStruct?.id || null;
      }

      if (structureId) {
        const monthlyCtc = Math.round((revision.newAnnualCtc / 12) * 100) / 100;
        await tx.employeeSalaryAssignment.create({
          data: {
            organizationId,
            employeeId: employee.id,
            salaryStructureId: structureId,
            annualCtc: revision.newAnnualCtc,
            monthlyCtc,
            monthlyGross: monthlyCtc,
            effectiveFrom: effectiveDate,
            status: 'ACTIVE',
            revisionReason: `${revision.revisionType}: ${revision.reason}`,
            approvedBy: userId,
            approvedAt: new Date(),
            createdBy: userId,
          },
        });
      }

      // 4. Create history event
      const incrementPercent = revision.currentAnnualCtc > 0
        ? ((revision.newAnnualCtc - revision.currentAnnualCtc) / revision.currentAnnualCtc * 100).toFixed(1)
        : '0';

      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId: employee.id,
          eventType: 'COMPENSATION_CHANGE',
          effectiveFrom: effectiveDate,
          remarks: `Salary Revision: ${revision.revisionType} (${incrementPercent}% change). Reason: ${revision.reason}`,
          newValues: {
            salaryRevisionId: revision.id,
            revisionType: revision.revisionType,
            oldCtc: revision.currentAnnualCtc,
            newCtc: revision.newAnnualCtc,
            effectiveFrom: effectiveDate.toISOString(),
          },
          changedByUserId: userId,
        },
      });

      return updatedRevision;
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.SALARY_REVISION_APPROVE,
      resource: 'salary_revisions',
      resourceId: id,
      details: {
        employeeId: employee.id,
        newAnnualCtc: revision.newAnnualCtc,
        effectiveFrom: revision.effectiveFrom,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return result;
  }

  async reject(
    id: string,
    organizationId: string,
    comments: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const revision = await this.findById(id, organizationId);
    if (revision.status !== SalaryRevisionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot reject salary revision in status '${revision.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: SalaryRevisionStatus.REJECTED,
      remarks: comments,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.SALARY_REVISION_REJECT,
      resource: 'salary_revisions',
      resourceId: id,
      details: { comments },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async cancel(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const revision = await this.findById(id, organizationId);
    if (revision.status !== SalaryRevisionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot cancel salary revision in status '${revision.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: SalaryRevisionStatus.CANCELLED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.SALARY_REVISION_CANCEL,
      resource: 'salary_revisions',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
