import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DelegationStatus } from '@zentra/shared-types';

@Injectable()
export class DelegationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    delegateFromUserId: string;
    delegateToUserId: string;
    module?: string | null;
    requestType?: string | null;
    startDate: Date;
    endDate: Date;
    status?: string;
    createdBy?: string | null;
  }) {
    return this.prisma.delegation.create({
      data: {
        organizationId: data.organizationId,
        delegateFromUserId: data.delegateFromUserId,
        delegateToUserId: data.delegateToUserId,
        module: data.module || null,
        requestType: data.requestType || null,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || DelegationStatus.ACTIVE,
        createdBy: data.createdBy || null,
      },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.delegation.findFirst({
      where: { id, organizationId },
    });
  }

  async update(id: string, organizationId: string, data: any) {
    return this.prisma.delegation.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    return this.prisma.delegation.delete({
      where: { id },
    });
  }

  async list(organizationId: string, userId?: string) {
    return this.prisma.delegation.findMany({
      where: {
        organizationId,
        ...(userId
          ? {
              OR: [
                { delegateFromUserId: userId },
                { delegateToUserId: userId },
                { createdBy: userId },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveDelegation(
    delegateFromUserId: string,
    organizationId: string,
    module?: string | null,
    requestType?: string | null,
    now: Date = new Date(),
  ) {
    const delegations = await this.prisma.delegation.findMany({
      where: {
        organizationId,
        delegateFromUserId,
        status: DelegationStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Match most specific delegation first (module + requestType, or module, or wildcard)
    const exact = delegations.find(
      (d) =>
        d.module === module &&
        d.requestType === requestType &&
        module !== null &&
        requestType !== null,
    );
    if (exact) return exact;

    const moduleMatch = delegations.find(
      (d) => d.module === module && (!d.requestType || d.requestType === requestType),
    );
    if (moduleMatch) return moduleMatch;

    const globalMatch = delegations.find((d) => !d.module && !d.requestType);
    return globalMatch || delegations[0] || null;
  }
}
