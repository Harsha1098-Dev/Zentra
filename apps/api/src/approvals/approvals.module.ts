import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalsRepository } from './approvals.repository';
import { DelegationsModule } from '../delegations/delegations.module';
import { UsersModule } from '../users/users.module';
import { EmployeesModule } from '../employees/employees.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    DelegationsModule,
    UsersModule,
    forwardRef(() => EmployeesModule),
    AuditModule,
    EmailModule,
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsRepository, ApprovalsService],
  exports: [ApprovalsService, ApprovalsRepository],
})
export class ApprovalsModule {}
