import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { OrganizationsRepository } from '../src/organizations/organizations.repository';
import { UsersService } from '../src/users/users.service';
import { RolesService } from '../src/roles/roles.service';
import { MembershipsService } from '../src/memberships/memberships.service';
import { EmailService } from '../src/email/email.service';
import { AuditService } from '../src/audit/audit.service';
import { RoleCode, AuditAction, InvitationStatus } from '@zentra/shared-types';

describe('Invitation Flow & User Linking', () => {
  let orgsService: OrganizationsService;
  let orgsRepo: jest.Mocked<OrganizationsRepository>;
  let usersService: jest.Mocked<UsersService>;
  let rolesService: jest.Mocked<RolesService>;
  let membershipsService: jest.Mocked<MembershipsService>;
  let emailService: jest.Mocked<EmailService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockOrgsRepo = {
      findById: jest.fn(),
      createInvitation: jest.fn(),
      findInvitationByTokenHash: jest.fn(),
      updateInvitationStatus: jest.fn(),
      addProduct: jest.fn(),
      create: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      getOrCreateForInvitation: jest.fn(),
      update: jest.fn(),
    };

    const mockRolesService = {
      getRoleById: jest.fn(),
      assignRoleToMembership: jest.fn(),
    };

    const mockMembershipsService = {
      createOrReactivateMembership: jest.fn(),
      findMembership: jest.fn(),
      activateMembership: jest.fn(),
    };

    const mockEmailService = {
      sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: OrganizationsRepository, useValue: mockOrgsRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: MembershipsService, useValue: mockMembershipsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    orgsService = module.get(OrganizationsService);
    orgsRepo = module.get(OrganizationsRepository);
    usersService = module.get(UsersService);
    rolesService = module.get(RolesService);
    membershipsService = module.get(MembershipsService);
    emailService = module.get(EmailService);
    auditService = module.get(AuditService);
  });

  describe('Inviting a user', () => {
    it('creates invited user if new, creates membership, assigns role, sends email, and logs audit', async () => {
      orgsRepo.findById.mockResolvedValue({
        id: 'org-1',
        name: 'Zentra Corp',
      } as any);

      rolesService.getRoleById.mockResolvedValue({
        id: 'role-emp',
        name: 'Employee',
        code: RoleCode.EMPLOYEE,
      } as any);

      usersService.findById.mockResolvedValue({
        id: 'hr-user-id',
        email: 'hr@zentra.com',
        firstName: 'Helen',
        lastName: 'Roberts',
      } as any);

      // User does not exist yet
      usersService.getOrCreateForInvitation.mockResolvedValue({
        user: {
          id: 'new-user-1',
          email: 'newhire@zentra.com',
          status: 'INVITED',
        } as any,
        isNew: true,
      });

      membershipsService.createOrReactivateMembership.mockResolvedValue({
        id: 'mem-new',
        userId: 'new-user-1',
        organizationId: 'org-1',
        status: 'INVITED',
      } as any);

      rolesService.assignRoleToMembership.mockResolvedValue({} as any);

      orgsRepo.createInvitation.mockResolvedValue({
        id: 'inv-1',
        organizationId: 'org-1',
        email: 'newhire@zentra.com',
        roleId: 'role-emp',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } as any);

      const result = await orgsService.inviteUser(
        'org-1',
        'hr-user-id',
        'newhire@zentra.com',
        'role-emp',
        'John',
        'Doe',
      );

      expect(usersService.getOrCreateForInvitation).toHaveBeenCalledWith(
        'newhire@zentra.com',
        'John',
        'Doe',
      );
      expect(membershipsService.createOrReactivateMembership).toHaveBeenCalledWith(
        'new-user-1',
        'org-1',
        'INVITED',
      );
      expect(rolesService.assignRoleToMembership).toHaveBeenCalledWith(
        'mem-new',
        'role-emp',
        'org-1',
        'hr-user-id',
      );
      expect(emailService.sendInvitationEmail).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.INVITATION_SENT,
          organizationId: 'org-1',
        }),
      );
      expect(result.isNewUser).toBe(true);
    });

    it('links existing user without duplicate account when inviting an already existing email', async () => {
      orgsRepo.findById.mockResolvedValue({
        id: 'org-2',
        name: 'Second Company',
      } as any);

      rolesService.getRoleById.mockResolvedValue({
        id: 'role-mgr',
        name: 'Manager',
        code: RoleCode.MANAGER,
      } as any);

      usersService.findById.mockResolvedValue({
        id: 'admin-id',
        email: 'admin@second.com',
      } as any);

      // Existing global user identity!
      usersService.getOrCreateForInvitation.mockResolvedValue({
        user: {
          id: 'existing-global-user-id',
          email: 'alex@acme.inc',
          firstName: 'Alex',
          status: 'ACTIVE',
        } as any,
        isNew: false, // NOT new!
      });

      membershipsService.createOrReactivateMembership.mockResolvedValue({
        id: 'mem-second-org',
        userId: 'existing-global-user-id',
        organizationId: 'org-2',
        status: 'INVITED',
      } as any);

      orgsRepo.createInvitation.mockResolvedValue({
        id: 'inv-2',
        organizationId: 'org-2',
        email: 'alex@acme.inc',
        roleId: 'role-mgr',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } as any);

      const result = await orgsService.inviteUser(
        'org-2',
        'admin-id',
        'alex@acme.inc',
        'role-mgr',
      );

      // Confirms existing user was reused without creating a duplicate
      expect(result.isNewUser).toBe(false);
      expect(membershipsService.createOrReactivateMembership).toHaveBeenCalledWith(
        'existing-global-user-id',
        'org-2',
        'INVITED',
      );
    });
  });

  describe('Accepting an invitation', () => {
    it('activates membership, updates user info, marks invitation accepted, and logs audit', async () => {
      const rawToken = 'sample_invitation_token_123';
      const tokenHash = orgsService.hashToken(rawToken);

      orgsRepo.findInvitationByTokenHash.mockResolvedValue({
        id: 'inv-1',
        organizationId: 'org-1',
        email: 'newhire@zentra.com',
        roleId: 'role-emp',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid
        organization: { id: 'org-1', name: 'Zentra Corp' },
      } as any);

      usersService.findByEmail.mockResolvedValue({
        id: 'user-newhire',
        email: 'newhire@zentra.com',
      } as any);

      membershipsService.findMembership.mockResolvedValue({
        id: 'mem-1',
        userId: 'user-newhire',
        organizationId: 'org-1',
        status: 'INVITED',
      } as any);

      const result = await orgsService.acceptInvitation(
        rawToken,
        'SecurePassword123!',
        'New',
        'Hire',
      );

      expect(usersService.update).toHaveBeenCalledWith(
        'user-newhire',
        expect.objectContaining({
          isEmailVerified: true,
          status: 'ACTIVE',
        }),
      );
      expect(membershipsService.activateMembership).toHaveBeenCalledWith('mem-1');
      expect(orgsRepo.updateInvitationStatus).toHaveBeenCalledWith(
        'inv-1',
        InvitationStatus.ACCEPTED,
        expect.any(Date),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.INVITATION_ACCEPTED,
          organizationId: 'org-1',
          actorUserId: 'user-newhire',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects expired invitations', async () => {
      const rawToken = 'expired_token';

      orgsRepo.findInvitationByTokenHash.mockResolvedValue({
        id: 'inv-expired',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000), // Expired in past
      } as any);

      await expect(orgsService.acceptInvitation(rawToken)).rejects.toThrow(
        BadRequestException,
      );
      expect(orgsRepo.updateInvitationStatus).toHaveBeenCalledWith(
        'inv-expired',
        InvitationStatus.EXPIRED,
      );
    });
  });
});
