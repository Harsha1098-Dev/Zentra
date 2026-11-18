import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OffersRepository } from './offers.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  AuditAction,
  OfferStatus,
  ApplicationStatus,
  CandidateStatus,
} from '@zentra/shared-types';

@Injectable()
export class OffersService {
  constructor(
    private readonly repository: OffersRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const offer = await this.repository.findById(id, organizationId);
    if (!offer) {
      throw new NotFoundException(`Offer '${id}' not found`);
    }
    return offer;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    // 1. Validate salary & dates
    if (!data.annualCtc || data.annualCtc <= 0) {
      throw new BadRequestException('Annual CTC must be greater than zero');
    }

    const offerDate = data.offerDate ? new Date(data.offerDate) : new Date();
    const joiningDate = new Date(data.joiningDate);
    const expiryDate = new Date(data.expiryDate);

    if (joiningDate <= offerDate) {
      throw new BadRequestException('Joining date must be after offer date');
    }
    if (expiryDate <= offerDate) {
      throw new BadRequestException('Expiry date must be after offer date');
    }
    if (expiryDate > joiningDate) {
      throw new BadRequestException('Expiry date must be on or before joining date');
    }

    // 2. Prevent duplicate active offer for application
    if (data.jobApplicationId) {
      const existingOffer = await this.repository.findActiveOfferForApplication(
        data.jobApplicationId,
        organizationId,
      );
      if (existingOffer) {
        throw new BadRequestException(
          `An active offer already exists for this application (${existingOffer.offerStatus})`,
        );
      }
    }

    // 3. Verify relations
    const [dept, desig, loc] = await Promise.all([
      this.prisma.department.findFirst({ where: { id: data.departmentId, organizationId } }),
      this.prisma.designation.findFirst({ where: { id: data.designationId, organizationId } }),
      this.prisma.location.findFirst({ where: { id: data.locationId, organizationId } }),
    ]);

    if (!dept) throw new BadRequestException('Specified department not found');
    if (!desig) throw new BadRequestException('Specified designation not found');
    if (!loc) throw new BadRequestException('Specified location not found');

    const offer = await this.repository.create(organizationId, data, userId);

    // Link offerId back to job application if present
    if (data.jobApplicationId) {
      await this.prisma.jobApplication.update({
        where: { id: data.jobApplicationId },
        data: { offerId: offer.id, applicationStatus: ApplicationStatus.OFFERED },
      });
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFER_CREATE,
      resource: 'Offer',
      resourceId: offer.id,
      details: { candidateId: data.candidateId, annualCtc: data.annualCtc },
      ipAddress: ip,
      userAgent: ua,
    });

