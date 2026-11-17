import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: data.organizationId || null,
        actorUserId: data.actorUserId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues ? JSON.parse(JSON.stringify(data.oldValues)) : null,
        newValues: data.newValues ? JSON.parse(JSON.stringify(data.newValues)) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
      include: {
        actorUser: {
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

  async findByOrganization(organizationId: string, limit = 50, offset = 0) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        actorUser: {
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

  async countByOrganization(organizationId: string) {
    return this.prisma.auditLog.count({
      where: { organizationId },
    });
  }
}
