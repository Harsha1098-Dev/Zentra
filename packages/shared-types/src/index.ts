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

export enum RecordStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum HolidayType {
  PUBLIC = 'PUBLIC',
  OPTIONAL = 'OPTIONAL',
  RESTRICTED = 'RESTRICTED',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  TEMPORARY = 'TEMPORARY',
}

export enum EmployeeStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  ON_PROBATION = 'ON_PROBATION',
  ON_NOTICE_PERIOD = 'ON_NOTICE_PERIOD',
  ON_LONG_LEAVE = 'ON_LONG_LEAVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
  EXITED = 'EXITED',
}

export enum EmploymentEventType {
  JOINED = 'JOINED',
  TRANSFERRED = 'TRANSFERRED',
  PROMOTED = 'PROMOTED',
  DESIGNATION_CHANGED = 'DESIGNATION_CHANGED',
  REPORTING_MANAGER_CHANGED = 'REPORTING_MANAGER_CHANGED',
  LOCATION_CHANGED = 'LOCATION_CHANGED',
  EMPLOYMENT_TYPE_CHANGED = 'EMPLOYMENT_TYPE_CHANGED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PROBATION_COMPLETED = 'PROBATION_COMPLETED',
  PROBATION_EXTENDED = 'PROBATION_EXTENDED',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
  REINSTATED = 'REINSTATED',
  EXITED = 'EXITED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export enum BloodGroup {
  A_POSITIVE = 'A_POSITIVE',
  A_NEGATIVE = 'A_NEGATIVE',
  B_POSITIVE = 'B_POSITIVE',
  B_NEGATIVE = 'B_NEGATIVE',
  AB_POSITIVE = 'AB_POSITIVE',
  AB_NEGATIVE = 'AB_NEGATIVE',
  O_POSITIVE = 'O_POSITIVE',
  O_NEGATIVE = 'O_NEGATIVE',
}

export enum PermissionCode {
  AUTH_MANAGE = 'auth.manage',
  ORGANIZATION_READ = 'organization.read',
  ORGANIZATION_UPDATE = 'organization.update',
  ORGANIZATION_LOGO_MANAGE = 'organization.logo.manage',
  USER_READ = 'user.read',
  USER_INVITE = 'user.invite',
  USER_MANAGE = 'user.manage',
  ROLE_READ = 'role.read',
  ROLE_MANAGE = 'role.manage',
  PERMISSION_READ = 'permission.read',
  AUDIT_READ = 'audit.read',
  PRODUCT_READ = 'product.read',

  // Organization Setup Permissions
  LOCATION_READ = 'location.read',
  LOCATION_CREATE = 'location.create',
  LOCATION_UPDATE = 'location.update',
  LOCATION_DEACTIVATE = 'location.deactivate',

  DEPARTMENT_READ = 'department.read',
  DEPARTMENT_CREATE = 'department.create',
  DEPARTMENT_UPDATE = 'department.update',
  DEPARTMENT_DEACTIVATE = 'department.deactivate',

  DESIGNATION_READ = 'designation.read',
  DESIGNATION_CREATE = 'designation.create',
  DESIGNATION_UPDATE = 'designation.update',
  DESIGNATION_DEACTIVATE = 'designation.deactivate',

  GRADE_READ = 'grade.read',
  GRADE_CREATE = 'grade.create',
  GRADE_UPDATE = 'grade.update',
  GRADE_DEACTIVATE = 'grade.deactivate',

  WORKWEEK_READ = 'workweek.read',
  WORKWEEK_UPDATE = 'workweek.update',

  HOLIDAY_READ = 'holiday.read',
  HOLIDAY_CREATE = 'holiday.create',
  HOLIDAY_UPDATE = 'holiday.update',
  HOLIDAY_DELETE = 'holiday.delete',

  ORGANIZATION_CHART_READ = 'organization_chart.read',

  // Employee Management Permissions
  EMPLOYEE_READ = 'employee.read',
  EMPLOYEE_READ_BASIC = 'employee.read_basic',
  EMPLOYEE_CREATE = 'employee.create',
  EMPLOYEE_UPDATE = 'employee.update',
  EMPLOYEE_DELETE = 'employee.delete',
  EMPLOYEE_STATUS_MANAGE = 'employee.status.manage',
  EMPLOYEE_REPORTING_MANAGER_MANAGE = 'employee.reporting_manager.manage',
  EMPLOYEE_DEPARTMENT_MANAGE = 'employee.department.manage',
  EMPLOYEE_DESIGNATION_MANAGE = 'employee.designation.manage',
  EMPLOYEE_LOCATION_MANAGE = 'employee.location.manage',
  EMPLOYEE_EMPLOYMENT_TYPE_MANAGE = 'employee.employment_type.manage',
  EMPLOYEE_IMPORT = 'employee.import',
  EMPLOYEE_EXPORT = 'employee.export',
  EMPLOYEE_TIMELINE_READ = 'employee.timeline.read',
  EMPLOYEE_EMPLOYMENT_HISTORY_READ = 'employee.employment_history.read',

  // Workflow Engine Permissions
  WORKFLOW_READ = 'workflow.read',
  WORKFLOW_CREATE = 'workflow.create',
  WORKFLOW_UPDATE = 'workflow.update',
  WORKFLOW_DELETE = 'workflow.delete',
  WORKFLOW_EXECUTE = 'workflow.execute',
  WORKFLOW_TEST = 'workflow.test',

  // Approval Engine Permissions
  APPROVAL_READ = 'approval.read',
  APPROVAL_CREATE = 'approval.create',
  APPROVAL_APPROVE = 'approval.approve',
  APPROVAL_REJECT = 'approval.reject',
  APPROVAL_DELEGATE = 'approval.delegate',
  APPROVAL_REASSIGN = 'approval.reassign',
  APPROVAL_CANCEL = 'approval.cancel',
  APPROVAL_ESCALATE = 'approval.escalate',

  // Checklist Permissions
  CHECKLIST_READ = 'checklist.read',
  CHECKLIST_CREATE = 'checklist.create',
  CHECKLIST_UPDATE = 'checklist.update',
  CHECKLIST_DELETE = 'checklist.delete',
  CHECKLIST_EXECUTE = 'checklist.execute',

  // Task Permissions
  TASK_READ = 'task.read',
  TASK_CREATE = 'task.create',
  TASK_UPDATE = 'task.update',
  TASK_COMPLETE = 'task.complete',
  TASK_REASSIGN = 'task.reassign',

  // Delegation Permissions
  DELEGATION_MANAGE = 'delegation.manage',

