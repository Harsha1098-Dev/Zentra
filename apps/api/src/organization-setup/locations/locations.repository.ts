import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationInput, UpdateLocationInput } from '@zentra/shared-types';

@Injectable()
export class LocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, status?: string, search?: string) {
    return this.prisma.location.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { country: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ isHeadquarters: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.location.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async findByName(organizationId: string, name: string) {
    return this.prisma.location.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.location.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  }

  async create(organizationId: string, data: CreateLocationInput) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isHeadquarters) {
        await tx.location.updateMany({
          where: { organizationId, isHeadquarters: true },
          data: { isHeadquarters: false },
        });
      }

      return tx.location.create({
        data: {
          organizationId,
          name: data.name,
          code: data.code,
          country: data.country,
          state: data.state || null,
          city: data.city,
          address: data.address,
          postalCode: data.postalCode || null,
          timezone: data.timezone,
          phone: data.phone || null,
          email: data.email || null,
          isHeadquarters: data.isHeadquarters || false,
          status: 'ACTIVE',
        },
      });
    });
  }

  async update(id: string, organizationId: string, data: UpdateLocationInput) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isHeadquarters) {
        await tx.location.updateMany({
          where: { organizationId, isHeadquarters: true, id: { not: id } },
          data: { isHeadquarters: false },
        });
      }

      return tx.location.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.code ? { code: data.code } : {}),
          ...(data.country ? { country: data.country } : {}),
          ...(data.state !== undefined ? { state: data.state || null } : {}),
          ...(data.city ? { city: data.city } : {}),
          ...(data.address ? { address: data.address } : {}),
          ...(data.postalCode !== undefined ? { postalCode: data.postalCode || null } : {}),
          ...(data.timezone ? { timezone: data.timezone } : {}),
          ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
          ...(data.email !== undefined ? { email: data.email || null } : {}),
          ...(data.isHeadquarters !== undefined ? { isHeadquarters: data.isHeadquarters } : {}),
        },
      });
    });
  }

  async setStatus(id: string, organizationId: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.prisma.location.update({
      where: { id },
      data: { status },
    });
  }
}
