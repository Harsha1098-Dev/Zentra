import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PollsRepository } from './polls.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';

@Injectable()
export class PollsService {
  constructor(
    private readonly repository: PollsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, status?: string) {
    return this.repository.findAll(organizationId, status);
  }

  async findById(organizationId: string, id: string, employeeId?: string) {
    const poll = await this.repository.findById(organizationId, id);
    if (!poll) {
      throw new NotFoundException(`Poll with ID ${id} not found`);
    }

    let hasVoted = false;
    let userVotedOptionId: string | null = null;

    if (employeeId) {
      const vote = await this.repository.findVote(organizationId, id, employeeId);
      if (vote) {
        hasVoted = true;
        userVotedOptionId = vote.pollOptionId;
      }
    }

    const optionsWithPercentages = poll.options.map((opt) => ({
      ...opt,
      percentage:
        poll.totalVotesCount > 0
          ? Math.round((opt.votesCount / poll.totalVotesCount) * 100)
          : 0,
    }));

    return {
      ...poll,
      options: optionsWithPercentages,
      hasVoted,
      userVotedOptionId,
    };
  }

  async create(
    organizationId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!data.question || !data.title) {
      throw new BadRequestException('Title and question are required');
    }

    const options = data.options && data.options.length > 0
      ? data.options
      : ['Yes', 'No'];

    const poll = await this.repository.create(organizationId, {
      title: data.title,
      question: data.question,
      pollType: data.pollType || 'SINGLE_CHOICE',
      status: data.status || 'ACTIVE',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isAnonymous: data.isAnonymous ?? true,
      audienceType: data.audienceType || 'ALL',
      audienceFilter: data.audienceFilter,
      createdBy: userId,
      options,
    });

    await this.auditService.log({
      action: AuditAction.POLL_CREATE,
      entityType: 'Poll',
      entityId: poll.id,
      organizationId,
      actorUserId: userId,
      details: { title: poll.title, question: poll.question },
      ipAddress,
      userAgent,
    });

    return this.findById(organizationId, poll.id);
  }

  async vote(
    organizationId: string,
    pollId: string,
    employeeId: string,
    pollOptionId?: string,
    ratingValue?: number,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const poll = await this.repository.findById(organizationId, pollId);
    if (!poll) {
      throw new NotFoundException(`Poll with ID ${pollId} not found`);
    }

    if (poll.status !== 'ACTIVE') {
      throw new BadRequestException('This poll is closed');
    }

    // Single vote per employee check
    const existingVote = await this.repository.findVote(
      organizationId,
      pollId,
      employeeId,
    );
    if (existingVote) {
      throw new ConflictException('You have already voted in this poll');
    }

    const vote = await this.repository.castVote(
      organizationId,
      pollId,
      employeeId,
      pollOptionId,
      ratingValue,
    );

    if (userId) {
      await this.auditService.log({
        action: AuditAction.POLL_VOTE,
        entityType: 'PollVote',
        entityId: vote.id,
        organizationId,
        actorUserId: userId,
        details: { pollId, pollOptionId, ratingValue },
        ipAddress,
        userAgent,
      });
    }

    return this.findById(organizationId, pollId, employeeId);
  }

  async close(
    organizationId: string,
    pollId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.repository.findById(organizationId, pollId);

    const updated = await this.repository.update(organizationId, pollId, {
      status: 'CLOSED',
      endDate: new Date(),
    });

    await this.auditService.log({
      action: AuditAction.POLL_CLOSE,
      entityType: 'Poll',
      entityId: pollId,
      organizationId,
      actorUserId: userId,
      details: { title: updated.title },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(organizationId: string, pollId: string) {
    await this.repository.findById(organizationId, pollId);
    return this.repository.delete(organizationId, pollId);
  }
}
