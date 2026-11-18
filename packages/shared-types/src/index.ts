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
  PAYROLL_ADMIN = 'PAYROLL_ADMIN',
  FINANCE = 'FINANCE',
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

  // Attendance & Time Tracking Permissions
  ATTENDANCE_READ = 'attendance.read',
  ATTENDANCE_READ_OWN = 'attendance.read_own',
  ATTENDANCE_READ_TEAM = 'attendance.read_team',
  ATTENDANCE_READ_ALL = 'attendance.read_all',
  ATTENDANCE_CHECK_IN = 'attendance.check_in',
  ATTENDANCE_CHECK_OUT = 'attendance.check_out',
  ATTENDANCE_REGULARISE = 'attendance.regularise',
  ATTENDANCE_REGULARISE_APPROVE = 'attendance.regularise_approve',
  ATTENDANCE_REGULARISE_OVERRIDE = 'attendance.regularise_override',
  ATTENDANCE_OVERTIME_READ = 'attendance.overtime.read',
  ATTENDANCE_OVERTIME_APPLY = 'attendance.overtime.apply',
  ATTENDANCE_OVERTIME_APPROVE = 'attendance.overtime.approve',
  ATTENDANCE_OVERTIME_OVERRIDE = 'attendance.overtime.override',
  ATTENDANCE_ONDUTY_APPLY = 'attendance.onduty.apply',
  ATTENDANCE_ONDUTY_APPROVE = 'attendance.onduty.approve',
  ATTENDANCE_WFH_APPLY = 'attendance.wfh.apply',
  ATTENDANCE_WFH_APPROVE = 'attendance.wfh.approve',
  ATTENDANCE_POLICY_READ = 'attendance.policy.read',
  ATTENDANCE_POLICY_CREATE = 'attendance.policy.create',
  ATTENDANCE_POLICY_UPDATE = 'attendance.policy.update',
  ATTENDANCE_POLICY_DELETE = 'attendance.policy.delete',
  ATTENDANCE_SHIFT_READ = 'attendance.shift.read',
  ATTENDANCE_SHIFT_CREATE = 'attendance.shift.create',
  ATTENDANCE_SHIFT_UPDATE = 'attendance.shift.update',
  ATTENDANCE_SHIFT_DELETE = 'attendance.shift.delete',
  ATTENDANCE_ROSTER_READ = 'attendance.roster.read',
  ATTENDANCE_ROSTER_CREATE = 'attendance.roster.create',
  ATTENDANCE_ROSTER_UPDATE = 'attendance.roster.update',
  ATTENDANCE_ROSTER_DELETE = 'attendance.roster.delete',
  ATTENDANCE_LOCK = 'attendance.lock',
  ATTENDANCE_REPORT_VIEW = 'attendance.report.view',
  ATTENDANCE_REPORT_EXPORT = 'attendance.report.export',

  // Payroll Permissions
  PAYROLL_READ = 'payroll.read',
  PAYROLL_READ_OWN = 'payroll.read_own',
  PAYROLL_READ_ALL = 'payroll.read_all',
  PAYROLL_SALARY_COMPONENT_READ = 'payroll.salary_component.read',
  PAYROLL_SALARY_COMPONENT_CREATE = 'payroll.salary_component.create',
  PAYROLL_SALARY_COMPONENT_UPDATE = 'payroll.salary_component.update',
  PAYROLL_SALARY_COMPONENT_DELETE = 'payroll.salary_component.delete',
  PAYROLL_SALARY_STRUCTURE_READ = 'payroll.salary_structure.read',
  PAYROLL_SALARY_STRUCTURE_CREATE = 'payroll.salary_structure.create',
  PAYROLL_SALARY_STRUCTURE_UPDATE = 'payroll.salary_structure.update',
  PAYROLL_SALARY_STRUCTURE_DELETE = 'payroll.salary_structure.delete',
  PAYROLL_SALARY_STRUCTURE_ASSIGN = 'payroll.salary_structure.assign',
  PAYROLL_SALARY_REVISION_CREATE = 'payroll.salary_revision.create',
  PAYROLL_SALARY_REVISION_APPROVE = 'payroll.salary_revision.approve',
  PAYROLL_PERIOD_READ = 'payroll.period.read',
  PAYROLL_PERIOD_CREATE = 'payroll.period.create',
  PAYROLL_PERIOD_UPDATE = 'payroll.period.update',
  PAYROLL_PERIOD_LOCK = 'payroll.period.lock',
  PAYROLL_RUN_READ = 'payroll.run.read',
  PAYROLL_RUN_CREATE = 'payroll.run.create',
  PAYROLL_RUN_CALCULATE = 'payroll.run.calculate',
  PAYROLL_RUN_SUBMIT = 'payroll.run.submit',
  PAYROLL_RUN_APPROVE = 'payroll.run.approve',
  PAYROLL_RUN_REJECT = 'payroll.run.reject',
  PAYROLL_RUN_CANCEL = 'payroll.run.cancel',
  PAYROLL_RUN_LOCK = 'payroll.run.lock',
  PAYROLL_INPUT_READ = 'payroll.input.read',
  PAYROLL_INPUT_CREATE = 'payroll.input.create',
  PAYROLL_INPUT_UPDATE = 'payroll.input.update',
  PAYROLL_INPUT_DELETE = 'payroll.input.delete',
  PAYROLL_EXCEPTION_READ = 'payroll.exception.read',
  PAYROLL_EXCEPTION_RESOLVE = 'payroll.exception.resolve',
  PAYROLL_PAYMENT_READ = 'payroll.payment.read',
  PAYROLL_PAYMENT_MARK_PAID = 'payroll.payment.mark_paid',
  PAYROLL_PAYMENT_UPLOAD_PROOF = 'payroll.payment.upload_proof',
  PAYROLL_PAYSLIP_READ = 'payroll.payslip.read',
  PAYROLL_PAYSLIP_GENERATE = 'payroll.payslip.generate',
  PAYROLL_PAYSLIP_PUBLISH = 'payroll.payslip.publish',
  PAYROLL_PAYSLIP_DOWNLOAD = 'payroll.payslip.download',
  PAYROLL_TEMPLATE_READ = 'payroll.template.read',
  PAYROLL_TEMPLATE_CREATE = 'payroll.template.create',
  PAYROLL_TEMPLATE_UPDATE = 'payroll.template.update',
  PAYROLL_TEMPLATE_DELETE = 'payroll.template.delete',
  PAYROLL_REPORT_VIEW = 'payroll.report.view',
  PAYROLL_REPORT_EXPORT = 'payroll.report.export',
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

  // Attendance & Time Tracking Audit Actions
  ATTENDANCE_POLICY_CREATE = 'ATTENDANCE_POLICY_CREATE',
  ATTENDANCE_POLICY_CREATED = 'ATTENDANCE_POLICY_CREATE',
  ATTENDANCE_POLICY_UPDATE = 'ATTENDANCE_POLICY_UPDATE',
  ATTENDANCE_POLICY_UPDATED = 'ATTENDANCE_POLICY_UPDATE',
  ATTENDANCE_POLICY_DELETE = 'ATTENDANCE_POLICY_DELETE',
  ATTENDANCE_POLICY_DELETED = 'ATTENDANCE_POLICY_DELETE',
  ATTENDANCE_POLICY_ACTIVATE = 'ATTENDANCE_POLICY_ACTIVATE',
  ATTENDANCE_POLICY_DEACTIVATE = 'ATTENDANCE_POLICY_DEACTIVATE',
  SHIFT_CREATE = 'SHIFT_CREATE',
  SHIFT_CREATED = 'SHIFT_CREATE',
  SHIFT_UPDATE = 'SHIFT_UPDATE',
  SHIFT_UPDATED = 'SHIFT_UPDATE',
  SHIFT_DELETE = 'SHIFT_DELETE',
  SHIFT_DELETED = 'SHIFT_DELETE',
  SHIFT_DEACTIVATE = 'SHIFT_DEACTIVATE',
  ROSTER_CREATE = 'ROSTER_CREATE',
  ROSTER_CREATED = 'ROSTER_CREATE',
  ROSTER_UPDATE = 'ROSTER_UPDATE',
  ROSTER_UPDATED = 'ROSTER_UPDATE',
  ROSTER_DELETE = 'ROSTER_DELETE',
  ROSTER_DELETED = 'ROSTER_DELETE',
  ROSTER_PUBLISH = 'ROSTER_PUBLISH',
  ROSTER_PUBLISHED = 'ROSTER_PUBLISH',
  SHIFT_ASSIGN = 'SHIFT_ASSIGN',
  SHIFT_ASSIGNED = 'SHIFT_ASSIGN',
  SHIFT_ASSIGN_UPDATE = 'SHIFT_ASSIGN_UPDATE',
  SHIFT_ASSIGN_UPDATED = 'SHIFT_ASSIGN_UPDATE',
  SHIFT_ASSIGN_DELETE = 'SHIFT_ASSIGN_DELETE',
  SHIFT_ASSIGN_DELETED = 'SHIFT_ASSIGN_DELETE',
  ATTENDANCE_CHECK_IN = 'ATTENDANCE_CHECK_IN',
  ATTENDANCE_CHECK_OUT = 'ATTENDANCE_CHECK_OUT',
  ATTENDANCE_MANUAL_ENTRY = 'ATTENDANCE_MANUAL_ENTRY',
  ATTENDANCE_MANUAL_CREATE = 'ATTENDANCE_MANUAL_CREATE',
  ATTENDANCE_MANUAL_UPDATE = 'ATTENDANCE_MANUAL_UPDATE',
  ATTENDANCE_REGULARISATION_REQUEST = 'ATTENDANCE_REGULARISATION_REQUEST',
  ATTENDANCE_REGULARISATION_REQUESTED = 'ATTENDANCE_REGULARISATION_REQUEST',
  ATTENDANCE_REGULARISATION_CREATE = 'ATTENDANCE_REGULARISATION_CREATE',
  ATTENDANCE_REGULARISATION_APPROVE = 'ATTENDANCE_REGULARISATION_APPROVE',
  ATTENDANCE_REGULARISATION_APPROVED = 'ATTENDANCE_REGULARISATION_APPROVE',
  ATTENDANCE_REGULARISATION_REJECT = 'ATTENDANCE_REGULARISATION_REJECT',
  ATTENDANCE_REGULARISATION_REJECTED = 'ATTENDANCE_REGULARISATION_REJECT',
  OVERTIME_REQUEST_CREATE = 'OVERTIME_REQUEST_CREATE',
  OVERTIME_REQUESTED = 'OVERTIME_REQUEST_CREATE',
  OVERTIME_APPROVED = 'OVERTIME_REQUEST_APPROVE',
  OVERTIME_REQUEST_APPROVE = 'OVERTIME_REQUEST_APPROVE',
  OVERTIME_REJECTED = 'OVERTIME_REQUEST_REJECT',
  OVERTIME_REQUEST_REJECT = 'OVERTIME_REQUEST_REJECT',
  ATTENDANCE_REQUEST_CREATE = 'ATTENDANCE_REQUEST_CREATE',
  ATTENDANCE_REQUEST_ONDUTY_APPLIED = 'ATTENDANCE_REQUEST_ONDUTY_APPLIED',
  ATTENDANCE_REQUEST_ONDUTY_APPROVED = 'ATTENDANCE_REQUEST_ONDUTY_APPROVED',
  ATTENDANCE_REQUEST_ONDUTY_REJECTED = 'ATTENDANCE_REQUEST_ONDUTY_REJECTED',
  ATTENDANCE_REQUEST_WFH_APPLIED = 'ATTENDANCE_REQUEST_WFH_APPLIED',
  ATTENDANCE_REQUEST_WFH_APPROVED = 'ATTENDANCE_REQUEST_WFH_APPROVED',
  ATTENDANCE_REQUEST_WFH_REJECTED = 'ATTENDANCE_REQUEST_WFH_REJECTED',
  ATTENDANCE_REQUEST_APPROVE = 'ATTENDANCE_REQUEST_APPROVE',
  ATTENDANCE_REQUEST_REJECT = 'ATTENDANCE_REQUEST_REJECT',
  ATTENDANCE_LOCK = 'ATTENDANCE_LOCK',
  ATTENDANCE_UNLOCK = 'ATTENDANCE_UNLOCK',
  ATTENDANCE_REPORT_EXPORT = 'ATTENDANCE_REPORT_EXPORT',
  ATTENDANCE_REPORT_EXPORTED = 'ATTENDANCE_REPORT_EXPORT',

  // Payroll Foundation Audit Actions
  SALARY_COMPONENT_CREATE = 'SALARY_COMPONENT_CREATE',
  SALARY_COMPONENT_CREATED = 'SALARY_COMPONENT_CREATE',
  SALARY_COMPONENT_UPDATE = 'SALARY_COMPONENT_UPDATE',
  SALARY_COMPONENT_UPDATED = 'SALARY_COMPONENT_UPDATE',
  SALARY_COMPONENT_ACTIVATE = 'SALARY_COMPONENT_ACTIVATE',
  SALARY_COMPONENT_ACTIVATED = 'SALARY_COMPONENT_ACTIVATE',
  SALARY_COMPONENT_DEACTIVATE = 'SALARY_COMPONENT_DEACTIVATE',
  SALARY_COMPONENT_DEACTIVATED = 'SALARY_COMPONENT_DEACTIVATE',
  SALARY_COMPONENT_DELETE = 'SALARY_COMPONENT_DELETE',
  SALARY_COMPONENT_DELETED = 'SALARY_COMPONENT_DELETE',

  SALARY_STRUCTURE_CREATE = 'SALARY_STRUCTURE_CREATE',
  SALARY_STRUCTURE_CREATED = 'SALARY_STRUCTURE_CREATE',
  SALARY_STRUCTURE_UPDATE = 'SALARY_STRUCTURE_UPDATE',
  SALARY_STRUCTURE_UPDATED = 'SALARY_STRUCTURE_UPDATE',
  SALARY_STRUCTURE_DELETE = 'SALARY_STRUCTURE_DELETE',
  SALARY_STRUCTURE_DELETED = 'SALARY_STRUCTURE_DELETE',
  SALARY_STRUCTURE_ASSIGN = 'SALARY_STRUCTURE_ASSIGN',
  SALARY_STRUCTURE_ASSIGNED = 'SALARY_STRUCTURE_ASSIGN',

  SALARY_REVISION_CREATE = 'SALARY_REVISION_CREATE',
  SALARY_REVISION_CREATED = 'SALARY_REVISION_CREATE',
  SALARY_REVISION_APPROVE = 'SALARY_REVISION_APPROVE',
  SALARY_REVISION_APPROVED = 'SALARY_REVISION_APPROVE',
  SALARY_REVISION_REJECT = 'SALARY_REVISION_REJECT',
  SALARY_REVISION_REJECTED = 'SALARY_REVISION_REJECT',

  PAYROLL_PERIOD_CREATE = 'PAYROLL_PERIOD_CREATE',
  PAYROLL_PERIOD_CREATED = 'PAYROLL_PERIOD_CREATE',
  PAYROLL_PERIOD_OPEN = 'PAYROLL_PERIOD_OPEN',
  PAYROLL_PERIOD_OPENED = 'PAYROLL_PERIOD_OPEN',
  PAYROLL_PERIOD_LOCK = 'PAYROLL_PERIOD_LOCK',
  PAYROLL_PERIOD_LOCKED = 'PAYROLL_PERIOD_LOCK',
  PAYROLL_PERIOD_UPDATE = 'PAYROLL_PERIOD_UPDATE',
  PAYROLL_PERIOD_UPDATED = 'PAYROLL_PERIOD_UPDATE',

  PAYROLL_RUN_CREATE = 'PAYROLL_RUN_CREATE',
  PAYROLL_RUN_CREATED = 'PAYROLL_RUN_CREATE',
  PAYROLL_RUN_CALCULATE = 'PAYROLL_RUN_CALCULATE',
  PAYROLL_RUN_CALCULATED = 'PAYROLL_RUN_CALCULATE',
  PAYROLL_RUN_SUBMIT = 'PAYROLL_RUN_SUBMIT',
  PAYROLL_RUN_SUBMITTED = 'PAYROLL_RUN_SUBMIT',
  PAYROLL_RUN_APPROVE = 'PAYROLL_RUN_APPROVE',
  PAYROLL_RUN_APPROVED = 'PAYROLL_RUN_APPROVE',
  PAYROLL_RUN_REJECT = 'PAYROLL_RUN_REJECT',
  PAYROLL_RUN_REJECTED = 'PAYROLL_RUN_REJECT',
  PAYROLL_RUN_CANCEL = 'PAYROLL_RUN_CANCEL',
  PAYROLL_RUN_CANCELLED = 'PAYROLL_RUN_CANCEL',
  PAYROLL_RUN_LOCK = 'PAYROLL_RUN_LOCK',
  PAYROLL_RUN_LOCKED = 'PAYROLL_RUN_LOCK',

  PAYROLL_INPUT_CREATE = 'PAYROLL_INPUT_CREATE',
  PAYROLL_INPUT_CREATED = 'PAYROLL_INPUT_CREATE',
  PAYROLL_INPUT_UPDATE = 'PAYROLL_INPUT_UPDATE',
  PAYROLL_INPUT_UPDATED = 'PAYROLL_INPUT_UPDATE',
  PAYROLL_INPUT_DELETE = 'PAYROLL_INPUT_DELETE',
  PAYROLL_INPUT_DELETED = 'PAYROLL_INPUT_DELETE',

  PAYROLL_EXCEPTION_RESOLVE = 'PAYROLL_EXCEPTION_RESOLVE',
  PAYROLL_EXCEPTION_RESOLVED = 'PAYROLL_EXCEPTION_RESOLVE',
  PAYROLL_EXCEPTION_OVERRIDE = 'PAYROLL_EXCEPTION_OVERRIDE',
  PAYROLL_EXCEPTION_OVERRIDDEN = 'PAYROLL_EXCEPTION_OVERRIDE',

  PAYROLL_PAYMENT_MARK_PAID = 'PAYROLL_PAYMENT_MARK_PAID',
  PAYROLL_PAYMENT_PROOF_UPLOAD = 'PAYROLL_PAYMENT_PROOF_UPLOAD',
  PAYROLL_PAYMENT_PROOF_UPLOADED = 'PAYROLL_PAYMENT_PROOF_UPLOAD',

  PAYSLIP_TEMPLATE_CREATE = 'PAYSLIP_TEMPLATE_CREATE',
  PAYSLIP_TEMPLATE_CREATED = 'PAYSLIP_TEMPLATE_CREATE',
  PAYSLIP_TEMPLATE_UPDATE = 'PAYSLIP_TEMPLATE_UPDATE',
  PAYSLIP_TEMPLATE_UPDATED = 'PAYSLIP_TEMPLATE_UPDATE',
  PAYSLIP_TEMPLATE_DELETE = 'PAYSLIP_TEMPLATE_DELETE',
  PAYSLIP_TEMPLATE_DELETED = 'PAYSLIP_TEMPLATE_DELETE',

  PAYSLIP_GENERATE = 'PAYSLIP_GENERATE',
  PAYSLIP_GENERATED = 'PAYSLIP_GENERATE',
  PAYSLIP_PUBLISH = 'PAYSLIP_PUBLISH',
  PAYSLIP_PUBLISHED = 'PAYSLIP_PUBLISH',
  PAYSLIP_VIEW = 'PAYSLIP_VIEW',
  PAYSLIP_VIEWED = 'PAYSLIP_VIEW',
  PAYSLIP_DOWNLOAD = 'PAYSLIP_DOWNLOAD',
  PAYSLIP_DOWNLOADED = 'PAYSLIP_DOWNLOAD',
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
    // Attendance & Time Tracking Permissions
    PermissionCode.ATTENDANCE_READ,
    PermissionCode.ATTENDANCE_READ_OWN,
    PermissionCode.ATTENDANCE_READ_TEAM,
    PermissionCode.ATTENDANCE_READ_ALL,
    PermissionCode.ATTENDANCE_CHECK_IN,
    PermissionCode.ATTENDANCE_CHECK_OUT,
    PermissionCode.ATTENDANCE_REGULARISE,
    PermissionCode.ATTENDANCE_REGULARISE_APPROVE,
    PermissionCode.ATTENDANCE_REGULARISE_OVERRIDE,
    PermissionCode.ATTENDANCE_OVERTIME_READ,
    PermissionCode.ATTENDANCE_OVERTIME_APPLY,
    PermissionCode.ATTENDANCE_OVERTIME_APPROVE,
    PermissionCode.ATTENDANCE_OVERTIME_OVERRIDE,
    PermissionCode.ATTENDANCE_ONDUTY_APPLY,
    PermissionCode.ATTENDANCE_ONDUTY_APPROVE,
    PermissionCode.ATTENDANCE_WFH_APPLY,
    PermissionCode.ATTENDANCE_WFH_APPROVE,
    PermissionCode.ATTENDANCE_POLICY_READ,
    PermissionCode.ATTENDANCE_POLICY_CREATE,
    PermissionCode.ATTENDANCE_POLICY_UPDATE,
    PermissionCode.ATTENDANCE_POLICY_DELETE,
    PermissionCode.ATTENDANCE_SHIFT_READ,
    PermissionCode.ATTENDANCE_SHIFT_CREATE,
    PermissionCode.ATTENDANCE_SHIFT_UPDATE,
    PermissionCode.ATTENDANCE_SHIFT_DELETE,
    PermissionCode.ATTENDANCE_ROSTER_READ,
    PermissionCode.ATTENDANCE_ROSTER_CREATE,
    PermissionCode.ATTENDANCE_ROSTER_UPDATE,
    PermissionCode.ATTENDANCE_ROSTER_DELETE,
    PermissionCode.ATTENDANCE_LOCK,
    PermissionCode.ATTENDANCE_REPORT_VIEW,
    PermissionCode.ATTENDANCE_REPORT_EXPORT,
    // Payroll Permissions for HR_ADMIN
    PermissionCode.PAYROLL_READ,
    PermissionCode.PAYROLL_READ_ALL,
    PermissionCode.PAYROLL_SALARY_COMPONENT_READ,
    PermissionCode.PAYROLL_SALARY_COMPONENT_CREATE,
    PermissionCode.PAYROLL_SALARY_COMPONENT_UPDATE,
    PermissionCode.PAYROLL_SALARY_COMPONENT_DELETE,
    PermissionCode.PAYROLL_SALARY_STRUCTURE_READ,
    PermissionCode.PAYROLL_SALARY_STRUCTURE_CREATE,
    PermissionCode.PAYROLL_SALARY_STRUCTURE_UPDATE,
    PermissionCode.PAYROLL_SALARY_STRUCTURE_DELETE,
    PermissionCode.PAYROLL_SALARY_STRUCTURE_ASSIGN,
    PermissionCode.PAYROLL_SALARY_REVISION_CREATE,
    PermissionCode.PAYROLL_SALARY_REVISION_APPROVE,
    PermissionCode.PAYROLL_PERIOD_READ,
    PermissionCode.PAYROLL_PERIOD_CREATE,
    PermissionCode.PAYROLL_PERIOD_UPDATE,
    PermissionCode.PAYROLL_PERIOD_LOCK,
    PermissionCode.PAYROLL_RUN_READ,
    PermissionCode.PAYROLL_RUN_CREATE,
    PermissionCode.PAYROLL_RUN_CALCULATE,
    PermissionCode.PAYROLL_RUN_SUBMIT,
    PermissionCode.PAYROLL_RUN_APPROVE,
    PermissionCode.PAYROLL_RUN_REJECT,
    PermissionCode.PAYROLL_RUN_CANCEL,
    PermissionCode.PAYROLL_RUN_LOCK,
    PermissionCode.PAYROLL_INPUT_READ,
    PermissionCode.PAYROLL_INPUT_CREATE,
    PermissionCode.PAYROLL_INPUT_UPDATE,
    PermissionCode.PAYROLL_INPUT_DELETE,
    PermissionCode.PAYROLL_EXCEPTION_READ,
    PermissionCode.PAYROLL_EXCEPTION_RESOLVE,
    PermissionCode.PAYROLL_PAYMENT_READ,
    PermissionCode.PAYROLL_PAYMENT_MARK_PAID,
    PermissionCode.PAYROLL_PAYMENT_UPLOAD_PROOF,
    PermissionCode.PAYROLL_PAYSLIP_READ,
    PermissionCode.PAYROLL_PAYSLIP_GENERATE,
    PermissionCode.PAYROLL_PAYSLIP_PUBLISH,
    PermissionCode.PAYROLL_PAYSLIP_DOWNLOAD,
    PermissionCode.PAYROLL_TEMPLATE_READ,
    PermissionCode.PAYROLL_TEMPLATE_CREATE,
    PermissionCode.PAYROLL_TEMPLATE_UPDATE,
    PermissionCode.PAYROLL_TEMPLATE_DELETE,
    PermissionCode.PAYROLL_REPORT_VIEW,
    PermissionCode.PAYROLL_REPORT_EXPORT,
  ],
  [RoleCode.PAYROLL_ADMIN]: Object.values(PermissionCode),
  [RoleCode.FINANCE]: [
    PermissionCode.ORGANIZATION_READ,
    PermissionCode.USER_READ,
    PermissionCode.PRODUCT_READ,
    PermissionCode.DEPARTMENT_READ,
    PermissionCode.EMPLOYEE_READ_BASIC,
    PermissionCode.PAYROLL_READ,
    PermissionCode.PAYROLL_RUN_READ,
    PermissionCode.PAYROLL_RUN_APPROVE,
    PermissionCode.PAYROLL_RUN_REJECT,
    PermissionCode.PAYROLL_PAYMENT_READ,
    PermissionCode.PAYROLL_PAYMENT_MARK_PAID,
    PermissionCode.PAYROLL_PAYMENT_UPLOAD_PROOF,
    PermissionCode.PAYROLL_PAYSLIP_READ,
    PermissionCode.PAYROLL_REPORT_VIEW,
    PermissionCode.PAYROLL_REPORT_EXPORT,
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
    PermissionCode.ATTENDANCE_READ,
    PermissionCode.ATTENDANCE_READ_OWN,
    PermissionCode.ATTENDANCE_READ_TEAM,
    PermissionCode.ATTENDANCE_CHECK_IN,
    PermissionCode.ATTENDANCE_CHECK_OUT,
    PermissionCode.ATTENDANCE_REGULARISE,
    PermissionCode.ATTENDANCE_REGULARISE_APPROVE,
    PermissionCode.ATTENDANCE_OVERTIME_READ,
    PermissionCode.ATTENDANCE_OVERTIME_APPLY,
    PermissionCode.ATTENDANCE_OVERTIME_APPROVE,
    PermissionCode.ATTENDANCE_ONDUTY_APPLY,
    PermissionCode.ATTENDANCE_ONDUTY_APPROVE,
    PermissionCode.ATTENDANCE_WFH_APPLY,
    PermissionCode.ATTENDANCE_WFH_APPROVE,
    PermissionCode.ATTENDANCE_SHIFT_READ,
    PermissionCode.ATTENDANCE_ROSTER_READ,
    PermissionCode.ATTENDANCE_REPORT_VIEW,
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
    PermissionCode.ATTENDANCE_READ_OWN,
    PermissionCode.ATTENDANCE_CHECK_IN,
    PermissionCode.ATTENDANCE_CHECK_OUT,
    PermissionCode.ATTENDANCE_REGULARISE,
    PermissionCode.ATTENDANCE_OVERTIME_APPLY,
    PermissionCode.ATTENDANCE_ONDUTY_APPLY,
    PermissionCode.ATTENDANCE_WFH_APPLY,
    PermissionCode.ATTENDANCE_SHIFT_READ,
    // Payroll Permissions for EMPLOYEE
    PermissionCode.PAYROLL_READ_OWN,
    PermissionCode.PAYROLL_PAYSLIP_READ,
    PermissionCode.PAYROLL_PAYSLIP_DOWNLOAD,
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


// ==========================================
// ATTENDANCE & TIME TRACKING ENUMS & SCHEMAS
// ==========================================

export enum AttendanceStatus {
  NOT_MARKED = 'NOT_MARKED',
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEKEND = 'WEEKEND',
  ON_DUTY = 'ON_DUTY',
  WORK_FROM_HOME = 'WORK_FROM_HOME',
  REGULARIZED = 'REGULARIZED',
  PENDING_REGULARIZATION = 'PENDING_REGULARIZATION',
}

export enum CheckInSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  MANUAL = 'MANUAL',
  MANUAL_HR = 'MANUAL_HR',
  BIOMETRIC = 'BIOMETRIC',
  SYSTEM = 'SYSTEM',
  GEOLOCATION = 'GEOLOCATION',
  IP_RESTRICTED = 'IP_RESTRICTED',
  QR_CODE = 'QR_CODE',
}

