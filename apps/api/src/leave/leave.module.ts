import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeesModule } from '../employees/employees.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { UsersModule } from '../users/users.module';

// Leave Types
import { LeaveTypesRepository } from './leave-types/leave-types.repository';
import { LeaveTypesService } from './leave-types/leave-types.service';
import { LeaveTypesController } from './leave-types/leave-types.controller';

// Leave Policies
import { LeavePoliciesRepository } from './leave-policies/leave-policies.repository';
import { LeavePoliciesService } from './leave-policies/leave-policies.service';
import { LeavePoliciesController } from './leave-policies/leave-policies.controller';

// Leave Balances
import { LeaveBalancesRepository } from './leave-balances/leave-balances.repository';
import { LeaveBalancesService } from './leave-balances/leave-balances.service';
import { LeaveBalancesController } from './leave-balances/leave-balances.controller';

// Leave Requests
import { LeaveRequestsRepository } from './leave-requests/leave-requests.repository';
import { LeaveRequestsService } from './leave-requests/leave-requests.service';
import { LeaveRequestsController } from './leave-requests/leave-requests.controller';

// Compensatory Off
import { CompOffRepository } from './comp-off/comp-off.repository';
import { CompOffService } from './comp-off/comp-off.service';
import { CompOffController } from './comp-off/comp-off.controller';

// Leave Calendar
import { LeaveCalendarService } from './leave-calendar/leave-calendar.service';
import { LeaveCalendarController } from './leave-calendar/leave-calendar.controller';

// Leave Reports
import { LeaveReportsService } from './leave-reports/leave-reports.service';
import { LeaveReportsController } from './leave-reports/leave-reports.controller';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    forwardRef(() => EmployeesModule),
    forwardRef(() => ApprovalsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    LeaveTypesController,
    LeavePoliciesController,
    LeaveBalancesController,
    LeaveRequestsController,
    CompOffController,
    LeaveCalendarController,
    LeaveReportsController,
  ],
  providers: [
    LeaveTypesRepository,
    LeaveTypesService,
    LeavePoliciesRepository,
    LeavePoliciesService,
    LeaveBalancesRepository,
    LeaveBalancesService,
    LeaveRequestsRepository,
    LeaveRequestsService,
    CompOffRepository,
    CompOffService,
    LeaveCalendarService,
    LeaveReportsService,
  ],
  exports: [
    LeaveTypesService,
    LeavePoliciesService,
    LeaveBalancesService,
    LeaveRequestsService,
    CompOffService,
    LeaveCalendarService,
    LeaveReportsService,
    LeaveTypesRepository,
    LeavePoliciesRepository,
    LeaveBalancesRepository,
    LeaveRequestsRepository,
    CompOffRepository,
  ],
})
export class LeaveModule {}
