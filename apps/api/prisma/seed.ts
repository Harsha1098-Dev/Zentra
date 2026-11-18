import { PrismaClient } from '@prisma/client';
import { DEFAULT_ROLE_PERMISSIONS, PermissionCode, RoleCode } from '@zentra/shared-types';

const prisma = new PrismaClient();

const BASE_PERMISSIONS: { code: string; name: string; description: string }[] = [
  { code: 'auth.manage', name: 'Manage Authentication', description: 'Full access to authentication settings' },
  { code: 'organization.read', name: 'Read Organization', description: 'View organization details' },
  { code: 'organization.update', name: 'Update Organization', description: 'Update organization settings' },
  { code: 'organization.logo.manage', name: 'Manage Organization Logo', description: 'Upload and delete company logo' },
  { code: 'user.read', name: 'Read Users', description: 'View users in the organization' },
  { code: 'user.invite', name: 'Invite Users', description: 'Invite users to the organization' },
  { code: 'user.manage', name: 'Manage Users', description: 'Manage user status and memberships' },
  { code: 'role.read', name: 'Read Roles', description: 'View roles and permissions' },
  { code: 'role.manage', name: 'Manage Roles', description: 'Create and modify custom roles' },
  { code: 'permission.read', name: 'Read Permissions', description: 'View system permissions' },
  { code: 'audit.read', name: 'Read Audit Logs', description: 'View audit logs for the organization' },
  { code: 'product.read', name: 'Read Products', description: 'View product subscriptions and entitlements' },

  // Organization Setup Permissions
  { code: 'location.read', name: 'Read Locations', description: 'View company locations' },
  { code: 'location.create', name: 'Create Location', description: 'Create new company location' },
  { code: 'location.update', name: 'Update Location', description: 'Update location details' },
  { code: 'location.deactivate', name: 'Deactivate Location', description: 'Activate or deactivate company locations' },

  { code: 'department.read', name: 'Read Departments', description: 'View departments and hierarchy' },
  { code: 'department.create', name: 'Create Department', description: 'Create company departments' },
  { code: 'department.update', name: 'Update Department', description: 'Update department details and parent' },
  { code: 'department.deactivate', name: 'Deactivate Department', description: 'Activate or deactivate departments' },

  { code: 'designation.read', name: 'Read Designations', description: 'View job titles and designations' },
  { code: 'designation.create', name: 'Create Designation', description: 'Create company designations' },
  { code: 'designation.update', name: 'Update Designation', description: 'Update designation details' },
  { code: 'designation.deactivate', name: 'Deactivate Designation', description: 'Activate or deactivate designations' },

  { code: 'grade.read', name: 'Read Grades', description: 'View employee grades and salary bands' },
  { code: 'grade.create', name: 'Create Grade', description: 'Create company grade' },
  { code: 'grade.update', name: 'Update Grade', description: 'Update grade level and details' },
  { code: 'grade.deactivate', name: 'Deactivate Grade', description: 'Activate or deactivate grades' },

  { code: 'workweek.read', name: 'Read Workweek', description: 'View workweek schedules' },
  { code: 'workweek.update', name: 'Update Workweek', description: 'Configure working days and shift hours' },

  { code: 'holiday.read', name: 'Read Holidays', description: 'View holiday calendars' },
  { code: 'holiday.create', name: 'Create Holiday', description: 'Add new holiday to calendar' },
  { code: 'holiday.update', name: 'Update Holiday', description: 'Edit holiday details' },
  { code: 'holiday.delete', name: 'Delete Holiday', description: 'Remove holiday from calendar' },

  { code: 'organization_chart.read', name: 'Read Organization Chart', description: 'View organization chart structure' },

  // Employee Management Permissions
  { code: 'employee.read', name: 'Read Employees', description: 'View full employee profiles and directory' },
  { code: 'employee.read_basic', name: 'Read Basic Employees', description: 'View basic colleague directory information' },
  { code: 'employee.create', name: 'Create Employee', description: 'Create employee records and trigger invitations' },
  { code: 'employee.update', name: 'Update Employee', description: 'Edit employee details' },
  { code: 'employee.delete', name: 'Delete Employee', description: 'Soft delete employee records' },
  { code: 'employee.status.manage', name: 'Manage Employee Status', description: 'Change employee lifecycle statuses' },
  { code: 'employee.reporting_manager.manage', name: 'Manage Reporting Manager', description: 'Reassign employee reporting managers' },
  { code: 'employee.department.manage', name: 'Manage Employee Department', description: 'Transfer employee departments' },
  { code: 'employee.designation.manage', name: 'Manage Employee Designation', description: 'Change employee job designations' },
  { code: 'employee.location.manage', name: 'Manage Employee Location', description: 'Change employee work locations' },
  { code: 'employee.employment_type.manage', name: 'Manage Employment Type', description: 'Change employment types' },
  { code: 'employee.import', name: 'Import Employees', description: 'Bulk import employees via CSV' },
  { code: 'employee.export', name: 'Export Employees', description: 'Export employee dataset to CSV' },
  { code: 'employee.timeline.read', name: 'Read Employee Timeline', description: 'View employee milestone timeline' },
  { code: 'employee.employment_history.read', name: 'Read Employment History', description: 'View complete employment history events' },

  // Workflow Engine Permissions
  { code: 'workflow.read', name: 'Read Workflows', description: 'View workflow rules and executions' },
  { code: 'workflow.create', name: 'Create Workflow', description: 'Create new workflow rules' },
  { code: 'workflow.update', name: 'Update Workflow', description: 'Update workflow rules, triggers, and actions' },
  { code: 'workflow.delete', name: 'Delete Workflow', description: 'Delete or deactivate workflow rules' },
  { code: 'workflow.execute', name: 'Execute Workflow', description: 'Trigger workflow execution' },
  { code: 'workflow.test', name: 'Test Workflow', description: 'Simulate workflow rule against sample payload' },

  // Approval Engine Permissions
  { code: 'approval.read', name: 'Read Approvals', description: 'View approval requests and inbox' },
  { code: 'approval.approve', name: 'Approve Request', description: 'Approve an assigned approval step' },
  { code: 'approval.reject', name: 'Reject Request', description: 'Reject an assigned approval step' },
  { code: 'approval.delegate', name: 'Delegate Approval', description: 'Delegate approval to another user' },
  { code: 'approval.reassign', name: 'Reassign Approval', description: 'Reassign approval step to another approver' },
  { code: 'approval.cancel', name: 'Cancel Approval', description: 'Cancel an initiated approval request' },
  { code: 'approval.escalate', name: 'Escalate Approval', description: 'Escalate approval step past due date' },

  // Checklist Permissions
  { code: 'checklist.read', name: 'Read Checklists', description: 'View checklists and checklist runs' },
  { code: 'checklist.create', name: 'Create Checklist', description: 'Create reusable onboarding/offboarding checklists' },
  { code: 'checklist.update', name: 'Update Checklist', description: 'Edit checklist and item details' },
  { code: 'checklist.delete', name: 'Delete Checklist', description: 'Remove checklist template' },
  { code: 'checklist.execute', name: 'Execute Checklist', description: 'Instantiate a checklist run for an employee' },

  // Task Permissions
  { code: 'task.read', name: 'Read Tasks', description: 'View assigned or organization tasks' },
  { code: 'task.create', name: 'Create Task', description: 'Create tasks and assignments' },
  { code: 'task.update', name: 'Update Task', description: 'Update task details and due date' },
  { code: 'task.complete', name: 'Complete Task', description: 'Mark task as completed' },
  { code: 'task.reassign', name: 'Reassign Task', description: 'Reassign task to another user' },

  // Delegation Permissions
  { code: 'delegation.manage', name: 'Manage Delegations', description: 'Configure approval delegations' },

  // Leave Management Permissions
  { code: 'leave.read', name: 'Read Leaves', description: 'View leave requests and balances' },
  { code: 'leave.read_own', name: 'Read Own Leaves', description: 'View own leave requests and balances' },
  { code: 'leave.read_team', name: 'Read Team Leaves', description: 'View reportees leave requests and balances' },
  { code: 'leave.read_all', name: 'Read All Leaves', description: 'View organization-wide leave requests and balances' },
  { code: 'leave.apply', name: 'Apply Leave', description: 'Submit leave request for self' },
  { code: 'leave.apply_for_reportee', name: 'Apply Leave for Reportee', description: 'Submit leave request on behalf of a reportee' },
  { code: 'leave.cancel', name: 'Cancel Leave', description: 'Cancel pending or approved leave request' },
  { code: 'leave.cancel_approved', name: 'Cancel Approved Leave', description: 'Cancel approved leave requests' },
  { code: 'leave.approve', name: 'Approve Leave', description: 'Approve leave request' },
  { code: 'leave.reject', name: 'Reject Leave', description: 'Reject leave request' },
  { code: 'leave.override', name: 'Override Leave Decision', description: 'HR Admin override on leave requests' },
  { code: 'leave.adjust_balance', name: 'Adjust Leave Balance', description: 'Manually credit or debit employee leave balances' },
  { code: 'leave.policy.read', name: 'Read Leave Policies', description: 'View leave policies' },
  { code: 'leave.policy.create', name: 'Create Leave Policy', description: 'Create leave policy rules and entitlements' },
  { code: 'leave.policy.update', name: 'Update Leave Policy', description: 'Update leave policy rules' },
  { code: 'leave.policy.delete', name: 'Delete Leave Policy', description: 'Delete or deactivate leave policy' },
  { code: 'leave.type.read', name: 'Read Leave Types', description: 'View leave types' },
  { code: 'leave.type.create', name: 'Create Leave Type', description: 'Create new leave types' },
  { code: 'leave.type.update', name: 'Update Leave Type', description: 'Edit leave type properties and options' },
  { code: 'leave.type.delete', name: 'Delete Leave Type', description: 'Deactivate leave types' },
  { code: 'leave.compoff.apply', name: 'Apply Comp-Off', description: 'Submit compensatory off request' },
  { code: 'leave.compoff.approve', name: 'Approve Comp-Off', description: 'Approve or reject compensatory off request' },
  { code: 'leave.report.view', name: 'View Leave Reports', description: 'Access leave reports and summaries' },
  { code: 'leave.report.export', name: 'Export Leave Reports', description: 'Download CSV leave reports' },

  // Attendance & Time Tracking Permissions
  { code: 'attendance.read', name: 'Read Attendance', description: 'View general attendance data' },
  { code: 'attendance.read_own', name: 'Read Own Attendance', description: 'View own attendance history and logs' },
  { code: 'attendance.read_team', name: 'Read Team Attendance', description: 'View reportees attendance records' },
  { code: 'attendance.read_all', name: 'Read All Attendance', description: 'View organization-wide attendance records' },
  { code: 'attendance.check_in', name: 'Attendance Check-In', description: 'Punch in/check-in attendance' },
  { code: 'attendance.check_out', name: 'Attendance Check-Out', description: 'Punch out/check-out attendance' },
  { code: 'attendance.regularise', name: 'Regularise Attendance', description: 'Submit attendance regularisation request' },
  { code: 'attendance.regularise_approve', name: 'Approve Regularisation', description: 'Approve attendance regularisation requests' },
  { code: 'attendance.regularise_override', name: 'Override Regularisation', description: 'HR Admin override on regularisation requests' },
  { code: 'attendance.overtime.read', name: 'Read Overtime', description: 'View overtime records' },
  { code: 'attendance.overtime.apply', name: 'Apply Overtime', description: 'Submit overtime claim request' },
  { code: 'attendance.overtime.approve', name: 'Approve Overtime', description: 'Approve or reject overtime claim' },
  { code: 'attendance.overtime.override', name: 'Override Overtime', description: 'HR Admin override on overtime claims' },
  { code: 'attendance.onduty.apply', name: 'Apply On-Duty', description: 'Submit on-duty attendance request' },
  { code: 'attendance.onduty.approve', name: 'Approve On-Duty', description: 'Approve on-duty attendance request' },
  { code: 'attendance.wfh.apply', name: 'Apply WFH', description: 'Submit work from home request' },
  { code: 'attendance.wfh.approve', name: 'Approve WFH', description: 'Approve work from home request' },
  { code: 'attendance.policy.read', name: 'Read Attendance Policies', description: 'View attendance policies' },
  { code: 'attendance.policy.create', name: 'Create Attendance Policy', description: 'Create attendance policy rules' },
  { code: 'attendance.policy.update', name: 'Update Attendance Policy', description: 'Update attendance policy configuration' },
  { code: 'attendance.policy.delete', name: 'Delete Attendance Policy', description: 'Deactivate attendance policy' },
  { code: 'attendance.shift.read', name: 'Read Shifts', description: 'View shift timings and definitions' },
  { code: 'attendance.shift.create', name: 'Create Shift', description: 'Create work shift definitions' },
  { code: 'attendance.shift.update', name: 'Update Shift', description: 'Update work shift timings and margins' },
  { code: 'attendance.shift.delete', name: 'Delete Shift', description: 'Deactivate work shifts' },
  { code: 'attendance.roster.read', name: 'Read Rosters', description: 'View rosters and shift calendars' },
  { code: 'attendance.roster.create', name: 'Create Roster', description: 'Create and plan work rosters' },
  { code: 'attendance.roster.update', name: 'Update Roster', description: 'Update and publish work rosters' },
  { code: 'attendance.roster.delete', name: 'Delete Roster', description: 'Archive work rosters' },
  { code: 'attendance.lock', name: 'Lock Attendance Period', description: 'Freeze attendance records for payroll cutoff' },
  { code: 'attendance.report.view', name: 'View Attendance Reports', description: 'Access attendance analytics and summaries' },
  { code: 'attendance.report.export', name: 'Export Attendance Reports', description: 'Export attendance data to CSV' },

  // Payroll Foundation Permissions
  { code: 'payroll.read', name: 'Read Payroll', description: 'View general payroll information' },
  { code: 'payroll.read_own', name: 'Read Own Payroll', description: 'View own salary structure and payslips' },
  { code: 'payroll.read_all', name: 'Read All Payroll', description: 'View organization-wide payroll data' },
  { code: 'payroll.salary_component.read', name: 'Read Salary Components', description: 'View salary components' },
  { code: 'payroll.salary_component.create', name: 'Create Salary Component', description: 'Create new salary components' },
  { code: 'payroll.salary_component.update', name: 'Update Salary Component', description: 'Update salary components' },
  { code: 'payroll.salary_component.delete', name: 'Delete Salary Component', description: 'Delete salary components' },
  { code: 'payroll.salary_structure.read', name: 'Read Salary Structures', description: 'View salary structure templates' },
  { code: 'payroll.salary_structure.create', name: 'Create Salary Structure', description: 'Create salary structure templates' },
  { code: 'payroll.salary_structure.update', name: 'Update Salary Structure', description: 'Update salary structure templates' },
  { code: 'payroll.salary_structure.delete', name: 'Delete Salary Structure', description: 'Delete salary structure templates' },
  { code: 'payroll.salary_structure.assign', name: 'Assign Salary Structure', description: 'Assign salary structures to employees' },
  { code: 'payroll.salary_revision.create', name: 'Create Salary Revision', description: 'Propose compensation revisions' },
  { code: 'payroll.salary_revision.approve', name: 'Approve Salary Revision', description: 'Approve or reject compensation revisions' },
  { code: 'payroll.period.read', name: 'Read Payroll Periods', description: 'View payroll periods' },
  { code: 'payroll.period.create', name: 'Create Payroll Period', description: 'Create monthly payroll periods' },
  { code: 'payroll.period.update', name: 'Update Payroll Period', description: 'Update cutoffs and pay dates' },
  { code: 'payroll.period.lock', name: 'Lock Payroll Period', description: 'Lock payroll period after completion' },
  { code: 'payroll.run.read', name: 'Read Payroll Runs', description: 'View payroll execution runs' },
  { code: 'payroll.run.create', name: 'Create Payroll Run', description: 'Initialize payroll run' },
  { code: 'payroll.run.calculate', name: 'Calculate Payroll Run', description: 'Execute payroll computation engine' },
  { code: 'payroll.run.submit', name: 'Submit Payroll Run', description: 'Submit payroll run for sign-off' },
  { code: 'payroll.run.approve', name: 'Approve Payroll Run', description: 'Sign-off and approve payroll run' },
  { code: 'payroll.run.reject', name: 'Reject Payroll Run', description: 'Reject payroll run with feedback' },
  { code: 'payroll.run.cancel', name: 'Cancel Payroll Run', description: 'Cancel active payroll run' },
  { code: 'payroll.run.lock', name: 'Lock Payroll Run', description: 'Lock approved and paid payroll run' },
  { code: 'payroll.input.read', name: 'Read Payroll Inputs', description: 'View payroll inputs and adjustments' },
  { code: 'payroll.input.create', name: 'Create Payroll Input', description: 'Add bonus, arrears, or manual adjustment' },
  { code: 'payroll.input.update', name: 'Update Payroll Input', description: 'Modify payroll adjustments' },
  { code: 'payroll.input.delete', name: 'Delete Payroll Input', description: 'Remove manual payroll adjustment' },
  { code: 'payroll.exception.read', name: 'Read Payroll Exceptions', description: 'View flagged payroll exceptions' },
  { code: 'payroll.exception.resolve', name: 'Resolve Payroll Exception', description: 'Resolve or override payroll exceptions' },
  { code: 'payroll.payment.read', name: 'Read Payroll Payments', description: 'View payment statuses and audit logs' },
  { code: 'payroll.payment.mark_paid', name: 'Mark Payroll Paid', description: 'Record payment execution' },
  { code: 'payroll.payment.upload_proof', name: 'Upload Payment Proof', description: 'Upload bank advice or payment receipt' },
  { code: 'payroll.payslip.read', name: 'Read Payslips', description: 'View generated payslips' },
  { code: 'payroll.payslip.generate', name: 'Generate Payslips', description: 'Generate payslip PDF artifacts' },
  { code: 'payroll.payslip.publish', name: 'Publish Payslips', description: 'Release payslips to employee self-service' },
  { code: 'payroll.payslip.download', name: 'Download Payslips', description: 'Download PDF payslip documents' },
  { code: 'payroll.template.read', name: 'Read Payslip Templates', description: 'View payslip layout templates' },
  { code: 'payroll.template.create', name: 'Create Payslip Template', description: 'Build customized payslip designs' },
  { code: 'payroll.template.update', name: 'Update Payslip Template', description: 'Edit payslip template layouts' },
  { code: 'payroll.template.delete', name: 'Delete Payslip Template', description: 'Deactivate payslip templates' },
  { code: 'payroll.report.view', name: 'View Payroll Reports', description: 'View payroll register and variance reports' },
  { code: 'payroll.report.export', name: 'Export Payroll Reports', description: 'Export payroll data to CSV' },

  // Statutory Payroll & Compliance Permissions (India)
  { code: 'payroll.statutory.read', name: 'Read Statutory Settings', description: 'View statutory configuration and dashboards' },
  { code: 'payroll.statutory.configure', name: 'Configure Statutory Settings', description: 'Configure organization statutory parameters' },
  { code: 'payroll.statutory.update', name: 'Update Statutory Settings', description: 'Update statutory compliance rules' },
  { code: 'payroll.statutory.calculate', name: 'Calculate Statutory Deductions', description: 'Run statutory calculation engine' },
  { code: 'payroll.statutory.report.view', name: 'View Statutory Reports', description: 'View compliance reports and registers' },
  { code: 'payroll.statutory.report.export', name: 'Export Statutory Reports', description: 'Export ECR, ESI, PT, and 24Q reports' },

  { code: 'payroll.pf.read', name: 'Read PF Configuration', description: 'View EPF and EPS contribution rates' },
  { code: 'payroll.pf.configure', name: 'Configure PF', description: 'Update EPF contribution rules and wage ceilings' },
  { code: 'payroll.pf.calculate', name: 'Calculate PF', description: 'Calculate employee and employer PF shares' },
  { code: 'payroll.pf.report.view', name: 'View PF Reports', description: 'View monthly PF ECR data' },
  { code: 'payroll.pf.report.export', name: 'Export PF ECR', description: 'Export monthly PF Electronic Challan cum Return text file' },

  { code: 'payroll.esi.read', name: 'Read ESI Configuration', description: 'View ESI contribution rates and thresholds' },
  { code: 'payroll.esi.configure', name: 'Configure ESI', description: 'Update ESI wage limits and contribution rates' },
  { code: 'payroll.esi.calculate', name: 'Calculate ESI', description: 'Calculate employee and employer ESI amounts' },
  { code: 'payroll.esi.report.view', name: 'View ESI Register', description: 'View monthly ESI contribution register' },
  { code: 'payroll.esi.report.export', name: 'Export ESI Register', description: 'Export monthly ESI register to CSV' },

  { code: 'payroll.professional_tax.read', name: 'Read Professional Tax', description: 'View state-wise professional tax slabs' },
  { code: 'payroll.professional_tax.configure', name: 'Configure Professional Tax', description: 'Manage state PT rules and slab thresholds' },
  { code: 'payroll.professional_tax.calculate', name: 'Calculate Professional Tax', description: 'Evaluate PT deductions across employee locations' },
  { code: 'payroll.professional_tax.report.view', name: 'View PT Reports', description: 'View state-wise PT monthly summaries' },
  { code: 'payroll.professional_tax.report.export', name: 'Export PT Reports', description: 'Export state-wise PT statements' },

  { code: 'payroll.lwf.read', name: 'Read LWF Configuration', description: 'View state Labour Welfare Fund rules' },
  { code: 'payroll.lwf.configure', name: 'Configure LWF', description: 'Configure state LWF contribution amounts and schedule' },
  { code: 'payroll.lwf.calculate', name: 'Calculate LWF', description: 'Compute periodic LWF deductions' },
  { code: 'payroll.lwf.report.view', name: 'View LWF Reports', description: 'View state-specific LWF schedules' },
  { code: 'payroll.lwf.report.export', name: 'Export LWF Reports', description: 'Export state LWF filing reports' },

  { code: 'payroll.tds.read', name: 'Read TDS Calculation', description: 'View projected annual tax liability and slab evaluation' },
  { code: 'payroll.tds.configure', name: 'Configure TDS', description: 'Configure TDS rules, tax slabs, and declaration windows' },
  { code: 'payroll.tds.calculate', name: 'Calculate TDS', description: 'Execute automated TDS monthly computations' },
  { code: 'payroll.tds.report.view', name: 'View TDS 24Q Report', description: 'View quarterly 24Q Annexure details' },
  { code: 'payroll.tds.report.export', name: 'Export TDS 24Q Report', description: 'Export Form 24Q quarterly returns' },

  { code: 'payroll.tax_declaration.read', name: 'Read Tax Declarations', description: 'View employee investment declarations' },
  { code: 'payroll.tax_declaration.create', name: 'Create Tax Declaration', description: 'Create and edit provisional tax declarations' },
  { code: 'payroll.tax_declaration.submit', name: 'Submit Tax Declaration', description: 'Submit declarations for verification' },
  { code: 'payroll.tax_declaration.review', name: 'Review Tax Declarations', description: 'Review declared Chapter VI-A investments' },
  { code: 'payroll.tax_declaration.approve', name: 'Approve Tax Declarations', description: 'Approve submitted tax declarations' },
  { code: 'payroll.tax_declaration.reject', name: 'Reject Tax Declarations', description: 'Reject invalid tax declarations' },

  { code: 'payroll.investment_proof.read', name: 'Read Investment Proofs', description: 'View submitted proof documents' },
  { code: 'payroll.investment_proof.upload', name: 'Upload Investment Proofs', description: 'Upload investment proof attachments' },
  { code: 'payroll.investment_proof.verify', name: 'Verify Investment Proofs', description: 'Approve verified investment proof amounts' },
  { code: 'payroll.investment_proof.reject', name: 'Reject Investment Proofs', description: 'Reject invalid proof documentation' },
  { code: 'payroll.investment_proof.download', name: 'Download Investment Proofs', description: 'Download uploaded proof attachments' },

  { code: 'payroll.form16.read', name: 'Read Form 16', description: 'View Form 16 Part A and Part B records' },
  { code: 'payroll.form16.prepare', name: 'Prepare Form 16', description: 'Compile annual income and TDS computation data for Form 16' },
  { code: 'payroll.form16.publish', name: 'Publish Form 16', description: 'Release signed Form 16 certificates to employees' },
  { code: 'payroll.form16.download', name: 'Download Form 16', description: 'Download employee Form 16 certificate' },
];

