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
  ],
  [RoleCode.MANAGER]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.USER_READ,
    PermissionCode.PRODUCT_READ,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.ORGANIZATION_CHART_READ,
    PermissionCode.EMPLOYEE_READ_BASIC,
    PermissionCode.EMPLOYEE_TIMELINE_READ,
  ],
  [RoleCode.EMPLOYEE]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.PRODUCT_READ,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.ORGANIZATION_CHART_READ,
    PermissionCode.EMPLOYEE_READ_BASIC,
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