export enum AttendanceRegularisationReason {
  MISSED_CHECK_IN = 'MISSED_CHECK_IN',
  MISSED_CHECK_OUT = 'MISSED_CHECK_OUT',
  MISSED_PUNCH = 'MISSED_PUNCH',
  INCORRECT_CHECK_IN = 'INCORRECT_CHECK_IN',
  INCORRECT_CHECK_OUT = 'INCORRECT_CHECK_OUT',
  INCORRECT_BREAK = 'INCORRECT_BREAK',
  MISSING_ENTRY = 'MISSING_ENTRY',
  WORK_FROM_HOME = 'WORK_FROM_HOME',
  ON_DUTY = 'ON_DUTY',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  TRANSIT_DELAY = 'TRANSIT_DELAY',
  PERSONAL_EMERGENCY = 'PERSONAL_EMERGENCY',
  OTHER = 'OTHER',
}

export enum OvertimeType {
  DAILY = 'daily',
  REST_DAY = 'rest_day',
  PLANNED = 'planned',
  UNPLANNED = 'unplanned',
  HOLIDAY = 'holiday',
  WEEKEND = 'weekend',
}

export enum AttendanceRequestType {
  ON_DUTY = 'on_duty',
  WORK_FROM_HOME = 'work_from_home',
}

