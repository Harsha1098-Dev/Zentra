import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { OrganizationsRepository } from './organizations.repository';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { MembershipsService } from '../memberships/memberships.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { ProductCode, ProductStatus, AuditAction, InvitationStatus } from '@zentra/shared-types';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly orgsRepository: OrganizationsRepository,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    @Inject(forwardRef(() => MembershipsService))
    private readonly membershipsService: MembershipsService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug || 'org'}-${randomSuffix}`;
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createOrganization(name: string, actorUserId?: string) {
    const slug = this.generateSlug(name);
    const org = await this.orgsRepository.create({ name, slug });

    // Enable Zentra People trial entitlement (30 days)
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.orgsRepository.addProduct(
      org.id,
      ProductCode.ZENTRA_PEOPLE,
      ProductStatus.TRIAL,
      trialEndsAt,
    );

    // Audit log organization creation
    await this.auditService.log({
      organizationId: org.id,
      actorUserId,
      action: AuditAction.ORGANIZATION_CREATE,
      entityType: 'Organization',
      entityId: org.id,
      newValues: {
        name: org.name,
        slug: org.slug,
        initialProduct: ProductCode.ZENTRA_PEOPLE,
      },
    });

    return org;
  }

  async getOrganizationById(id: string) {
    const org = await this.orgsRepository.findById(id);
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async getOrganizationProducts(organizationId: string) {
    return this.orgsRepository.getProducts(organizationId);
  }

  /**
   * Invitation flow:
   * 1. HR admin invites a user by email.
   * 2. If user does not exist, create an invited user.
   * 3. If user already exists, do not create a duplicate user.
   * 4. Create or reactivate organization membership.
   * 5. Assign the requested role.
   * 6. Send invitation email.
   */
  async inviteUser(
    organizationId: string,
    invitedByUserId: string,
    email: string,
    roleId: string,
    firstName?: string,
    lastName?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const org = await this.getOrganizationById(organizationId);
    const role = await this.rolesService.getRoleById(roleId);
    const inviter = await this.usersService.findById(invitedByUserId);

    // 2 & 3: Check or create global user identity without duplicates
    const { user, isNew } = await this.usersService.getOrCreateForInvitation(
      email,
      firstName,
      lastName,
    );

    // 4: Create or reactivate membership
    const membership = await this.membershipsService.createOrReactivateMembership(
      user.id,
      organizationId,
      'INVITED',
    );

    // 5: Assign requested role to membership
    await this.rolesService.assignRoleToMembership(
      membership.id,
      role.id,
      organizationId,
      invitedByUserId,
    );

    // 6: Create invitation token and record
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.orgsRepository.createInvitation({
      organizationId,
      email: user.email,
      roleId: role.id,
      invitedByUserId,
      tokenHash,
      expiresAt,
    });

    // Send invitation email
    const inviterName = `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email;
    await this.emailService.sendInvitationEmail(
      user.email,
      rawToken,
      org.name,
      role.name,
      inviterName,
    );

    // 7: Audit log invitation sent
    await this.auditService.log({
      organizationId,
      actorUserId: invitedByUserId,
      action: AuditAction.INVITATION_SENT,
      entityType: 'Invitation',
      entityId: invitation.id,
      newValues: {
        email: user.email,
        roleId: role.id,
        roleCode: role.code,
        isNewUser: isNew,
      },
      ipAddress,
      userAgent,
    });

    return {
      invitationId: invitation.id,
      email: user.email,
      role: {
        id: role.id,
        name: role.name,
        code: role.code,
      },
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      isNewUser: isNew,
      token: rawToken, // Provided in development response for easy test verification
    };
  }

  /**
   * Accept invitation flow:
   * 1. Accepting an invitation must link the existing user to the organization.
   * 2. Sets user password/name if needed.
   * 3. Activates membership.
   * 4. Updates invitation status.
   */
  async acceptInvitation(
    rawToken: string,
    password?: string,
    firstName?: string,
    lastName?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = this.hashToken(rawToken);
    const invitation = await this.orgsRepository.findInvitationByTokenHash(tokenHash);

    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    if (new Date() > invitation.expiresAt) {
      await this.orgsRepository.updateInvitationStatus(invitation.id, InvitationStatus.EXPIRED);
      throw new BadRequestException('Invitation has expired');
    }

    // Find the invited user
    const user = await this.usersService.findByEmail(invitation.email);
    if (!user) {
      throw new NotFoundException('User for this invitation was not found');
    }

    // Update user if they don't have password or are setting profile
    const updateData: any = {};
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
      updateData.isEmailVerified = true;
      updateData.status = 'ACTIVE';
    }
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    if (Object.keys(updateData).length > 0) {
      await this.usersService.update(user.id, updateData);
    }

    // Activate membership
    const membership = await this.membershipsService.findMembership(user.id, invitation.organizationId);
    if (membership) {
      await this.membershipsService.activateMembership(membership.id);
    }

    // Mark invitation as accepted
    await this.orgsRepository.updateInvitationStatus(invitation.id, InvitationStatus.ACCEPTED, new Date());

    // Audit log invitation acceptance
    await this.auditService.log({
      organizationId: invitation.organizationId,
      actorUserId: user.id,
      action: AuditAction.INVITATION_ACCEPTED,
      entityType: 'Invitation',
      entityId: invitation.id,
      newValues: {
        userId: user.id,
        email: user.email,
        roleId: invitation.roleId,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Invitation accepted successfully. You may now log in to your organization.',
      user: {
        id: user.id,
        email: user.email,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
      },
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
      },
    };
  }

  async getInvitations(organizationId: string) {
    return this.orgsRepository.findInvitationsByOrganization(organizationId);
  }
}
