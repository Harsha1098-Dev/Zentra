import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RewardsRepository } from './rewards.repository';
import { RecognitionRepository } from '../recognition/recognition.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class RewardsService {
  constructor(
    private readonly repository: RewardsRepository,
    private readonly recognitionRepository: RecognitionRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, isActiveOnly = true) {
    return this.repository.findAll(organizationId, isActiveOnly);
  }

  async findById(organizationId: string, id: string) {
    const reward = await this.repository.findById(organizationId, id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }
    return reward;
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const reward = await this.repository.create(organizationId, {
      title: data.title,
      description: data.description,
      pointsCost: data.pointsCost,
      rewardType: data.rewardType || 'VOUCHER',
      quantityAvailable: data.quantityAvailable ?? -1,
      maxRedemptionsPerEmployee: data.maxRedemptionsPerEmployee ?? 1,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
    });

    await this.auditService.log({
      action: AuditAction.REWARD_CREATE,
      entityType: 'Reward',
      entityId: reward.id,
      organizationId,
      actorUserId: userId,
      details: { title: reward.title, pointsCost: reward.pointsCost },
      ipAddress,
      userAgent,
    });

    return reward;
  }

  async update(
    organizationId: string,
    id: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findById(organizationId, id);

    const updated = await this.repository.update(organizationId, id, data);

    await this.auditService.log({
      action: AuditAction.REWARD_UPDATE,
      entityType: 'Reward',
      entityId: id,
      organizationId,
      actorUserId: userId,
      details: data,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(organizationId: string, id: string) {
    await this.findById(organizationId, id);
    return this.repository.delete(organizationId, id);
  }

  async redeem(
    organizationId: string,
    rewardId: string,
    employeeId: string,
    notes?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const reward = await this.findById(organizationId, rewardId);

    if (!reward.isActive) {
      throw new BadRequestException('This reward is currently unavailable');
    }

    // 1. Stock check
    if (reward.quantityAvailable !== -1 && reward.quantityAvailable <= 0) {
      throw new BadRequestException('Reward is out of stock');
    }

    // 2. Employee balance check
    const currentBalance = await this.recognitionRepository.getEmployeePointsBalance(
      organizationId,
      employeeId,
    );
    if (currentBalance < reward.pointsCost) {
      throw new BadRequestException(
        `Insufficient points balance. You have ${currentBalance} points, but this reward costs ${reward.pointsCost} points.`,
      );
    }

    // 3. Max redemptions per employee check
    const previousRedemptions = await this.repository.countEmployeeRedemptionsForReward(
      organizationId,
      rewardId,
      employeeId,
    );
    if (previousRedemptions >= reward.maxRedemptionsPerEmployee) {
      throw new BadRequestException(
        `You have reached the maximum redemption limit of ${reward.maxRedemptionsPerEmployee} for this reward`,
      );
    }

    const redemption = await this.repository.createRedemption(
      organizationId,
      rewardId,
      employeeId,
      reward.pointsCost,
      notes,
    );

    if (userId) {
      await this.auditService.log({
        action: AuditAction.REWARD_REDEEM,
        entityType: 'RewardRedemption',
        entityId: redemption.id,
        organizationId,
        actorUserId: userId,
        details: { rewardId, pointsSpent: reward.pointsCost },
        ipAddress,
        userAgent,
      });
    }

    return redemption;
  }

  async findRedemptions(organizationId: string, employeeId?: string, status?: string) {
    return this.repository.findRedemptions(organizationId, employeeId, status);
  }

  async updateRedemptionStatus(
    organizationId: string,
    id: string,
    status: string,
    approverUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.repository.findRedemptionById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`Redemption with ID ${id} not found`);
    }

    const updated = await this.repository.updateRedemptionStatus(
      organizationId,
      id,
      status,
      approverUserId,
    );

    const action =
      status === 'APPROVED'
        ? AuditAction.REWARD_REDEMPTION_APPROVE
        : status === 'FULFILLED'
        ? AuditAction.REWARD_REDEMPTION_FULFILL
        : AuditAction.REWARD_UPDATE;

    await this.auditService.log({
      action,
      entityType: 'RewardRedemption',
      entityId: id,
      organizationId,
      actorUserId: approverUserId,
      details: { status, rewardId: existing.rewardId, employeeId: existing.employeeId },
      ipAddress,
      userAgent,
    });

    return updated;
  }
}
