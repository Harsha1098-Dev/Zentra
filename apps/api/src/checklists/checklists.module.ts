import { Module } from '@nestjs/common';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { ChecklistsRepository } from './checklists.repository';
import { TasksModule } from '../tasks/tasks.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, TasksModule, AuditModule, EmailModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsRepository, ChecklistsService],
  exports: [ChecklistsService, ChecklistsRepository],
})
export class ChecklistsModule {}
