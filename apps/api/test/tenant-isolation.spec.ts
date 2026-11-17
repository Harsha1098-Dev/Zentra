import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { MembershipsService } from '../src/memberships/memberships.service';
import { RolesService } from '../src/roles/roles.service';
import { PermissionCode } from '@zentra/shared-types';

describe('Tenant Isolation & PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let membershipsService: jest.Mocked<MembershipsService>;
  let rolesService: jest.Mocked<RolesService>;

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    membershipsService = {
      findMembership: jest.fn(),
    } as any;

    rolesService = {
      getMembershipRolesAndPermissions: jest.fn(),
    } as any;

    guard = new PermissionsGuard(reflector, membershipsService, rolesService);
  });

  it('allows access if endpoint requires no specific permissions and user is authenticated without active org', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ id: 'user-1', email: 'test@zentra.local' });

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
  });

  it('throws ForbiddenException if endpoint requires a permission but user has no active organization in session', async () => {
    reflector.getAllAndOverride.mockReturnValue([PermissionCode.USER_INVITE]);
    const context = createMockContext({
      id: 'user-1',
      email: 'test@zentra.local',
      organizationId: null, // No active organization selected
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException if user is not an active member in the selected organization', async () => {
    reflector.getAllAndOverride.mockReturnValue([PermissionCode.USER_INVITE]);
    const context = createMockContext({
      id: 'user-1',
      email: 'test@zentra.local',
      organizationId: 'org-tenant-a',
    });

    // Membership is null or suspended
    membershipsService.findMembership.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('allows access if user has active membership and possesses required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue([PermissionCode.USER_INVITE]);
    const user = {
      id: 'user-1',
      email: 'hr@acme.com',
      organizationId: 'org-acme',
    };
    const context = createMockContext(user);

    membershipsService.findMembership.mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      organizationId: 'org-acme',
      status: 'ACTIVE',
      deletedAt: null,
    } as any);

    rolesService.getMembershipRolesAndPermissions.mockResolvedValue({
      roles: ['HR_ADMIN'],
      permissions: [
        PermissionCode.ORGANIZATION_READ,
        PermissionCode.USER_READ,
        PermissionCode.USER_INVITE,
      ],
    });

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
    expect((user as any).permissions).toContain(PermissionCode.USER_INVITE);
  });

  it('blocks access if user belongs to the active organization but lacks the required permission', async () => {
    // Requires user.invite, but user is standard EMPLOYEE with only organization.read
    reflector.getAllAndOverride.mockReturnValue([PermissionCode.USER_INVITE]);
    const user = {
      id: 'emp-1',
      email: 'emp@acme.com',
      organizationId: 'org-acme',
    };
    const context = createMockContext(user);

    membershipsService.findMembership.mockResolvedValue({
      id: 'membership-2',
      userId: 'emp-1',
      organizationId: 'org-acme',
      status: 'ACTIVE',
      deletedAt: null,
    } as any);

    rolesService.getMembershipRolesAndPermissions.mockResolvedValue({
      roles: ['EMPLOYEE'],
      permissions: [PermissionCode.ORGANIZATION_READ, PermissionCode.PRODUCT_READ],
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
