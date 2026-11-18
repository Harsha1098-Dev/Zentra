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

  // Employee Lifecycle Permissions
  { code: 'onboarding.read', name: 'Read Onboarding', description: 'View onboarding flows and employee runs' },
  { code: 'onboarding.create', name: 'Create Onboarding Flow', description: 'Create new employee onboarding flow' },
  { code: 'onboarding.update', name: 'Update Onboarding Flow', description: 'Modify onboarding flows and tasks' },
  { code: 'onboarding.delete', name: 'Delete Onboarding Flow', description: 'Deactivate or delete onboarding flows' },
  { code: 'onboarding.execute', name: 'Execute Onboarding', description: 'Initiate onboarding runs for employees' },
  { code: 'onboarding.task.complete', name: 'Complete Onboarding Task', description: 'Mark assigned onboarding tasks complete' },
  { code: 'onboarding.task.reassign', name: 'Reassign Onboarding Task', description: 'Reassign onboarding tasks to other owners' },

  { code: 'probation.read', name: 'Read Probation', description: 'View employee probation details and tracking' },
  { code: 'probation.create', name: 'Create Probation Review', description: 'Initiate probation review workflow' },
  { code: 'probation.review', name: 'Review Probation', description: 'Submit manager probation ratings and remarks' },
  { code: 'probation.approve', name: 'Approve Probation Confirmation', description: 'Confirm or extend employee probation' },
  { code: 'probation.reject', name: 'Reject Probation Confirmation', description: 'Terminate or reject probation confirmation' },

  { code: 'transfer.read', name: 'Read Transfers', description: 'View employee transfer requests' },
  { code: 'transfer.create', name: 'Create Transfer Request', description: 'Initiate employee department/location transfer' },
  { code: 'transfer.update', name: 'Update Transfer Request', description: 'Modify transfer request parameters' },
  { code: 'transfer.approve', name: 'Approve Transfer', description: 'Approve employee transfer request' },
  { code: 'transfer.reject', name: 'Reject Transfer', description: 'Reject employee transfer request' },
  { code: 'transfer.cancel', name: 'Cancel Transfer', description: 'Cancel pending transfer request' },

  { code: 'promotion.read', name: 'Read Promotions', description: 'View employee promotion requests' },
  { code: 'promotion.create', name: 'Create Promotion Request', description: 'Initiate employee promotion' },
  { code: 'promotion.update', name: 'Update Promotion Request', description: 'Modify promotion request parameters' },
  { code: 'promotion.approve', name: 'Approve Promotion', description: 'Approve employee promotion' },
  { code: 'promotion.reject', name: 'Reject Promotion', description: 'Reject employee promotion' },
  { code: 'promotion.cancel', name: 'Cancel Promotion', description: 'Cancel pending promotion request' },

  { code: 'salary_revision.read', name: 'Read Salary Revisions', description: 'View salary revision requests' },
  { code: 'salary_revision.create', name: 'Create Salary Revision', description: 'Initiate employee compensation revision' },
  { code: 'salary_revision.update', name: 'Update Salary Revision', description: 'Modify revision request details' },
  { code: 'salary_revision.approve', name: 'Approve Salary Revision', description: 'Approve salary revision' },
  { code: 'salary_revision.reject', name: 'Reject Salary Revision', description: 'Reject salary revision' },
  { code: 'salary_revision.cancel', name: 'Cancel Salary Revision', description: 'Cancel pending salary revision' },

  { code: 'resignation.read', name: 'Read Resignations', description: 'View resignation requests' },
  { code: 'resignation.create', name: 'Submit Resignation', description: 'Submit employee resignation request' },
  { code: 'resignation.update', name: 'Update Resignation', description: 'Modify resignation details' },
  { code: 'resignation.approve', name: 'Approve Resignation', description: 'Approve employee resignation' },
  { code: 'resignation.reject', name: 'Reject Resignation', description: 'Reject resignation request' },
  { code: 'resignation.withdraw', name: 'Withdraw Resignation', description: 'Withdraw pending resignation request' },
  { code: 'resignation.cancel', name: 'Cancel Resignation', description: 'Cancel resignation request' },

  { code: 'exit_clearance.read', name: 'Read Exit Clearances', description: 'View exit clearance checklist' },
  { code: 'exit_clearance.create', name: 'Create Exit Clearance', description: 'Add clearance item for offboarding' },
  { code: 'exit_clearance.update', name: 'Update Exit Clearance', description: 'Edit exit clearance item' },
  { code: 'exit_clearance.complete', name: 'Complete Exit Clearance', description: 'Sign off on exit clearance item' },
  { code: 'exit_clearance.reassign', name: 'Reassign Exit Clearance', description: 'Reassign clearance task to department owner' },

  { code: 'offboarding.read', name: 'Read Offboarding', description: 'View employee offboarding requests' },
  { code: 'offboarding.create', name: 'Create Offboarding Request', description: 'Initiate employee exit process' },
  { code: 'offboarding.update', name: 'Update Offboarding Request', description: 'Modify offboarding parameters' },
  { code: 'offboarding.complete', name: 'Complete Offboarding', description: 'Finalize employee exit and mark exited' },
  { code: 'offboarding.cancel', name: 'Cancel Offboarding', description: 'Cancel employee offboarding' },

  { code: 'asset.read', name: 'Read Assets', description: 'View company asset inventory' },
  { code: 'asset.assign', name: 'Assign Asset', description: 'Assign asset to employee' },
  { code: 'asset.return', name: 'Return Asset', description: 'Record asset return and condition' },
  { code: 'asset.update', name: 'Update Asset', description: 'Edit asset details' },

  { code: 'letter.generate', name: 'Generate Lifecycle Letter', description: 'Generate official HR lifecycle letter' },
  { code: 'letter.download', name: 'Download Lifecycle Letter', description: 'Download generated lifecycle letter PDF' },

  // Performance & Goals Permissions
  { code: 'performance.read', name: 'Read Performance', description: 'View general performance modules' },
  { code: 'performance.read_own', name: 'Read Own Performance', description: 'View own performance dashboard, reviews, and goals' },
  { code: 'performance.read_team', name: 'Read Team Performance', description: 'View team reportees performance data' },
  { code: 'performance.read_all', name: 'Read All Performance', description: 'View organization-wide performance data' },

  { code: 'goal.read', name: 'Read Goals', description: 'View goals and progress' },
  { code: 'goal.create', name: 'Create Goal', description: 'Create new goals' },
  { code: 'goal.update', name: 'Update Goal', description: 'Modify goals and progress' },
  { code: 'goal.delete', name: 'Delete Goal', description: 'Delete goals' },
  { code: 'goal.align', name: 'Align Goal', description: 'Align goal with manager or org goals' },
  { code: 'goal.approve', name: 'Approve Goal', description: 'Approve goal creation or alignment' },

  { code: 'kra.read', name: 'Read KRAs', description: 'View Key Result Areas' },
  { code: 'kra.create', name: 'Create KRA', description: 'Create Key Result Area' },
  { code: 'kra.update', name: 'Update KRA', description: 'Modify Key Result Area' },
  { code: 'kra.delete', name: 'Delete KRA', description: 'Delete Key Result Area' },

  { code: 'okr.read', name: 'Read OKRs', description: 'View OKR objectives and key results' },
  { code: 'okr.create', name: 'Create OKR', description: 'Create objectives and key results' },
  { code: 'okr.update', name: 'Update OKR', description: 'Update objectives and key results' },
  { code: 'okr.delete', name: 'Delete OKR', description: 'Delete objectives and key results' },
  { code: 'okr.checkin.create', name: 'Create OKR Check-in', description: 'Submit check-in for key results' },
  { code: 'okr.checkin.approve', name: 'Approve OKR Check-in', description: 'Approve or reject check-in submissions' },

  { code: 'feedback.read', name: 'Read Feedback', description: 'View continuous feedback' },
  { code: 'feedback.create', name: 'Create Feedback', description: 'Give praise or constructive feedback' },
  { code: 'feedback.request', name: 'Request Feedback', description: 'Request 360 or peer feedback' },
  { code: 'feedback.give', name: 'Give Feedback', description: 'Respond with feedback' },

  { code: 'one_on_one.read', name: 'Read 1:1 Meetings', description: 'View 1:1 meetings' },
  { code: 'one_on_one.create', name: 'Schedule 1:1 Meeting', description: 'Schedule 1:1 meetings' },
  { code: 'one_on_one.update', name: 'Update 1:1 Meeting', description: 'Update agenda and meeting notes' },

  { code: 'improvement_plan.read', name: 'Read Improvement Plans', description: 'View PIP plans' },
  { code: 'improvement_plan.create', name: 'Create Improvement Plan', description: 'Initiate performance improvement plan' },
  { code: 'improvement_plan.update', name: 'Update Improvement Plan', description: 'Update PIP progress' },
  { code: 'improvement_plan.complete', name: 'Complete Improvement Plan', description: 'Mark PIP as completed or resolved' },

  { code: 'performance_cycle.read', name: 'Read Performance Cycles', description: 'View appraisal review cycles' },
  { code: 'performance_cycle.create', name: 'Create Performance Cycle', description: 'Configure review cycle' },
  { code: 'performance_cycle.update', name: 'Update Performance Cycle', description: 'Edit review cycle parameters' },
  { code: 'performance_cycle.delete', name: 'Delete Performance Cycle', description: 'Remove or cancel review cycle' },
  { code: 'performance_cycle.run', name: 'Run Performance Cycle', description: 'Start appraisal process and assign reviews' },
  { code: 'performance_cycle.publish', name: 'Publish Performance Cycle', description: 'Publish final appraisal ratings' },

  { code: 'appraisal.read', name: 'Read Appraisals', description: 'View appraisal assignments and templates' },
  { code: 'appraisal.submit', name: 'Submit Appraisal', description: 'Submit self-review appraisal' },
  { code: 'appraisal.review', name: 'Review Appraisal', description: 'Submit manager appraisal review' },
  { code: 'appraisal.approve', name: 'Approve Appraisal', description: 'Approve appraisal review' },
  { code: 'appraisal.reject', name: 'Reject Appraisal', description: 'Reject or request rework on review' },
  { code: 'appraisal.publish', name: 'Publish Appraisal', description: 'Release appraisal ratings' },

  { code: 'calibration.read', name: 'Read Calibration', description: 'View calibration sessions' },
  { code: 'calibration.create', name: 'Create Calibration Session', description: 'Schedule calibration meeting' },
  { code: 'calibration.participate', name: 'Participate in Calibration', description: 'Attend calibration session' },
  { code: 'calibration.decide', name: 'Record Calibration Decision', description: 'Adjust ratings with justification' },

  { code: 'performance.report.view', name: 'View Performance Reports', description: 'View performance analytics dashboards' },
  { code: 'performance.report.export', name: 'Export Performance Reports', description: 'Export performance data to CSV' },

  // Recruitment Permissions
  { code: 'recruitment.read', name: 'Read Recruitment', description: 'View recruitment dashboard and data' },
  { code: 'recruitment.read_own', name: 'Read Own Recruitment', description: 'View own recruitment referrals and applications' },
  { code: 'recruitment.read_team', name: 'Read Team Recruitment', description: 'View hiring manager team recruitment pipeline' },
  { code: 'recruitment.read_all', name: 'Read All Recruitment', description: 'Full access to organization recruitment pipeline' },

  { code: 'job_opening.read', name: 'Read Job Openings', description: 'View job openings' },
  { code: 'job_opening.create', name: 'Create Job Opening', description: 'Create new job requisition' },
  { code: 'job_opening.update', name: 'Update Job Opening', description: 'Update job details and requirements' },
  { code: 'job_opening.delete', name: 'Delete Job Opening', description: 'Delete or archive job opening' },
  { code: 'job_opening.publish', name: 'Publish Job Opening', description: 'Publish job internally or externally' },
  { code: 'job_opening.close', name: 'Close Job Opening', description: 'Close job opening' },

  { code: 'candidate.read', name: 'Read Candidates', description: 'View candidates' },
  { code: 'candidate.create', name: 'Create Candidate', description: 'Add new candidate to database' },
  { code: 'candidate.update', name: 'Update Candidate', description: 'Edit candidate profile and contact details' },
  { code: 'candidate.delete', name: 'Delete Candidate', description: 'Delete candidate record' },
  { code: 'candidate.resume.upload', name: 'Upload Resume', description: 'Upload candidate resume' },
  { code: 'candidate.document.upload', name: 'Upload Candidate Document', description: 'Upload candidate documents' },
  { code: 'candidate.note.create', name: 'Create Candidate Note', description: 'Add internal recruitment notes' },

  { code: 'application.read', name: 'Read Applications', description: 'View job applications' },
  { code: 'application.create', name: 'Create Application', description: 'Apply for job or create application' },
  { code: 'application.update', name: 'Update Application', description: 'Update application details' },
  { code: 'application.stage.change', name: 'Change Application Stage', description: 'Move candidate through hiring stages' },
  { code: 'application.screen', name: 'Screen Application', description: 'Submit screening score and notes' },
  { code: 'application.reject', name: 'Reject Application', description: 'Reject candidate application' },
  { code: 'application.hire', name: 'Hire Application', description: 'Mark application as hired' },

  { code: 'interview.read', name: 'Read Interviews', description: 'View scheduled interviews' },
  { code: 'interview.schedule', name: 'Schedule Interview', description: 'Schedule interview with candidate' },
  { code: 'interview.reschedule', name: 'Reschedule Interview', description: 'Change interview schedule' },
  { code: 'interview.cancel', name: 'Cancel Interview', description: 'Cancel scheduled interview' },
  { code: 'interview.feedback.submit', name: 'Submit Interview Feedback', description: 'Submit interview evaluation and score' },
  { code: 'interview.feedback.view', name: 'View Interview Feedback', description: 'Read submitted interview feedback' },

  { code: 'offer.read', name: 'Read Offers', description: 'View job offers' },
  { code: 'offer.create', name: 'Create Offer', description: 'Generate job offer for candidate' },
  { code: 'offer.update', name: 'Update Offer', description: 'Modify offer terms' },
  { code: 'offer.approve', name: 'Approve Offer', description: 'Approve job offer' },
  { code: 'offer.reject', name: 'Reject Offer', description: 'Reject job offer' },
  { code: 'offer.send', name: 'Send Offer', description: 'Send offer letter to candidate' },
  { code: 'offer.withdraw', name: 'Withdraw Offer', description: 'Withdraw pending offer' },

  { code: 'candidate.convert', name: 'Convert Candidate to Employee', description: 'Convert hired candidate to employee record' },
  { code: 'candidate.onboard', name: 'Trigger Onboarding', description: 'Initiate onboarding workflow for hired candidate' },

  { code: 'referral.read', name: 'Read Referrals', description: 'View employee referrals' },
  { code: 'referral.create', name: 'Create Referral', description: 'Refer candidate for job opening' },
  { code: 'referral.track', name: 'Track Referral', description: 'Track status of referred candidate' },

  { code: 'recruitment.report.view', name: 'View Recruitment Reports', description: 'View recruitment analytics' },
  { code: 'recruitment.report.export', name: 'Export Recruitment Reports', description: 'Export recruitment reports to CSV' },

  // Helpdesk Permissions
  { code: 'helpdesk.read', name: 'Read Helpdesk', description: 'Access helpdesk portal and knowledge center' },
  { code: 'helpdesk.manage', name: 'Manage Helpdesk', description: 'Configure helpdesk categories, routing, and SLAs' },
  { code: 'helpdesk.category.read', name: 'Read Categories', description: 'View ticket categories and subcategories' },
  { code: 'helpdesk.category.create', name: 'Create Category', description: 'Create ticket categories' },
  { code: 'helpdesk.category.update', name: 'Update Category', description: 'Update ticket categories' },
  { code: 'helpdesk.category.delete', name: 'Delete Category', description: 'Deactivate ticket categories' },
  { code: 'helpdesk.agent.read', name: 'Read Agents', description: 'View helpdesk agent assignments' },
  { code: 'helpdesk.agent.manage', name: 'Manage Agents', description: 'Assign agents to categories and teams' },
  { code: 'ticket.read', name: 'Read Tickets', description: 'View tickets' },
  { code: 'ticket.read_own', name: 'Read Own Tickets', description: 'View own submitted tickets' },
  { code: 'ticket.read_team', name: 'Read Team Tickets', description: 'View team or assigned tickets' },
  { code: 'ticket.read_all', name: 'Read All Tickets', description: 'View all tickets in organization' },
  { code: 'ticket.create', name: 'Create Ticket', description: 'Submit support ticket' },
  { code: 'ticket.create_own', name: 'Create Own Ticket', description: 'Create ticket for oneself' },
  { code: 'ticket.create_all', name: 'Create Ticket on Behalf', description: 'Create ticket on behalf of any employee' },
  { code: 'ticket.update', name: 'Update Ticket', description: 'Update ticket details and status' },
  { code: 'ticket.assign', name: 'Assign Ticket', description: 'Assign or reassign tickets' },
  { code: 'ticket.resolve', name: 'Resolve Ticket', description: 'Mark ticket as resolved' },
  { code: 'ticket.close', name: 'Close Ticket', description: 'Close ticket' },
  { code: 'ticket.reopen', name: 'Reopen Ticket', description: 'Reopen resolved or closed ticket' },
  { code: 'ticket.cancel', name: 'Cancel Ticket', description: 'Cancel ticket' },
  { code: 'ticket.note.create', name: 'Create Ticket Note', description: 'Add internal confidential note' },
  { code: 'sla.policy.read', name: 'Read SLA Policies', description: 'View SLA policies' },
  { code: 'sla.policy.manage', name: 'Manage SLA Policies', description: 'Create and configure SLA policies' },
  { code: 'sla.escalation.manage', name: 'Manage Escalations', description: 'Configure SLA escalation triggers and actions' },
  { code: 'knowledge_base.read', name: 'Read Knowledge Base', description: 'View published knowledge base articles' },
  { code: 'knowledge_base.create', name: 'Create Article', description: 'Author knowledge base article' },
  { code: 'knowledge_base.update', name: 'Update Article', description: 'Edit knowledge base article' },
  { code: 'knowledge_base.publish', name: 'Publish Article', description: 'Publish or archive articles' },
  { code: 'knowledge_base.archive', name: 'Archive Article', description: 'Archive articles' },
  { code: 'knowledge_base.delete', name: 'Delete Article', description: 'Delete knowledge base article' },
  { code: 'faq.read', name: 'Read FAQs', description: 'View frequently asked questions' },
  { code: 'faq.create', name: 'Create FAQ', description: 'Create FAQ item' },
  { code: 'faq.update', name: 'Update FAQ', description: 'Update FAQ item' },
  { code: 'faq.delete', name: 'Delete FAQ', description: 'Delete FAQ item' },
  { code: 'ticket.feedback.submit', name: 'Submit Feedback', description: 'Submit CSAT rating on resolved ticket' },
  { code: 'ticket.feedback.read', name: 'Read Feedback', description: 'View customer satisfaction ratings' },
  { code: 'helpdesk.report.view', name: 'View Helpdesk Reports', description: 'View helpdesk analytics' },
  { code: 'helpdesk.report.export', name: 'Export Helpdesk Reports', description: 'Export helpdesk metrics and tickets' },
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
  {
    code: RoleCode.RECRUITER,
    name: 'Recruiter',
    description: 'Talent acquisition specialist managing job openings, candidates, interviews, and offers',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.RECRUITER],
  },
  {
    code: RoleCode.HIRING_MANAGER,
    name: 'Hiring Manager',
    description: 'Hiring manager screening applications, conducting interviews, and approving offers',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.HIRING_MANAGER],
  },
  {
    code: RoleCode.INTERVIEWER,
    name: 'Interviewer',
    description: 'Assigned interviewer conducting rounds and submitting candidate evaluations',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.INTERVIEWER],
  },
  {
    code: RoleCode.HELPDESK_AGENT,
    name: 'Helpdesk Agent',
    description: 'Support agent handling and resolving employee support tickets',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.HELPDESK_AGENT],
  },
  {
    code: RoleCode.CATEGORY_ADMIN,
    name: 'Category Administrator',
    description: 'Helpdesk administrator managing category workflows and SLAs',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.CATEGORY_ADMIN],
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