  // Leave Management Permissions
  LEAVE_READ = 'leave.read',
  LEAVE_READ_OWN = 'leave.read_own',
  LEAVE_READ_TEAM = 'leave.read_team',
  LEAVE_READ_ALL = 'leave.read_all',
  LEAVE_APPLY = 'leave.apply',
  LEAVE_APPLY_FOR_REPORTEE = 'leave.apply_for_reportee',
  LEAVE_CANCEL = 'leave.cancel',
  LEAVE_CANCEL_APPROVED = 'leave.cancel_approved',
  LEAVE_APPROVE = 'leave.approve',
  LEAVE_REJECT = 'leave.reject',
  LEAVE_OVERRIDE = 'leave.override',
  LEAVE_ADJUST_BALANCE = 'leave.adjust_balance',
  LEAVE_POLICY_READ = 'leave.policy.read',
  LEAVE_POLICY_CREATE = 'leave.policy.create',
  LEAVE_POLICY_UPDATE = 'leave.policy.update',
  LEAVE_POLICY_DELETE = 'leave.policy.delete',
  LEAVE_TYPE_READ = 'leave.type.read',
  LEAVE_TYPE_CREATE = 'leave.type.create',
  LEAVE_TYPE_UPDATE = 'leave.type.update',
  LEAVE_TYPE_DELETE = 'leave.type.delete',
  LEAVE_COMPOFF_APPLY = 'leave.compoff.apply',
  LEAVE_COMPOFF_APPROVE = 'leave.compoff.approve',
  LEAVE_REPORT_VIEW = 'leave.report.view',
  LEAVE_REPORT_EXPORT = 'leave.report.export',
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

  // Organization Setup Audit Actions
  COMPANY_PROFILE_UPDATE = 'COMPANY_PROFILE_UPDATE',
  COMPANY_LOGO_UPLOAD = 'COMPANY_LOGO_UPLOAD',
  COMPANY_LOGO_REMOVE = 'COMPANY_LOGO_REMOVE',

  LOCATION_CREATE = 'LOCATION_CREATE',
  LOCATION_UPDATE = 'LOCATION_UPDATE',
  LOCATION_ACTIVATE = 'LOCATION_ACTIVATE',
  LOCATION_DEACTIVATE = 'LOCATION_DEACTIVATE',

  DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
  DEPARTMENT_ACTIVATE = 'DEPARTMENT_ACTIVATE',
  DEPARTMENT_DEACTIVATE = 'DEPARTMENT_DEACTIVATE',

  DESIGNATION_CREATE = 'DESIGNATION_CREATE',
  DESIGNATION_UPDATE = 'DESIGNATION_UPDATE',
  DESIGNATION_ACTIVATE = 'DESIGNATION_ACTIVATE',
  DESIGNATION_DEACTIVATE = 'DESIGNATION_DEACTIVATE',

  GRADE_CREATE = 'GRADE_CREATE',
  GRADE_UPDATE = 'GRADE_UPDATE',
  GRADE_ACTIVATE = 'GRADE_ACTIVATE',
  GRADE_DEACTIVATE = 'GRADE_DEACTIVATE',

  WORKWEEK_UPDATE = 'WORKWEEK_UPDATE',

  HOLIDAY_CREATE = 'HOLIDAY_CREATE',
  HOLIDAY_UPDATE = 'HOLIDAY_UPDATE',
  HOLIDAY_DELETE = 'HOLIDAY_DELETE',

  // Employee Audit Actions
  EMPLOYEE_CREATE = 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE = 'EMPLOYEE_UPDATE',
  EMPLOYEE_INVITE = 'EMPLOYEE_INVITE',
  EMPLOYEE_STATUS_CHANGE = 'EMPLOYEE_STATUS_CHANGE',
  EMPLOYEE_REPORTING_MANAGER_CHANGE = 'EMPLOYEE_REPORTING_MANAGER_CHANGE',
  EMPLOYEE_DEPARTMENT_CHANGE = 'EMPLOYEE_DEPARTMENT_CHANGE',
  EMPLOYEE_DESIGNATION_CHANGE = 'EMPLOYEE_DESIGNATION_CHANGE',
  EMPLOYEE_LOCATION_CHANGE = 'EMPLOYEE_LOCATION_CHANGE',
  EMPLOYEE_EMPLOYMENT_TYPE_CHANGE = 'EMPLOYEE_EMPLOYMENT_TYPE_CHANGE',
  EMPLOYEE_IMPORT = 'EMPLOYEE_IMPORT',
  EMPLOYEE_EXPORT = 'EMPLOYEE_EXPORT',
  EMPLOYEE_DEACTIVATE = 'EMPLOYEE_DEACTIVATE',
  EMPLOYEE_DELETE = 'EMPLOYEE_DELETE',

  // Workflow Engine Audit Actions
  WORKFLOW_CREATE = 'WORKFLOW_CREATE',
  WORKFLOW_UPDATE = 'WORKFLOW_UPDATE',
  WORKFLOW_ACTIVATE = 'WORKFLOW_ACTIVATE',
  WORKFLOW_DEACTIVATE = 'WORKFLOW_DEACTIVATE',
  WORKFLOW_EXECUTE = 'WORKFLOW_EXECUTE',
  WORKFLOW_FAIL = 'WORKFLOW_FAIL',
  WORKFLOW_DELETE = 'WORKFLOW_DELETE',

  APPROVAL_CREATE = 'APPROVAL_CREATE',
  APPROVAL_APPROVE = 'APPROVAL_APPROVE',
  APPROVAL_REJECT = 'APPROVAL_REJECT',
  APPROVAL_REQUEST_CHANGES = 'APPROVAL_REQUEST_CHANGES',
  APPROVAL_CANCEL = 'APPROVAL_CANCEL',
  APPROVAL_DELEGATE = 'APPROVAL_DELEGATE',
  APPROVAL_REASSIGN = 'APPROVAL_REASSIGN',
  APPROVAL_ESCALATE = 'APPROVAL_ESCALATE',

  CHECKLIST_CREATE = 'CHECKLIST_CREATE',
  CHECKLIST_UPDATE = 'CHECKLIST_UPDATE',
  CHECKLIST_DELETE = 'CHECKLIST_DELETE',
  CHECKLIST_EXECUTE = 'CHECKLIST_EXECUTE',
  CHECKLIST_ITEM_COMPLETE = 'CHECKLIST_ITEM_COMPLETE',

  TASK_CREATE = 'TASK_CREATE',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_COMPLETE = 'TASK_COMPLETE',
  TASK_REASSIGN = 'TASK_REASSIGN',
  TASK_DELETE = 'TASK_DELETE',

  DELEGATION_CREATE = 'DELEGATION_CREATE',
  DELEGATION_UPDATE = 'DELEGATION_UPDATE',
  DELEGATION_CANCEL = 'DELEGATION_CANCEL',

  // Leave Management Audit Actions
  LEAVE_TYPE_CREATE = 'LEAVE_TYPE_CREATE',
  LEAVE_TYPE_UPDATE = 'LEAVE_TYPE_UPDATE',
  LEAVE_TYPE_ACTIVATE = 'LEAVE_TYPE_ACTIVATE',
  LEAVE_TYPE_DEACTIVATE = 'LEAVE_TYPE_DEACTIVATE',
  LEAVE_TYPE_DELETE = 'LEAVE_TYPE_DELETE',
  LEAVE_POLICY_CREATE = 'LEAVE_POLICY_CREATE',
  LEAVE_POLICY_UPDATE = 'LEAVE_POLICY_UPDATE',
  LEAVE_POLICY_ACTIVATE = 'LEAVE_POLICY_ACTIVATE',
  LEAVE_POLICY_DEACTIVATE = 'LEAVE_POLICY_DEACTIVATE',
  LEAVE_POLICY_DELETE = 'LEAVE_POLICY_DELETE',
  LEAVE_BALANCE_ADJUST = 'LEAVE_BALANCE_ADJUST',
  LEAVE_REQUEST_CREATE = 'LEAVE_REQUEST_CREATE',
  LEAVE_REQUEST_UPDATE = 'LEAVE_REQUEST_UPDATE',
  LEAVE_REQUEST_APPROVE = 'LEAVE_REQUEST_APPROVE',
  LEAVE_REQUEST_REJECT = 'LEAVE_REQUEST_REJECT',
  LEAVE_REQUEST_CANCEL = 'LEAVE_REQUEST_CANCEL',
  LEAVE_CANCEL_REQUEST = 'LEAVE_CANCEL_REQUEST',
  LEAVE_CANCEL_APPROVE = 'LEAVE_CANCEL_APPROVE',
  LEAVE_CANCEL_REJECT = 'LEAVE_CANCEL_REJECT',
  COMP_OFF_REQUEST_CREATE = 'COMP_OFF_REQUEST_CREATE',
  COMP_OFF_REQUEST_APPROVE = 'COMP_OFF_REQUEST_APPROVE',
  COMP_OFF_REQUEST_REJECT = 'COMP_OFF_REQUEST_REJECT',
  LEAVE_REPORT_EXPORT = 'LEAVE_REPORT_EXPORT',
}