// Zod Schemas
export const CreateAttendancePolicySchema = z.object({
  name: z.string().min(2, 'Policy name is required').max(100),
  code: z.string().min(1, 'Policy code is required').max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().default(false).optional(),
  mode: z.enum(['STRICT', 'LENIENT', 'strict', 'lenient']).default('STRICT').optional(),
  attendanceMode: z.enum(['strict', 'lenient', 'STRICT', 'LENIENT']).default('strict').optional(),
  workHoursPerDay: z.coerce.number().min(1).max(24).default(8.0).optional(),
  expectedWorkingHoursPerDay: z.coerce.number().min(1).max(24).default(8.0).optional(),
  minHoursFullDay: z.coerce.number().min(1).max(24).default(8.0).optional(),
  minHoursHalfDay: z.coerce.number().min(0.5).max(12).default(4.0).optional(),
  gracePeriodLateCheckIn: z.coerce.number().int().min(0).max(120).default(15).optional(),
  gracePeriodEarlyCheckOut: z.coerce.number().int().min(0).max(120).default(15).optional(),
  maxGraceOccurrencesPerMonth: z.coerce.number().int().min(0).default(3).optional(),
  lateCheckInPenaltyType: z.string().default('HALF_DAY').optional(),
  lateCheckInPenaltyDeductionDays: z.coerce.number().default(0.5).optional(),
  allowOvertime: z.boolean().default(false).optional(),
  minOvertimeMinutes: z.coerce.number().int().min(0).default(30).optional(),
  maxOvertimeMinutesPerDay: z.coerce.number().int().min(0).default(240).optional(),
  overtimeRequiresApproval: z.boolean().default(true).optional(),
  allowRegularisation: z.boolean().default(true).optional(),
  regularisationDeadlineDays: z.coerce.number().int().min(1).default(7).optional(),
  maxRegularisationsPerMonth: z.coerce.number().int().min(0).default(3).optional(),
  allowSelfCheckIn: z.boolean().default(true).optional(),
  allowWebPunch: z.boolean().default(true).optional(),
  allowMobilePunch: z.boolean().default(false).optional(),
  ipRestrictions: z.any().optional(),
  geofencingEnabled: z.boolean().default(false).optional(),
  geofenceRadiusMeters: z.coerce.number().int().optional().nullable(),
  autoCheckoutEnabled: z.boolean().default(false).optional(),
  autoCheckoutTime: z.string().optional().nullable(),
  effectiveFrom: z.string().or(z.date()).optional(),
  effectiveTo: z.string().or(z.date()).optional().nullable(),
  status: z.enum(['active', 'inactive', 'ACTIVE', 'INACTIVE']).default('active').optional(),
});

