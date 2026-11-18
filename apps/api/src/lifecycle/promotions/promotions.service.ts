import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PromotionsRepository } from './promotions.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { AuditAction, TransitionStatus, TransitionType } from '@zentra/shared-types';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly repository: PromotionsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const promotion = await this.repository.findById(id, organizationId);
    if (!promotion) {
      throw new NotFoundException(`Promotion request '${id}' not found`);
    }
    return promotion;
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

    // Validate new designation if provided
    if (data.newDesignationId) {
      const desig = await this.prisma.designation.findFirst({
        where: { id: data.newDesignationId, organizationId, status: 'ACTIVE', deletedAt: null },
      });
      if (!desig) {
        throw new BadRequestException('Target designation does not exist or is inactive');
      }
    }

    // Validate new grade if provided
    if (data.newGradeId) {
      const grade = await this.prisma.grade.findFirst({
        where: { id: data.newGradeId, organizationId, status: 'ACTIVE', deletedAt: null },
      });
      if (!grade) {
        throw new BadRequestException('Target grade does not exist or is inactive');
      }
    }

    // Validate new salary structure if provided
    if (data.newSalaryStructureId) {
      const struct = await this.prisma.salaryStructure.findFirst({
        where: { id: data.newSalaryStructureId, organizationId, status: 'ACTIVE', deletedAt: null },
      });
      if (!struct) {
        throw new BadRequestException('Target salary structure does not exist or is inactive');
      }
    }

    const promotion = await this.repository.create(
      organizationId,
      {
        employeeId: employee.id,
        effectiveFrom: new Date(data.effectiveFrom),
        currentDepartmentId: employee.departmentId,
        newDepartmentId: employee.departmentId,
        currentDesignationId: employee.designationId,
        newDesignationId: data.newDesignationId || employee.designationId,
        currentLocationId: employee.locationId,
        newLocationId: employee.locationId,
        currentGradeId: employee.gradeId,
        newGradeId: data.newGradeId || employee.gradeId,
        currentReportingManagerId: employee.reportingManagerId,
        newReportingManagerId: employee.reportingManagerId,
        reason: data.reason,
        remarks: data.remarks ? JSON.stringify({
          notes: data.remarks,
          newSalaryStructureId: data.newSalaryStructureId,
          newAnnualCtc: data.newAnnualCtc,
        }) : JSON.stringify({
          newSalaryStructureId: data.newSalaryStructureId,
          newAnnualCtc: data.newAnnualCtc,
        }),
        status: TransitionStatus.PENDING_APPROVAL,
      },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROMOTION_CREATE,
      resource: 'employee_transitions',
      resourceId: promotion.id,
      details: { employeeId: employee.id, newDesignationId: data.newDesignationId },
      ipAddress: ip,
      userAgent: ua,
    });

    return promotion;
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
    const promotion = await this.findById(id, organizationId);
    if (promotion.status !== TransitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve promotion in status '${promotion.status}'`);
    }

    const employee = promotion.employee;

    let meta: any = {};
    try {
      meta = promotion.remarks ? JSON.parse(promotion.remarks) : {};
    } catch {
      meta = {};
    }

    const previousValues = {
      designationId: employee.designationId,
      gradeId: employee.gradeId,
    };

    const newValues = {
      designationId: promotion.newDesignationId || employee.designationId,
      gradeId: promotion.newGradeId || employee.gradeId,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update promotion transition status
      const updatedPromotion = await tx.employeeTransition.update({
        where: { id },
        data: { status: TransitionStatus.APPROVED },
      });

      // 2. Update employee designation and grade
      await tx.employee.update({
        where: { id: employee.id },
        data: newValues,
      });

      // 3. Create Employment History
      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId: employee.id,
          eventType: 'PROMOTED',
          effectiveFrom: promotion.effectiveFrom,
          departmentId: employee.departmentId,
          designationId: newValues.designationId,
          locationId: employee.locationId,
          gradeId: newValues.gradeId,
          remarks: promotion.reason,
          previousValues,
          newValues,
          changedByUserId: userId,
        },
      });

      // 4. If salary structure / CTC is linked, create new salary assignment
      if (meta.newSalaryStructureId && meta.newAnnualCtc) {
        const annualCtc = Number(meta.newAnnualCtc);
        const monthlyCtc = Number((annualCtc / 12).toFixed(2));
        const monthlyGross = monthlyCtc; // base gross approximation

        // Mark previous active assignment as superseded
        await tx.employeeSalaryAssignment.updateMany({
          where: {
            organizationId,
            employeeId: employee.id,
            status: 'ACTIVE',
          },
          data: { status: 'SUPERSEDED' },
        });

        await tx.employeeSalaryAssignment.create({
          data: {
            organizationId,
            employeeId: employee.id,
            salaryStructureId: meta.newSalaryStructureId,
            annualCtc,
            monthlyCtc,
            monthlyGross,
            effectiveFrom: promotion.effectiveFrom,
            status: 'ACTIVE',
            revisionReason: `Promoted: ${promotion.reason}`,
            approvedBy: userId,
            approvedAt: new Date(),
            createdBy: userId,
          },
        });
      }

      return updatedPromotion;
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROMOTION_APPROVE,
      resource: 'employee_transitions',
      resourceId: id,
      details: { previousValues, newValues },
      ipAddress: ip,
      userAgent: ua,
    });

    // Notify employee
    if (employee.workEmail) {
      await this.emailService.sendNotification(
        employee.workEmail,
        'Congratulations on Your Promotion!',
        `Dear ${employee.firstName},\n\nWe are delighted to share that your promotion has been officially approved!`,
      );
    }

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
    const promotion = await this.findById(id, organizationId);
    if (promotion.status !== TransitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot reject promotion in status '${promotion.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: TransitionStatus.REJECTED,
      remarks: comments,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROMOTION_REJECT,
      resource: 'employee_transitions',
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
    const promotion = await this.findById(id, organizationId);
    if (promotion.status !== TransitionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot cancel promotion in status '${promotion.status}'`);
    }

    const updated = await this.repository.update(id, organizationId, {
      status: TransitionStatus.CANCELLED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROMOTION_CANCEL,
      resource: 'employee_transitions',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