// Role-to-Permissions Mapping for Default Seed
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  [RoleCode.SUPER_ADMIN]: Object.values(PermissionCode),
  [RoleCode.HR_ADMIN]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.ORGANIZATION_UPDATE,
    PermissionCode.ORGANIZATION_LOGO_MANAGE,
    PermissionCode.USER_READ,
    PermissionCode.USER_INVITE,
    PermissionCode.USER_MANAGE,
    PermissionCode.ROLE_READ,
    PermissionCode.PERMISSION_READ,
    PermissionCode.AUDIT_READ,
    PermissionCode.PRODUCT_READ,
    PermissionCode.LOCATION_READ,
    PermissionCode.LOCATION_CREATE,
    PermissionCode.LOCATION_UPDATE,
    PermissionCode.LOCATION_DEACTIVATE,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.DEPARTMENT_CREATE,
    PermissionCode.DEPARTMENT_UPDATE,
    PermissionCode.DEPARTMENT_DEACTIVATE,
    PermissionCode.DESIGNATION_READ,
    PermissionCode.DESIGNATION_CREATE,
    PermissionCode.DESIGNATION_UPDATE,
    PermissionCode.DESIGNATION_DEACTIVATE,
    PermissionCode.GRADE_READ,
    PermissionCode.GRADE_CREATE,
    PermissionCode.GRADE_UPDATE,
    PermissionCode.GRADE_DEACTIVATE,
    PermissionCode.WORKWEEK_READ,
    PermissionCode.WORKWEEK_UPDATE,
    PermissionCode.HOLIDAY_READ,
    PermissionCode.HOLIDAY_CREATE,
    PermissionCode.HOLIDAY_UPDATE,
    PermissionCode.HOLIDAY_DELETE,
    PermissionCode.ORGANIZATION_CHART_READ,
    // Employee Permissions for HR_ADMIN
    PermissionCode.EMPLOYEE_READ,
    PermissionCode.EMPLOYEE_READ_BASIC,
    PermissionCode.EMPLOYEE_CREATE,
    PermissionCode.EMPLOYEE_UPDATE,
    PermissionCode.EMPLOYEE_DELETE,
    PermissionCode.EMPLOYEE_STATUS_MANAGE,
    PermissionCode.EMPLOYEE_REPORTING_MANAGER_MANAGE,
    PermissionCode.EMPLOYEE_DEPARTMENT_MANAGE,
    PermissionCode.EMPLOYEE_DESIGNATION_MANAGE,
    PermissionCode.EMPLOYEE_LOCATION_MANAGE,
    PermissionCode.EMPLOYEE_EMPLOYMENT_TYPE_MANAGE,
    PermissionCode.EMPLOYEE_IMPORT,
    PermissionCode.EMPLOYEE_EXPORT,
    PermissionCode.EMPLOYEE_TIMELINE_READ,
    PermissionCode.EMPLOYEE_EMPLOYMENT_HISTORY_READ,
    // Workflow Permissions for HR_ADMIN
    PermissionCode.WORKFLOW_READ,
    PermissionCode.WORKFLOW_CREATE,
    PermissionCode.WORKFLOW_UPDATE,
    PermissionCode.WORKFLOW_DELETE,
    PermissionCode.WORKFLOW_EXECUTE,
    PermissionCode.WORKFLOW_TEST,
    PermissionCode.APPROVAL_READ,
    PermissionCode.APPROVAL_CREATE,
    PermissionCode.APPROVAL_APPROVE,
    PermissionCode.APPROVAL_REJECT,
    PermissionCode.APPROVAL_DELEGATE,
    PermissionCode.APPROVAL_REASSIGN,
    PermissionCode.APPROVAL_CANCEL,
    PermissionCode.APPROVAL_ESCALATE,
    PermissionCode.CHECKLIST_READ,
    PermissionCode.CHECKLIST_CREATE,
    PermissionCode.CHECKLIST_UPDATE,
    PermissionCode.CHECKLIST_DELETE,
    PermissionCode.CHECKLIST_EXECUTE,
    PermissionCode.TASK_READ,
    PermissionCode.TASK_CREATE,
    PermissionCode.TASK_UPDATE,
    PermissionCode.TASK_COMPLETE,
    PermissionCode.TASK_REASSIGN,
    PermissionCode.DELEGATION_MANAGE,
    // Leave Management Permissions
    PermissionCode.LEAVE_READ,
    PermissionCode.LEAVE_READ_OWN,
    PermissionCode.LEAVE_READ_TEAM,
    PermissionCode.LEAVE_READ_ALL,
    PermissionCode.LEAVE_APPLY,
    PermissionCode.LEAVE_APPLY_FOR_REPORTEE,
    PermissionCode.LEAVE_CANCEL,
    PermissionCode.LEAVE_CANCEL_APPROVED,
    PermissionCode.LEAVE_APPROVE,
    PermissionCode.LEAVE_REJECT,
    PermissionCode.LEAVE_OVERRIDE,
    PermissionCode.LEAVE_ADJUST_BALANCE,
    PermissionCode.LEAVE_POLICY_READ,
    PermissionCode.LEAVE_POLICY_CREATE,
    PermissionCode.LEAVE_POLICY_UPDATE,
    PermissionCode.LEAVE_POLICY_DELETE,
    PermissionCode.LEAVE_TYPE_READ,
    PermissionCode.LEAVE_TYPE_CREATE,
    PermissionCode.LEAVE_TYPE_UPDATE,
    PermissionCode.LEAVE_TYPE_DELETE,
    PermissionCode.LEAVE_COMPOFF_APPLY,
    PermissionCode.LEAVE_COMPOFF_APPROVE,
    PermissionCode.LEAVE_REPORT_VIEW,
    PermissionCode.LEAVE_REPORT_EXPORT,
  ],
  [RoleCode.MANAGER]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.USER_READ,
    PermissionCode.PRODUCT_READ,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.ORGANIZATION_CHART_READ,
    PermissionCode.EMPLOYEE_READ_BASIC,
    PermissionCode.EMPLOYEE_TIMELINE_READ,
    PermissionCode.APPROVAL_READ,
    PermissionCode.APPROVAL_CREATE,
    PermissionCode.APPROVAL_APPROVE,
    PermissionCode.APPROVAL_REJECT,
    PermissionCode.APPROVAL_DELEGATE,
    PermissionCode.APPROVAL_CANCEL,
    PermissionCode.TASK_READ,
    PermissionCode.TASK_UPDATE,
    PermissionCode.TASK_COMPLETE,
    PermissionCode.DELEGATION_MANAGE,
    PermissionCode.LEAVE_READ,
    PermissionCode.LEAVE_READ_OWN,
    PermissionCode.LEAVE_READ_TEAM,
    PermissionCode.LEAVE_APPLY,
    PermissionCode.LEAVE_APPLY_FOR_REPORTEE,
    PermissionCode.LEAVE_APPROVE,
    PermissionCode.LEAVE_REJECT,
    PermissionCode.LEAVE_CANCEL,
    PermissionCode.LEAVE_COMPOFF_APPROVE,
    PermissionCode.LEAVE_REPORT_VIEW,
  ],
  [RoleCode.EMPLOYEE]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.PRODUCT_READ,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.ORGANIZATION_CHART_READ,
    PermissionCode.EMPLOYEE_READ_BASIC,
    PermissionCode.APPROVAL_READ,
    PermissionCode.TASK_READ,
    PermissionCode.TASK_COMPLETE,
    PermissionCode.LEAVE_READ_OWN,
    PermissionCode.LEAVE_APPLY,
    PermissionCode.LEAVE_CANCEL,
    PermissionCode.LEAVE_COMPOFF_APPLY,
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
// ORGANIZATION SETUP SCHEMAS
// ==========================================