export const UpdateAttendancePolicySchema = CreateAttendancePolicySchema.partial();

export const AttendancePolicyQueryFilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const CreateShiftSchema = z.object({
  name: z.string().min(2, 'Shift name is required').max(100),
  code: z.string().min(1, 'Shift code is required').max(20),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:mm'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:mm'),
  isOvernight: z.boolean().default(false).optional(),
  isOvernightShift: z.boolean().default(false).optional(),
  breakDurationMinutes: z.coerce.number().int().min(0).max(300).default(60).optional(),
  breakDuration: z.coerce.number().int().min(0).max(300).default(60).optional(),
  isPaidBreak: z.boolean().default(false).optional(),
  paidBreakDuration: z.coerce.number().int().min(0).max(120).default(0).optional(),
  unpaidBreakDuration: z.coerce.number().int().min(0).max(300).default(60).optional(),
  checkInMarginBeforeMinutes: z.coerce.number().int().min(0).max(240).default(60).optional(),
  shiftMarginStart: z.coerce.number().int().min(0).max(240).default(60).optional(),
  checkOutMarginAfterMinutes: z.coerce.number().int().min(0).max(240).default(120).optional(),
  shiftMarginEnd: z.coerce.number().int().min(0).max(240).default(60).optional(),
  minHoursFullDay: z.coerce.number().min(1).max(24).default(8.0).optional(),
  minHoursHalfDay: z.coerce.number().min(0.5).max(12).default(4.0).optional(),
  colorCode: z.string().default('#3B82F6').optional(),
  isDefault: z.boolean().default(false).optional(),
  isRotatingShift: z.boolean().default(false).optional(),
  status: z.string().default('ACTIVE').optional(),
  policyId: z.string().uuid().optional().nullable(),
});

