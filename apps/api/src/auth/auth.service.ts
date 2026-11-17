import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { MembershipsService } from '../memberships/memberships.service';
import { RolesService } from '../roles/roles.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import {
  RegisterCompanyInput,
  LoginInput,
  RoleCode,
  AuditAction,
  AuthResponseDto,
  UserProfileDto,
  OrganizationSummaryDto,
  MeResponseDto,
} from '@zentra/shared-types';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersService: UsersService,
    private readonly orgsService: OrganizationsService,
    private readonly membershipsService: MembershipsService,
    private readonly rolesService: RolesService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(userId: string, email: string, organizationId?: string | null) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      organizationId: organizationId || null,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'zentra_jwt_access_super_secret_key_change_in_production_min_32_chars',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');

    return {
      accessToken,
      rawRefreshToken,
    };
  }

  /**
   * Company registration flow:
   * 1. Create user with email and password.
   * 2. Create organization.
   * 3. Create organization membership.
   * 4. Assign Super Admin role.
   * 5. Enable Zentra People trial entitlement (handled inside createOrganization).
   * 6. Send email verification token.
   * 7. Return appropriate response without exposing tokens or sensitive data.
   */
  async registerCompany(
    input: RegisterCompanyInput,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const normalizedEmail = this.usersService.normalizeEmail(input.email);

    // 1. Prevent duplicate accounts globally
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException(
        'An account with this email address already exists. Please log in or use another email.',
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await this.usersService.create({
      email: normalizedEmail,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      isEmailVerified: false,
      status: 'ACTIVE',
    });

    // Audit log user registration
    await this.auditService.log({
      actorUserId: user.id,
      action: AuditAction.USER_REGISTER,
      entityType: 'User',
      entityId: user.id,
      newValues: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ipAddress,
      userAgent,
    });

    // 2. Create organization & 5. Enable Zentra People trial
    const org = await this.orgsService.createOrganization(input.companyName, user.id);

    // 3. Create organization membership
    const membership = await this.membershipsService.createOrReactivateMembership(
      user.id,
      org.id,
      'ACTIVE',
      user.id,
    );

    // 4. Assign Super Admin role
    const superAdminRole = await this.rolesService.getRoleByCode(
      RoleCode.SUPER_ADMIN,
      org.id,
    );
    await this.rolesService.assignRoleToMembership(
      membership.id,
      superAdminRole.id,
      org.id,
      user.id,
    );

    // 6. Generate and send email verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = this.hashToken(rawVerificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.authRepository.createEmailVerificationToken({
      userId: user.id,
      tokenHash: verificationTokenHash,
      expiresAt,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      rawVerificationToken,
      user.firstName || undefined,
    );

    // 7. Return clean response without exposing secrets or raw verification token
    return {
      success: true,
      message:
        'Company registered successfully. A verification email has been sent to your address.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
      // Note: verificationToken returned for ease of local testing/demonstration
      _debugVerificationToken:
        process.env.NODE_ENV !== 'production' ? rawVerificationToken : undefined,
    };
  }

  /**
   * Login flow:
   * 1. Validate email and password.
   * 2. Return access token and refresh token.
   * 3. Store refresh token securely.
   * 4. Return user profile and available organizations.
   * 5. If user has one active organization, auto-select it.
   * 6. If user has multiple organizations, return them for selection.
   */
  async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const normalizedEmail = this.usersService.normalizeEmail(input.email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || !user.passwordHash) {
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        entityId: 'unknown',
        newValues: { email: normalizedEmail, reason: 'Invalid credentials' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditService.log({
        actorUserId: user.id,
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        entityId: user.id,
        newValues: { email: user.email, reason: 'Password mismatch' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account has been suspended');
    }

    // 4. Retrieve available organizations
    const organizations = await this.membershipsService.getUserOrganizations(user.id);

    // 5 & 6. Auto-select if exactly 1 organization
    const activeOrganizationId =
      organizations.length === 1 ? organizations[0].id : null;

    // Generate tokens
    const { accessToken, rawRefreshToken } = this.generateTokens(
      user.id,
      user.email,
      activeOrganizationId,
    );

    // 3. Store refresh token securely
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
      ipAddress,
      userAgent,
    });

    // Audit log login success
    await this.auditService.log({
      organizationId: activeOrganizationId,
      actorUserId: user.id,
      action: AuditAction.LOGIN_SUCCESS,
      entityType: 'User',
      entityId: user.id,
      newValues: {
        email: user.email,
        activeOrganizationId,
      },
      ipAddress,
      userAgent,
    });

    const userProfile: UserProfileDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      isEmailVerified: user.isEmailVerified,
      status: user.status as any,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: userProfile,
      organizations,
      activeOrganizationId,
    };
  }

  /**
   * Refresh token rotation
   */
  async refreshTokens(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.authRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt || new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await this.authRepository.revokeRefreshToken(tokenHash);

    // Check organizations
    const orgs = await this.membershipsService.getUserOrganizations(storedToken.userId);
    const activeOrgId = orgs.length === 1 ? orgs[0].id : null;

    const { accessToken, rawRefreshToken: newRawRefresh } = this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      activeOrgId,
    );

    const newHash = this.hashToken(newRawRefresh);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken({
      userId: storedToken.user.id,
      tokenHash: newHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: newRawRefresh,
    };
  }

  async logout(rawRefreshToken: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.authRepository.revokeRefreshToken(tokenHash);
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async forgotPassword(email: string, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = this.usersService.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.authRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      await this.emailService.sendPasswordResetEmail(user.email, rawToken);

      await this.auditService.log({
        actorUserId: user.id,
        action: AuditAction.PASSWORD_RESET_REQUEST,
        entityType: 'User',
        entityId: user.id,
        newValues: { email: user.email },
        ipAddress,
        userAgent,
      });

      return {
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
        _debugResetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
      };
    }

    return {
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(token);
    const resetRecord = await this.authRepository.findPasswordResetToken(tokenHash);

    if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(resetRecord.userId, { passwordHash });
    await this.authRepository.markPasswordResetTokenUsed(resetRecord.id);

    // Invalidate old refresh tokens for security
    await this.authRepository.revokeAllUserRefreshTokens(resetRecord.userId);

    await this.auditService.log({
      actorUserId: resetRecord.userId,
      action: AuditAction.PASSWORD_RESET_SUCCESS,
      entityType: 'User',
      entityId: resetRecord.userId,
      newValues: { reset: true },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Password has been reset successfully. Please log in.' };
  }

  async verifyEmail(token: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(token);
    const verificationRecord = await this.authRepository.findEmailVerificationToken(tokenHash);

    if (!verificationRecord || verificationRecord.usedAt || new Date() > verificationRecord.expiresAt) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.update(verificationRecord.userId, { isEmailVerified: true });
    await this.authRepository.markEmailVerificationTokenUsed(verificationRecord.id);

    await this.auditService.log({
      actorUserId: verificationRecord.userId,
      action: AuditAction.EMAIL_VERIFIED,
      entityType: 'User',
      entityId: verificationRecord.userId,
      newValues: { isEmailVerified: true },
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Email verified successfully.' };
  }

  async resendVerification(email: string) {
    const normalizedEmail = this.usersService.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user && !user.isEmailVerified) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.authRepository.createEmailVerificationToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      await this.emailService.sendVerificationEmail(user.email, rawToken, user.firstName || undefined);
    }

    return {
      success: true,
      message: 'If your email is registered and unverified, a verification link has been resent.',
    };
  }

  /**
   * Organization selection:
   * Validates membership and issues organization-scoped tokens
   */
  async selectOrganization(userId: string, organizationId: string) {
    const membership = await this.membershipsService.findMembership(userId, organizationId);
    if (!membership || membership.status !== 'ACTIVE' || membership.deletedAt) {
      throw new UnauthorizedException('You do not belong to this organization or membership is inactive');
    }

    const user = await this.usersService.findById(userId);
    const { accessToken, rawRefreshToken } = this.generateTokens(
      user.id,
      user.email,
      organizationId,
    );

    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
    });

    const org = await this.orgsService.getOrganizationById(organizationId);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      activeOrganization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
      },
    };
  }

  async getMe(userId: string, organizationId?: string | null): Promise<MeResponseDto> {
    const user = await this.usersService.findById(userId);

    let activeOrgSummary: OrganizationSummaryDto | null = null;
    let roles: string[] = [];
    let permissions: string[] = [];

    if (organizationId) {
      const membership = await this.membershipsService.findMembership(userId, organizationId);
      if (membership && membership.status === 'ACTIVE') {
        const rolesAndPerms = await this.rolesService.getMembershipRolesAndPermissions(membership.id);
        roles = rolesAndPerms.roles;
        permissions = rolesAndPerms.permissions;

        const primaryRole = membership.userRoles[0]?.role || {
          id: '',
          name: 'Member',
          code: 'MEMBER',
        };

        activeOrgSummary = {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          status: membership.organization.status as any,
          joinedAt: membership.joinedAt?.toISOString() || membership.createdAt.toISOString(),
          role: {
            id: primaryRole.id,
            name: primaryRole.name,
            code: primaryRole.code,
          },
          products: membership.organization.products.map((p) => ({
            code: p.productCode as any,
            status: p.status as any,
            trialEndsAt: p.trialEndsAt?.toISOString() || null,
          })),
        };
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isEmailVerified: user.isEmailVerified,
        status: user.status as any,
        createdAt: user.createdAt.toISOString(),
      },
      activeOrganization: activeOrgSummary,
      roles,
      permissions,
    };
  }
}