export const UpdateCompanyProfileSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(100).optional(),
  legalName: z.string().trim().max(150).nullable().optional(),
  website: z.string().trim().url('Invalid website URL').or(z.literal('')).nullable().optional(),
  industry: z.string().trim().max(100).nullable().optional(),
  companySize: z.string().trim().max(50).nullable().optional(),
  registrationNumber: z.string().trim().max(100).nullable().optional(),
  taxIdNumber: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  address: z.string().trim().max(255).nullable().optional(),
  timezone: z.string().trim().max(50).nullable().optional(),
  defaultCurrency: z.string().trim().max(10).nullable().optional(),
  primaryContactName: z.string().trim().max(100).nullable().optional(),
  primaryContactEmail: z.string().trim().email('Invalid contact email').or(z.literal('')).nullable().optional(),
  primaryContactPhone: z.string().trim().max(30).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});
export type UpdateCompanyProfileInput = z.infer<typeof UpdateCompanyProfileSchema>;

export const CreateLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required').max(100),
  code: z.string().trim().min(1, 'Location code is required').max(50).toUpperCase(),
  country: z.string().trim().min(1, 'Country is required').max(100),
  state: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  address: z.string().trim().min(1, 'Address is required').max(255),
  postalCode: z.string().trim().max(20).optional().nullable(),
  timezone: z.string().trim().min(1, 'Timezone is required').max(50),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email('Invalid email').or(z.literal('')).optional().nullable(),
  isHeadquarters: z.boolean().optional(),
});
export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;

export const UpdateLocationSchema = CreateLocationSchema.partial();
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;

export const CreateDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required').max(100),
  code: z.string().trim().min(1, 'Department code is required').max(50).toUpperCase(),
  parentDepartmentId: z.string().uuid('Invalid parent department UUID').optional().nullable(),
  departmentHeadUserId: z.string().uuid('Invalid head user UUID').optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;

export const CreateGradeSchema = z.object({
  name: z.string().trim().min(1, 'Grade name is required').max(100),
  code: z.string().trim().min(1, 'Grade code is required').max(50).toUpperCase(),
  level: z.number().int('Level must be an integer').positive('Level must be a positive integer'),
  description: z.string().trim().max(500).optional().nullable(),
});
export type CreateGradeInput = z.infer<typeof CreateGradeSchema>;

export const UpdateGradeSchema = CreateGradeSchema.partial();
export type UpdateGradeInput = z.infer<typeof UpdateGradeSchema>;

export const CreateDesignationSchema = z.object({
  name: z.string().trim().min(1, 'Designation name is required').max(100),
  code: z.string().trim().min(1, 'Designation code is required').max(50).toUpperCase(),
  gradeId: z.string().uuid('Invalid grade UUID').optional().nullable(),
  departmentId: z.string().uuid('Invalid department UUID').optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});
export type CreateDesignationInput = z.infer<typeof CreateDesignationSchema>;

export const UpdateDesignationSchema = CreateDesignationSchema.partial();
export type UpdateDesignationInput = z.infer<typeof UpdateDesignationSchema>;

export const UpdateWorkweekSchema = z.object({
  weeklyWorkingDays: z.array(z.nativeEnum(DayOfWeek)).min(1, 'At least one working day must be specified'),
  weekendDays: z.array(z.nativeEnum(DayOfWeek)),
  dailyStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Daily start time must be in HH:MM format'),
  dailyEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Daily end time must be in HH:MM format'),
  breakDurationMinutes: z.number().int().min(0, 'Break duration cannot be negative').max(360),
  timezone: z.string().trim().min(1, 'Timezone is required').max(50),
  effectiveFrom: z.string().or(z.date()).optional(),
}).refine((data) => {
  return data.dailyEndTime > data.dailyStartTime;
}, {
  message: 'Daily end time must be after start time',
  path: ['dailyEndTime'],
});
export type UpdateWorkweekInput = z.infer<typeof UpdateWorkweekSchema>;

