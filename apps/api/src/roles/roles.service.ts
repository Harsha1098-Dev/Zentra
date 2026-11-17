import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly auditService: AuditService,
  ) {}

  async getRoleById(id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async getRoleByCode(code: string, organizationId?: string | null) {
    const role = await this.rolesRepository.findByCode(code, organizationId);
    if (!role) {
      throw new NotFoundException(`Role with code ${code} not found`);
    }
    return role;
  }

  async getAvailableRoles(organizationId?: string | null) {
    return this.rolesRepository.findAvailableForOrganization(organizationId);
  }

  async assignRoleToMembership(
    membershipId: string,
    roleId: string,
    organizationId: string,
    actorUserId?: string,
  ) {
    const role = await this.getRoleById(roleId);
    const result = await this.rolesRepository.assignRoleToMembership(
      membershipId,
      role.id,
      organizationId,
    );

    // Audit log role assignment
    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.ROLE_ASSIGN,
      entityType: 'UserRole',
      entityId: result.id,
      newValues: {
        membershipId,
        roleId: role.id,
        roleCode: role.code,
        roleName: role.name,
      },
    });

    return result;
  }

  async getMembershipRolesAndPermissions(membershipId: string) {
    const userRoles = await this.rolesRepository.findRolesForMembership(membershipId);

    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of userRoles) {
      roles.push(ur.role.code);
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    return {
      roles,
      permissions: Array.from(permissionsSet),
    };
  }
}
