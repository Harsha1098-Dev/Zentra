import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowsRepository } from './workflows.repository';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ChecklistsModule } from '../checklists/checklists.module';
import { TasksModule } from '../tasks/tasks.module';
import { DelegationsModule } from '../delegations/delegations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    EmailModule,
    ApprovalsModule,
    ChecklistsModule,
    TasksModule,
    DelegationsModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsRepository, WorkflowsService, WorkflowEngineService],
  exports: [WorkflowsService, WorkflowEngineService, WorkflowsRepository],
})
export class WorkflowsModule {}
