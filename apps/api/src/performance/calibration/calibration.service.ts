import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CalibrationRepository } from './calibration.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class CalibrationService {
  constructor(
    private readonly repository: CalibrationRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, performanceCycleId?: string) {
    return this.repository.findAll(organizationId, performanceCycleId);
  }

  async findById(id: string, organizationId: string) {
    const session = await this.repository.findById(id, organizationId);
    if (!session) {
      throw new NotFoundException(`Calibration session '${id}' not found`);
    }
    return session;
  }

  async create(organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    const session = await this.repository.create(organizationId, data, userId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CALIBRATION_SESSION_CREATE,
      resource: 'calibration_sessions',
      resourceId: session.id,
      details: { name: session.name, performanceCycleId: session.performanceCycleId },
      ipAddress: ip,
      userAgent: ua,
    });

    return session;
  }

  async update(id: string, organizationId: string, data: any, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    return this.repository.update(id, organizationId, data);
  }

  async recordDecision(
    sessionId: string,
    organizationId: string,
    data: any,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const session = await this.findById(sessionId, organizationId);

    return this.prisma.$transaction(async (tx) => {
      const decision = await tx.calibrationDecision.upsert({
        where: {
          calibrationSessionId_employeeId: {
            calibrationSessionId: sessionId,
            employeeId: data.employeeId,
          },
        },
        create: {
          organizationId,
          calibrationSessionId: sessionId,
          employeeId: data.employeeId,
          originalRating: data.originalRating,
          adjustedRating: data.adjustedRating,
          adjustmentReason: data.adjustmentReason,
          decidedBy: userId,
        },
        update: {
          originalRating: data.originalRating,
          adjustedRating: data.adjustedRating,
          adjustmentReason: data.adjustmentReason,
          decidedBy: userId,
          decidedAt: new Date(),
        },
      });

      // Update corresponding assignment
      await tx.appraisalAssignment.updateMany({
        where: {
          organizationId,
          performanceCycleId: session.performanceCycleId,
          employeeId: data.employeeId,
        },
        data: {
          finalRating: data.adjustedRating,
          calibrationStatus: 'COMPLETED',
        },
      });

      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.CALIBRATION_DECISION_RECORD,
        resource: 'calibration_decisions',
        resourceId: decision.id,
        details: {
          employeeId: data.employeeId,
          originalRating: data.originalRating,
          adjustedRating: data.adjustedRating,
          adjustmentReason: data.adjustmentReason,
        },
        ipAddress: ip,
        userAgent: ua,
      });

      return decision;
    });
  }

  async publish(id: string, organizationId: string, userId: string, ip?: string, ua?: string) {
    await this.findById(id, organizationId);
    const updated = await this.repository.update(id, organizationId, {
      status: 'COMPLETED',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.CALIBRATION_PUBLISH,
      resource: 'calibration_sessions',
      resourceId: id,
      details: { status: 'COMPLETED' },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }
}
