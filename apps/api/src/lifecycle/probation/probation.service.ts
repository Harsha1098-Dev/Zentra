import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProbationRepository } from './probation.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { AuditAction, ProbationStatus, ProbationRecommendation } from '@zentra/shared-types';

@Injectable()
export class ProbationService {
  constructor(
    private readonly repository: ProbationRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: { status?: string; employeeId?: string } = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const review = await this.repository.findById(id, organizationId);
    if (!review) {
      throw new NotFoundException(`Probation review '${id}' not found`);
    }
    return review;
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
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${data.employeeId}' not found`);
    }

    const review = await this.repository.create(
      organizationId,
      {
        employeeId: employee.id,
        probationStartDate: new Date(data.probationStartDate),
        probationEndDate: new Date(data.probationEndDate),
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
        managerId: data.managerId || employee.reportingManagerId,
        managerRating: data.managerRating,
        managerComments: data.managerComments,
        employeeComments: data.employeeComments,
        recommendation: data.recommendation || ProbationRecommendation.CONFIRM,
        status: ProbationStatus.PENDING_REVIEW,
      },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROBATION_REVIEW_CREATE,
      resource: 'probation_reviews',
      resourceId: review.id,
      details: { employeeId: employee.id },
      ipAddress: ip,
      userAgent: ua,
    });

    return review;
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
    const updated = await this.repository.update(id, organizationId, data);
    return updated;
  }

  async submitReview(
    id: string,
    organizationId: string,
    data: {
      managerRating: number;
      managerComments: string;
      employeeComments?: string | null;
      recommendation: ProbationRecommendation;
    },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const review = await this.findById(id, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      managerRating: data.managerRating,
      managerComments: data.managerComments,
      employeeComments: data.employeeComments,
      recommendation: data.recommendation,
      status: ProbationStatus.SUBMITTED,
      reviewDate: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROBATION_REVIEW_SUBMIT,
      resource: 'probation_reviews',
      resourceId: id,
      details: { rating: data.managerRating, recommendation: data.recommendation },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async approveReview(
    id: string,
    organizationId: string,
    data: {
      action: 'CONFIRM' | 'EXTEND' | 'TERMINATE';
      extensionDate?: string | null;
      comments?: string | null;
    },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const review = await this.findById(id, organizationId);
    const employee = review.employee;

    return this.prisma.$transaction(async (tx) => {
      let finalStatus = ProbationStatus.CONFIRMED;

      if (data.action === 'CONFIRM') {
        finalStatus = ProbationStatus.CONFIRMED;

        // Update employee status to ACTIVE
        await tx.employee.update({
          where: { id: employee.id },
          data: { status: 'ACTIVE' },
        });

        // Record Employment History
        await tx.employmentHistory.create({
          data: {
            organizationId,
            employeeId: employee.id,
            eventType: 'PROBATION_CONFIRMED',
            effectiveFrom: new Date(),
            employeeStatus: 'ACTIVE',
            remarks: data.comments || 'Probation successfully confirmed',
            changedByUserId: userId,
          },
        });

        await this.auditService.log({
          organizationId,
          userId,
          action: AuditAction.PROBATION_APPROVE,
          resource: 'probation_reviews',
          resourceId: id,
          details: { action: 'CONFIRM', comments: data.comments },
          ipAddress: ip,
          userAgent: ua,
        });

        if (employee.workEmail) {
          await this.emailService.sendNotification(
            employee.workEmail,
            'Congratulations on Your Probation Confirmation!',
            `Dear ${employee.firstName},\n\nWe are pleased to inform you that your probation period at Zentra has been successfully confirmed.`,
          );
        }
      } else if (data.action === 'EXTEND') {
        finalStatus = ProbationStatus.EXTENDED;
        if (!data.extensionDate) {
          throw new BadRequestException('Extension date is required to extend probation');
        }

        const newEndDate = new Date(data.extensionDate);
        await tx.employee.update({
          where: { id: employee.id },
          data: { probationEndDate: newEndDate },
        });

        await tx.employmentHistory.create({
          data: {
            organizationId,
            employeeId: employee.id,
            eventType: 'PROBATION_EXTENDED',
            effectiveFrom: new Date(),
            remarks: data.comments || `Probation extended to ${data.extensionDate}`,
            changedByUserId: userId,
          },
        });

        await this.auditService.log({
          organizationId,
          userId,
          action: AuditAction.PROBATION_EXTEND,
          resource: 'probation_reviews',
          resourceId: id,
          details: { action: 'EXTEND', newEndDate: data.extensionDate },
          ipAddress: ip,
          userAgent: ua,
        });
      } else if (data.action === 'TERMINATE') {
        finalStatus = ProbationStatus.TERMINATED;

        await tx.employee.update({
          where: { id: employee.id },
          data: {
            status: 'TERMINATED',
            dateOfExit: new Date(),
            exitReason: data.comments || 'Unsuccessful probation review',
          },
        });

        await tx.employmentHistory.create({
          data: {
            organizationId,
            employeeId: employee.id,
            eventType: 'TERMINATED',
            effectiveFrom: new Date(),
            employeeStatus: 'TERMINATED',
            remarks: data.comments || 'Employment terminated due to probation review',
            changedByUserId: userId,
          },
        });

        await this.auditService.log({
          organizationId,
          userId,
          action: AuditAction.PROBATION_REJECT,
          resource: 'probation_reviews',
          resourceId: id,
          details: { action: 'TERMINATE', comments: data.comments },
          ipAddress: ip,
          userAgent: ua,
        });
      }

      return tx.probationReview.update({
        where: { id },
        data: {
          status: finalStatus,
          managerComments: data.comments ? `${review.managerComments || ''}\n[HR Decision]: ${data.comments}` : review.managerComments,
        },
        include: { employee: true },
      });
    });
  }

  async rejectReview(
    id: string,
    organizationId: string,
    comments: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      status: ProbationStatus.REJECTED,
      managerComments: comments,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PROBATION_REJECT,
      resource: 'probation_reviews',
      resourceId: id,
      details: { comments },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
