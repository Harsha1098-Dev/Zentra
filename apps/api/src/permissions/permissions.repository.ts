import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string) {
    return this.prisma.permission.findUnique({
      where: { code },
    });
  }

  async findByIds(ids: string[]) {
    return this.prisma.permission.findMany({
      where: { id: { in: ids } },
    });
  }
}
