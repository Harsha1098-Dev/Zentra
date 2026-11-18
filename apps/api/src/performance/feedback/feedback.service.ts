import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly repository: FeedbackRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters: any = {}, userId?: string, roles: string[] = []) {
    let currentEmployeeId: string | undefined;
    if (userId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) currentEmployeeId = emp.id;
    }

    if (roles.includes('EMPLOYEE') && !roles.includes('SUPER_ADMIN') && !roles.includes('HR_ADMIN') && !roles.includes('MANAGER')) {
      if (currentEmployeeId) {
        filters.employeeId = currentEmployeeId;
      }
    }

    const items = await this.repository.findAll(organizationId, filters);

    // Mask anonymity if requested by recipient
    return items.map((f: any) => {
      if (f.isAnonymous && f.employeeId === currentEmployeeId) {
        return {
          ...f,
          givenBy: 'ANONYMOUS',
          giver: null,
        };
      }
      return f;
    });
  }

  async findById(id: string, organizationId: string, userId?: string) {
    const feedback = await this.repository.findById(id, organizationId);
    if (!feedback) {
      throw new NotFoundException(`Feedback '${id}' not found`);
    }

    if (feedback.isAnonymous && userId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp && feedback.employeeId === emp.id) {
        return {
          ...feedback,
          givenBy: 'ANONYMOUS',
          giver: null,
        };
      }
    }

    return feedback;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    // Find current employee as giver
    let givenBy = data.givenBy;
    if (!givenBy) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (!emp) {
        throw new BadRequestException('No employee record found for user giving feedback');
      }
      givenBy = emp.id;
    }

    const feedback = await this.repository.create(organizationId, {
      ...data,
      givenBy,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.FEEDBACK_CREATE,
      resource: 'continuous_feedback',
      resourceId: feedback.id,
      details: {
        employeeId: feedback.employeeId,
        feedbackType: feedback.feedbackType,
        feedbackCategory: feedback.feedbackCategory,
        isAnonymous: feedback.isAnonymous,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return feedback;
  }

  async requestFeedback(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    let employeeId = data.employeeId;
    if (!employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) employeeId = emp.id;
    }

    const feedback = await this.repository.create(organizationId, {
      employeeId,
      givenBy: data.requestedFromId,
      feedbackType: 'CONSTRUCTIVE',
      feedbackCategory: data.feedbackCategory || 'QUALITY_OF_WORK',
      feedback: `Pending feedback request: ${data.requestReason}`,
      status: 'REQUESTED',
      requestReason: data.requestReason,
      requestedBy: userId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.FEEDBACK_REQUEST,
      resource: 'continuous_feedback',
      resourceId: feedback.id,
      details: { requestedFromId: data.requestedFromId, reason: data.requestReason },
      ipAddress: ip,
      userAgent: ua,
    });

    return feedback;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.FEEDBACK_UPDATE,
      resource: 'continuous_feedback',
      resourceId: id,
      details: data,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
