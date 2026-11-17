import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCompanyProfileInput } from '@zentra/shared-types';

@Injectable()
export class CompanyProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganizationId(organizationId: string) {
    return this.prisma.companyProfile.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }

  async upsertProfile(organizationId: string, data: UpdateCompanyProfileInput) {
    const { name, ...profileFields } = data;

    return this.prisma.$transaction(async (tx) => {
      // If organization name was updated, update organization table as well
      if (name) {
        await tx.organization.update({
          where: { id: organizationId },
          data: { name },
        });
      }

      const existing = await tx.companyProfile.findUnique({
        where: { organizationId },
      });

      if (!existing) {
        return tx.companyProfile.create({
          data: {
            organizationId,
            ...profileFields,
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        });
      }

      return tx.companyProfile.update({
        where: { organizationId },
        data: profileFields,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
      });
    });
  }

  async updateLogoUrl(organizationId: string, logoUrl: string | null) {
    return this.prisma.companyProfile.upsert({
      where: { organizationId },
      update: { logoUrl },
      create: {
        organizationId,
        logoUrl,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
