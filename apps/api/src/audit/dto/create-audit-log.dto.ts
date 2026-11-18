export interface CreateAuditLogDto {
  organizationId?: string | null;
  actorUserId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any> | null;
  prevValues?: Record<string, any> | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
