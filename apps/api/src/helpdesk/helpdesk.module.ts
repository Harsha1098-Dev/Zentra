import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

// Categories
import { HelpdeskCategoriesRepository } from './categories/helpdesk-categories.repository';
import { HelpdeskCategoriesService } from './categories/helpdesk-categories.service';
import { HelpdeskCategoriesController } from './categories/helpdesk-categories.controller';

// Agents
import { HelpdeskAgentsRepository } from './agents/helpdesk-agents.repository';
import { HelpdeskAgentsService } from './agents/helpdesk-agents.service';
import { HelpdeskAgentsController } from './agents/helpdesk-agents.controller';

// SLA
import { SlaRepository } from './sla/sla.repository';
import { SlaService } from './sla/sla.service';
import { SlaController } from './sla/sla.controller';

// Tickets
import { TicketsRepository } from './tickets/tickets.repository';
import { TicketsService } from './tickets/tickets.service';
import { TicketsController } from './tickets/tickets.controller';
import { MyTicketsController } from './tickets/my-tickets.controller';

// Knowledge Base
import { KnowledgeBaseRepository } from './knowledge-base/knowledge-base.repository';
import { KnowledgeBaseService } from './knowledge-base/knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base/knowledge-base.controller';

// FAQs
import { FaqsRepository } from './faqs/faqs.repository';
import { FaqsService } from './faqs/faqs.service';
import { FaqsController } from './faqs/faqs.controller';

// Reports
import { HelpdeskReportsRepository } from './reports/reports.repository';
import { HelpdeskReportsService } from './reports/reports.service';
import { HelpdeskReportsController } from './reports/reports.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    HelpdeskCategoriesController,
    HelpdeskAgentsController,
    SlaController,
    TicketsController,
    MyTicketsController,
    KnowledgeBaseController,
    FaqsController,
    HelpdeskReportsController,
  ],
  providers: [
    HelpdeskCategoriesRepository,
    HelpdeskCategoriesService,
    HelpdeskAgentsRepository,
    HelpdeskAgentsService,
    SlaRepository,
    SlaService,
    TicketsRepository,
    TicketsService,
    KnowledgeBaseRepository,
    KnowledgeBaseService,
    FaqsRepository,
    FaqsService,
    HelpdeskReportsRepository,
    HelpdeskReportsService,
  ],
  exports: [
    HelpdeskCategoriesService,
    HelpdeskAgentsService,
    SlaService,
    TicketsService,
    KnowledgeBaseService,
    FaqsService,
    HelpdeskReportsService,
  ],
})
export class HelpdeskModule {}
