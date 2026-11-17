import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { AuditService } from '../audit/audit.service';
import { AuditAction, OrganizationSummaryDto } from '@zentra/shared-types';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly membershipsRepository: MembershipsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findMembership(userId: string, organizationId: string) {
    return this.membershipsRepository.findByUserAndOrg(userId, organizationId);
  }

  async findMembershipById(id: string) {
    return this.membershipsRepository.findById(id);
  }

  async createOrReactivateMembership(
    userId: string,
    organizationId: string,
    status = 'ACTIVE',
    actorUserId?: string,
  ) {
    const existing = await this.membershipsRepository.findByUserAndOrg(userId, organizationId);
    if (existing) {
      if (existing.status !== 'ACTIVE' && status === 'ACTIVE') {
        const updated = await this.membershipsRepository.updateStatus(
          existing.id,
          'ACTIVE',
          new Date(),
        );
        return updated;
      }
      return existing;
    }

    const membership = await this.membershipsRepository.create(userId, organizationId, status);

    // Audit log membership creation
    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.MEMBERSHIP_CREATE,
      entityType: 'OrganizationMembership',
      entityId: membership.id,
      newValues: {
        userId,
        organizationId,
        status,
      },
    });

    return membership;
  }

  async activateMembership(membershipId: string) {
    return this.membershipsRepository.updateStatus(membershipId, 'ACTIVE', new Date());
  }

  async getUserOrganizations(userId: string): Promise<OrganizationSummaryDto[]> {
    const memberships = await this.membershipsRepository.findActiveByUserId(userId);

    return memberships.map((m) => {
      const primaryRole = m.userRoles[0]?.role || {
        id: '',
        name: 'Member',
        code: 'MEMBER',
      };

      return {
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        status: m.organization.status as any,
        joinedAt: m.joinedAt?.toISOString() || m.createdAt.toISOString(),
        role: {
          id: primaryRole.id,
          name: primaryRole.name,
          code: primaryRole.code,
        },
        products: m.organization.products.map((p) => ({
          code: p.productCode as any,
          status: p.status as any,
          trialEndsAt: p.trialEndsAt?.toISOString() || null,
        })),
      };
    });
  }

  async getOrganizationMembers(organizationId: string) {
    const members = await this.membershipsRepository.findByOrganizationId(organizationId);

    return members.map((m) => ({
      membershipId: m.id,
      status: m.status,
      joinedAt: m.joinedAt,
      createdAt: m.createdAt,
      user: m.user,
      roles: m.userRoles.map((ur) => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
      })),
    }));
  }
}
