import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// Company Profile
import { CompanyProfileController } from './company-profile/company-profile.controller';
import { CompanyProfileService } from './company-profile/company-profile.service';
import { CompanyProfileRepository } from './company-profile/company-profile.repository';

// Locations
import { LocationsController } from './locations/locations.controller';
import { LocationsService } from './locations/locations.service';
import { LocationsRepository } from './locations/locations.repository';

// Departments
import { DepartmentsController } from './departments/departments.controller';
import { DepartmentsService } from './departments/departments.service';
import { DepartmentsRepository } from './departments/departments.repository';

// Grades
import { GradesController } from './grades/grades.controller';
import { GradesService } from './grades/grades.service';
import { GradesRepository } from './grades/grades.repository';

// Designations
import { DesignationsController } from './designations/designations.controller';
import { DesignationsService } from './designations/designations.service';
import { DesignationsRepository } from './designations/designations.repository';

// Workweek & Holidays
import {
  WorkweekController,
  HolidaysController,
} from './workweek/workweek.controller';
import { WorkweekService } from './workweek/workweek.service';
import { WorkweekRepository } from './workweek/workweek.repository';

// Organization Chart
import { OrganizationChartController } from './organization-chart/organization-chart.controller';
import { OrganizationChartService } from './organization-chart/organization-chart.service';

// External modules
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuditModule } from '../audit/audit.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    OrganizationsModule,
    AuditModule,
    MembershipsModule,
    RolesModule,
  ],
  controllers: [
    CompanyProfileController,
    LocationsController,
    DepartmentsController,
    GradesController,
    DesignationsController,
    WorkweekController,
    HolidaysController,
    OrganizationChartController,
  ],
  providers: [
    StorageService,
    CompanyProfileRepository,
    CompanyProfileService,
    LocationsRepository,
    LocationsService,
    DepartmentsRepository,
    DepartmentsService,
    GradesRepository,
    GradesService,
    DesignationsRepository,
    DesignationsService,
    WorkweekRepository,
    WorkweekService,
    OrganizationChartService,
  ],
  exports: [
    CompanyProfileService,
    LocationsService,
    DepartmentsService,
    GradesService,
    DesignationsService,
    WorkweekService,
    OrganizationChartService,
  ],
})
export class OrganizationSetupModule {}
