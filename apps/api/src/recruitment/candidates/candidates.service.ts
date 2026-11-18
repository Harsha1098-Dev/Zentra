import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CandidatesRepository } from './candidates.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  CandidateStatus,
  EmploymentEventType,
  RoleCode,
} from '@zentra/shared-types';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly repository: CandidatesRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const candidate = await this.repository.findById(id, organizationId);
    if (!candidate) {
      throw new NotFoundException(`Candidate '${id}' not found`);
    }
    return candidate;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.repository.findByEmail(data.email, organizationId);
    if (existing) {
      throw new BadRequestException(
        `A candidate with email '${data.email}' already exists in this organization`,
      );
    }

    const candidate = await this.repository.create(organizationId, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CANDIDATE_CREATE,
      resource: 'Candidate',
      resourceId: candidate.id,
      details: { email: candidate.email, fullName: `${candidate.firstName} ${candidate.lastName}` },
      ipAddress: ip,
      userAgent: ua,
    });

    return candidate;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.findById(id, organizationId);

    if (data.email && data.email !== existing.email) {
      const duplicate = await this.repository.findByEmail(data.email, organizationId);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(`A candidate with email '${data.email}' already exists`);
      }
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CANDIDATE_UPDATE,
      resource: 'Candidate',
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async uploadResume(id: string, organizationId: string, resumeUrl: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, { resumeUrl });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CANDIDATE_RESUME_UPLOAD,
      resource: 'Candidate',
      resourceId: id,
      details: { resumeUrl },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async addDocument(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const doc = await this.repository.addDocument(organizationId, id, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CANDIDATE_DOCUMENT_UPLOAD,
      resource: 'CandidateDocument',
      resourceId: doc.id,
      details: { documentType: doc.documentType, documentName: doc.documentName },
      ipAddress: ip,
      userAgent: ua,
    });

    return doc;
  }

  async addNote(id: string, organizationId: string, data: any, userId: string) {
    await this.findById(id, organizationId);
    const note = await this.repository.addNote(organizationId, id, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CANDIDATE_NOTE_CREATE,
      resource: 'RecruitmentNote',
      resourceId: note.id,
      details: { noteType: note.noteType },
    });

    return note;
  }

  async delete(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const deleted = await this.repository.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CANDIDATE_DELETE,
      resource: 'Candidate',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return deleted;
  }

  async convertToEmployee(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const candidate = await this.findById(id, organizationId);

    // 1. Verify accepted offer exists
    const acceptedOffer = await this.prisma.offer.findFirst({
      where: {
        organizationId,
        candidateId: id,
        offerStatus: 'ACCEPTED',
        deletedAt: null,
      },
      include: { jobApplication: true },
    });

    if (!acceptedOffer) {
      throw new BadRequestException('Candidate must have an accepted offer before converting to employee');
    }

    // 2. Check if already converted
    const existingEmployee = await this.prisma.employee.findFirst({
      where: {
        organizationId,
        personalEmail: candidate.email,
        deletedAt: null,
      },
    });
    if (existingEmployee) {
      throw new BadRequestException(`Candidate is already converted to employee (${existingEmployee.employeeCode})`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 3. User account linking or creation
      let targetUser = await tx.user.findUnique({
        where: { email: candidate.email },
      });

      if (!targetUser) {
        targetUser = await tx.user.create({
          data: {
            email: candidate.email,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            status: 'ACTIVE',
          },
        });
      }

      // 4. Ensure Organization Membership
      let membership = await tx.organizationMembership.findFirst({
        where: { organizationId, userId: targetUser.id },
      });

      if (!membership) {
        membership = await tx.organizationMembership.create({
          data: {
            organizationId,
            userId: targetUser.id,
            status: 'ACTIVE',
            joinedAt: new Date(data.joiningDate),
          },
        });
      }

      // Assign EMPLOYEE role if not present
      const employeeRole = await tx.role.findFirst({
        where: { code: RoleCode.EMPLOYEE },
      });
      if (employeeRole) {
        const hasRole = await tx.userRole.findFirst({
          where: { membershipId: membership.id, roleId: employeeRole.id },
        });
        if (!hasRole) {
          await tx.userRole.create({
            data: {
              membershipId: membership.id,
              roleId: employeeRole.id,
              organizationId,
            },
          });
        }
      }

      // 5. Generate employee code if not supplied
      let code = data.employeeCode;
      if (!code) {
        const count = await tx.employee.count({ where: { organizationId } });
        code = `EMP-${String(count + 101).padStart(4, '0')}`;
      }

      const workEmail = data.workEmail || candidate.email;

      // 6. Create Employee record
      const employee = await tx.employee.create({
        data: {
          organizationId,
          userId: targetUser.id,
          employeeCode: code,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          workEmail,
          personalEmail: candidate.email,
          phone: candidate.phone,
          dateOfBirth: candidate.dateOfBirth,
          gender: candidate.gender,
          dateOfJoining: new Date(data.joiningDate),
          departmentId: data.departmentId,
          designationId: data.designationId,
          locationId: data.locationId,
          reportingManagerId: data.reportingManagerId,
          employmentType: data.employmentType || 'FULL_TIME',
          status: 'ACTIVE',
        },
      });

      // 7. Create JOINED employment history
      await tx.employmentHistory.create({
        data: {
          organizationId,
          employeeId: employee.id,
          eventType: EmploymentEventType.JOINED,
          effectiveFrom: new Date(data.joiningDate),
          departmentId: data.departmentId,
          designationId: data.designationId,
          locationId: data.locationId,
          employmentType: data.employmentType || 'FULL_TIME',
          remarks: 'Converted from accepted recruitment offer',
        },
      });

      // 8. Update candidate and application status
      await tx.candidate.update({
        where: { id },
        data: { candidateStatus: CandidateStatus.HIRED },
      });

      if (acceptedOffer.jobApplicationId) {
        await tx.jobApplication.update({
          where: { id: acceptedOffer.jobApplicationId },
          data: {
            applicationStatus: 'HIRED',
            hiredEmployeeId: employee.id,
          },
        });
      }

      // Increment filled openings on JobOpening
      await tx.jobOpening.update({
        where: { id: acceptedOffer.jobOpeningId },
        data: { filledOpenings: { increment: 1 } },
      });

      // 9. Onboarding flow trigger if requested
      if (data.triggerOnboarding) {
        const defaultFlow = await tx.onboardingFlow.findFirst({
          where: { organizationId, isActive: true, deletedAt: null },
        });
        if (defaultFlow) {
          await tx.onboardingRun.create({
            data: {
              organizationId,
              onboardingFlowId: defaultFlow.id,
              employeeId: employee.id,
              status: 'IN_PROGRESS',
              startDate: new Date(data.joiningDate),
              createdBy: userId,
            },
          });
        }
      }

      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.CANDIDATE_CONVERT_EMPLOYEE,
        resource: 'Employee',
        resourceId: employee.id,
        details: { candidateId: id, employeeCode: employee.employeeCode },
        ipAddress: ip,
        userAgent: ua,
      });

      // Send welcome email
      await this.emailService.sendNotification(
        employee.workEmail,
        'Welcome to Zentra - Your Employee Record Has Been Created',
        `Hello ${employee.firstName}, welcome to the team! Your employee profile has been set up with ID ${employee.employeeCode}.`,
      );

      return employee;
    });
  }

  async triggerOnboarding(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const candidate = await this.findById(id, organizationId);
    const employee = await this.prisma.employee.findFirst({
      where: {
        organizationId,
        personalEmail: candidate.email,
        deletedAt: null,
      },
    });

    if (!employee) {
      throw new BadRequestException('Candidate has not been converted to an employee yet');
    }

    const defaultFlow = await this.prisma.onboardingFlow.findFirst({
      where: { organizationId, isActive: true, deletedAt: null },
    });

    if (!defaultFlow) {
      throw new NotFoundException('No active onboarding flow found for this organization');
    }

    const existingRun = await this.prisma.onboardingRun.findFirst({
      where: { organizationId, employeeId: employee.id, status: 'IN_PROGRESS' },
    });

    if (existingRun) {
      return existingRun;
    }

    const run = await this.prisma.onboardingRun.create({
      data: {
        organizationId,
        onboardingFlowId: defaultFlow.id,
        employeeId: employee.id,
        status: 'IN_PROGRESS',
        startDate: new Date(),
        createdBy: userId,
      },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CANDIDATE_ONBOARD_TRIGGER,
      resource: 'OnboardingRun',
      resourceId: run.id,
      details: { candidateId: id, employeeId: employee.id },
      ipAddress: ip,
      userAgent: ua,
    });

    return run;
  }
}
