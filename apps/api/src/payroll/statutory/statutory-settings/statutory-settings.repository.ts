import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StatutorySettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganizationId(organizationId: string) {
    return this.prisma.statutorySetting.findUnique({
      where: { organizationId },
    });
  }

  async upsert(organizationId: string, data: any) {
    return this.prisma.statutorySetting.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }
}