    return offer;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const existing = await this.findById(id, organizationId);
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(existing.offerStatus)) {
      throw new BadRequestException(`Cannot update offer in status '${existing.offerStatus}'`);
    }

    const updated = await this.repository.update(id, organizationId, data);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFER_CREATE,
      resource: 'Offer',
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async submit(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const offer = await this.findById(id, organizationId);
    if (offer.offerStatus !== OfferStatus.DRAFT) {
      throw new BadRequestException(`Only DRAFT offers can be submitted for approval`);
    }

    const updated = await this.repository.update(id, organizationId, {
      offerStatus: OfferStatus.PENDING_APPROVAL,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFER_SUBMIT,
      resource: 'Offer',
      resourceId: id,
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async approve(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const offer = await this.findById(id, organizationId);
    if (offer.offerStatus !== OfferStatus.PENDING_APPROVAL && offer.offerStatus !== OfferStatus.DRAFT) {
      throw new BadRequestException(`Offer is not pending approval`);
    }

    // Resolve employee id if approving user is an employee
    const currentEmp = await this.prisma.employee.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });

    const updated = await this.repository.update(id, organizationId, {
      offerStatus: OfferStatus.APPROVED,
      approvedBy: currentEmp?.id || null,
      approvedAt: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFER_APPROVE,
      resource: 'Offer',
      resourceId: id,
      details: { approvedBy: currentEmp?.id },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async reject(id: string, organizationId: string, rejectionReason: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      offerStatus: OfferStatus.REJECTED,
      rejectionReason,
      rejectedAt: new Date(),
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFER_REJECT,
      resource: 'Offer',
      resourceId: id,
      details: { rejectionReason },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async send(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const offer = await this.findById(id, organizationId);
    if (offer.offerStatus !== OfferStatus.APPROVED) {
      throw new BadRequestException(`Offer must be APPROVED before sending to candidate (current status: ${offer.offerStatus})`);
    }

    // Generate mock letterhead URL if template provided
    const offerLetterUrl =
      offer.offerLetterUrl ||
      `https://documents.zentra.io/offers/${organizationId}/${offer.id}/offer-letter.pdf`;

    const updated = await this.repository.update(id, organizationId, {
      offerStatus: OfferStatus.SENT,
      sentAt: new Date(),
      offerLetterUrl,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.OFFER_SEND,
      resource: 'Offer',
      resourceId: id,
      details: { sentAt: updated.sentAt, offerLetterUrl },
      ipAddress: ip,
      userAgent: ua,
    });

    // Send email notification to candidate
    if (offer.candidate?.email) {
      await this.emailService.sendNotification(
        offer.candidate.email,
        `Official Offer of Employment: ${offer.jobOpening?.title}`,
        `Congratulations ${offer.candidate.firstName}! We are pleased to extend an offer of employment. Annual CTC: ${offer.currency} ${offer.annualCtc.toLocaleString()}. Joining Date: ${new Date(offer.joiningDate).toLocaleDateString()}. Please review your offer letter.`,
      );
    }

    return updated;
  }

  async accept(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    const offer = await this.findById(id, organizationId);
    if (offer.offerStatus !== OfferStatus.SENT) {
      throw new BadRequestException(`Offer must be in SENT status to be accepted (current: ${offer.offerStatus})`);
    }

    // Check expiry
    if (new Date() > new Date(offer.expiryDate)) {
      await this.repository.update(id, organizationId, { offerStatus: OfferStatus.EXPIRED });
      throw new BadRequestException('This offer has expired and can no longer be accepted');
    }

    return this.prisma.$transaction(async (tx) => {
      const accepted = await tx.offer.update({
        where: { id },
        data: {
          offerStatus: OfferStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // Update candidate & application status
      await tx.candidate.update({
        where: { id: offer.candidateId },
        data: { candidateStatus: CandidateStatus.OFFERED },
      });

      await tx.jobApplication.update({
        where: { id: offer.jobApplicationId },
        data: { applicationStatus: ApplicationStatus.HIRED },
      });

      // Increment filled openings on JobOpening
      await tx.jobOpening.update({
        where: { id: offer.jobOpeningId },
        data: { filledOpenings: { increment: 1 } },
      });

      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.OFFER_ACCEPT,
        resource: 'Offer',
        resourceId: id,
        details: { acceptedAt: accepted.acceptedAt },
        ipAddress: ip,
        userAgent: ua,
      });

      if (offer.candidate?.email) {
        await this.emailService.sendNotification(
          offer.candidate.email,
          `Offer Accepted: ${offer.jobOpening?.title}`,
          `Thank you ${offer.candidate.firstName}! Your offer acceptance has been confirmed. Our HR team will reach out with onboarding next steps.`,
        );
      }

      return accepted;
    });
  }

  async withdraw(id: string, organizationId: string, reason?: string, userId?: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);

    const updated = await this.repository.update(id, organizationId, {
      offerStatus: OfferStatus.WITHDRAWN,
      rejectionReason: reason,
    });

    await this.auditService.log({
      organizationId,
      userId: userId || 'system',
      action: AuditAction.OFFER_WITHDRAW,
      resource: 'Offer',
      resourceId: id,
      details: { reason },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