const BASE_ROLES = [
  {
    code: RoleCode.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full administrative access across the entire organization',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.SUPER_ADMIN],
  },
  {
    code: RoleCode.HR_ADMIN,
    name: 'HR Admin',
    description: 'Human resources administrator with team, attendance, and payroll setup management',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.HR_ADMIN],
  },
  {
    code: RoleCode.PAYROLL_ADMIN,
    name: 'Payroll Admin',
    description: 'Payroll administrator with end-to-end payroll processing and configuration access',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.PAYROLL_ADMIN],
  },
  {
    code: RoleCode.FINANCE,
    name: 'Finance',
    description: 'Finance controller with payroll register review, sign-off, and payment marking authority',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.FINANCE],
  },
  {
    code: RoleCode.MANAGER,
    name: 'Manager',
    description: 'Team manager with view permissions to org chart and departments',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.MANAGER],
  },
  {
    code: RoleCode.EMPLOYEE,
    name: 'Employee',
    description: 'Standard employee with self-service and read-only org chart access',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.EMPLOYEE],
  },
];

export async function seedDatabase(client: PrismaClient = prisma) {
  console.log('Seeding permissions...');
  await client.permission.createMany({
    data: BASE_PERMISSIONS,
    skipDuplicates: true,
  });

  const allPerms = await client.permission.findMany();
  const permissionMap = new Map<string, string>();
  for (const perm of allPerms) {
    permissionMap.set(perm.code, perm.id);
  }

  console.log('Seeding base system roles...');
  for (const roleDef of BASE_ROLES) {
    let role = await client.role.findFirst({
      where: {
        code: roleDef.code,
        organizationId: null,
      },
    });

    if (!role) {
      role = await client.role.create({
        data: {
          name: roleDef.name,
          code: roleDef.code,
          description: roleDef.description,
          isSystem: true,
          organizationId: null,
        },
      });
    } else {
      role = await client.role.update({
        where: { id: role.id },
        data: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
        },
      });
    }

    const rolePermsData = roleDef.permissions
      .map((permCode) => {
        const permId = permissionMap.get(permCode);
        return permId ? { roleId: role.id, permissionId: permId } : null;
      })
      .filter((p): p is { roleId: string; permissionId: string } => p !== null);

    if (rolePermsData.length > 0) {
      await client.rolePermission.createMany({
        data: rolePermsData,
        skipDuplicates: true,
      });
    }
  }

  console.log('Database seeded successfully.');
}

async function main() {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
