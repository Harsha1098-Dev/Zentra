import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AppraisalsRepository } from './appraisals.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class AppraisalsService {
  constructor(
    private readonly repository: AppraisalsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // --- Templates ---

  async findAllTemplates(organizationId: string) {
    return this.repository.findAllTemplates(organizationId);
  }

  async findTemplateById(id: string, organizationId: string) {
    const template = await this.repository.findTemplateById(id, organizationId);
    if (!template) {
      throw new NotFoundException(`Appraisal template '${id}' not found`);
    }
    return template;
  }

  async createTemplate(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const template = await this.repository.createTemplate(organizationId, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_TEMPLATE_CREATE,
      resource: 'appraisal_templates',
      resourceId: template.id,
      details: { name: template.name, appraisalType: template.appraisalType },
      ipAddress: ip,
      userAgent: ua,
    });

    return template;
  }

  async updateTemplate(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findTemplateById(id, organizationId);
    const updated = await this.repository.updateTemplate(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_TEMPLATE_UPDATE,
      resource: 'appraisal_templates',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async deleteTemplate(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findTemplateById(id, organizationId);
    const deleted = await this.repository.softDeleteTemplate(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_TEMPLATE_DELETE,
      resource: 'appraisal_templates',
      resourceId: id,
      details: { deleted: true },
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  // --- Rating Scales ---

  async findAllRatingScales(organizationId: string) {
    return this.repository.findAllRatingScales(organizationId);
  }

  async findRatingScaleById(id: string, organizationId: string) {
    const scale = await this.repository.findRatingScaleById(id, organizationId);
    if (!scale) {
      throw new NotFoundException(`Rating scale '${id}' not found`);
    }
    return scale;
  }

  async createRatingScale(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const scale = await this.repository.createRatingScale(organizationId, data, userId);
    return scale;
  }

  async updateRatingScale(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findRatingScaleById(id, organizationId);
    return this.repository.updateRatingScale(id, organizationId, data);
  }

  // --- Assignments ---

  async findAllAssignments(organizationId: string, filters: any = {}, userId?: string, roles: string[] = []) {
    if (roles.includes('EMPLOYEE') && !roles.includes('SUPER_ADMIN') && !roles.includes('HR_ADMIN') && !roles.includes('MANAGER')) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) filters.employeeId = emp.id;
    }
    return this.repository.findAllAssignments(organizationId, filters);
  }

  async findAssignmentById(id: string, organizationId: string) {
    const assignment = await this.repository.findAssignmentById(id, organizationId);
    if (!assignment) {
      throw new NotFoundException(`Appraisal assignment '${id}' not found`);
    }
    return assignment;
  }

  async createAssignment(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.prisma.appraisalAssignment.findUnique({
      where: {
        performanceCycleId_employeeId: {
          performanceCycleId: data.performanceCycleId,
          employeeId: data.employeeId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Appraisal assignment already exists for this employee in this cycle');
    }

    const assignment = await this.repository.createAssignment(organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_ASSIGNMENT_CREATE,
      resource: 'appraisal_assignments',
      resourceId: assignment.id,
      details: {
        performanceCycleId: assignment.performanceCycleId,
        employeeId: assignment.employeeId,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return assignment;
  }

  async updateAssignment(id: string, organizationId: string, data: any) {
    return this.repository.updateAssignment(id, organizationId, data);
  }

  async submitSelfReview(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const assignment = await this.findAssignmentById(id, organizationId);

    return this.prisma.$transaction(async (tx) => {
      // Record responses
      if (Array.isArray(data.responses)) {
        for (const resp of data.responses) {
          await tx.reviewResponse.create({
            data: {
              organizationId,
              appraisalAssignmentId: id,
              reviewerId: assignment.employeeId,
              reviewerType: 'EMPLOYEE',
              reviewType: 'SELF',
              section: resp.section,
              question: resp.question,
              response: resp.response,
              rating: resp.rating || null,
              comments: resp.comments || null,
            },
          });
        }
      }

      const updated = await tx.appraisalAssignment.update({
        where: { id },
        data: {
          selfReviewStatus: 'SUBMITTED',
          status: 'IN_PROGRESS',
        },
      });

      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.SELF_REVIEW_SUBMIT,
        resource: 'appraisal_assignments',
        resourceId: id,
        details: { responsesCount: data.responses?.length || 0 },
        ipAddress: ip,
        userAgent: ua,
      });

      return updated;
    });
  }

  async submitManagerReview(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const assignment = await this.findAssignmentById(id, organizationId);

    return this.prisma.$transaction(async (tx) => {
      // Record manager responses
      if (Array.isArray(data.responses)) {
        for (const resp of data.responses) {
          await tx.reviewResponse.create({
            data: {
              organizationId,
              appraisalAssignmentId: id,
              reviewerId: assignment.reportingManagerId || userId,
              reviewerType: 'MANAGER',
              reviewType: 'MANAGER',
              section: resp.section,
              question: resp.question,
              response: resp.response,
              rating: resp.rating || null,
              comments: resp.comments || null,
            },
          });
        }
      }

      const updated = await tx.appraisalAssignment.update({
        where: { id },
        data: {
          managerReviewStatus: 'SUBMITTED',
          status: 'PENDING_APPROVAL',
          finalRating: data.finalRating,
          finalComments: data.finalComments || null,
          promotionRecommended: data.promotionRecommended ?? false,
          incrementRecommended: data.incrementRecommended ?? false,
        },
      });

      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.MANAGER_REVIEW_SUBMIT,
        resource: 'appraisal_assignments',
        resourceId: id,
        details: {
          finalRating: data.finalRating,
          promotionRecommended: data.promotionRecommended,
          incrementRecommended: data.incrementRecommended,
        },
        ipAddress: ip,
        userAgent: ua,
      });

      return updated;
    });
  }

  async approveAssignment(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findAssignmentById(id, organizationId);

    const updated = await this.repository.updateAssignment(id, organizationId, {
      status: 'APPROVED',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_APPROVE,
      resource: 'appraisal_assignments',
      resourceId: id,
      details: { status: 'APPROVED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async rejectAssignment(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findAssignmentById(id, organizationId);

    const updated = await this.repository.updateAssignment(id, organizationId, {
      status: 'REJECTED',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_REJECT,
      resource: 'appraisal_assignments',
      resourceId: id,
      details: { status: 'REJECTED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async publishAssignment(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findAssignmentById(id, organizationId);

    const updated = await this.repository.updateAssignment(id, organizationId, {
      status: 'PUBLISHED',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_PUBLISH,
      resource: 'appraisal_assignments',
      resourceId: id,
      details: { status: 'PUBLISHED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async acknowledgeAssignment(id: string, organizationId: string, comments: string, userId: string, ip?: string, ua?: string) {
    await this.findAssignmentById(id, organizationId);

    const updated = await this.repository.updateAssignment(id, organizationId, {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      acknowledgementComments: comments || null,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPRAISAL_ACKNOWLEDGE,
      resource: 'appraisal_assignments',
      resourceId: id,
      details: { status: 'ACKNOWLEDGED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
