import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InterviewsRepository } from './interviews.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  InterviewStatus,
} from '@zentra/shared-types';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly repository: InterviewsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const interview = await this.repository.findById(id, organizationId);
    if (!interview) {
      throw new NotFoundException(`Interview '${id}' not found`);
    }
    return interview;
  }

  async schedule(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: data.jobApplicationId, organizationId, deletedAt: null },
      include: { candidate: true, jobOpening: true },
    });
    if (!application) {
      throw new NotFoundException(`Job application '${data.jobApplicationId}' not found`);
    }

    // Verify interviewer availability (double-booking check)
    const interviewDate = new Date(data.interviewDate);
    for (const interviewerId of data.interviewerIds || []) {
      const conflict = await this.repository.findInterviewerConflict(
        organizationId,
        interviewerId,
        interviewDate,
        data.startTime,
        data.endTime,
      );
      if (conflict) {
        throw new BadRequestException(
          `Interviewer '${interviewerId}' has a scheduling conflict during ${data.startTime} - ${data.endTime} on ${data.interviewDate}`,
        );
      }
    }

    const interview = await this.repository.create(
      organizationId,
      data,
      application.candidateId,
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.INTERVIEW_SCHEDULE,
      resource: 'Interview',
      resourceId: interview.id,
      details: {
        candidateId: application.candidateId,
        interviewType: interview.interviewType,
        interviewDate: data.interviewDate,
        startTime: data.startTime,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    // Notify candidate
    if (application.candidate.email) {
      await this.emailService.sendNotification(
        application.candidate.email,
        `Interview Scheduled: ${application.jobOpening.title} (${interview.interviewType})`,
        `Hello ${application.candidate.firstName}, your interview has been scheduled for ${data.interviewDate} at ${data.startTime} (${data.timezone}). Link: ${data.meetingLink || 'N/A'}.`,
      );
    }

    return interview;
  }

  async reschedule(
    id: string,
    organizationId: string,
    data: { interviewDate: string; startTime: string; endTime: string; reason: string },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const interview = await this.findById(id, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      interviewDate: data.interviewDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: InterviewStatus.RESCHEDULED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.INTERVIEW_RESCHEDULE,
      resource: 'Interview',
      resourceId: id,
      details: { newDate: data.interviewDate, newTime: data.startTime, reason: data.reason },
      ipAddress: ip,
      userAgent: ua,
    });

    if (interview.candidate?.email) {
      await this.emailService.sendNotification(
        interview.candidate.email,
        `Interview Rescheduled: ${interview.jobApplication?.jobOpening?.title}`,
        `Your interview has been rescheduled to ${data.interviewDate} at ${data.startTime}. Reason: ${data.reason}`,
      );
    }

    return updated;
  }

  async cancel(id: string, organizationId: string, reason?: string, userId?: string, ip?: string, ua?: string) {
    const interview = await this.findById(id, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      status: InterviewStatus.CANCELLED,
    });

    await this.auditService.log({
      organizationId,
      userId: userId || 'system',
      action: AuditAction.INTERVIEW_CANCEL,
      resource: 'Interview',
      resourceId: id,
      details: { reason },
      ipAddress: ip,
      userAgent: ua,
    });

    if (interview.candidate?.email) {
      await this.emailService.sendNotification(
        interview.candidate.email,
        `Interview Cancelled: ${interview.jobApplication?.jobOpening?.title}`,
        `Your scheduled interview on ${interview.interviewDate} has been cancelled.`,
      );
    }

    return updated;
  }

  async submitFeedback(
    id: string,
    organizationId: string,
    data: any,
    userId: string,
    userRoles: string[] = [],
    ip?: string,
    ua?: string,
  ) {
    const interview = await this.findById(id, organizationId);

    // Resolve current employee
    const currentEmployee = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });

    const isHrOrAdmin = userRoles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r));
    const interviewerId = currentEmployee?.id || data.interviewerId;

    if (!interviewerId) {
      throw new BadRequestException('No interviewer employee profile found');
    }

    // Verify interviewer assignment
    const assignedIds = (interview.interviewerIds as string[]) || [];
    if (!assignedIds.includes(interviewerId) && !isHrOrAdmin) {
      throw new ForbiddenException('Only assigned interviewers or HR administrators can submit feedback for this interview');
    }

    // Prevent duplicate feedback
    const existingFeedback = await this.repository.findFeedback(id, interviewerId);
    if (existingFeedback) {
      throw new BadRequestException('Feedback has already been submitted by this interviewer');
    }

    const feedback = await this.repository.createFeedback(organizationId, id, {
      ...data,
      interviewerId,
      candidateId: interview.candidateId,
      jobApplicationId: interview.jobApplicationId,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.INTERVIEW_FEEDBACK_SUBMIT,
      resource: 'InterviewFeedback',
      resourceId: feedback.id,
      details: { recommendation: feedback.recommendation, overallRating: feedback.overallRating },
      ipAddress: ip,
      userAgent: ua,
    });

    return feedback;
  }
}
