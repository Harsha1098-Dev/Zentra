import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BASE_PERMISSIONS = [
  { code: 'auth.manage', name: 'Manage Authentication', description: 'Full access to authentication settings' },
  { code: 'organization.read', name: 'Read Organization', description: 'View organization details' },
  { code: 'organization.update', name: 'Update Organization', description: 'Update organization settings' },
  { code: 'user.read', name: 'Read Users', description: 'View users in the organization' },
  { code: 'user.invite', name: 'Invite Users', description: 'Invite users to the organization' },
  { code: 'user.manage', name: 'Manage Users', description: 'Manage user status and memberships' },
  { code: 'role.read', name: 'Read Roles', description: 'View roles and permissions' },
  { code: 'role.manage', name: 'Manage Roles', description: 'Create and modify custom roles' },
  { code: 'permission.read', name: 'Read Permissions', description: 'View system permissions' },
  { code: 'audit.read', name: 'Read Audit Logs', description: 'View audit logs for the organization' },
  { code: 'product.read', name: 'Read Products', description: 'View product subscriptions and entitlements' },
];

const BASE_ROLES = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full administrative access across the entire organization',
    permissions: [
      'auth.manage',
      'organization.read',
      'organization.update',
      'user.read',
      'user.invite',
      'user.manage',
      'role.read',
      'role.manage',
      'permission.read',
      'audit.read',
      'product.read',
    ],
  },
  {
    code: 'HR_ADMIN',
    name: 'HR Admin',
    description: 'Human resources administrator with team and invitation management',
    permissions: [
      'organization.read',
      'user.read',
      'user.invite',
      'user.manage',
      'role.read',
      'permission.read',
      'audit.read',
      'product.read',
    ],
  },
  {
    code: 'MANAGER',
    name: 'Manager',
    description: 'Team manager with view permissions',
    permissions: ['organization.read', 'user.read', 'product.read'],
  },
  {
    code: 'EMPLOYEE',
    name: 'Employee',
    description: 'Standard employee with access to organization self-service',
    permissions: ['organization.read', 'product.read'],
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
    // Upsert base global system role (organizationId is null)
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
