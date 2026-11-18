import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ReferralsRepository } from './referrals.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  CandidateSourceType,
} from '@zentra/shared-types';

@Injectable()
export class ReferralsService {
  constructor(
    private readonly repository: ReferralsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: any = {}, userId?: string, roles: string[] = []) {
    const isHrOrAdmin = roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'].includes(r));
    if (!isHrOrAdmin && userId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId, deletedAt: null },
      });
      if (emp) {
        filters.referringEmployeeId = emp.id;
      }
    }
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const ref = await this.repository.findById(id, organizationId);
    if (!ref) {
      throw new NotFoundException(`Referral '${id}' not found`);
    }
    return ref;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    // 1. Resolve referring employee
    const referringEmployee = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!referringEmployee) {
      throw new BadRequestException('You must have an employee profile to submit referrals');
    }

    // Check duplicate referral
    const existingReferral = await this.prisma.employeeReferral.findFirst({
      where: {
        organizationId,
        referringEmployeeId: referringEmployee.id,
        candidateEmail: data.candidateEmail,
        jobOpeningId: data.jobOpeningId,
      },
    });
    if (existingReferral) {
      throw new BadRequestException('You have already referred this candidate for this job opening');
    }

    // 2. Resolve job opening
    const jobOpening = await this.prisma.jobOpening.findFirst({
      where: { id: data.jobOpeningId, organizationId, deletedAt: null },
      include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });
    if (!jobOpening) {
      throw new NotFoundException(`Job opening '${data.jobOpeningId}' not found`);
    }

    // 3. Find or create candidate
    let candidate = await this.prisma.candidate.findFirst({
      where: { organizationId, email: data.candidateEmail, deletedAt: null },
    });

    if (!candidate) {
      const nameParts = data.candidateName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      candidate = await this.prisma.candidate.create({
        data: {
          organizationId,
          firstName,
          lastName,
          email: data.candidateEmail,
          phone: data.candidatePhone,
          resumeUrl: data.resumeUrl,
          sourceType: CandidateSourceType.EMPLOYEE_REFERRAL,
          sourceName: `${referringEmployee.firstName} ${referringEmployee.lastName}`,
          referralEmployeeId: referringEmployee.id,
          candidateStatus: 'NEW',
          createdBy: userId,
        },
      });
    }

    // 4. Create referral
    const referral = await this.repository.create(organizationId, {
      ...data,
      referringEmployeeId: referringEmployee.id,
      candidateId: candidate.id,
    });

    // 5. Automatically create job application if not exists
    const existingApp = await this.prisma.jobApplication.findFirst({
      where: { organizationId, jobOpeningId: jobOpening.id, candidateId: candidate.id },
    });

    if (!existingApp && jobOpening.stages.length > 0) {
      const initialStage = jobOpening.stages[0];
      await this.prisma.jobApplication.create({
        data: {
          organizationId,
          jobOpeningId: jobOpening.id,
          candidateId: candidate.id,
          applicationStatus: 'APPLIED',
          currentStageId: initialStage.id,
          currentStageName: initialStage.stageName,
          sourceType: CandidateSourceType.EMPLOYEE_REFERRAL,
          sourceName: `${referringEmployee.firstName} ${referringEmployee.lastName}`,
          referralEmployeeId: referringEmployee.id,
          resumeUrl: data.resumeUrl,
          createdBy: userId,
        },
      });
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.REFERRAL_CREATE,
      resource: 'EmployeeReferral',
      resourceId: referral.id,
      details: { candidateName: data.candidateName, candidateEmail: data.candidateEmail },
      ipAddress: ip,
      userAgent: ua,
    });

    // Notify candidate
    await this.emailService.sendNotification(
      data.candidateEmail,
      `You've been referred to ${jobOpening.title} at Zentra`,
      `Hello ${data.candidateName}, your colleague ${referringEmployee.firstName} ${referringEmployee.lastName} has referred you for the ${jobOpening.title} position.`,
    );

    return referral;
  }

  async findInternalJobs(organizationId: string) {
    return this.prisma.jobOpening.findMany({
      where: {
        organizationId,
        jobStatus: 'OPEN',
        publishedStatus: { in: ['INTERNAL', 'BOTH'] },
        deletedAt: null,
      },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyInternalJob(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const jobOpening = await this.prisma.jobOpening.findFirst({
      where: {
        id,
        organizationId,
        jobStatus: 'OPEN',
        publishedStatus: { in: ['INTERNAL', 'BOTH'] },
        deletedAt: null,
      },
      include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });
    if (!jobOpening) {
      throw new NotFoundException(`Internal job opening '${id}' not found or not open for applications`);
    }

    const employee = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!employee) {
      throw new BadRequestException('Active employee profile required to apply internally');
    }

    // Check candidate profile for this employee
    const candidateEmail = employee.personalEmail || employee.workEmail;
    let candidate = await this.prisma.candidate.findFirst({
      where: { organizationId, email: candidateEmail, deletedAt: null },
    });

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          organizationId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: candidateEmail,
          phone: employee.phone,
          sourceType: CandidateSourceType.INTERNAL_TRANSFER,
          sourceName: 'Internal Job Posting',
          candidateStatus: 'NEW',
          createdBy: userId,
        },
      });
    }

    // Check duplicate
    const existing = await this.prisma.jobApplication.findFirst({
      where: { organizationId, jobOpeningId: id, candidateId: candidate.id, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('You have already applied for this internal position');
    }

    const initialStage = jobOpening.stages[0];
    const application = await this.prisma.jobApplication.create({
      data: {
        organizationId,
        jobOpeningId: id,
        candidateId: candidate.id,
        applicationStatus: 'APPLIED',
        currentStageId: initialStage.id,
        currentStageName: initialStage.stageName,
        sourceType: CandidateSourceType.INTERNAL_TRANSFER,
        sourceName: 'Internal Transfer',
        createdBy: userId,
      },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.APPLICATION_CREATE,
      resource: 'JobApplication',
      resourceId: application.id,
      details: { isInternalTransfer: true, jobTitle: jobOpening.title },
      ipAddress: ip,
      userAgent: ua,
    });

    return application;
  }
}