export const CreateHolidaySchema = z.object({
  name: z.string().trim().min(1, 'Holiday name is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.nativeEnum(HolidayType),
  locationId: z.string().uuid('Invalid location UUID').optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  isRecurring: z.boolean().optional(),
});
export type CreateHolidayInput = z.infer<typeof CreateHolidaySchema>;

export const UpdateHolidaySchema = CreateHolidaySchema.partial();
export type UpdateHolidayInput = z.infer<typeof UpdateHolidaySchema>;

// ==========================================
// EMPLOYEE ZOD SCHEMAS & TYPES
// ==========================================

export const CreateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  middleName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  workEmail: z.string().trim().toLowerCase().email('Invalid work email address'),
  personalEmail: z.string().trim().toLowerCase().email('Invalid personal email').or(z.literal('')).optional().nullable(),
  phone: z.string().trim().min(1, 'Phone number is required').max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
  bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),
  nationality: z.string().trim().max(100).optional().nullable(),
  currentAddress: z.string().trim().max(500).optional().nullable(),
  permanentAddress: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  emergencyContactName: z.string().trim().max(150).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(50).optional().nullable(),
  emergencyContactRel: z.string().trim().max(100).optional().nullable(),
  profilePhotoUrl: z.string().trim().optional().nullable(),
  employeeCode: z.string().trim().max(50).toUpperCase().optional().nullable(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of joining must be in YYYY-MM-DD format'),
  probationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Probation end date must be in YYYY-MM-DD format').optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  status: z.nativeEnum(EmployeeStatus).optional(),
  locationId: z.string().uuid('Invalid location UUID'),
  departmentId: z.string().uuid('Invalid department UUID'),
  designationId: z.string().uuid('Invalid designation UUID'),
  gradeId: z.string().uuid('Invalid grade UUID').optional().nullable(),
  reportingManagerId: z.string().uuid('Invalid reporting manager UUID').optional().nullable(),
  workLocationId: z.string().uuid('Invalid work location UUID').optional().nullable(),
  customFields: z.record(z.any()).optional().nullable(),
  sendInvitation: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.probationEndDate && data.dateOfJoining) {
    return data.probationEndDate >= data.dateOfJoining;
  }
  return true;
}, {
  message: 'Probation end date must be on or after date of joining',
  path: ['probationEndDate'],
});
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100).optional(),
  middleName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100).optional(),
  personalEmail: z.string().trim().toLowerCase().email('Invalid personal email').or(z.literal('')).optional().nullable(),
  phone: z.string().trim().min(1, 'Phone number is required').max(50).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
  bloodGroup: z.nativeEnum(BloodGroup).optional().nullable(),
  nationality: z.string().trim().max(100).optional().nullable(),
  currentAddress: z.string().trim().max(500).optional().nullable(),
  permanentAddress: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  emergencyContactName: z.string().trim().max(150).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(50).optional().nullable(),
  emergencyContactRel: z.string().trim().max(100).optional().nullable(),
  profilePhotoUrl: z.string().trim().optional().nullable(),
  gradeId: z.string().uuid('Invalid grade UUID').optional().nullable(),
  workLocationId: z.string().uuid('Invalid work location UUID').optional().nullable(),
  customFields: z.record(z.any()).optional().nullable(),
  probationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Probation end date must be in YYYY-MM-DD format').optional().nullable(),
});
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const ChangeEmployeeStatusSchema = z.object({
  status: z.nativeEnum(EmployeeStatus),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be YYYY-MM-DD format'),
  remarks: z.string().trim().max(500).optional().nullable(),
  exitReason: z.string().trim().max(500).optional().nullable(),
});
export type ChangeEmployeeStatusInput = z.infer<typeof ChangeEmployeeStatusSchema>;