export const UpdateShiftSchema = CreateShiftSchema.partial();

export const ShiftQueryFilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const CreateRosterSchema = z.object({
  name: z.string().min(2, 'Roster name is required').max(100),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  locationId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  status: z.string().default('DRAFT').optional(),
});

export const UpdateRosterSchema = CreateRosterSchema.partial();

export const RosterQueryFilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const CreateShiftAssignmentSchema = z.object({
  employeeId: z.string().uuid('Valid employeeId required'),
  shiftId: z.string().uuid('Valid shiftId required'),
  rosterId: z.string().uuid().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false).optional(),
  recurrencePattern: z.string().optional().nullable(),
  isOverride: z.boolean().default(false).optional(),
  status: z.string().default('ACTIVE').optional(),
});

export const UpdateShiftAssignmentSchema = CreateShiftAssignmentSchema.partial();

export const ShiftAssignmentQueryFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  rosterId: z.string().uuid().optional(),
  status: z.string().optional(),
  effectiveDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const CheckInSchema = z.object({
  source: z.nativeEnum(CheckInSource).or(z.string()).default(CheckInSource.WEB).optional(),
  location: z.any().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  checkInTime: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export const CheckOutSchema = z.object({
  source: z.nativeEnum(CheckInSource).or(z.string()).default(CheckInSource.WEB).optional(),
  location: z.any().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export const ManualAttendanceSchema = z.object({
  employeeId: z.string().uuid('Valid employeeId required'),
  attendanceDate: z.string().min(1, 'Attendance date is required'),
  shiftId: z.string().uuid().optional().nullable(),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  breakMinutes: z.coerce.number().int().min(0).default(60).optional(),
  status: z.nativeEnum(AttendanceStatus).or(z.string()).optional(),
  attendanceStatus: z.nativeEnum(AttendanceStatus).or(z.string()).optional(),
  remarks: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const AttendanceRecordQueryFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});
export const AttendanceQueryFilterSchema = AttendanceRecordQueryFilterSchema;

export const CreateAttendanceRegularisationSchema = z.object({
  attendanceRecordId: z.string().min(1, 'Attendance record ID is required').optional(),
  attendanceDate: z.string().optional(),
  requestedCheckIn: z.string().optional().nullable(),
  requestedCheckInTime: z.string().optional().nullable(),
  requestedCheckOut: z.string().optional().nullable(),
  requestedCheckOutTime: z.string().optional().nullable(),
  requestedBreakMinutes: z.coerce.number().int().min(0).max(240).default(60).optional(),
  reason: z.nativeEnum(AttendanceRegularisationReason).or(z.string()),
  explanation: z.string().optional(),
  description: z.string().optional(),
  attachmentUrl: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export const RegularisationDecisionSchema = z.object({
  status: z.string().default('APPROVED').optional(),
  rejectionReason: z.string().optional().nullable(),
});

export const AttendanceRegularisationQueryFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const CreateOvertimeRequestSchema = z.object({
  attendanceRecordId: z.string().optional().nullable(),
  date: z.string().optional(),
  attendanceDate: z.string().optional(),
  overtimeMinutes: z.coerce.number().int().min(15, 'Minimum 15 minutes').max(720),
  reason: z.string().optional(),
  overtimeReason: z.string().optional(),
  overtimeType: z.nativeEnum(OvertimeType).or(z.string()).default(OvertimeType.DAILY).optional(),
  shiftId: z.string().uuid().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export const OvertimeDecisionSchema = z.object({
  status: z.string().default('APPROVED').optional(),
  rejectionReason: z.string().optional().nullable(),
});

export const OvertimeQueryFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const CreateAttendanceRequestSchema = z.object({
  requestType: z.nativeEnum(AttendanceRequestType).or(z.string()),
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  reason: z.string().min(3, 'Reason is required').max(1000),
  location: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export const AttendanceRequestDecisionSchema = z.object({
  status: z.string().default('APPROVED').optional(),
  rejectionReason: z.string().optional().nullable(),
});

export const AttendanceRequestQueryFilterSchema = z.object({
  employeeId: z.string().uuid().optional(),
  requestType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const LockAttendancePeriodSchema = z.object({
  name: z.string().default('Cutoff Lock').optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  remarks: z.string().max(500).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});

// Infer types
export type CreateAttendancePolicyInput = z.infer<typeof CreateAttendancePolicySchema>;
export type UpdateAttendancePolicyInput = z.infer<typeof UpdateAttendancePolicySchema>;
export type AttendancePolicyQueryFilterInput = z.infer<typeof AttendancePolicyQueryFilterSchema>;

export type CreateShiftInput = z.infer<typeof CreateShiftSchema>;
export type UpdateShiftInput = z.infer<typeof UpdateShiftSchema>;
export type ShiftQueryFilterInput = z.infer<typeof ShiftQueryFilterSchema>;

export type CreateRosterInput = z.infer<typeof CreateRosterSchema>;
export type UpdateRosterInput = z.infer<typeof UpdateRosterSchema>;
export type RosterQueryFilterInput = z.infer<typeof RosterQueryFilterSchema>;

export type CreateShiftAssignmentInput = z.infer<typeof CreateShiftAssignmentSchema>;
export type UpdateShiftAssignmentInput = z.infer<typeof UpdateShiftAssignmentSchema>;
export type ShiftAssignmentQueryFilterInput = z.infer<typeof ShiftAssignmentQueryFilterSchema>;

export type CheckInInput = z.infer<typeof CheckInSchema>;
export type CheckOutInput = z.infer<typeof CheckOutSchema>;
export type ManualAttendanceInput = z.infer<typeof ManualAttendanceSchema>;
export type AttendanceQueryFilterInput = z.infer<typeof AttendanceQueryFilterSchema>;
export type AttendanceRecordQueryFilterInput = AttendanceQueryFilterInput;

export type CreateAttendanceRegularisationInput = z.infer<typeof CreateAttendanceRegularisationSchema>;
export type RegularisationDecisionInput = z.infer<typeof RegularisationDecisionSchema>;
export type AttendanceRegularisationQueryFilterInput = z.infer<typeof AttendanceRegularisationQueryFilterSchema>;

export type CreateOvertimeRequestInput = z.infer<typeof CreateOvertimeRequestSchema>;
export type OvertimeDecisionInput = z.infer<typeof OvertimeDecisionSchema>;
export type OvertimeQueryFilterInput = z.infer<typeof OvertimeQueryFilterSchema>;

export type CreateAttendanceRequestInput = z.infer<typeof CreateAttendanceRequestSchema>;
export type AttendanceRequestDecisionInput = z.infer<typeof AttendanceRequestDecisionSchema>;
export type AttendanceRequestQueryFilterInput = z.infer<typeof AttendanceRequestQueryFilterSchema>;

export type LockAttendancePeriodInput = z.infer<typeof LockAttendancePeriodSchema>;

// DTO Interfaces
export interface AttendancePolicyDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  applicableLocations: string[];
  applicableDepartments: string[];
  applicableDesignations: string[];
  applicableGrades: string[];
  applicableEmploymentTypes: string[];
  applicableShifts: string[];
  attendanceMode: string;
  expectedWorkingHoursPerDay: number;
  minHoursFullDay: number;
  minHoursHalfDay: number;
  weeklyWorkingDays: string[];
  weekendDays: string[];
  breakPolicy: string;
  paidBreakDuration: number;
  unpaidBreakDuration: number;
  gracePeriodLateCheckIn: number;
  gracePeriodEarlyCheckOut: number;
  maxAllowedLateArrivals: number;
  maxAllowedEarlyDepartures: number;
  deviationTrackingPeriod: string;
  absencePenaltyLeaveType?: string | null;
  absencePenaltyDeduction?: number | null;
  allowOvertime: boolean;
  overtimeCalculationMethod: string;
  overtimeApprovalRequired: boolean;
  allowRegularisation: boolean;
  regularisationApprovalRequired: boolean;
  allowOnDutyRequests: boolean;
  allowWorkFromHomeRequests: boolean;
  allowAttendanceEditByManager: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  paidBreakDuration: number;
  unpaidBreakDuration: number;
  shiftMarginStart: number;
  shiftMarginEnd: number;
  minHoursFullDay: number;
  minHoursHalfDay: number;
  isOvernightShift: boolean;
  isRotatingShift: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RosterDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  locationId?: string | null;
  locationName?: string;
  departmentId?: string | null;
  departmentName?: string;
  status: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignmentDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  shiftId: string;
  shiftName?: string;
  shiftCode?: string;
  shiftTiming?: string;
  rosterId?: string | null;
  rosterName?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecordDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  attendanceDate: string;
  shiftId?: string | null;
  shiftName?: string;
  shiftCode?: string;
  shiftTiming?: string;
  attendancePolicyId?: string | null;
  attendancePolicyName?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInSource?: string | null;
  checkOutSource?: string | null;
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
  checkInIpAddress?: string | null;
  checkOutIpAddress?: string | null;
  workedMinutes: number;
  breakMinutes: number;
  paidBreakMinutes: number;
  payableMinutes: number;
  overtimeMinutes: number;
  deviationMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  attendanceStatus: AttendanceStatus;
  regularisationStatus?: string | null;
  leaveRequestId?: string | null;
  holidayId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRegularisationDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  attendanceRecordId?: string | null;
  attendanceDate: string;
  requestedCheckInTime?: string | null;
  requestedCheckOutTime?: string | null;
  requestedBreakMinutes?: number | null;
  reason: AttendanceRegularisationReason;
  description: string;
  attachmentUrl?: string | null;
  status: string;
  approvalFlowId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OvertimeRequestDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  attendanceDate: string;
  shiftId?: string | null;
  shiftName?: string;
  overtimeMinutes: number;
  overtimeReason: string;
  overtimeType: OvertimeType;
  status: string;
  approvalFlowId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRequestDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  requestType: AttendanceRequestType;
  fromDate: string;
  toDate: string;
  reason: string;
  location?: string | null;
  attachmentUrl?: string | null;
  status: string;
  approvalFlowId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLockDto {
  id: string;
  organizationId: string;
  startDate: string;
  endDate: string;
  lockedBy: string;
  reason?: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummaryDto {
  employeeId: string;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  holidayDays: number;
  weekendDays: number;
  onDutyDays: number;
  wfhDays: number;
  lateArrivals: number;
  earlyDepartures: number;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
  pendingRegularisations: number;
  pendingOvertime: number;
}

// ==========================================
// PAYROLL FOUNDATION ENUMS, SCHEMAS & DTOS
// ==========================================

export enum SalaryComponentType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION',
  REIMBURSEMENT = 'REIMBURSEMENT',
  BENEFIT = 'BENEFIT',
  VARIABLE_PAY = 'VARIABLE_PAY',
  ARREAR = 'ARREAR',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum CalculationType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE_OF_BASIC = 'PERCENTAGE_OF_BASIC',
  PERCENTAGE_OF_GROSS = 'PERCENTAGE_OF_GROSS',
  PERCENTAGE_OF_CTC = 'PERCENTAGE_OF_CTC',
  FORMULA_BASED = 'FORMULA_BASED',
  ATTENDANCE_BASED = 'ATTENDANCE_BASED',
  MANUAL_INPUT = 'MANUAL_INPUT',
}

export enum PayrollPeriodStatus {
  UPCOMING = 'UPCOMING',
  OPEN = 'OPEN',
  INPUT_COLLECTION = 'INPUT_COLLECTION',
  CALCULATED = 'CALCULATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PAYMENT_IN_PROGRESS = 'PAYMENT_IN_PROGRESS',
  PAID = 'PAID',
  PAYSLIP_GENERATED = 'PAYSLIP_GENERATED',
  PUBLISHED = 'PUBLISHED',
  LOCKED = 'LOCKED',
  CANCELLED = 'CANCELLED',
}

export enum PayrollRunType {
  REGULAR = 'REGULAR',
  OFF_CYCLE = 'OFF_CYCLE',
  BONUS = 'BONUS',
  ARREARS = 'ARREARS',
  FINAL_SETTLEMENT = 'FINAL_SETTLEMENT',
}

export enum PayrollRunStatus {
  DRAFT = 'DRAFT',
  PENDING_INPUTS = 'PENDING_INPUTS',
  CALCULATED = 'CALCULATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAYMENT_IN_PROGRESS = 'PAYMENT_IN_PROGRESS',
  PAID = 'PAID',
  PAYSLIP_GENERATED = 'PAYSLIP_GENERATED',
  PUBLISHED = 'PUBLISHED',
  LOCKED = 'LOCKED',
  CANCELLED = 'CANCELLED',
}

export enum PayrollPaymentStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  ON_HOLD = 'ON_HOLD',
}

export enum PayslipStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  PUBLISHED = 'PUBLISHED',
  ON_HOLD = 'ON_HOLD',
}

export enum PayrollInputType {
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  LOP = 'LOP',
  OVERTIME = 'OVERTIME',
  BONUS = 'BONUS',
  INCENTIVE = 'INCENTIVE',
  ARREARS = 'ARREARS',
  REIMBURSEMENT = 'REIMBURSEMENT',
  LOAN_EMI = 'LOAN_EMI',
  ADVANCE_DEDUCTION = 'ADVANCE_DEDUCTION',
  OTHER_EARNING = 'OTHER_EARNING',
  OTHER_DEDUCTION = 'OTHER_DEDUCTION',
}

export enum PayrollExceptionSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

// Zod Schemas
export const CreateSalaryComponentSchema = z.object({
  name: z.string().trim().min(2, 'Component name must be at least 2 characters').max(100),
  componentCode: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase letters, numbers, and underscores'),
  componentType: z.nativeEnum(SalaryComponentType),
  calculationType: z.nativeEnum(CalculationType),
  amount: z.number().min(0).optional().default(0),
  percentage: z.number().min(0).max(100).optional().default(0),
  formula: z.string().optional().nullable(),
  taxable: z.boolean().default(true),
  includeInCtc: z.boolean().default(true),
  includeInGross: z.boolean().default(true),
  includeInNetPay: z.boolean().default(true),
  includeInStatutoryWages: z.boolean().default(false),
  payslipLabel: z.string().trim().min(1, 'Payslip label is required').max(100),
  payslipDisplayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isSystemDefined: z.boolean().default(false),
  effectiveFrom: z.string().optional().nullable(),
  effectiveTo: z.string().optional().nullable(),
});

export const UpdateSalaryComponentSchema = CreateSalaryComponentSchema.partial();

export const SalaryStructureComponentInputSchema = z.object({
  salaryComponentId: z.string().uuid(),
  calculationType: z.nativeEnum(CalculationType),
  amount: z.number().min(0).default(0),
  percentage: z.number().min(0).max(100).default(0),
  formula: z.string().optional().nullable(),
  payslipDisplayOrder: z.number().int().default(0),
  isMandatory: z.boolean().default(true),
  isEditable: z.boolean().default(true),
});

export const CreateSalaryStructureSchema = z.object({
  name: z.string().trim().min(2, 'Structure name must be at least 2 characters').max(100),
  description: z.string().optional().nullable(),
  annualCtc: z.number().min(0, 'Annual CTC must be >= 0'),
  currency: z.string().default('INR'),
  effectiveFrom: z.string().optional().nullable(),
  effectiveTo: z.string().optional().nullable(),
  status: z.string().default('ACTIVE'),
  isDefault: z.boolean().default(false),
  components: z.array(SalaryStructureComponentInputSchema).min(1, 'At least one salary component is required'),
});

export const UpdateSalaryStructureSchema = CreateSalaryStructureSchema.partial();

export const AssignSalaryStructureSchema = z.object({
  employeeId: z.string().uuid(),
  salaryStructureId: z.string().uuid(),
  annualCtc: z.number().positive('Annual CTC must be greater than zero'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional().nullable(),
  componentOverrides: z.record(z.any()).optional().nullable(),
  revisionReason: z.string().optional().nullable(),
});

export const CreateSalaryRevisionSchema = z.object({
  salaryStructureId: z.string().uuid(),
  annualCtc: z.number().positive('Annual CTC must be greater than zero'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional().nullable(),
  componentOverrides: z.record(z.any()).optional().nullable(),
  revisionReason: z.string().min(2, 'Revision reason is required'),
});

export const CreatePayrollPeriodSchema = z.object({
  payrollYear: z.number().int().min(2000).max(2100),
  payrollMonth: z.number().int().min(1).max(12),
  periodStartDate: z.string().min(1, 'Period start date is required'),
  periodEndDate: z.string().min(1, 'Period end date is required'),
  payDate: z.string().min(1, 'Pay date is required'),
  attendanceCutoffDate: z.string().min(1, 'Attendance cutoff date is required'),
  leaveCutoffDate: z.string().min(1, 'Leave cutoff date is required'),
  payrollCutoffDate: z.string().min(1, 'Payroll cutoff date is required'),
});

export const UpdatePayrollPeriodSchema = CreatePayrollPeriodSchema.partial();

export const CreatePayrollRunSchema = z.object({
  payrollPeriodId: z.string().uuid(),
  runName: z.string().trim().min(2, 'Run name is required').max(100),
  runType: z.nativeEnum(PayrollRunType).default(PayrollRunType.REGULAR),
});

export const UpdatePayrollRunSchema = z.object({
  runName: z.string().trim().min(2).max(100).optional(),
});

export const CreatePayrollInputSchema = z.object({
  employeeId: z.string().uuid(),
  inputType: z.nativeEnum(PayrollInputType),
  componentId: z.string().uuid().optional().nullable(),
  amount: z.number(),
  units: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  reason: z.string().min(2, 'Reason is required'),
});

export const UpdatePayrollInputSchema = CreatePayrollInputSchema.partial();

export const ResolveExceptionSchema = z.object({
  resolutionNotes: z.string().min(2, 'Resolution notes are required'),
});

export const OverrideExceptionSchema = z.object({
  overrideReason: z.string().min(2, 'Override reason is required'),
});

export const MarkPaidSchema = z.object({
  paymentDate: z.string().optional(),
  paymentReference: z.string().min(2, 'Payment reference is required'),
  paymentNotes: z.string().optional().nullable(),
});

export const PaymentProofSchema = z.object({
  paymentProofUrl: z.string().min(1, 'Proof URL or path is required'),
  paymentReference: z.string().optional(),
  paymentNotes: z.string().optional(),
});

export const CreatePayslipTemplateSchema = z.object({
  name: z.string().trim().min(2, 'Template name is required').max(100),
  isDefault: z.boolean().default(false),
  pageSize: z.string().default('A4'),
  orientation: z.string().default('PORTRAIT'),
  margins: z.record(z.any()).optional().nullable(),
  fontFamily: z.string().default('Inter, sans-serif'),
  fontSize: z.number().default(12),
  primaryColor: z.string().default('#1E3A8A'),
  secondaryColor: z.string().default('#64748B'),
  headerSettings: z.record(z.any()).optional().nullable(),
  footerSettings: z.record(z.any()).optional().nullable(),
  watermarkSettings: z.record(z.any()).optional().nullable(),
  stampSettings: z.record(z.any()).optional().nullable(),
  signatureSettings: z.record(z.any()).optional().nullable(),
  showEmployerContributions: z.boolean().default(true),
  showReimbursements: z.boolean().default(true),
  showBankAccount: z.boolean().default(true),
  bankAccountMasking: z.string().default('LAST_4'),
  currencyFormat: z.string().default('INR'),
  numberFormat: z.string().default('en-IN'),
  dateFormat: z.string().default('DD/MM/YYYY'),
  htmlTemplate: z.string().optional().nullable(),
});

export const UpdatePayslipTemplateSchema = CreatePayslipTemplateSchema.partial();

// TypeScript DTOs
export interface SalaryComponentDto {
  id: string;
  organizationId: string;
  name: string;
  componentCode: string;
  componentType: SalaryComponentType;
  calculationType: CalculationType;
  amount: number;
  percentage: number;
  formula?: string | null;
  taxable: boolean;
  includeInCtc: boolean;
  includeInGross: boolean;
  includeInNetPay: boolean;
  includeInStatutoryWages: boolean;
  payslipLabel: string;
  payslipDisplayOrder: number;
  isActive: boolean;
  isSystemDefined: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructureComponentDto {
  id: string;
  salaryStructureId: string;
  salaryComponentId: string;
  salaryComponent?: SalaryComponentDto;
  calculationType: CalculationType;
  amount: number;
  percentage: number;
  formula?: string | null;
  payslipDisplayOrder: number;
  isMandatory: boolean;
  isEditable: boolean;
}

export interface SalaryStructureDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  annualCtc: number;
  monthlyCtc: number;
  currency: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  status: string;
  isDefault: boolean;
  createdBy?: string | null;
  components: SalaryStructureComponentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryAssignmentDto {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  designationName?: string;
  salaryStructureId: string;
  salaryStructureName?: string;
  annualCtc: number;
  monthlyCtc: number;
  monthlyGross: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: string;
  revisionReason?: string | null;
  componentOverrides?: Record<string, any>;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriodDto {
  id: string;
  organizationId: string;
  payrollYear: number;
  payrollMonth: number;
  periodStartDate: string;
  periodEndDate: string;
  payDate: string;
  attendanceCutoffDate: string;
  leaveCutoffDate: string;
  payrollCutoffDate: string;
  status: PayrollPeriodStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRunDto {
  id: string;
  organizationId: string;
  payrollPeriodId: string;
  payrollPeriod?: PayrollPeriodDto;
  runName: string;
  runType: PayrollRunType;
  status: PayrollRunStatus;
  totalEmployeeCount: number;
  totalGrossEarnings: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  totalNetPay: number;
  totalCtcCost: number;
  calculatedBy?: string | null;
  calculatedAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  paymentDate?: string | null;
  paymentReference?: string | null;
  paymentProofUrl?: string | null;
  paymentNotes?: string | null;
  idempotencyKey?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollEmployeeRecordDto {
  id: string;
  organizationId: string;
  payrollRunId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  designationName?: string;
  salaryStructureId?: string | null;
  salaryAssignmentId?: string | null;
  payableDays: number;
  lopDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  weekendDays: number;
  presentDays: number;
  overtimeMinutes: number;
  overtimeAmount: number;
  bonusAmount: number;
  incentiveAmount: number;
  arrearsAmount: number;
  reimbursementAmount: number;
  adjustmentAmount: number;
  grossEarnings: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  netPay: number;
  paymentStatus: PayrollPaymentStatus;
  paymentDate?: string | null;
  paymentReference?: string | null;
  payslipStatus: PayslipStatus;
  payslipUrl?: string | null;
  snapshotData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollInputDto {
  id: string;
  organizationId: string;
  payrollRunId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  inputType: PayrollInputType;
  componentId?: string | null;
  componentName?: string;
  amount: number;
  units?: number | null;
  description?: string | null;
  reason?: string | null;
  isApproved: boolean;
  approvedBy?: string | null;
  isLocked: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollExceptionDto {
  id: string;
  organizationId: string;
  payrollRunId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  exceptionCode: string;
  severity: PayrollExceptionSeverity;
  message: string;
  details?: Record<string, any>;
  isResolved: boolean;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  isOverridden: boolean;
  overrideReason?: string | null;
  overriddenBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayslipTemplateDto {
  id: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  pageSize: string;
  orientation: string;
  margins?: Record<string, any>;
  fontFamily: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  headerSettings?: Record<string, any>;
  footerSettings?: Record<string, any>;
  watermarkSettings?: Record<string, any>;
  stampSettings?: Record<string, any>;
  signatureSettings?: Record<string, any>;
  showEmployerContributions: boolean;
  showReimbursements: boolean;
  showBankAccount: boolean;
  bankAccountMasking: string;
  currencyFormat: string;
  numberFormat: string;
  dateFormat: string;
  htmlTemplate?: string | null;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayslipDto {
  id: string;
  organizationId: string;
  payrollRunId: string;
  payrollPeriodId: string;
  payrollEmployeeRecordId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  designationName?: string;
  templateId?: string | null;
  templateVersion: number;
  payslipNumber: string;
  periodName: string;
  payDate: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  netPayWords: string;
  earningsBreakdown: Array<{ name: string; code: string; amount: number; type: string }>;
  deductionsBreakdown: Array<{ name: string; code: string; amount: number; type: string }>;
  contributionsBreakdown: Array<{ name: string; code: string; amount: number }>;
  ytdEarnings: number;
  ytdDeductions: number;
  ytdNetPay: number;
  status: PayslipStatus;
  pdfUrl?: string | null;
  pdfGeneratedAt?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  viewCount: number;
  lastViewedAt?: string | null;
  downloadCount: number;
  lastDownloadedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

