import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditLogDto) {
    const actorUserId = data.actorUserId || data.userId || null;
    const entityType = data.entityType || data.resource || 'UNKNOWN';
    const entityId = data.entityId || data.resourceId || 'UNKNOWN';
    const newValues = data.newValues || data.details || null;
    const oldValues = data.oldValues || data.prevValues || null;

    return this.prisma.auditLog.create({
      data: {
        organizationId: data.organizationId || null,
        actorUserId,
        action: data.action,
        entityType,
        entityId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
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
