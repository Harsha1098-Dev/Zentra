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
    description: 'Human resources administrator with team and organization setup management',
    permissions: DEFAULT_ROLE_PERMISSIONS[RoleCode.HR_ADMIN],
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
  const permissionMap = new Map<string, string>();

  for (const perm of BASE_PERMISSIONS) {
    const record = await client.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description },
      create: {
        code: perm.code,
        name: perm.name,
        description: perm.description,
      },
    });
    permissionMap.set(perm.code, record.id);
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

    // Assign permissions to base system role
    for (const permCode of roleDef.permissions) {
      const permId = permissionMap.get(permCode);
      if (permId) {
        await client.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
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
