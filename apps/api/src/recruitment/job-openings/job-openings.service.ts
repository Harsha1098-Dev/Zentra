import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JobOpeningsRepository } from './job-openings.repository';
import { PipelinesService } from '../pipelines/pipelines.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  JobOpeningStatus,
  JobPublishedStatus,
} from '@zentra/shared-types';

@Injectable()
export class JobOpeningsService {
  constructor(
    private readonly repository: JobOpeningsRepository,
    private readonly pipelinesService: PipelinesService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const job = await this.repository.findById(id, organizationId);
    if (!job) {
      throw new NotFoundException(`Job opening '${id}' not found`);
    }
    return job;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    // 1. Uniqueness checks
    const existingTitle = await this.repository.findByTitle(data.title, organizationId);
    if (existingTitle) {
      throw new BadRequestException(`A job opening with title '${data.title}' already exists`);
    }
    const existingCode = await this.repository.findByCode(data.jobCode, organizationId);
    if (existingCode) {
      throw new BadRequestException(`A job opening with code '${data.jobCode}' already exists`);
    }

    // 2. Validate ranges
    if (
      data.salaryMin !== undefined &&
      data.salaryMax !== undefined &&
      data.salaryMin > data.salaryMax
    ) {
      throw new BadRequestException('Minimum salary cannot exceed maximum salary');
    }
    if (
      data.experienceMinYears !== undefined &&
      data.experienceMaxYears !== undefined &&
      data.experienceMinYears > data.experienceMaxYears
    ) {
      throw new BadRequestException('Minimum experience cannot exceed maximum experience');
    }

    // 3. Validate relations
    const [dept, desig, loc, hm] = await Promise.all([
      this.prisma.department.findFirst({ where: { id: data.departmentId, organizationId } }),
      this.prisma.designation.findFirst({ where: { id: data.designationId, organizationId } }),
      this.prisma.location.findFirst({ where: { id: data.locationId, organizationId } }),
      this.prisma.employee.findFirst({ where: { id: data.hiringManagerId, organizationId } }),
    ]);

    if (!dept) throw new BadRequestException('Specified department not found');
    if (!desig) throw new BadRequestException('Specified designation not found');
    if (!loc) throw new BadRequestException('Specified location not found');
    if (!hm) throw new BadRequestException('Specified hiring manager not found');

    if (data.recruiterId) {
      const rec = await this.prisma.employee.findFirst({
        where: { id: data.recruiterId, organizationId },
      });
      if (!rec) throw new BadRequestException('Specified recruiter not found');
    }

    // 4. Resolve pipeline stages
    let stagesData: any[] = [];
    if (data.pipelineId) {
      const pipeline = await this.pipelinesService.findById(data.pipelineId, organizationId);
      stagesData = pipeline.stages;
    } else {
      const defaultPipeline = await this.prisma.hiringPipeline.findFirst({
        where: { organizationId, isDefault: true },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
      });
      if (defaultPipeline) {
        stagesData = defaultPipeline.stages;
      } else {
        const createdDefault = await this.pipelinesService.createDefaultPipeline(organizationId);
        stagesData = createdDefault?.stages || [];
      }
    }

    const jobOpening = await this.repository.create(organizationId, data, stagesData, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.JOB_OPENING_CREATE,
      resource: 'JobOpening',
      resourceId: jobOpening.id,
      details: { title: jobOpening.title, jobCode: jobOpening.jobCode },
      ipAddress: ip,
      userAgent: ua,
    });

    return jobOpening;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.findById(id, organizationId);

    if (data.title && data.title !== existing.title) {
      const duplicateTitle = await this.repository.findByTitle(data.title, organizationId);
      if (duplicateTitle && duplicateTitle.id !== id) {
        throw new BadRequestException(`A job opening with title '${data.title}' already exists`);
      }
    }
    if (data.jobCode && data.jobCode !== existing.jobCode) {
      const duplicateCode = await this.repository.findByCode(data.jobCode, organizationId);
      if (duplicateCode && duplicateCode.id !== id) {
        throw new BadRequestException(`A job opening with code '${data.jobCode}' already exists`);
      }
    }

    const salaryMin = data.salaryMin ?? existing.salaryMin;
    const salaryMax = data.salaryMax ?? existing.salaryMax;
    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      throw new BadRequestException('Minimum salary cannot exceed maximum salary');
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.JOB_OPENING_UPDATE,
      resource: 'JobOpening',
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async publish(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const job = await this.findById(id, organizationId);

    // Validate completeness
    if (!job.title || !job.description || !job.departmentId || !job.designationId || !job.locationId) {
      throw new BadRequestException('Cannot publish incomplete job opening');
    }
    if (!job.stages || job.stages.length === 0) {
      throw new BadRequestException('Job opening must have at least one hiring stage before publishing');
    }

    const updated = await this.repository.update(id, organizationId, {
      publishedStatus: data.publishedStatus || JobPublishedStatus.BOTH,
      jobStatus: JobOpeningStatus.OPEN,
      externalJobUrl: data.externalJobUrl,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.JOB_OPENING_PUBLISH,
      resource: 'JobOpening',
      resourceId: id,
      details: { publishedStatus: updated.publishedStatus },
      ipAddress: ip,
      userAgent: ua,
    });

    // Send notification to hiring manager
    if (job.hiringManager?.workEmail) {
      await this.emailService.sendNotification(
        job.hiringManager.workEmail,
        `Job Opening Published: ${job.title} (${job.jobCode})`,
        `The job opening for ${job.title} has been successfully published (${updated.publishedStatus}).`,
      );
    }

    return updated;
  }

  async close(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const job = await this.findById(id, organizationId);

    const activeApplicationsCount = await this.prisma.jobApplication.count({
      where: {
        jobOpeningId: id,
        applicationStatus: { in: ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED'] },
        deletedAt: null,
      },
    });

    if (activeApplicationsCount > 0 && !data.forceClose) {
      throw new BadRequestException(
        `Job opening has ${activeApplicationsCount} active candidate applications. Confirm with forceClose to proceed.`,
      );
    }

    const updated = await this.repository.update(id, organizationId, {
      jobStatus: JobOpeningStatus.CLOSED,
      publishedStatus: JobPublishedStatus.NOT_PUBLISHED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.JOB_OPENING_CLOSE,
      resource: 'JobOpening',
      resourceId: id,
      details: { reason: data.reason },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async cancel(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const cancelled = await this.repository.update(id, organizationId, {
      jobStatus: JobOpeningStatus.CANCELLED,
      publishedStatus: JobPublishedStatus.NOT_PUBLISHED,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.JOB_OPENING_CANCEL,
      resource: 'JobOpening',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return cancelled;
  }

  async delete(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const deleted = await this.repository.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.JOB_OPENING_CANCEL,
      resource: 'JobOpening',
      resourceId: id,
      details: { action: 'soft_delete' },
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }
}
