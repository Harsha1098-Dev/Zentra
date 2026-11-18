import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { HelpdeskCategoriesService } from '../src/helpdesk/categories/helpdesk-categories.service';
import { HelpdeskCategoriesRepository } from '../src/helpdesk/categories/helpdesk-categories.repository';
import { HelpdeskAgentsService } from '../src/helpdesk/agents/helpdesk-agents.service';
import { HelpdeskAgentsRepository } from '../src/helpdesk/agents/helpdesk-agents.repository';
import { SlaService } from '../src/helpdesk/sla/sla.service';
import { SlaRepository } from '../src/helpdesk/sla/sla.repository';
import { TicketsService } from '../src/helpdesk/tickets/tickets.service';
import { TicketsRepository } from '../src/helpdesk/tickets/tickets.repository';
import { KnowledgeBaseService } from '../src/helpdesk/knowledge-base/knowledge-base.service';
import { KnowledgeBaseRepository } from '../src/helpdesk/knowledge-base/knowledge-base.repository';
import { FaqsService } from '../src/helpdesk/faqs/faqs.service';
import { FaqsRepository } from '../src/helpdesk/faqs/faqs.repository';
import { HelpdeskReportsService } from '../src/helpdesk/reports/reports.service';
import { HelpdeskReportsRepository } from '../src/helpdesk/reports/reports.repository';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import {
  AuditAction,
  TicketPriority,
  TicketStatus,
  DefaultAssigneeType,
  AgentType,
  AgentLevel,
  ArticleStatus,
  KnowledgeBaseVisibility,
  TicketConversationAuthorType,
} from '@zentra/shared-types';