export const ChangeReportingManagerSchema = z.object({
  reportingManagerId: z.string().uuid('Invalid manager UUID').optional().nullable(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be YYYY-MM-DD format'),
  remarks: z.string().trim().max(500).optional().nullable(),
});
export type ChangeReportingManagerInput = z.infer<typeof ChangeReportingManagerSchema>;

export const ChangeDepartmentSchema = z.object({
  departmentId: z.string().uuid('Invalid department UUID'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be YYYY-MM-DD format'),
  remarks: z.string().trim().max(500).optional().nullable(),
});
export type ChangeDepartmentInput = z.infer<typeof ChangeDepartmentSchema>;

export const ChangeDesignationSchema = z.object({
  designationId: z.string().uuid('Invalid designation UUID'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be YYYY-MM-DD format'),
  remarks: z.string().trim().max(500).optional().nullable(),
});
export type ChangeDesignationInput = z.infer<typeof ChangeDesignationSchema>;

export const ChangeLocationSchema = z.object({
  locationId: z.string().uuid('Invalid location UUID'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be YYYY-MM-DD format'),
  remarks: z.string().trim().max(500).optional().nullable(),
});
export type ChangeLocationInput = z.infer<typeof ChangeLocationSchema>;

export const ChangeEmploymentTypeSchema = z.object({
  employmentType: z.nativeEnum(EmploymentType),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be YYYY-MM-DD format'),
  remarks: z.string().trim().max(500).optional().nullable(),
});
export type ChangeEmploymentTypeInput = z.infer<typeof ChangeEmploymentTypeSchema>;

export const EmployeeQueryFilterSchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().optional(),
  locationId: z.string().optional(),
  designationId: z.string().optional(),
  gradeId: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.string().optional(),
  reportingManagerId: z.string().optional(),
  sortBy: z.enum(['name', 'dateOfJoining', 'employeeCode', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
export type EmployeeQueryFilterInput = z.infer<typeof EmployeeQueryFilterSchema>;

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

export interface CompanyProfileDto {
  id: string;
  organizationId: string;
  name: string;
  legalName?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  companySize?: string | null;
  registrationNumber?: string | null;
  taxIdNumber?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  timezone?: string | null;
  defaultCurrency?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  description?: string | null;
  updatedAt: string;
}

export interface LocationDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  country: string;
  state?: string | null;
  city: string;
  address: string;
  postalCode?: string | null;
  timezone: string;
  phone?: string | null;
  email?: string | null;
  isHeadquarters: boolean;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  parentDepartmentId?: string | null;
  parentDepartmentName?: string | null;
  departmentHeadUserId?: string | null;
  departmentHeadName?: string | null;
  description?: string | null;
  status: RecordStatus;
  employeeCount?: number;
  childCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentTreeNodeDto extends DepartmentDto {
  children: DepartmentTreeNodeDto[];
}

export interface DesignationDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  gradeId?: string | null;
  gradeName?: string | null;
  gradeLevel?: number | null;
  departmentId?: string | null;
  departmentName?: string | null;
  description?: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GradeDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  level: number;
  description?: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkweekDto {
  id: string;
  organizationId: string;
  weeklyWorkingDays: DayOfWeek[];
  weekendDays: DayOfWeek[];
  dailyStartTime: string;
  dailyEndTime: string;
  breakDurationMinutes: number;
  timezone: string;
  effectiveFrom: string;
  updatedAt: string;
}

export interface HolidayDto {
  id: string;
  organizationId: string;
  name: string;
  date: string;
  type: HolidayType;
  locationId?: string | null;
  locationName?: string | null;
  description?: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationChartDto {
  company: CompanyProfileDto;
  locations: LocationDto[];
  departmentsTree: DepartmentTreeNodeDto[];
  designations: DesignationDto[];
  grades: GradeDto[];
}

export interface EmployeeBasicDto {
  id: string;
  organizationId: string;
  employeeCode: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  workEmail: string;
  phone: string;
  profilePhotoUrl?: string | null;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationName: string;
  locationId: string;
  locationName: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  dateOfJoining: string;
  reportingManagerId?: string | null;
  reportingManagerName?: string | null;
}

export interface EmployeeDto extends EmployeeBasicDto {
  userId?: string | null;
  personalEmail?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  bloodGroup?: BloodGroup | null;
  nationality?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRel?: string | null;
  probationEndDate?: string | null;
  gradeId?: string | null;
  gradeName?: string | null;
  gradeLevel?: number | null;
  workLocationId?: string | null;
  dateOfExit?: string | null;
  exitReason?: string | null;
  customFields?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeProfileDto {
  employee: EmployeeDto;
  directReporteesCount: number;
  departmentHead?: { id: string; name: string } | null;
  reportingHierarchy: { id: string; name: string; employeeCode: string; designation: string }[];
}

export interface EmploymentHistoryDto {
  id: string;
  organizationId: string;
  employeeId: string;
  eventType: EmploymentEventType;
  effectiveFrom: string;
  effectiveTo?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  designationId?: string | null;
  designationName?: string | null;
  gradeId?: string | null;
  gradeName?: string | null;
  reportingManagerId?: string | null;
  reportingManagerName?: string | null;
  employmentType?: EmploymentType | null;
  employeeStatus?: EmployeeStatus | null;
  remarks?: string | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  changedByUserId?: string | null;
  changedByName?: string | null;
  createdAt: string;
}

export interface EmployeeTimelineItemDto {
  id: string;
  date: string;
  title: string;
  eventType: EmploymentEventType;
  description: string;
  changedByName?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ReportingStructureDto {
  employee: EmployeeBasicDto;
  manager?: EmployeeBasicDto | null;
  skipLevelManager?: EmployeeBasicDto | null;
  departmentHead?: EmployeeBasicDto | null;
  reportees: EmployeeBasicDto[];
}

export interface EmployeeImportJobDto {
  id: string;
  organizationId: string;
  status: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errors: { row: number; field?: string; message: string; data?: any }[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeExportJobDto {
  id: string;
  organizationId: string;
  status: string;
  fileName: string;
  totalRecords: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// ==========================================
// WORKFLOW & APPROVAL ENGINE TYPES & SCHEMAS
// ==========================================

export enum WorkflowTriggerEvent {
  RECORD_CREATED = 'record_created',
  RECORD_UPDATED = 'record_updated',
  FIELD_CHANGED = 'field_changed',
  RECORD_DELETED = 'record_deleted',
  APPROVAL_REQUESTED = 'approval_requested',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
  APPROVAL_CANCELLED = 'approval_cancelled',
  DATE_REACHED = 'date_reached',
  MANUAL_TRIGGER = 'manual_trigger',
}

export enum ConditionMatchType {
  ALL = 'ALL',
  ANY = 'ANY',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
}

export enum WorkflowActionType {
  SEND_NOTIFICATION = 'send_notification',
  SEND_EMAIL = 'send_email',
  CREATE_TASK = 'create_task',
  CREATE_CHECKLIST_RUN = 'create_checklist_run',
  UPDATE_FIELD = 'update_field',
  CHANGE_STATUS = 'change_status',
  CREATE_APPROVAL_FLOW = 'create_approval_flow',
  ESCALATE_APPROVAL = 'escalate_approval',
  CALL_WEBHOOK = 'call_webhook',
  GENERATE_DOCUMENT = 'generate_document',
  ADD_AUDIT_LOG = 'add_audit_log',
}

export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ApprovalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  ESCALATED = 'escalated',
}

export enum ApprovalStepStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
  WAITING = 'waiting',
}

export enum ApproverType {
  REPORTING_MANAGER = 'reporting_manager',
  DEPARTMENT_HEAD = 'department_head',
  LOCATION_HEAD = 'location_head',
  SPECIFIC_USER = 'specific_user',
  SPECIFIC_ROLE = 'specific_role',
  EMPLOYEE_SELF = 'employee_self',
  FORM_FIELD_USER = 'form_field_user',
  APPROVAL_CHAIN = 'approval_chain',
}

export enum ApprovalMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  ANY_ONE = 'any_one',
  ALL_APPROVERS = 'all_approvers',
  AUTO_APPROVAL = 'auto_approval',
  AUTO_REJECTION = 'auto_rejection',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum ChecklistRunStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum DelegationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Zod Schemas for Workflows
export const WorkflowConditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.nativeEnum(ConditionOperator),
  value: z.any().optional(),
  value_type: z.string().optional(),
});

export const WorkflowActionConfigSchema = z.object({
  actionType: z.nativeEnum(WorkflowActionType),
  actionConfig: z.record(z.any()),
  executionOrder: z.number().int().default(1),
  isActive: z.boolean().default(true),
});

export const CreateWorkflowRuleSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  module: z.string().default('people'),
  entityType: z.string().min(1, 'Entity type is required'),
  triggerEvent: z.string().min(1, 'Trigger event is required'),
  conditions: z.array(z.any()).default([]),
  conditionMatchType: z.nativeEnum(ConditionMatchType).default(ConditionMatchType.ALL),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
  actions: z.array(WorkflowActionConfigSchema).default([]),
});

export const UpdateWorkflowRuleSchema = CreateWorkflowRuleSchema.partial();

export const WorkflowQueryFilterSchema = z.object({
  module: z.string().optional(),
  entityType: z.string().optional(),
  triggerEvent: z.string().optional(),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Zod Schemas for Approvals
export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes', 'delegate', 'reassign', 'cancel', 'escalate']),
  comments: z.string().max(1000).optional(),
  delegateToUserId: z.string().uuid().optional(),
  reassignToUserId: z.string().uuid().optional(),
});

export const ApprovalQueryFilterSchema = z.object({
  status: z.nativeEnum(ApprovalStatus).optional(),
  requestType: z.string().optional(),
  entityType: z.string().optional(),
  scope: z.enum(['awaiting_me', 'my_requests', 'all', 'delegated']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Zod Schemas for Checklists
export const ChecklistItemConfigSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(500).optional().nullable(),
  ownerType: z.string().default('role'), // role, user, manager, employee
  ownerId: z.string().optional().nullable(),
  ownerRole: z.string().optional().nullable(),
  dueOffsetDays: z.number().int().default(0),
  isMandatory: z.boolean().default(true),
  executionOrder: z.number().int().default(1),
});

export const CreateChecklistSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  module: z.string().default('people'),
  entityType: z.string().min(1),
  triggerEvent: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  items: z.array(ChecklistItemConfigSchema).default([]),
});

export const UpdateChecklistSchema = CreateChecklistSchema.partial();

export const ExecuteChecklistSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  dueDate: z.string().optional(),
});

export const UpdateChecklistRunItemSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'overdue']),
  comments: z.string().max(1000).optional(),
});

