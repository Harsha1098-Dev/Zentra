import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateOrgData {
  name: string;
  slug: string;
}

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrgData) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: 'ACTIVE',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.organization.findUnique({
      where: { slug },
      include: {
        products: true,
      },
    });
  }

  async addProduct(organizationId: string, productCode: string, status = 'TRIAL', trialEndsAt?: Date) {
    return this.prisma.organizationProduct.upsert({
      where: {
        organizationId_productCode: {
          organizationId,
          productCode,
        },
      },
      update: {
        status,
        trialEndsAt: trialEndsAt || null,
      },
      create: {
        organizationId,
        productCode,
        status,
        trialEndsAt: trialEndsAt || null,
      },
    });
  }

  async getProducts(organizationId: string) {
    return this.prisma.organizationProduct.findMany({
      where: { organizationId },
    });
  }

  // Invitation data access
  async createInvitation(data: {
    organizationId: string;
    email: string;
    roleId: string;
    invitedByUserId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.invitation.create({
      data: {
        organizationId: data.organizationId,
        email: data.email,
        roleId: data.roleId,
        invitedByUserId: data.invitedByUserId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        status: 'PENDING',
      },
      include: {
        role: true,
        organization: true,
      },
    });
  }

  async findInvitationByTokenHash(tokenHash: string) {
    return this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: {
        role: true,
        organization: true,
        invitedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateInvitationStatus(id: string, status: string, acceptedAt?: Date) {
    return this.prisma.invitation.update({
      where: { id },
      data: {
        status,
        ...(acceptedAt ? { acceptedAt } : {}),
      },
    });
  }

  async findInvitationsByOrganization(organizationId: string) {
    return this.prisma.invitation.findMany({
      where: { organizationId },
      include: {
        role: true,
        invitedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
