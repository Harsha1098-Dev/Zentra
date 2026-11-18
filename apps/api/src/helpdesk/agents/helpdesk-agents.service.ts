import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { HelpdeskAgentsRepository } from './helpdesk-agents.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HelpdeskAgentsService {
  constructor(
    private readonly repository: HelpdeskAgentsRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async findById(organizationId: string, id: string) {
    const agent = await this.repository.findById(organizationId, id);
    if (!agent) {
      throw new NotFoundException(`Helpdesk agent with ID ${id} not found`);
    }
    return agent;
  }

  async findByUserId(organizationId: string, userId: string) {
    return this.repository.findByUserId(organizationId, userId);
  }

  async create(
    organizationId: string,
    data: any,
    currentUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify membership
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { organizationId, userId: data.userId },
    });
    if (!membership) {
      throw new BadRequestException('User is not a member of this organization');
    }

    // Check duplicate
    const existing = await this.repository.findByUserId(organizationId, data.userId);
    if (existing) {
      throw new ConflictException('User is already registered as a helpdesk agent in this organization');
    }

    const { categoryIds, ...agentData } = data;
    const agent = await this.repository.create(organizationId, {
      ...agentData,
      createdBy: currentUserId,
    });

    if (categoryIds && categoryIds.length > 0) {
      for (const catId of categoryIds) {
        await this.repository.assignCategory(organizationId, agent.id, catId);
      }
    }

    await this.auditService.log({
      organizationId,
      userId: currentUserId,
      action: AuditAction.HELPDESK_AGENT_ASSIGN,
      resource: 'HelpdeskAgent',
      resourceId: agent.id,
      ipAddress,
      userAgent,
      details: { agentUserId: data.userId, agentType: agent.agentType, agentLevel: agent.agentLevel },
    });

    return this.findById(organizationId, agent.id);
  }

  async update(
    organizationId: string,
    id: string,
    data: any,
    currentUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findById(organizationId, id);
    const { categoryIds, ...agentData } = data;

    const updated = await this.repository.update(organizationId, id, agentData);

    if (categoryIds !== undefined) {
      // Re-map categories
      await this.prisma.helpdeskCategoryAgent.deleteMany({
        where: { organizationId, helpdeskAgentId: id },
      });
      for (const catId of categoryIds) {
        await this.repository.assignCategory(organizationId, id, catId);
      }
    }

    await this.auditService.log({
      organizationId,
      userId: currentUserId,
      action: AuditAction.HELPDESK_AGENT_ASSIGN,
      resource: 'HelpdeskAgent',
      resourceId: id,
      ipAddress,
      userAgent,
      details: data,
    });

    return this.findById(organizationId, id);
  }

  async assignCategory(
    organizationId: string,
    agentId: string,
    categoryId: string,
    isPrimary = false,
    subCategoryId?: string,
  ) {
    await this.findById(organizationId, agentId);
    return this.repository.assignCategory(organizationId, agentId, categoryId, isPrimary, subCategoryId);
  }

  async removeCategory(
    organizationId: string,
    agentId: string,
    categoryId: string,
  ) {
    await this.findById(organizationId, agentId);
    return this.repository.removeCategory(organizationId, agentId, categoryId);
  }

  async deactivate(
    organizationId: string,
    id: string,
    currentUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const updated = await this.update(organizationId, id, { isActive: false }, currentUserId, ipAddress, userAgent);

    await this.auditService.log({
      organizationId,
      userId: currentUserId,
      action: AuditAction.HELPDESK_AGENT_REMOVE,
      resource: 'HelpdeskAgent',
      resourceId: id,
      ipAddress,
      userAgent,
      details: { isActive: false },
    });

    return updated;
  }
}