describe('HR Helpdesk & Employee Support Module Suite', () => {
  let categoriesService: HelpdeskCategoriesService;
  let agentsService: HelpdeskAgentsService;
  let slaService: SlaService;
  let ticketsService: TicketsService;
  let kbService: KnowledgeBaseService;
  let faqsService: FaqsService;
  let reportsService: HelpdeskReportsService;

  const orgId = 'org-helpdesk-test';
  const otherOrgId = 'org-other-test';
  const userId = 'usr-admin-1';
  const employeeUserId = 'usr-emp-1';
  const employeeId = 'emp-001';
  const agentUserId = 'usr-agent-1';
  const agentId = 'agent-001';
  const categoryId = 'cat-it-support';
  const subCategoryId = 'subcat-hardware';
  const ticketId = 'tick-001';

  const mockCategoriesRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countOpenTickets: jest.fn(),
    findSubCategoryById: jest.fn(),
    createSubCategory: jest.fn(),
    updateSubCategory: jest.fn(),
    countOpenTicketsForSubCategory: jest.fn(),
  };

  const mockAgentsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    assignCategory: jest.fn(),
    removeCategory: jest.fn(),
    findCategoryAgents: jest.fn(),
  };

  const mockSlaRepo = {
    findAllPolicies: jest.fn(),
    findPolicyById: jest.fn(),
    createPolicy: jest.fn(),
    updatePolicy: jest.fn(),
    deletePolicy: jest.fn(),
    createEscalationRule: jest.fn(),
    updateEscalationRule: jest.fn(),
    deleteEscalationRule: jest.fn(),
    findEscalationRuleById: jest.fn(),
  };

  const mockTicketsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findDuplicateTicket: jest.fn(),
    getNextTicketNumber: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    addStatusHistory: jest.fn(),
    addAssignmentHistory: jest.fn(),
    addConversation: jest.fn(),
    addAttachment: jest.fn(),
    createFeedback: jest.fn(),
    findFeedbackByTicketId: jest.fn(),
  };

  const mockKbRepo = {
    findAllCategories: jest.fn(),
    findCategoryById: jest.fn(),
    createCategory: jest.fn(),
    findAllArticles: jest.fn(),
    findArticleById: jest.fn(),
    findArticleBySlug: jest.fn(),
    createArticle: jest.fn(),
    updateArticle: jest.fn(),
    incrementViews: jest.fn(),
    voteHelpfulness: jest.fn(),
    deleteArticle: jest.fn(),
  };

  const mockFaqsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    suggest: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    voteHelpfulness: jest.fn(),
    delete: jest.fn(),
  };

  const mockReportsRepo = {
    getSummary: jest.fn(),
    getWorkbenchSummary: jest.fn(),
    getExportTickets: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrisma = {
    employee: {
      findFirst: jest.fn(),
    },
    organizationMembership: {
      findFirst: jest.fn(),
    },
    helpdeskAgent: {
      findFirst: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    helpdeskCategoryAgent: {
      deleteMany: jest.fn(),
    },
    slaPolicy: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelpdeskCategoriesService,
        { provide: HelpdeskCategoriesRepository, useValue: mockCategoriesRepo },
        HelpdeskAgentsService,
        { provide: HelpdeskAgentsRepository, useValue: mockAgentsRepo },
        SlaService,
        { provide: SlaRepository, useValue: mockSlaRepo },
        TicketsService,
        { provide: TicketsRepository, useValue: mockTicketsRepo },
        KnowledgeBaseService,
        { provide: KnowledgeBaseRepository, useValue: mockKbRepo },
        FaqsService,
        { provide: FaqsRepository, useValue: mockFaqsRepo },
        HelpdeskReportsService,
        { provide: HelpdeskReportsRepository, useValue: mockReportsRepo },
        { provide: AuditService, useValue: mockAuditService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    categoriesService = module.get<HelpdeskCategoriesService>(HelpdeskCategoriesService);
    agentsService = module.get<HelpdeskAgentsService>(HelpdeskAgentsService);
    slaService = module.get<SlaService>(SlaService);
    ticketsService = module.get<TicketsService>(TicketsService);
    kbService = module.get<KnowledgeBaseService>(KnowledgeBaseService);
    faqsService = module.get<FaqsService>(FaqsService);
    reportsService = module.get<HelpdeskReportsService>(HelpdeskReportsService);
  });

  describe('1. Categories & Subcategories', () => {
    it('creates a new category and writes audit log', async () => {
      mockCategoriesRepo.findByCode.mockResolvedValue(null);
      mockCategoriesRepo.findByName.mockResolvedValue(null);
      mockCategoriesRepo.create.mockResolvedValue({
        id: categoryId,
        organizationId: orgId,
        name: 'IT Support',
        categoryCode: 'IT_SUPPORT',
        isActive: true,
      });

      const result = await categoriesService.create(
        orgId,
        { name: 'IT Support', categoryCode: 'IT_SUPPORT' },
        userId,
      );

      expect(result.id).toEqual(categoryId);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgId,
          action: AuditAction.HELPDESK_CATEGORY_CREATE,
        }),
      );
    });

    it('rejects duplicate category code with ConflictException', async () => {
      mockCategoriesRepo.findByCode.mockResolvedValue({ id: 'existing-cat' });
      await expect(
        categoriesService.create(orgId, { name: 'IT Support', categoryCode: 'IT_SUPPORT' }, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('prevents deactivating a category that has open tickets', async () => {
      mockCategoriesRepo.findById.mockResolvedValue({
        id: categoryId,
        organizationId: orgId,
        name: 'IT Support',
        isActive: true,
      });
      mockCategoriesRepo.countOpenTickets.mockResolvedValue(3);

      await expect(
        categoriesService.update(orgId, categoryId, { isActive: false }, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows deactivating a category when all tickets are resolved or closed', async () => {
      mockCategoriesRepo.findById.mockResolvedValue({
        id: categoryId,
        organizationId: orgId,
        name: 'IT Support',
        isActive: true,
      });
      mockCategoriesRepo.countOpenTickets.mockResolvedValue(0);
      mockCategoriesRepo.update.mockResolvedValue({
        id: categoryId,
        isActive: false,
      });

      const result = await categoriesService.update(orgId, categoryId, { isActive: false }, userId);
      expect(result.isActive).toBe(false);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.HELPDESK_CATEGORY_DEACTIVATE,
        }),
      );
    });
  });

  describe('2. Helpdesk Agents', () => {
    it('registers an agent and maps assigned categories', async () => {
      mockPrisma.organizationMembership.findFirst.mockResolvedValue({ id: 'mem-1', userId: agentUserId });
      mockAgentsRepo.findByUserId.mockResolvedValue(null);
      mockAgentsRepo.create.mockResolvedValue({
        id: agentId,
        organizationId: orgId,
        userId: agentUserId,
        agentType: AgentType.PRIMARY,
        agentLevel: AgentLevel.TIER_1,
      });
      mockAgentsRepo.findById.mockResolvedValue({
        id: agentId,
        userId: agentUserId,
        categoryAgents: [{ helpdeskCategoryId: categoryId }],
      });

      const result = await agentsService.create(
        orgId,
        { userId: agentUserId, agentType: AgentType.PRIMARY, categoryIds: [categoryId] },
        userId,
      );

      expect(result.id).toEqual(agentId);
      expect(mockAgentsRepo.assignCategory).toHaveBeenCalledWith(orgId, agentId, categoryId);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.HELPDESK_AGENT_ASSIGN,
        }),
      );
    });

    it('rejects agent registration if user is not in the organization', async () => {
      mockPrisma.organizationMembership.findFirst.mockResolvedValue(null);
      await expect(
        agentsService.create(orgId, { userId: 'intruder-user' }, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Tickets & Routing', () => {
    it('creates a ticket with generated ticket number and calculates SLA', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      mockCategoriesRepo.findById.mockResolvedValue({
        id: categoryId,
        organizationId: orgId,
        isActive: true,
        defaultAssigneeType: DefaultAssigneeType.ROUND_ROBIN,
        defaultPriority: TicketPriority.MEDIUM,
      });
      mockTicketsRepo.findDuplicateTicket.mockResolvedValue(null);
      mockTicketsRepo.getNextTicketNumber.mockResolvedValue('TICK-00001');
      mockAgentsRepo.findCategoryAgents.mockResolvedValue([
        { helpdeskAgentId: agentId, isPrimary: true },
      ]);
      mockPrisma.ticket.count.mockResolvedValue(2);
      mockPrisma.slaPolicy.findFirst.mockResolvedValue({
        id: 'sla-default',
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 1440,
        businessHoursOnly: false,
      });
      mockSlaRepo.findPolicyById.mockResolvedValue({
        id: 'sla-default',
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 1440,
        businessHoursOnly: false,
        isActive: true,
      });
      mockTicketsRepo.create.mockResolvedValue({
        id: ticketId,
        ticketNumber: 'TICK-00001',
        employeeId,
        helpdeskCategoryId: categoryId,
        subject: 'VPN Connection issue',
        ticketStatus: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
        assignedAgentId: agentId,
      });
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        ticketNumber: 'TICK-00001',
        conversations: [],
      });

      const ticket = await ticketsService.create(
        orgId,
        {
          helpdeskCategoryId: categoryId,
          subject: 'VPN Connection issue',
          description: 'Cannot connect to company VPN from home',
        },
        employeeUserId,
      );

      expect(ticket.ticketNumber).toEqual('TICK-00001');
      expect(mockTicketsRepo.addStatusHistory).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          toStatus: TicketStatus.OPEN,
        }),
      );
      expect(mockTicketsRepo.addAssignmentHistory).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          toAgentId: agentId,
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TICKET_CREATE,
        }),
      );
    });

    it('rejects duplicate ticket submission within 10 minutes with ConflictException', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: employeeId });
      mockCategoriesRepo.findById.mockResolvedValue({ id: categoryId, isActive: true });
      mockTicketsRepo.findDuplicateTicket.mockResolvedValue({
        id: 'existing-tick',
        ticketNumber: 'TICK-00001',
      });

      await expect(
        ticketsService.create(
          orgId,
          {
            helpdeskCategoryId: categoryId,
            subject: 'VPN Connection issue',
            description: 'Duplicate attempt',
          },
          employeeUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('transitions status through lifecycle: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED', async () => {
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        organizationId: orgId,
        ticketStatus: TicketStatus.OPEN,
        resolvedAt: null,
        closedAt: null,
      });

      // 1. Resolve
      await ticketsService.changeStatus(
        orgId,
        ticketId,
        TicketStatus.RESOLVED,
        userId,
        'Issue fixed by clearing cache',
      );

      expect(mockTicketsRepo.update).toHaveBeenCalledWith(
        orgId,
        ticketId,
        expect.objectContaining({
          ticketStatus: TicketStatus.RESOLVED,
          resolvedAt: expect.any(Date),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TICKET_RESOLVE,
        }),
      );
    });
  });

  describe('4. Confidential Internal Notes & Thread Conversations', () => {
    it('filters out internal notes when requested by regular employee', async () => {
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        organizationId: orgId,
        employeeId,
        conversations: [
          { id: 'c1', message: 'Hello, what OS are you using?', isInternal: false },
          { id: 'c2', message: 'Agent note: Escalating to tier 2 network engineer', isInternal: true },
        ],
      });

      // Employee request: isAgentOrAdmin = false
      const result = await ticketsService.findById(orgId, ticketId, employeeUserId, false);

      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].isInternal).toBe(false);
    });

    it('shows internal notes when requested by agent or admin', async () => {
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        organizationId: orgId,
        employeeId,
        conversations: [
          { id: 'c1', message: 'Hello, what OS are you using?', isInternal: false },
          { id: 'c2', message: 'Agent note: Escalating to tier 2 network engineer', isInternal: true },
        ],
      });

      // Agent request: isAgentOrAdmin = true
      const result = await ticketsService.findById(orgId, ticketId, agentUserId, true);

      expect(result.conversations).toHaveLength(2);
    });

    it('records firstResponseAt when an agent sends public reply', async () => {
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        organizationId: orgId,
        firstResponseAt: null,
      });
      mockTicketsRepo.addConversation.mockResolvedValue({ id: 'c1', message: 'We are investigating' });

      await ticketsService.addConversation(
        orgId,
        ticketId,
        { message: 'We are investigating', isInternal: false },
        agentUserId,
        TicketConversationAuthorType.AGENT,
      );

      expect(mockTicketsRepo.update).toHaveBeenCalledWith(
        orgId,
        ticketId,
        expect.objectContaining({
          firstResponseAt: expect.any(Date),
        }),
      );
    });
  });

  describe('5. SLA Engine & Business Hours Calculation', () => {
    it('calculates due date in business hours, skipping non-working hours', () => {
      // Monday 9:00 AM in local timezone + 60 business minutes = Monday 10:00 AM
      const mondayMorning = new Date(2026, 10, 23, 9, 0, 0);
      const policy = {
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 240,
        businessHoursOnly: true,
        businessHoursStart: '09:00',
        businessHoursEnd: '18:00',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      };

      const { responseDueAt, resolutionDueAt } = slaService.calculateDueDates(mondayMorning, policy);

      expect(responseDueAt.getHours()).toBe(10);
      expect(resolutionDueAt.getHours()).toBe(13);
    });
  });

  describe('6. Knowledge Base & FAQs', () => {
    it('creates article with generated slug and publishes', async () => {
      mockKbRepo.findCategoryById.mockResolvedValue({ id: 'kb-cat-1' });
      mockKbRepo.findArticleBySlug.mockResolvedValue(null);
      mockKbRepo.createArticle.mockResolvedValue({
        id: 'art-1',
        title: 'How to setup Wi-Fi',
        slug: 'how-to-setup-wi-fi-1234',
        articleStatus: ArticleStatus.DRAFT,
      });

      const article = await kbService.createArticle(
        orgId,
        {
          knowledgeBaseCategoryId: 'kb-cat-1',
          title: 'How to setup Wi-Fi',
          content: 'Follow these steps to connect to office Wi-Fi...',
        },
        userId,
      );

      expect(article.id).toBe('art-1');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.KNOWLEDGE_BASE_ARTICLE_CREATE,
        }),
      );
    });

    it('suggests FAQs for ticket subject and category', async () => {
      mockFaqsRepo.suggest.mockResolvedValue([
        { id: 'faq-1', question: 'How do I reset my VPN password?', answer: 'Go to idm.zentra.io' },
      ]);

      const suggestions = await faqsService.suggest(orgId, categoryId, 'VPN');
      expect(suggestions).toHaveLength(1);
      expect(mockFaqsRepo.suggest).toHaveBeenCalledWith(orgId, categoryId, 'VPN');
    });
  });

  describe('7. Ticket CSAT Feedback', () => {
    it('submits feedback for a resolved ticket by the owner employee', async () => {
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        organizationId: orgId,
        employeeId,
        ticketStatus: TicketStatus.RESOLVED,
      });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: employeeId });
      mockTicketsRepo.findFeedbackByTicketId.mockResolvedValue(null);
      mockTicketsRepo.createFeedback.mockResolvedValue({
        id: 'fb-1',
        ticketId,
        employeeId,
        rating: 5,
        comment: 'Super fast resolution, thank you!',
      });

      const fb = await ticketsService.submitFeedback(
        orgId,
        ticketId,
        5,
        'Super fast resolution, thank you!',
        employeeUserId,
      );

      expect(fb.rating).toBe(5);
      expect(mockTicketsRepo.update).toHaveBeenCalledWith(
        orgId,
        ticketId,
        expect.objectContaining({
          satisfactionRating: 5,
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TICKET_FEEDBACK_SUBMIT,
        }),
      );
    });

    it('blocks feedback submission if ticket is still open', async () => {
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        organizationId: orgId,
        employeeId,
        ticketStatus: TicketStatus.OPEN,
      });

      await expect(
        ticketsService.submitFeedback(orgId, ticketId, 5, 'Great', employeeUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks duplicate feedback submission for the same ticket', async () => {
      mockTicketsRepo.findById.mockResolvedValue({
        id: ticketId,
        organizationId: orgId,
        employeeId,
        ticketStatus: TicketStatus.RESOLVED,
      });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: employeeId });
      mockTicketsRepo.findFeedbackByTicketId.mockResolvedValue({ id: 'existing-fb' });

      await expect(
        ticketsService.submitFeedback(orgId, ticketId, 4, 'Already submitted', employeeUserId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('8. Reports, Workbench & CSV Export', () => {
    it('generates summary reports and formatted CSV export', async () => {
      mockReportsRepo.getSummary.mockResolvedValue({
        totalTicketsCount: 10,
        openTicketsCount: 2,
        resolvedTicketsCount: 7,
        slaComplianceRate: 90.0,
      });

      const summary = await reportsService.getSummary(orgId);
      expect(summary.slaComplianceRate).toBe(90.0);

      mockReportsRepo.getExportTickets.mockResolvedValue([
        {
          ticketNumber: 'TICK-00001',
          subject: 'Sample ticket, with comma',
          employee: { employeeCode: 'EMP-01', firstName: 'John', lastName: 'Doe' },
          helpdeskCategory: { name: 'IT Support' },
          priority: 'HIGH',
          ticketStatus: 'RESOLVED',
          assignedAgent: { user: { firstName: 'Alice', lastName: 'Support' } },
          createdAt: new Date('2026-11-01T10:00:00.000Z'),
          resolvedAt: new Date('2026-11-01T12:00:00.000Z'),
          satisfactionRating: 5,
        },
      ]);

      const csv = await reportsService.exportCsv(orgId, userId);
      expect(csv).toContain('Ticket Number,Subject,Employee Code');
      expect(csv).toContain('TICK-00001');
      expect(csv).toContain('"Sample ticket, with comma"');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.HELPDESK_REPORT_EXPORT,
        }),
      );
    });
  });
});
