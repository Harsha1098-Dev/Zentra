import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { OrganizationSetupModule } from './organization-setup/organization-setup.module';
import { EmployeesModule } from './employees/employees.module';
import { DelegationsModule } from './delegations/delegations.module';
import { TasksModule } from './tasks/tasks.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { LeaveModule } from './leave/leave.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuditModule,
    UsersModule,
    OrganizationsModule,
    MembershipsModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
    HealthModule,
    OrganizationSetupModule,
    EmployeesModule,
    DelegationsModule,
    TasksModule,
    ChecklistsModule,
    ApprovalsModule,
    WorkflowsModule,
    LeaveModule,
    AttendanceModule,
    PayrollModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule {}
