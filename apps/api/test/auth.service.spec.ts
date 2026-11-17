import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { AuthRepository } from '../src/auth/auth.repository';
import { UsersService } from '../src/users/users.service';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { MembershipsService } from '../src/memberships/memberships.service';
import { RolesService } from '../src/roles/roles.service';
import { EmailService } from '../src/email/email.service';
import { AuditService } from '../src/audit/audit.service';
import { RoleCode, ProductCode, ProductStatus, AuditAction } from '@zentra/shared-types';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let orgsService: jest.Mocked<OrganizationsService>;
  let membershipsService: jest.Mocked<MembershipsService>;
  let rolesService: jest.Mocked<RolesService>;
  let authRepository: jest.Mocked<AuthRepository>;
  let auditService: jest.Mocked<AuditService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockUsersService = {
      normalizeEmail: jest.fn((e: string) => e.trim().toLowerCase()),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockOrgsService = {
      createOrganization: jest.fn(),
      getOrganizationById: jest.fn(),
    };

    const mockMembershipsService = {
      createOrReactivateMembership: jest.fn(),
      findMembership: jest.fn(),
      getUserOrganizations: jest.fn(),
    };

    const mockRolesService = {
      getRoleByCode: jest.fn(),
      getRoleById: jest.fn(),
      assignRoleToMembership: jest.fn(),
      getMembershipRolesAndPermissions: jest.fn(),
    };

    const mockAuthRepository = {
      createRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllUserRefreshTokens: jest.fn(),
      createEmailVerificationToken: jest.fn(),
      findEmailVerificationToken: jest.fn(),
      markEmailVerificationTokenUsed: jest.fn(),
      createPasswordResetToken: jest.fn(),
      findPasswordResetToken: jest.fn(),
      markPasswordResetTokenUsed: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' } as any),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: OrganizationsService, useValue: mockOrgsService },
        { provide: MembershipsService, useValue: mockMembershipsService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_access_jwt'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test_secret_key_1234567890123456';
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    orgsService = module.get(OrganizationsService);
    membershipsService = module.get(MembershipsService);
    rolesService = module.get(RolesService);
    authRepository = module.get(AuthRepository);
    auditService = module.get(AuditService);
    emailService = module.get(EmailService);
  });

  describe('Company Registration Flow', () => {
    it('successfully registers a company, creates user, organization, membership, assigns SUPER_ADMIN, and triggers verification email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'user-1',
        email: 'alex@acme.inc',
        passwordHash: 'hashed_pw',
        firstName: 'Alex',
        lastName: 'Smith',
        isEmailVerified: false,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      orgsService.createOrganization.mockResolvedValue({
        id: 'org-1',
        name: 'Acme Corp',
        slug: 'acme-corp-1234',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      membershipsService.createOrReactivateMembership.mockResolvedValue({
        id: 'mem-1',
        userId: 'user-1',
        organizationId: 'org-1',
        status: 'ACTIVE',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      rolesService.getRoleByCode.mockResolvedValue({
        id: 'role-super-admin',
        code: RoleCode.SUPER_ADMIN,
        name: 'Super Admin',
        description: 'All permissions',
        isSystem: true,
        organizationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rolePermissions: [],
      } as any);

      rolesService.assignRoleToMembership.mockResolvedValue({} as any);

      const result = await authService.registerCompany({
        companyName: 'Acme Corp',
        email: 'Alex@Acme.Inc', // Mixed case to test normalization
        password: 'Password123!',
        firstName: 'Alex',
        lastName: 'Smith',
      });

      expect(usersService.normalizeEmail).toHaveBeenCalledWith('Alex@Acme.Inc');
      expect(usersService.findByEmail).toHaveBeenCalledWith('alex@acme.inc');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alex@acme.inc',
          firstName: 'Alex',
          lastName: 'Smith',
          isEmailVerified: false,
        }),
      );
      expect(orgsService.createOrganization).toHaveBeenCalledWith('Acme Corp', 'user-1');
      expect(membershipsService.createOrReactivateMembership).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        'ACTIVE',
        'user-1',
      );
      expect(rolesService.getRoleByCode).toHaveBeenCalledWith(RoleCode.SUPER_ADMIN, 'org-1');
      expect(rolesService.assignRoleToMembership).toHaveBeenCalledWith(
        'mem-1',
        'role-super-admin',
        'org-1',
        'user-1',
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.USER_REGISTER,
          entityId: 'user-1',
        }),
      );
      expect(result.success).toBe(true);
      expect(result.organization.name).toBe('Acme Corp');
    });

    it('rejects registration if the email already exists globally (duplicate email prevention)', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'existing-user-id',
        email: 'alex@acme.inc',
      } as any);

      await expect(
        authService.registerCompany({
          companyName: 'Duplicate Corp',
          email: 'alex@acme.inc',
          password: 'Password123!',
          firstName: 'Alex',
          lastName: 'Smith',
        }),
      ).rejects.toThrow(ConflictException);

      expect(orgsService.createOrganization).not.toHaveBeenCalled();
    });
  });

  describe('Login Flow', () => {
    it('validates credentials and auto-selects organization if user belongs to exactly one organization', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'alex@acme.inc',
        passwordHash,
        firstName: 'Alex',
        lastName: 'Smith',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: new Date(),
      } as any);

      membershipsService.getUserOrganizations.mockResolvedValue([
        {
          id: 'org-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          status: 'ACTIVE' as any,
          joinedAt: new Date().toISOString(),
          role: { id: 'role-1', name: 'Super Admin', code: 'SUPER_ADMIN' },
          products: [{ code: ProductCode.ZENTRA_PEOPLE, status: ProductStatus.TRIAL }],
        },
      ]);

      const result = await authService.login({
        email: 'alex@acme.inc',
        password: 'CorrectPass123',
      });

      expect(result.activeOrganizationId).toBe('org-1');
      expect(result.accessToken).toBe('mock_access_jwt');
      expect(result.organizations).toHaveLength(1);
      expect(authRepository.createRefreshToken).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_SUCCESS,
          entityId: 'user-1',
        }),
      );
    });

    it('returns available organizations for user selection if user belongs to multiple organizations', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'alex@acme.inc',
        passwordHash,
        firstName: 'Alex',
        lastName: 'Smith',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: new Date(),
      } as any);

      membershipsService.getUserOrganizations.mockResolvedValue([
        {
          id: 'org-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          status: 'ACTIVE' as any,
          joinedAt: new Date().toISOString(),
          role: { id: 'role-1', name: 'Super Admin', code: 'SUPER_ADMIN' },
          products: [],
        },
        {
          id: 'org-2',
          name: 'Beta Global',
          slug: 'beta-global',
          status: 'ACTIVE' as any,
          joinedAt: new Date().toISOString(),
          role: { id: 'role-2', name: 'HR Admin', code: 'HR_ADMIN' },
          products: [],
        },
      ]);

      const result = await authService.login({
        email: 'alex@acme.inc',
        password: 'CorrectPass123',
      });

      // Does not auto-select if multiple orgs exist
      expect(result.activeOrganizationId).toBeNull();
      expect(result.organizations).toHaveLength(2);
    });

    it('rejects invalid password and audit logs failed login', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'alex@acme.inc',
        passwordHash,
        status: 'ACTIVE',
      } as any);

      await expect(
        authService.login({
          email: 'alex@acme.inc',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_FAILED,
        }),
      );
    });
  });

  describe('Organization Selection Flow', () => {
    it('verifies membership and issues organization-scoped tokens', async () => {
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        email: 'alex@acme.inc',
      } as any);

      membershipsService.findMembership.mockResolvedValue({
        id: 'mem-1',
        userId: 'user-1',
        organizationId: 'org-1',
        status: 'ACTIVE',
      } as any);

      orgsService.getOrganizationById.mockResolvedValue({
        id: 'org-1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: 'ACTIVE',
      } as any);

      const result = await authService.selectOrganization('user-1', 'org-1');

      expect(membershipsService.findMembership).toHaveBeenCalledWith('user-1', 'org-1');
      expect(result.activeOrganization.id).toBe('org-1');
      expect(result.accessToken).toBe('mock_access_jwt');
    });

    it('rejects organization selection if user is not an active member', async () => {
      membershipsService.findMembership.mockResolvedValue(null);

      await expect(
        authService.selectOrganization('user-1', 'unauthorized-org'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
