import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { WellnessRepository } from './wellness.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class WellnessService {
  constructor(
    private readonly repository: WellnessRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, status?: string, category?: string) {
    return this.repository.findAll(organizationId, status, category);
  }

  async findById(organizationId: string, id: string, employeeId?: string) {
    const activity = await this.repository.findById(organizationId, id);
    if (!activity) {
      throw new NotFoundException(`Wellness activity with ID ${id} not found`);
    }

    let isEnrolled = false;
    let isCompleted = false;

    if (employeeId) {
      const part = activity.participations.find((p) => p.employeeId === employeeId);
      if (part) {
        isEnrolled = true;
        isCompleted = part.status === 'COMPLETED';
      }
    }

    return {
      ...activity,
      isEnrolled,
      isCompleted,
    };
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const activity = await this.repository.create(organizationId, {
      title: data.title,
      description: data.description,
      category: data.category || 'FITNESS_CHALLENGE',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      maxParticipants: data.maxParticipants ?? 0,
      pointsReward: data.pointsReward ?? 100,
      locationOrLink: data.locationOrLink,
      status: data.status || 'ACTIVE',
      createdBy: userId,
    });

    await this.auditService.log({
      action: AuditAction.WELLNESS_ACTIVITY_CREATE,
      entityType: 'WellnessActivity',
      entityId: activity.id,
      organizationId,
      actorUserId: userId,
      details: { title: activity.title, pointsReward: activity.pointsReward },
      ipAddress,
      userAgent,
    });

    return activity;
  }

  async update(
    organizationId: string,
    id: string,
    data: any,
  ) {
    await this.findById(organizationId, id);
    return this.repository.update(organizationId, id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
  }

  async delete(organizationId: string, id: string) {
    await this.findById(organizationId, id);
    return this.repository.delete(organizationId, id);
  }

  async joinActivity(
    organizationId: string,
    activityId: string,
    employeeId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const activity = await this.findById(organizationId, activityId);

    if (activity.status !== 'ACTIVE' && activity.status !== 'SCHEDULED') {
      throw new BadRequestException('This wellness activity is not open for registration');
    }

    // 1. Capacity check
    if (
      activity.maxParticipants > 0 &&
      activity.enrolledCount >= activity.maxParticipants
    ) {
      throw new BadRequestException(
        `Activity has reached maximum participant capacity of ${activity.maxParticipants}`,
      );
    }

    // 2. Duplicate registration check
    const existing = await this.repository.findParticipation(
      organizationId,
      activityId,
      employeeId,
    );
    if (existing) {
      throw new ConflictException('Already registered for this wellness activity');
    }

    const participation = await this.repository.joinActivity(
      organizationId,
      activityId,
      employeeId,
    );

    if (userId) {
      await this.auditService.log({
        action: AuditAction.WELLNESS_ACTIVITY_JOIN,
        entityType: 'WellnessParticipation',
        entityId: participation.id,
        organizationId,
        actorUserId: userId,
        details: { activityId, title: activity.title, employeeId },
        ipAddress,
        userAgent,
      });
    }

    return participation;
  }

  async completeActivity(
    organizationId: string,
    activityId: string,
    employeeId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const activity = await this.findById(organizationId, activityId);

    const participation = await this.repository.findParticipation(
      organizationId,
      activityId,
      employeeId,
    );
    if (!participation) {
      throw new NotFoundException('Registration record for this activity not found');
    }

    if (participation.status === 'COMPLETED') {
      throw new BadRequestException('Activity has already been marked completed');
    }

    const completed = await this.repository.completeActivity(
      organizationId,
      activityId,
      employeeId,
      activity.pointsReward,
    );

    if (userId) {
      await this.auditService.log({
        action: AuditAction.WELLNESS_ACTIVITY_COMPLETE,
        entityType: 'WellnessParticipation',
        entityId: completed.id,
        organizationId,
        actorUserId: userId,
        details: {
          activityId,
          employeeId,
          pointsAwarded: activity.pointsReward,
        },
        ipAddress,
        userAgent,
      });
    }

    return completed;
  }

  async findEmployeeParticipations(organizationId: string, employeeId: string) {
    return this.repository.findEmployeeParticipations(organizationId, employeeId);
  }
}
