import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeesModule } from '../employees/employees.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { UsersModule } from '../users/users.module';

// Policies
import { AttendancePoliciesRepository } from './attendance-policies/attendance-policies.repository';
import { AttendancePoliciesService } from './attendance-policies/attendance-policies.service';
import { AttendancePoliciesController } from './attendance-policies/attendance-policies.controller';

// Shifts
import { ShiftsRepository } from './shifts/shifts.repository';
import { ShiftsService } from './shifts/shifts.service';
import { ShiftsController } from './shifts/shifts.controller';

// Rosters
import { RostersRepository } from './rosters/rosters.repository';
import { RostersService } from './rosters/rosters.service';
import { RostersController } from './rosters/rosters.controller';

// Shift Assignments
import { ShiftAssignmentsRepository } from './shift-assignments/shift-assignments.repository';
import { ShiftAssignmentsService } from './shift-assignments/shift-assignments.service';
import { ShiftAssignmentsController } from './shift-assignments/shift-assignments.controller';

// Attendance Records & Calculator
import { AttendanceCalculatorService } from './attendance-records/attendance-calculator.service';
import { AttendanceRecordsRepository } from './attendance-records/attendance-records.repository';
import { AttendanceRecordsService } from './attendance-records/attendance-records.service';
import { AttendanceRecordsController } from './attendance-records/attendance-records.controller';

// Regularisations
import { AttendanceRegularisationsRepository } from './attendance-regularisations/attendance-regularisations.repository';
import { AttendanceRegularisationsService } from './attendance-regularisations/attendance-regularisations.service';
import { AttendanceRegularisationsController } from './attendance-regularisations/attendance-regularisations.controller';

// Overtime
import { OvertimeRequestsRepository } from './overtime-requests/overtime-requests.repository';
import { OvertimeRequestsService } from './overtime-requests/overtime-requests.service';
import { OvertimeRequestsController } from './overtime-requests/overtime-requests.controller';

// Attendance Requests (On-Duty / WFH)
import { AttendanceRequestsRepository } from './attendance-requests/attendance-requests.repository';
import { AttendanceRequestsService } from './attendance-requests/attendance-requests.service';
import { AttendanceRequestsController } from './attendance-requests/attendance-requests.controller';

// Attendance Locks
import { AttendanceLocksRepository } from './attendance-locks/attendance-locks.repository';
import { AttendanceLocksService } from './attendance-locks/attendance-locks.service';
import { AttendanceLocksController } from './attendance-locks/attendance-locks.controller';

// Reports
import { AttendanceReportsService } from './attendance-reports/attendance-reports.service';
import { AttendanceReportsController } from './attendance-reports/attendance-reports.controller';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    forwardRef(() => EmployeesModule),
    forwardRef(() => ApprovalsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    AttendancePoliciesController,
    ShiftsController,
    RostersController,
    ShiftAssignmentsController,
    AttendanceRecordsController,
    AttendanceRegularisationsController,
    OvertimeRequestsController,
    AttendanceRequestsController,
    AttendanceLocksController,
    AttendanceReportsController,
  ],
  providers: [
    AttendancePoliciesRepository,
    AttendancePoliciesService,
    ShiftsRepository,
    ShiftsService,
    RostersRepository,
    RostersService,
    ShiftAssignmentsRepository,
    ShiftAssignmentsService,
    AttendanceCalculatorService,
    AttendanceRecordsRepository,
    AttendanceRecordsService,
    AttendanceRegularisationsRepository,
    AttendanceRegularisationsService,
    OvertimeRequestsRepository,
    OvertimeRequestsService,
    AttendanceRequestsRepository,
    AttendanceRequestsService,
    AttendanceLocksRepository,
    AttendanceLocksService,
    AttendanceReportsService,
  ],
  exports: [
    AttendancePoliciesService,
    ShiftsService,
    RostersService,
    ShiftAssignmentsService,
    AttendanceCalculatorService,
    AttendanceRecordsService,
    AttendanceRegularisationsService,
    OvertimeRequestsService,
    AttendanceRequestsService,
    AttendanceLocksService,
    AttendanceReportsService,
  ],
})
export class AttendanceModule {}
