import { Module } from '@nestjs/common';
import { DelegationsController } from './delegations.controller';
import { DelegationsService } from './delegations.service';
import { DelegationsRepository } from './delegations.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, UsersModule, AuditModule, EmailModule],
  controllers: [DelegationsController],
  providers: [DelegationsRepository, DelegationsService],
  exports: [DelegationsService, DelegationsRepository],
})
export class DelegationsModule {}
