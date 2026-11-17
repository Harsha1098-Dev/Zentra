import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { MembershipsService } from '../../memberships/memberships.service';
import { RolesService } from '../../roles/roles.service';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membershipsService: MembershipsService,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // If an endpoint has an active organization in context, load memberships and roles
    if (user.organizationId) {
      const membership = await this.membershipsService.findMembership(
        user.id,
        user.organizationId,
      );

      if (!membership || membership.status !== 'ACTIVE' || membership.deletedAt) {
        throw new ForbiddenException(
          'Forbidden: You do not have an active membership in the selected organization',
        );
      }

      const { roles, permissions } =
        await this.rolesService.getMembershipRolesAndPermissions(membership.id);

      user.membershipId = membership.id;
      user.roles = roles;
      user.permissions = permissions;
    }

    // If no specific permissions are required on this endpoint, allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Endpoint requires permissions, so active organization is mandatory
    if (!user.organizationId) {
      throw new ForbiddenException(
        'Forbidden: No active organization selected for this operation',
      );
    }

    const userPermissions = user.permissions || [];

    // Check if user has all required permissions (or super admin / auth.manage)
    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Forbidden: Missing required permission(s): ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
