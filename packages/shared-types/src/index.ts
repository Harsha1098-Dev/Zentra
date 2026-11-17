import { z } from 'zod';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  SUSPENDED = 'SUSPENDED',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  SUSPENDED = 'SUSPENDED',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum ProductCode {
  ZENTRA_PEOPLE = 'ZENTRA_PEOPLE',
  ZENTRA_PAYROLL = 'ZENTRA_PAYROLL',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum RoleCode {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HR_ADMIN = 'HR_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum PermissionCode {
  AUTH_MANAGE = 'auth.manage',
  ORGANIZATION_READ = 'organization.read',
  ORGANIZATION_UPDATE = 'organization.update',
  USER_READ = 'user.read',
  USER_INVITE = 'user.invite',
  USER_MANAGE = 'user.manage',
  ROLE_READ = 'role.read',
  ROLE_MANAGE = 'role.manage',
  PERMISSION_READ = 'permission.read',
  AUDIT_READ = 'audit.read',
  PRODUCT_READ = 'product.read',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum AuditAction {
  USER_REGISTER = 'USER_REGISTER',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ORGANIZATION_CREATE = 'ORGANIZATION_CREATE',
  MEMBERSHIP_CREATE = 'MEMBERSHIP_CREATE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  INVITATION_SENT = 'INVITATION_SENT',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

// Role-to-Permissions Mapping for Default Seed
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  [RoleCode.SUPER_ADMIN]: [
    PermissionCode.AUTH_MANAGE,
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.ORGANIZATION_UPDATE,
    PermissionCode.USER_READ,
    PermissionCode.USER_INVITE,
    PermissionCode.USER_MANAGE,
    PermissionCode.ROLE_READ,
    PermissionCode.ROLE_MANAGE,
    PermissionCode.PERMISSION_READ,
    PermissionCode.AUDIT_READ,
    PermissionCode.PRODUCT_READ,
  ],
  [RoleCode.HR_ADMIN]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.USER_READ,
    PermissionCode.USER_INVITE,
    PermissionCode.USER_MANAGE,
    PermissionCode.ROLE_READ,
    PermissionCode.PERMISSION_READ,
    PermissionCode.AUDIT_READ,
    PermissionCode.PRODUCT_READ,
  ],
  [RoleCode.MANAGER]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.USER_READ,
    PermissionCode.PRODUCT_READ,
  ],
  [RoleCode.EMPLOYEE]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.PRODUCT_READ,
  ],
};

// ==========================================
// ZOD SCHEMAS & TYPES
// ==========================================

export const RegisterCompanySchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name is too long'),
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
export type RegisterCompanyInput = z.infer<typeof RegisterCompanySchema>;

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
});
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

export const SelectOrganizationSchema = z.object({
  organizationId: z.string().uuid('Invalid organization UUID'),
});
export type SelectOrganizationInput = z.infer<typeof SelectOrganizationSchema>;

export const InviteUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  roleId: z.string().uuid('Invalid role UUID'),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
});
export type InviteUserInput = z.infer<typeof InviteUserSchema>;

export const AcceptInvitationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
});
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

// ==========================================
// DATA TRANSFER OBJECT INTERFACES
// ==========================================

export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  status: UserStatus;
  createdAt: string;
}

export interface OrganizationSummaryDto {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  joinedAt: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
  products: {
    code: ProductCode;
    status: ProductStatus;
    trialEndsAt?: string | null;
  }[];
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDto;
  organizations: OrganizationSummaryDto[];
  activeOrganizationId?: string | null;
}

export interface MeResponseDto {
  user: UserProfileDto;
  activeOrganization: OrganizationSummaryDto | null;
  roles: string[];
  permissions: string[];
}

export interface AuditLogDto {
  id: string;
  organizationId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
