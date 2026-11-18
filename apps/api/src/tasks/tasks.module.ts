import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, UsersModule, AuditModule, EmailModule],
  controllers: [TasksController],
  providers: [TasksRepository, TasksService],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
