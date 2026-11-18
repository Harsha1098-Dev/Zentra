import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  ApplicationStatus,
  CandidateStatus,
  StageType,
} from '@zentra/shared-types';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const app = await this.repository.findById(id, organizationId);
    if (!app) {
      throw new NotFoundException(`Application '${id}' not found`);
    }
    return app;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    // 1. Duplicate check
    const existingActive = await this.repository.findActiveApplication(
      data.jobOpeningId,
      data.candidateId,
      organizationId,
    );
    if (existingActive) {
      throw new BadRequestException(
        'An active application already exists for this candidate on the specified job opening',
      );
    }

    // 2. Resolve job opening and initial stage
    const job = await this.prisma.jobOpening.findFirst({
      where: { id: data.jobOpeningId, organizationId, deletedAt: null },
      include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });
    if (!job) {
      throw new NotFoundException(`Job opening '${data.jobOpeningId}' not found`);
    }
    if (!job.stages || job.stages.length === 0) {
      throw new BadRequestException('Job opening has no stages configured');
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { id: data.candidateId, organizationId, deletedAt: null },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate '${data.candidateId}' not found`);
    }

    const initialStage =
      job.stages.find((s) => s.stageType === StageType.APPLIED) || job.stages[0];

    const application = await this.repository.create(
      organizationId,
      data,
      initialStage,
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPLICATION_CREATE,
      resource: 'JobApplication',
      resourceId: application.id,
      details: { jobOpeningId: job.id, candidateId: candidate.id },
      ipAddress: ip,
      userAgent: ua,
    });

    // Send application notification to candidate
    if (candidate.email) {
      await this.emailService.sendNotification(
        candidate.email,
        `Application Received: ${job.title}`,
        `Hello ${candidate.firstName}, your application for ${job.title} has been received. Our team will review your qualifications.`,
      );
    }

    return application;
  }

  async moveStage(
    id: string,
    organizationId: string,
    toStageId: string,
    comments: string | undefined,
    user: { id: string; roles: string[] },
    ip?: string,
    ua?: string,
  ) {
    const app = await this.findById(id, organizationId);
    const stages = app.jobOpening?.stages || [];

    const currentStage = stages.find((s) => s.id === app.currentStageId);
    const toStage = stages.find((s) => s.id === toStageId);

    if (!toStage) {
      throw new BadRequestException(`Destination stage '${toStageId}' is not part of this job opening's pipeline`);
    }

    // Check backward movement permission
    if (currentStage && toStage.stageOrder < currentStage.stageOrder) {
      const allowedRoles = ['SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'];
      const canMoveBack = user.roles.some((r) => allowedRoles.includes(r));
      if (!canMoveBack) {
        throw new ForbiddenException('Only recruiters and HR admins can move candidates to previous stages');
      }
    }

    // Check mandatory interview requirement before Hired
    if (toStage.stageType === StageType.HIRED) {
      const mandatoryStages = stages.filter(
        (s) =>
          s.isMandatory &&
          s.stageType !== StageType.HIRED &&
          s.stageType !== StageType.APPLIED,
      );

      // Check if all mandatory stages have passed or have completed feedback
      const interviewStages = mandatoryStages.filter((s) =>
        [
          StageType.TECHNICAL_INTERVIEW,
          StageType.MANAGER_INTERVIEW,
          StageType.HR_INTERVIEW,
        ].includes(s.stageType as any),
      );

      for (const reqStage of interviewStages) {
        const interview = (app.interviews || []).find((i) => i.status === 'COMPLETED');
        if (!interview) {
          throw new BadRequestException(
            `Cannot move candidate to Hired without completing mandatory interview stage: ${reqStage.stageName}`,
          );
        }
      }
    }

    let newStatus = app.applicationStatus;
    if (toStage.stageType === StageType.HIRED) {
      newStatus = ApplicationStatus.HIRED;
    } else if (toStage.stageType === StageType.OFFER) {
      newStatus = ApplicationStatus.OFFERED;
    } else if (toStage.stageType === StageType.REJECTED) {
      newStatus = ApplicationStatus.REJECTED;
    } else if (toStage.stageType === StageType.ON_HOLD) {
      newStatus = ApplicationStatus.ON_HOLD;
    } else if (
      [
        StageType.TECHNICAL_INTERVIEW,
        StageType.MANAGER_INTERVIEW,
        StageType.HR_INTERVIEW,
        StageType.ASSESSMENT,
      ].includes(toStage.stageType as any)
    ) {
      newStatus = ApplicationStatus.INTERVIEWING;
    } else if (toStage.stageType === StageType.SCREENING) {
      newStatus = ApplicationStatus.SCREENING;
    }

    const updated = await this.repository.updateStage(
      id,
      organizationId,
      toStage,
      currentStage || { id: app.currentStageId, stageName: app.currentStageName },
      user.id,
      comments,
      newStatus,
    );

    await this.auditService.log({
      organizationId,
      userId: user.id,
      action: AuditAction.APPLICATION_STAGE_CHANGE,
      resource: 'JobApplication',
      resourceId: id,
      details: { fromStage: app.currentStageName, toStage: toStage.stageName, comments },
      ipAddress: ip,
      userAgent: ua,
    });

    if (app.candidate?.email) {
      await this.emailService.sendNotification(
        app.candidate.email,
        `Update on your application for ${app.jobOpening?.title}`,
        `Your application has progressed to stage: ${toStage.stageName}.`,
      );
    }

    return updated;
  }

  async screen(
    id: string,
    organizationId: string,
    data: { screeningScore: number; screeningNotes: string; passed?: boolean },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const app = await this.findById(id, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      screeningScore: data.screeningScore,
      screeningNotes: data.screeningNotes,
      applicationStatus: data.passed === false ? ApplicationStatus.REJECTED : ApplicationStatus.SCREENING,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPLICATION_SCREEN,
      resource: 'JobApplication',
      resourceId: id,
      details: { screeningScore: data.screeningScore, passed: data.passed },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async reject(
    id: string,
    organizationId: string,
    data: { rejectionReason: string; comments?: string },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const app = await this.findById(id, organizationId);
    const stages = app.jobOpening?.stages || [];
    const rejectStage = stages.find((s) => s.stageType === StageType.REJECTED);

    const updated = await this.repository.update(id, organizationId, {
      applicationStatus: ApplicationStatus.REJECTED,
      rejectionReason: data.rejectionReason,
      ...(rejectStage
        ? { currentStageId: rejectStage.id, currentStageName: rejectStage.stageName }
        : {}),
    });

    // Record stage history
    await this.prisma.applicationStageHistory.create({
      data: {
        organizationId,
        jobApplicationId: id,
        fromStageId: app.currentStageId,
        toStageId: rejectStage?.id || app.currentStageId,
        fromStageName: app.currentStageName,
        toStageName: rejectStage?.stageName || 'Rejected',
        changedBy: userId,
        comments: `Rejected: ${data.rejectionReason}. ${data.comments || ''}`.trim(),
      },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPLICATION_REJECT,
      resource: 'JobApplication',
      resourceId: id,
      details: { rejectionReason: data.rejectionReason },
      ipAddress: ip,
      userAgent: ua,
    });

    if (app.candidate?.email) {
      await this.emailService.sendNotification(
        app.candidate.email,
        `Update regarding your application for ${app.jobOpening?.title}`,
        `Thank you for taking the time to speak with us. Unfortunately, we have decided to move forward with other candidates at this time.`,
      );
    }

    return updated;
  }

  async hire(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const app = await this.findById(id, organizationId);
    const stages = app.jobOpening?.stages || [];
    const hiredStage = stages.find((s) => s.stageType === StageType.HIRED);

    const updated = await this.repository.update(id, organizationId, {
      applicationStatus: ApplicationStatus.HIRED,
      ...(hiredStage
        ? { currentStageId: hiredStage.id, currentStageName: hiredStage.stageName }
        : {}),
    });

    await this.prisma.candidate.update({
      where: { id: app.candidateId },
      data: { candidateStatus: CandidateStatus.HIRED },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPLICATION_HIRE,
      resource: 'JobApplication',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
