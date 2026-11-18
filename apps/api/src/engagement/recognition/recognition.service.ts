import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RecognitionRepository } from './recognition.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecognitionService {
  constructor(
    private readonly repository: RecognitionRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(organizationId: string, status?: string, category?: string) {
    return this.repository.findAll(organizationId, status, category);
  }

  async findById(organizationId: string, id: string) {
    const recognition = await this.repository.findById(organizationId, id);
    if (!recognition) {
      throw new NotFoundException(`Recognition with ID ${id} not found`);
    }
    return recognition;
  }

  async giveRecognition(
    organizationId: string,
    senderEmployeeId: string,
    data: {
      receiverId: string;
      category: string;
      message: string;
      pointsAwarded?: number;
      programId?: string;
      badgeId?: string;
      recognitionType?: string;
    },
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Self-recognition check
    if (senderEmployeeId === data.receiverId) {
      throw new BadRequestException('Employees cannot recognize themselves');
    }

    // 2. Validate receiver is active in the same organization
    const receiver = await this.prisma.employee.findFirst({
      where: {
        id: data.receiverId,
        organizationId,
        status: 'ACTIVE',
      },
    });
    if (!receiver) {
      throw new BadRequestException('Receiver employee not found or is inactive');
    }

    // 3. Check program approval settings if programId provided
    let status = 'APPROVED';
    let points = data.pointsAwarded ?? 50;

    if (data.programId) {
      const program = await this.repository.findProgramById(organizationId, data.programId);
      if (program) {
        if (program.requiresApproval) {
          status = 'PENDING';
        }
        if (data.pointsAwarded === undefined) {
          points = program.defaultPoints;
        }
      }
    }

    const recognition = await this.repository.create(organizationId, {
      senderId: senderEmployeeId,
      receiverId: data.receiverId,
      programId: data.programId || null,
      badgeId: data.badgeId || null,
      category: data.category,
      recognitionType: data.recognitionType || 'PEER_TO_PEER',
      message: data.message,
      pointsAwarded: points,
      status,
    });

    // If approved and badgeId was specified, award badge
    if (status === 'APPROVED' && data.badgeId) {
      await this.prisma.employeeBadge.create({
        data: {
          organizationId,
          badgeId: data.badgeId,
          employeeId: data.receiverId,
          recognitionId: recognition.id,
          reason: `Awarded via recognition from peer: ${data.category}`,
        },
      });
    }

    await this.auditService.log({
      action: AuditAction.RECOGNITION_GIVE,
      entityType: 'Recognition',
      entityId: recognition.id,
      organizationId,
      actorUserId: userId,
      details: {
        senderId: senderEmployeeId,
        receiverId: data.receiverId,
        category: data.category,
        pointsAwarded: points,
        status,
      },
      ipAddress,
      userAgent,
    });

    return recognition;
  }

  async approve(
    organizationId: string,
    id: string,
    approverUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const recognition = await this.findById(organizationId, id);

    const updated = await this.repository.update(organizationId, id, {
      status: 'APPROVED',
      approvedById: approverUserId,
      approvedAt: new Date(),
    });

    // Award badge if one was attached
    if (recognition.badgeId) {
      await this.prisma.employeeBadge.create({
        data: {
          organizationId,
          badgeId: recognition.badgeId,
          employeeId: recognition.receiverId,
          recognitionId: recognition.id,
          reason: `Awarded via approved recognition: ${recognition.category}`,
        },
      });
    }

    await this.auditService.log({
      action: AuditAction.RECOGNITION_APPROVE,
      entityType: 'Recognition',
      entityId: id,
      organizationId,
      actorUserId: approverUserId,
      details: { receiverId: recognition.receiverId, pointsAwarded: recognition.pointsAwarded },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async reject(
    organizationId: string,
    id: string,
    approverUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findById(organizationId, id);

    const updated = await this.repository.update(organizationId, id, {
      status: 'REJECTED',
    });

    await this.auditService.log({
      action: AuditAction.RECOGNITION_REJECT,
      entityType: 'Recognition',
      entityId: id,
      organizationId,
      actorUserId: approverUserId,
      details: { id },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async like(organizationId: string, id: string) {
    await this.findById(organizationId, id);
    return this.repository.incrementLikes(organizationId, id);
  }

  async findAllPrograms(organizationId: string) {
    return this.repository.findAllPrograms(organizationId);
  }

  async createProgram(organizationId: string, data: any) {
    return this.repository.createProgram(organizationId, data);
  }

  async getEmployeePointsBalance(organizationId: string, employeeId: string) {
    return this.repository.getEmployeePointsBalance(organizationId, employeeId);
  }
}
