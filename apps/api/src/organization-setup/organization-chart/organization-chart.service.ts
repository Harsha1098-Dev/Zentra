import { Injectable } from '@nestjs/common';
import { CompanyProfileService } from '../company-profile/company-profile.service';
import { LocationsService } from '../locations/locations.service';
import { DepartmentsService } from '../departments/departments.service';
import { DesignationsService } from '../designations/designations.service';
import { GradesService } from '../grades/grades.service';
import { OrganizationChartDto } from '@zentra/shared-types';

@Injectable()
export class OrganizationChartService {
  constructor(
    private readonly companyProfileService: CompanyProfileService,
    private readonly locationsService: LocationsService,
    private readonly departmentsService: DepartmentsService,
    private readonly designationsService: DesignationsService,
    private readonly gradesService: GradesService,
  ) {}

  async getOrganizationChart(organizationId: string): Promise<OrganizationChartDto> {
    const [company, locations, departmentsTree, designations, grades] =
      await Promise.all([
        this.companyProfileService.getProfile(organizationId),
        this.locationsService.getLocations(organizationId, 'ACTIVE'),
        this.departmentsService.getDepartmentTree(organizationId),
        this.designationsService.getDesignations(organizationId, 'ACTIVE'),
        this.gradesService.getGrades(organizationId, 'ACTIVE'),
      ]);

    return {
      company,
      locations,
      departmentsTree,
      designations,
      grades,
    };
  }
}
