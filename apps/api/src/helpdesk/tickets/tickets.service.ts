import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TicketsRepository } from './tickets.repository';
import { HelpdeskCategoriesRepository } from '../categories/helpdesk-categories.repository';
import { HelpdeskAgentsRepository } from '../agents/helpdesk-agents.repository';
import { SlaService } from '../sla/sla.service';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  TicketStatus,
  TicketPriority,
  DefaultAssigneeType,
  TicketMessageType,
  TicketConversationAuthorType,
} from '@zentra/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly repository: TicketsRepository,
    private readonly categoriesRepository: HelpdeskCategoriesRepository,
    private readonly agentsRepository: HelpdeskAgentsRepository,
    private readonly slaService: SlaService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(organizationId: string, id: string, viewerUserId?: string, isAgentOrAdmin = false) {
    const ticket = await this.repository.findById(organizationId, id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Filter out internal notes if viewer is a regular employee
    if (!isAgentOrAdmin && ticket.conversations) {
      ticket.conversations = ticket.conversations.filter((c) => !c.isInternal);
    }

    return ticket;
  }

  async create(
    organizationId: string,
    data: any,
    authorUserId: string,
    ipAddress?: string,
    userAgent?: string,
    forcedEmployeeId?: string,
  ) {
    // 1. Resolve employee ID
    let employeeId = forcedEmployeeId || data.employeeId;
    if (!employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { organizationId, userId: authorUserId },
      });
      if (!emp) {
        throw new BadRequestException('Author must be an employee of the organization');
      }
      employeeId = emp.id;
    }

    // 2. Validate category
    const category = await this.categoriesRepository.findById(organizationId, data.helpdeskCategoryId);
    if (!category || !category.isActive) {
      throw new BadRequestException('Selected category is inactive or does not exist');
    }

    // 3. Duplicate ticket prevention (10-minute sliding window)
    const duplicate = await this.repository.findDuplicateTicket(
      organizationId,
      employeeId,
      data.helpdeskCategoryId,
      data.subject,
      10,
    );
    if (duplicate) {
      throw new ConflictException(
        'A duplicate ticket with the same subject and category was recently submitted. Please wait before submitting again.',
      );
    }

    // 4. Generate Ticket Number
    const ticketNumber = await this.repository.getNextTicketNumber(organizationId);

    // 5. Auto-assignment logic
    let assignedAgentId: string | null = null;
    const assigneeType = category.defaultAssigneeType;

    if (assigneeType === DefaultAssigneeType.AGENT && category.defaultAssigneeId) {
      assignedAgentId = category.defaultAssigneeId;
    } else {
      // Round-robin or lowest load among category agents
      const categoryAgents = await this.agentsRepository.findCategoryAgents(
        organizationId,
        data.helpdeskCategoryId,
        data.helpdeskSubCategoryId,
      );

      if (categoryAgents && categoryAgents.length > 0) {
        // Pick primary if exists, or agent with lowest active ticket count
        const agentCounts = await Promise.all(
          categoryAgents.map(async (ca) => {
            const count = await this.prisma.ticket.count({
              where: {
                organizationId,
                assignedAgentId: ca.helpdeskAgentId,
                ticketStatus: { notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'] },
              },
            });
            return { agentId: ca.helpdeskAgentId, isPrimary: ca.isPrimary, count };
          }),
        );

        agentCounts.sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return a.count - b.count;
        });

        assignedAgentId = agentCounts[0].agentId;
      }
    }

    // 6. SLA due dates calculation
    let slaResponseDueAt: Date | null = null;
    let slaResolutionDueAt: Date | null = null;
    let slaPolicyId = category.slaPolicyId;

    if (!slaPolicyId) {
      const defaultPolicy = await this.prisma.slaPolicy.findFirst({
        where: { organizationId, isActive: true },
      });
      if (defaultPolicy) {
        slaPolicyId = defaultPolicy.id;
      }
    }

    if (slaPolicyId) {
      const policy = await this.slaService.findPolicyById(organizationId, slaPolicyId);
      if (policy && policy.isActive) {
        const { responseDueAt, resolutionDueAt } = this.slaService.calculateDueDates(
          new Date(),
          policy,
        );
        slaResponseDueAt = responseDueAt;
        slaResolutionDueAt = resolutionDueAt;
      }
    }

    // 7. Create Ticket
    const ticket = await this.repository.create(organizationId, {
      ticketNumber,
      employeeId,
      raisedBy: authorUserId,
      helpdeskCategoryId: data.helpdeskCategoryId,
      helpdeskSubCategoryId: data.helpdeskSubCategoryId || null,
      subject: data.subject.trim(),
      description: data.description.trim(),
      priority: data.priority || category.defaultPriority || TicketPriority.MEDIUM,
      ticketStatus: TicketStatus.OPEN,
      assignedAgentId,
      slaPolicyId,
      slaResponseDueAt,
      slaResolutionDueAt,
    });

    // 8. Record initial status history
    await this.repository.addStatusHistory(organizationId, {
      ticketId: ticket.id,
      fromStatus: null,
      toStatus: TicketStatus.OPEN,
      changedBy: authorUserId,
      comments: 'Ticket opened',
    });

    // 9. If assigned, record initial assignment history
    if (assignedAgentId) {
      await this.repository.addAssignmentHistory(organizationId, {
        ticketId: ticket.id,
        fromAgentId: null,
        toAgentId: assignedAgentId,
        assignedBy: authorUserId,
        comments: 'Auto-assigned by routing policy',
      });
    }

    // 10. Handle initial attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      for (const att of data.attachments) {
        await this.repository.addAttachment(organizationId, {
          ticketId: ticket.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileSize: att.fileSize,
          uploadedBy: authorUserId,
        });
      }
    }

    // 11. Audit log
    await this.auditService.log({
      organizationId,
      userId: authorUserId,
      action: AuditAction.TICKET_CREATE,
      resource: 'Ticket',
      resourceId: ticket.id,
      ipAddress,
      userAgent,
      details: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        priority: ticket.priority,
        assignedAgentId,
      },
    });

    return this.findById(organizationId, ticket.id, authorUserId, true);
  }

  async update(
    organizationId: string,
    id: string,
    data: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const ticket = await this.findById(organizationId, id, userId, true);
    const updateData: any = {};

    if (data.priority && data.priority !== ticket.priority) {
      updateData.priority = data.priority;
      await this.auditService.log({
        organizationId,
        userId,
        action: AuditAction.TICKET_PRIORITY_CHANGE,
        resource: 'Ticket',
        resourceId: id,
        ipAddress,
        userAgent,
        details: { from: ticket.priority, to: data.priority },
      });
    }

    if (data.escalationLevel) {
      updateData.escalationLevel = data.escalationLevel;
    }

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(organizationId, id, updateData);
    }

    if (data.assignedAgentId !== undefined && data.assignedAgentId !== ticket.assignedAgentId) {
      await this.assign(organizationId, id, data.assignedAgentId, userId, data.comment, ipAddress, userAgent);
    }

    if (data.ticketStatus && data.ticketStatus !== ticket.ticketStatus) {
      await this.changeStatus(organizationId, id, data.ticketStatus, userId, data.comment, ipAddress, userAgent);
    }

    return this.findById(organizationId, id, userId, true);
  }

  async assign(
    organizationId: string,
    id: string,
    newAgentId: string | null,
    assignedByUserId: string,
    comments?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const ticket = await this.findById(organizationId, id, assignedByUserId, true);

    if (newAgentId) {
      const agent = await this.agentsRepository.findById(organizationId, newAgentId);
      if (!agent || !agent.isActive) {
        throw new BadRequestException('Assigned agent is not active or not found');
      }
    }

    await this.repository.update(organizationId, id, {
      assignedAgentId: newAgentId,
    });

    await this.repository.addAssignmentHistory(organizationId, {
      ticketId: id,
      fromAgentId: ticket.assignedAgentId,
      toAgentId: newAgentId,
      assignedBy: assignedByUserId,
      comments: comments || 'Agent reassigned',
    });

    await this.auditService.log({
      organizationId,
      userId: assignedByUserId,
      action: AuditAction.TICKET_ASSIGN,
      resource: 'Ticket',
      resourceId: id,
      ipAddress,
      userAgent,
      details: { fromAgentId: ticket.assignedAgentId, toAgentId: newAgentId },
    });

    return this.findById(organizationId, id, assignedByUserId, true);
  }

  async changeStatus(
    organizationId: string,
    id: string,
    newStatus: TicketStatus,
    changedByUserId: string,
    comments?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const ticket = await this.findById(organizationId, id, changedByUserId, true);
    const updateData: any = { ticketStatus: newStatus };

    if (newStatus === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = changedByUserId;
    }

    if (newStatus === TicketStatus.CLOSED && !ticket.closedAt) {
      updateData.closedAt = new Date();
      updateData.closedBy = changedByUserId;
    }

    if (newStatus === TicketStatus.REOPENED) {
      updateData.reopenedAt = new Date();
    }

    await this.repository.update(organizationId, id, updateData);

    await this.repository.addStatusHistory(organizationId, {
      ticketId: id,
      fromStatus: ticket.ticketStatus,
      toStatus: newStatus,
      changedBy: changedByUserId,
      comments: comments || `Status changed to ${newStatus}`,
    });

    let action = AuditAction.TICKET_STATUS_CHANGE;
    if (newStatus === TicketStatus.RESOLVED) action = AuditAction.TICKET_RESOLVE;
    if (newStatus === TicketStatus.CLOSED) action = AuditAction.TICKET_CLOSE;
    if (newStatus === TicketStatus.REOPENED) action = AuditAction.TICKET_REOPEN;
    if (newStatus === TicketStatus.CANCELLED) action = AuditAction.TICKET_CANCEL;

    await this.auditService.log({
      organizationId,
      userId: changedByUserId,
      action,
      resource: 'Ticket',
      resourceId: id,
      ipAddress,
      userAgent,
      details: { from: ticket.ticketStatus, to: newStatus, comments },
    });

    return this.findById(organizationId, id, changedByUserId, true);
  }

  async addConversation(
    organizationId: string,
    ticketId: string,
    data: any,
    authorUserId: string,
    authorType: TicketConversationAuthorType = TicketConversationAuthorType.AGENT,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const ticket = await this.findById(organizationId, ticketId, authorUserId, true);

    const convo = await this.repository.addConversation(organizationId, {
      ticketId,
      authorId: authorUserId,
      authorType,
      messageType: data.messageType || (data.isInternal ? TicketMessageType.NOTE : TicketMessageType.REPLY),
      message: data.message.trim(),
      isInternal: data.isInternal || false,
      attachments: data.attachments,
    });

    // If this is an agent reply and firstResponseAt is not set, set it now
    if (
      (authorType === TicketConversationAuthorType.AGENT || authorType === TicketConversationAuthorType.SYSTEM) &&
      !data.isInternal &&
      !ticket.firstResponseAt
    ) {
      await this.repository.update(organizationId, ticketId, {
        firstResponseAt: new Date(),
      });
    }

    // If employee replied to WAITING_FOR_EMPLOYEE ticket, automatically bump back to IN_PROGRESS
    if (authorType === TicketConversationAuthorType.EMPLOYEE && ticket.ticketStatus === TicketStatus.WAITING_FOR_EMPLOYEE) {
      await this.changeStatus(organizationId, ticketId, TicketStatus.IN_PROGRESS, authorUserId, 'Employee responded');
    }

    await this.auditService.log({
      organizationId,
      userId: authorUserId,
      action: data.isInternal ? AuditAction.TICKET_NOTE_CREATE : AuditAction.TICKET_UPDATE,
      resource: 'TicketConversation',
      resourceId: convo.id,
      ipAddress,
      userAgent,
      details: { ticketId, isInternal: data.isInternal },
    });

    return convo;
  }

  async addAttachment(
    organizationId: string,
    ticketId: string,
    data: any,
    uploadedByUserId: string,
  ) {
    await this.findById(organizationId, ticketId, uploadedByUserId, true);
    return this.repository.addAttachment(organizationId, {
      ticketId,
      ...data,
      uploadedBy: uploadedByUserId,
    });
  }

  async submitFeedback(
    organizationId: string,
    ticketId: string,
    rating: number,
    comment: string | null,
    authorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const ticket = await this.findById(organizationId, ticketId, authorUserId, true);

    // Verify status is RESOLVED or CLOSED
    if (ticket.ticketStatus !== TicketStatus.RESOLVED && ticket.ticketStatus !== TicketStatus.CLOSED) {
      throw new BadRequestException('Feedback can only be submitted for resolved or closed tickets');
    }

    // Verify employee ownership
    const emp = await this.prisma.employee.findFirst({
      where: { organizationId, userId: authorUserId },
    });
    if (!emp || emp.id !== ticket.employeeId) {
      throw new ForbiddenException('Only the employee who raised this ticket can submit feedback');
    }

    // Check if feedback already submitted
    const existingFeedback = await this.repository.findFeedbackByTicketId(organizationId, ticketId);
    if (existingFeedback) {
      throw new ConflictException('Feedback has already been submitted for this ticket');
    }

    const feedback = await this.repository.createFeedback(organizationId, {
      ticketId,
      employeeId: emp.id,
      rating,
      comment,
    });

    // Update satisfaction rating on Ticket
    await this.repository.update(organizationId, ticketId, {
      satisfactionRating: rating,
      satisfactionComment: comment,
    });

    await this.auditService.log({
      organizationId,
      userId: authorUserId,
      action: AuditAction.TICKET_FEEDBACK_SUBMIT,
      resource: 'TicketFeedback',
      resourceId: feedback.id,
      ipAddress,
      userAgent,
      details: { ticketId, rating },
    });

    return feedback;
  }
}