// Zod Schemas for Tasks
export const CreateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(1000).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  sourceType: z.string().optional().nullable(),
  sourceId: z.string().optional().nullable(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const ReassignTaskSchema = z.object({
  assignedTo: z.string().uuid(),
  comments: z.string().optional(),
});

export const TaskQueryFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedTo: z.string().optional(),
  sourceType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Zod Schemas for Delegations
export const CreateDelegationSchema = z.object({
  delegateToUserId: z.string().uuid(),
  module: z.string().optional().nullable(),
  requestType: z.string().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const UpdateDelegationSchema = CreateDelegationSchema.partial();

// Type Interfaces
export type WorkflowConditionInput = z.infer<typeof WorkflowConditionSchema>;
export type WorkflowActionConfigInput = z.infer<typeof WorkflowActionConfigSchema>;
export type CreateWorkflowRuleInput = z.infer<typeof CreateWorkflowRuleSchema>;
export type UpdateWorkflowRuleInput = z.infer<typeof UpdateWorkflowRuleSchema>;
export type WorkflowQueryFilterInput = z.infer<typeof WorkflowQueryFilterSchema>;
export type ApprovalDecisionInput = z.infer<typeof ApprovalDecisionSchema>;
export type ApprovalQueryFilterInput = z.infer<typeof ApprovalQueryFilterSchema>;
export type CreateChecklistInput = z.infer<typeof CreateChecklistSchema>;
export type UpdateChecklistInput = z.infer<typeof UpdateChecklistSchema>;
export type ExecuteChecklistInput = z.infer<typeof ExecuteChecklistSchema>;
export type UpdateChecklistRunItemInput = z.infer<typeof UpdateChecklistRunItemSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type ReassignTaskInput = z.infer<typeof ReassignTaskSchema>;
export type TaskQueryFilterInput = z.infer<typeof TaskQueryFilterSchema>;
export type CreateDelegationInput = z.infer<typeof CreateDelegationSchema>;
export type UpdateDelegationInput = z.infer<typeof UpdateDelegationSchema>;

// DTOs
export interface WorkflowRuleDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  module: string;
  entityType: string;
  triggerEvent: string;
  conditions: any[];
  conditionMatchType: ConditionMatchType;
  isActive: boolean;
  priority: number;
  createdBy?: string | null;
  actions: WorkflowActionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowActionDto {
  id: string;
  workflowRuleId: string;
  actionType: WorkflowActionType;
  actionConfig: Record<string, any>;
  executionOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionDto {
  id: string;
  organizationId: string;
  workflowRuleId: string;
  entityType: string;
  entityId: string;
  triggerEvent: string;
  status: WorkflowExecutionStatus;
  context?: Record<string, any> | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface ApprovalStepDto {
  id: string;
  approvalFlowId: string;
  stepOrder: number;
  stepName: string;
  approverType: ApproverType;
  approverId?: string | null;
  approverRole?: string | null;
  status: ApprovalStepStatus;
  decision?: string | null;
  comments?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  dueDate?: string | null;
  escalatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalFlowDto {
  id: string;
  organizationId: string;
  requestType: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  requesterName?: string;
  requesterEmail?: string;
  currentStep: number;
  status: ApprovalStatus;
  initiatedAt: string;
  completedAt?: string | null;
  metadata?: Record<string, any> | null;
  steps: ApprovalStepDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItemDto {
  id: string;
  checklistId: string;
  title: string;
  description?: string | null;
  ownerType: string;
  ownerId?: string | null;
  ownerRole?: string | null;
  dueOffsetDays: number;
  isMandatory: boolean;
  executionOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  module: string;
  entityType: string;
  triggerEvent?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  items: ChecklistItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistRunItemDto {
  id: string;
  checklistRunId: string;
  checklistItemId?: string | null;
  title: string;
  ownerType: string;
  ownerId?: string | null;
  dueDate?: string | null;
  status: string;
  completedBy?: string | null;
  completedAt?: string | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistRunDto {
  id: string;
  organizationId: string;
  checklistId: string;
  checklistName?: string;
  entityType: string;
  entityId: string;
  status: ChecklistRunStatus;
  dueDate?: string | null;
  createdBy?: string | null;
  items: ChecklistRunItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDto {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedBy?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DelegationDto {
  id: string;
  organizationId: string;
  delegateFromUserId: string;
  delegateFromName?: string;
  delegateToUserId: string;
  delegateToName?: string;
  module?: string | null;
  requestType?: string | null;
  startDate: string;
  endDate: string;
  status: DelegationStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// LEAVE MANAGEMENT ENUMS & SCHEMAS
// ==========================================

export enum LeaveCategory {
  EARNED_LEAVE = 'earned_leave',
  SICK_LEAVE = 'sick_leave',
  CASUAL_LEAVE = 'casual_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  MARRIAGE_LEAVE = 'marriage_leave',
  BEREAVEMENT_LEAVE = 'bereavement_leave',
  COMPENSATORY_OFF = 'compensatory_off',
  LOSS_OF_PAY = 'loss_of_pay',
  SABBATICAL_LEAVE = 'sabbatical_leave',
  CHILDCARE_LEAVE = 'childcare_leave',
  RESTRICTED_HOLIDAY = 'restricted_holiday',
  CUSTOM = 'custom',
}

export enum LeaveDurationType {
  FULL_DAY = 'full_day',
  HALF_DAY = 'half_day',
  QUARTER_DAY = 'quarter_day',
  HOURLY = 'hourly',
}

export enum LeaveRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  WITHDRAWN = 'WITHDRAWN',
  CANCEL_REQUESTED = 'CANCEL_REQUESTED',
  CANCELLED_AFTER_APPROVAL = 'CANCELLED_AFTER_APPROVAL',
}

export enum CompOffStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().min(1, 'Code is required').max(20).toUpperCase(),
  description: z.string().max(500).optional().nullable(),
  category: z.nativeEnum(LeaveCategory).default(LeaveCategory.EARNED_LEAVE),
  isPaid: z.boolean().default(true),
  isActive: z.boolean().default(true),
  color: z.string().optional().default('#1E3A8A'),
  icon: z.string().optional().default('calendar'),
  requiresAttachment: z.boolean().default(false),
  attachmentRequiredDays: z.number().int().min(0).default(0),
  allowsHalfDay: z.boolean().default(true),
  allowsQuarterDay: z.boolean().default(false),
  allowsHourly: z.boolean().default(false),
  allowsNegativeBalance: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  isCompOff: z.boolean().default(false),
  isLossOfPay: z.boolean().default(false),
  isRestrictedHoliday: z.boolean().default(false),
  applicableProbation: z.boolean().default(true),
  applicableContract: z.boolean().default(true),
  applicableIntern: z.boolean().default(true),
  customFields: z.record(z.any()).optional().default({}),
});

export const UpdateLeaveTypeSchema = CreateLeaveTypeSchema.partial();

export const LeaveTypeQueryFilterSchema = z.object({
  category: z.nativeEnum(LeaveCategory).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const CreateLeavePolicySchema = z.object({
  name: z.string().min(2, 'Policy name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  leaveTypeId: z.string().uuid('Valid leaveTypeId is required'),
  applicableLocations: z.array(z.string()).default(['ALL']),
  applicableDepartments: z.array(z.string()).default(['ALL']),
  applicableDesignations: z.array(z.string()).default(['ALL']),
  applicableGrades: z.array(z.string()).default(['ALL']),
  applicableEmploymentTypes: z.array(z.string()).default(['ALL']),
  applicableEmployeeStatuses: z.array(z.string()).default(['ALL']),
  entitlementType: z.enum(['fixed', 'experience_based', 'grant_based', 'attendance_based']).default('fixed'),
  annualEntitlement: z.coerce.number().min(0).default(0),
  monthlyEntitlement: z.coerce.number().min(0).optional().nullable(),
  accrualFrequency: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly']).default('yearly'),
  accrualStartDate: z.string().optional().nullable(),
  prorateNewJoiners: z.boolean().default(true),
  probationEligibility: z.boolean().default(true),
  minimumServicePeriodDays: z.coerce.number().int().min(0).default(0),
  maxDaysPerRequest: z.coerce.number().min(0).optional().nullable(),
  maxConsecutiveDays: z.coerce.number().min(0).optional().nullable(),
  minimumNoticeDays: z.coerce.number().int().min(0).default(0),
  allowPastDates: z.boolean().default(true),
  allowFutureDates: z.boolean().default(true),
  maxFutureDays: z.coerce.number().int().min(0).optional().nullable(),
  allowHalfDay: z.boolean().default(true),
  allowQuarterDay: z.boolean().default(false),
  allowHourly: z.boolean().default(false),
  allowNegativeBalance: z.boolean().default(false),
  allowCarryForward: z.boolean().default(false),
  carryForwardLimit: z.coerce.number().min(0).optional().nullable(),
  carryForwardExpiryDays: z.coerce.number().int().min(0).optional().nullable(),
  allowEncashment: z.boolean().default(false),
  encashmentLimit: z.coerce.number().min(0).optional().nullable(),
  minBalanceForEncashment: z.coerce.number().min(0).optional().nullable(),
  allowWeekendLeave: z.boolean().default(false),
  allowHolidayLeave: z.boolean().default(false),
  allowOverlappingRequests: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  approvalWorkflowId: z.string().optional().nullable(),
  requiresAttachment: z.boolean().default(false),
  attachmentRequiredDays: z.coerce.number().int().min(0).default(0),
  effectiveFrom: z.string().or(z.date()).optional(),
  effectiveTo: z.string().or(z.date()).optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const UpdateLeavePolicySchema = CreateLeavePolicySchema.partial();

export const LeavePolicyQueryFilterSchema = z.object({
  leaveTypeId: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const AdjustLeaveBalanceSchema = z.object({
  leaveTypeId: z.string().uuid('Valid leaveTypeId is required'),
  year: z.coerce.number().int().min(2020).max(2100).default(new Date().getFullYear()),
  adjustmentAmount: z.coerce.number(), // positive or negative
  reason: z.string().min(3, 'Adjustment reason is required'),
});

export const CreateLeaveRequestSchema = z.object({
  employeeId: z.string().uuid().optional(), // optional if applying for self
  leaveTypeId: z.string().uuid('Valid leaveTypeId is required'),
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  durationType: z.nativeEnum(LeaveDurationType).default(LeaveDurationType.FULL_DAY),
  halfDayType: z.enum(['first_half', 'second_half']).optional().nullable(),
  quarterDayType: z.enum(['q1', 'q2', 'q3', 'q4']).optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  reason: z.string().min(3, 'Reason is required').max(1000),
  attachmentUrl: z.string().url().optional().nullable().or(z.literal('')),
  coveringEmployeeId: z.string().uuid().optional().nullable().or(z.literal('')),
  contactNumber: z.string().max(25).optional().nullable().or(z.literal('')),
  idempotencyKey: z.string().optional().nullable(),
});

export const CancelLeaveRequestSchema = z.object({
  cancellationReason: z.string().min(3, 'Cancellation reason is required'),
});

export const CreateCompOffRequestSchema = z.object({
  employeeId: z.string().uuid().optional(),
  workedDate: z.string().min(1, 'Worked date is required'),
  workedHours: z.coerce.number().min(0.5).max(24).optional().nullable(),
  reason: z.string().min(3, 'Reason is required'),
  attachmentUrl: z.string().url().optional().nullable().or(z.literal('')),
  creditedDays: z.coerce.number().min(0.5).max(2.0).default(1.0),
});

export const LeaveRequestQueryFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  leaveTypeId: z.string().uuid().optional(),
  status: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// TypeScript Types & DTOs
export type CreateLeaveTypeInput = z.infer<typeof CreateLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof UpdateLeaveTypeSchema>;
export type LeaveTypeQueryFilterInput = z.infer<typeof LeaveTypeQueryFilterSchema>;

export type CreateLeavePolicyInput = z.infer<typeof CreateLeavePolicySchema>;
export type UpdateLeavePolicyInput = z.infer<typeof UpdateLeavePolicySchema>;
export type LeavePolicyQueryFilterInput = z.infer<typeof LeavePolicyQueryFilterSchema>;

export type AdjustLeaveBalanceInput = z.infer<typeof AdjustLeaveBalanceSchema>;
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>;
export type CancelLeaveRequestInput = z.infer<typeof CancelLeaveRequestSchema>;
export type CreateCompOffRequestInput = z.infer<typeof CreateCompOffRequestSchema>;
export type LeaveRequestQueryFilterInput = z.infer<typeof LeaveRequestQueryFilterSchema>;

export interface LeaveTypeDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  category: LeaveCategory;
  isPaid: boolean;
  isActive: boolean;
  color?: string | null;
  icon?: string | null;
  requiresAttachment: boolean;
  attachmentRequiredDays?: number | null;
  allowsHalfDay: boolean;
  allowsQuarterDay: boolean;
  allowsHourly: boolean;
  allowsNegativeBalance: boolean;
  requiresApproval: boolean;
  isCompOff: boolean;
  isLossOfPay: boolean;
  isRestrictedHoliday: boolean;
  applicableProbation: boolean;
  applicableContract: boolean;
  applicableIntern: boolean;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LeavePolicyDto {
  id: string;
  organizationId: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  name: string;
  description?: string | null;
  applicableLocations: string[];
  applicableDepartments: string[];
  applicableDesignations: string[];
  applicableGrades: string[];
  applicableEmploymentTypes: string[];
  applicableEmployeeStatuses: string[];
  entitlementType: string;
  annualEntitlement: number;
  monthlyEntitlement?: number | null;
  accrualFrequency: string;
  accrualStartDate?: string | null;
  prorateNewJoiners: boolean;
  probationEligibility: boolean;
  minimumServicePeriodDays: number;
  maxDaysPerRequest?: number | null;
  maxConsecutiveDays?: number | null;
  minimumNoticeDays: number;
  allowPastDates: boolean;
  allowFutureDates: boolean;
  maxFutureDays?: number | null;
  allowHalfDay: boolean;
  allowQuarterDay: boolean;
  allowHourly: boolean;
  allowNegativeBalance: boolean;
  allowCarryForward: boolean;
  carryForwardLimit?: number | null;
  carryForwardExpiryDays?: number | null;
  allowEncashment: boolean;
  encashmentLimit?: number | null;
  minBalanceForEncashment?: number | null;
  allowWeekendLeave: boolean;
  allowHolidayLeave: boolean;
  allowOverlappingRequests: boolean;
  requiresApproval: boolean;
  approvalWorkflowId?: string | null;
  requiresAttachment: boolean;
  attachmentRequiredDays: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalanceDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  leaveTypeColor?: string;
  leavePolicyId?: string | null;
  year: number;
  openingBalance: number;
  accrued: number;
  granted: number;
  used: number;
  pending: number;
  carryForward: number;
  encashed: number;
  adjustment: number;
  closingBalance: number;
  availableBalance: number; // calculated: (openingBalance + accrued + granted + carryForward + adjustment) - (used + pending + encashed)
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalanceHistoryDto {
  id: string;
  organizationId: string;
  leaveBalanceId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  action: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  reason?: string | null;
  referenceId?: string | null;
  actorUserId?: string | null;
  createdAt: string;
}

export interface LeaveRequestDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  leaveTypeColor?: string;
  leavePolicyId?: string | null;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  durationType: LeaveDurationType;
  halfDayType?: string | null;
  quarterDayType?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reason: string;
  attachmentUrl?: string | null;
  coveringEmployeeId?: string | null;
  coveringEmployeeName?: string | null;
  contactNumber?: string | null;
  status: LeaveRequestStatus;
  approvalFlowId?: string | null;
  appliedOn: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompOffRequestDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  workedDate: string;
  workedHours?: number | null;
  reason: string;
  attachmentUrl?: string | null;
  status: CompOffStatus;
  approvalFlowId?: string | null;
  creditedDays: number;
  expiryDate?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveCalendarItemDto {
  id: string;
  type: 'leave' | 'holiday' | 'weekend';
  title: string;
  date: string;
  endDate?: string;
  employeeId?: string;
  employeeName?: string;
  leaveTypeName?: string;
  leaveTypeColor?: string;
  status?: string;
  isHalfDay?: boolean;
}

