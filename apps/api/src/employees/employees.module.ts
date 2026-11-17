import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesImportController } from './employees-import.controller';
import { EmployeesExportController } from './employees-export.controller';
import { EmployeesService } from './employees.service';
import { EmployeesImportService } from './employees-import.service';
import { EmployeesExportService } from './employees-export.service';
import { EmployeesRepository } from './employees.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { RolesModule } from '../roles/roles.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { OrganizationSetupModule } from '../organization-setup/organization-setup.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    EmailModule,
    UsersModule,
    MembershipsModule,
    RolesModule,
    OrganizationsModule,
    OrganizationSetupModule,
  ],
  controllers: [
    EmployeesController,
    EmployeesImportController,
    EmployeesExportController,
  ],
  providers: [
    EmployeesRepository,
    EmployeesService,
    EmployeesImportService,
    EmployeesExportService,
  ],
  exports: [
    EmployeesService,
    EmployeesRepository,
    EmployeesImportService,
    EmployeesExportService,
  ],
})
export class EmployeesModule {}
