import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'tokenhash',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie',
  'credential',
]);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  private sanitize(obj?: Record<string, any> | null): Record<string, any> | null {
    if (!obj || typeof obj !== 'object') return null;

    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        sanitized[key] = this.sanitize(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  async log(dto: CreateAuditLogDto) {
    try {
      const sanitizedDto: CreateAuditLogDto = {
        ...dto,
        oldValues: this.sanitize(dto.oldValues),
        newValues: this.sanitize(dto.newValues),
      };

      const record = await this.auditRepository.create(sanitizedDto);
      this.logger.log(
        `[AUDIT] Action: ${dto.action} | Entity: ${dto.entityType}:${dto.entityId} | Actor: ${dto.actorUserId || 'system'} | Org: ${dto.organizationId || 'none'}`,
      );
      return record;
    } catch (err: any) {
      this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
      // We do not rethrow so audit failure doesn't break user flow, but it is logged
      return null;
    }
  }

  async getOrganizationAuditLogs(organizationId: string, limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.auditRepository.findByOrganization(organizationId, limit, offset),
      this.auditRepository.countByOrganization(organizationId),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        organizationId: item.organizationId,
        actorUserId: item.actorUserId,
        actorEmail: item.actorUser?.email || null,
        actorName: item.actorUser
          ? `${item.actorUser.firstName || ''} ${item.actorUser.lastName || ''}`.trim()
          : null,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        oldValues: item.oldValues,
        newValues: item.newValues,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    };
  }
}
