import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { LocationsService } from '../src/organization-setup/locations/locations.service';
import { LocationsRepository } from '../src/organization-setup/locations/locations.repository';
import { DepartmentsService } from '../src/organization-setup/departments/departments.service';
import { DepartmentsRepository } from '../src/organization-setup/departments/departments.repository';
import { GradesService } from '../src/organization-setup/grades/grades.service';
import { GradesRepository } from '../src/organization-setup/grades/grades.repository';
import { DesignationsService } from '../src/organization-setup/designations/designations.service';
import { DesignationsRepository } from '../src/organization-setup/designations/designations.repository';
import { WorkweekService } from '../src/organization-setup/workweek/workweek.service';
import { WorkweekRepository } from '../src/organization-setup/workweek/workweek.repository';
import { CompanyProfileService } from '../src/organization-setup/company-profile/company-profile.service';
import { CompanyProfileRepository } from '../src/organization-setup/company-profile/company-profile.repository';
import { OrganizationChartService } from '../src/organization-setup/organization-chart/organization-chart.service';
import { StorageService } from '../src/organization-setup/storage.service';
import { AuditService } from '../src/audit/audit.service';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { AuditAction, DayOfWeek, HolidayType } from '@zentra/shared-types';

describe('Organization Setup Module Test Suite', () => {
  let locationsService: LocationsService;
  let locationsRepo: jest.Mocked<LocationsRepository>;

  let departmentsService: DepartmentsService;
  let deptsRepo: jest.Mocked<DepartmentsRepository>;

  let gradesService: GradesService;
  let gradesRepo: jest.Mocked<GradesRepository>;

  let designationsService: DesignationsService;
  let designationsRepo: jest.Mocked<DesignationsRepository>;

  let workweekService: WorkweekService;
  let workweekRepo: jest.Mocked<WorkweekRepository>;

  let profileService: CompanyProfileService;
  let profileRepo: jest.Mocked<CompanyProfileRepository>;

  let orgChartService: OrganizationChartService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockAuditService = {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' } as any),
    };

    const mockLocationsRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setStatus: jest.fn(),
    };

    const mockDeptsRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setStatus: jest.fn(),
    };

    const mockGradesRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByCode: jest.fn(),
      findByLevel: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setStatus: jest.fn(),
    };

    const mockDesignationsRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setStatus: jest.fn(),
    };

    const mockWorkweekRepo = {
      findWorkweekConfig: jest.fn(),
      upsertWorkweekConfig: jest.fn(),
      findHolidays: jest.fn(),
      findHolidayById: jest.fn(),
      findHolidayByDateAndLocation: jest.fn(),
      createHoliday: jest.fn(),
      updateHoliday: jest.fn(),
      deleteHoliday: jest.fn(),
    };

    const mockProfileRepo = {
      findByOrganizationId: jest.fn(),
      upsertProfile: jest.fn(),
      updateLogoUrl: jest.fn(),
    };

    const mockStorageService = {
      saveLogo: jest.fn().mockResolvedValue('http://localhost:4000/uploads/logos/logo.png'),
      deleteLogo: jest.fn().mockResolvedValue(undefined),
    };

    const mockOrgsService = {
      getOrganizationById: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Zentra Inc' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: LocationsRepository, useValue: mockLocationsRepo },
        DepartmentsService,
        { provide: DepartmentsRepository, useValue: mockDeptsRepo },
        GradesService,
        { provide: GradesRepository, useValue: mockGradesRepo },
        DesignationsService,
        { provide: DesignationsRepository, useValue: mockDesignationsRepo },
        WorkweekService,
        { provide: WorkweekRepository, useValue: mockWorkweekRepo },
        CompanyProfileService,
        { provide: CompanyProfileRepository, useValue: mockProfileRepo },
        OrganizationChartService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: OrganizationsService, useValue: mockOrgsService },
      ],
    }).compile();

    locationsService = module.get(LocationsService);
    locationsRepo = module.get(LocationsRepository);

    departmentsService = module.get(DepartmentsService);
    deptsRepo = module.get(DepartmentsRepository);

    gradesService = module.get(GradesService);
    gradesRepo = module.get(GradesRepository);

    designationsService = module.get(DesignationsService);
    designationsRepo = module.get(DesignationsRepository);

    workweekService = module.get(WorkweekService);
    workweekRepo = module.get(WorkweekRepository);

    profileService = module.get(CompanyProfileService);
    profileRepo = module.get(CompanyProfileRepository);

    orgChartService = module.get(OrganizationChartService);
    auditService = module.get(AuditService);
  });

  // 1. Locations
  describe('Locations Service', () => {
    it('creates location and emits audit log', async () => {
      locationsRepo.findByName.mockResolvedValue(null);
      locationsRepo.findByCode.mockResolvedValue(null);
      locationsRepo.create.mockResolvedValue({
        id: 'loc-1',
        organizationId: 'org-1',
        name: 'Headquarters',
        code: 'HQ-NY',
        country: 'USA',
        city: 'New York',
        address: '123 Wall St',
        timezone: 'America/New_York',
        isHeadquarters: true,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await locationsService.createLocation('org-1', {
        name: 'Headquarters',
        code: 'HQ-NY',
        country: 'USA',
        city: 'New York',
        address: '123 Wall St',
        timezone: 'America/New_York',
        isHeadquarters: true,
      });

      expect(result.id).toBe('loc-1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOCATION_CREATE,
          organizationId: 'org-1',
        }),
      );
    });

    it('prevents duplicate location name within same organization', async () => {
      locationsRepo.findByName.mockResolvedValue({ id: 'loc-1', name: 'Headquarters' } as any);

      await expect(
        locationsService.createLocation('org-1', {
          name: 'Headquarters',
          code: 'HQ-2',
          country: 'USA',
          city: 'New York',
          address: '456 Wall St',
          timezone: 'America/New_York',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('prevents duplicate location code within same organization', async () => {
      locationsRepo.findByName.mockResolvedValue(null);
      locationsRepo.findByCode.mockResolvedValue({ id: 'loc-1', code: 'HQ-NY' } as any);

      await expect(
        locationsService.createLocation('org-1', {
          name: 'Branch Office',
          code: 'HQ-NY',
          country: 'USA',
          city: 'New York',
          address: '456 Wall St',
          timezone: 'America/New_York',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('enforces tenant isolation: throws NotFoundException if location belongs to another tenant', async () => {
      locationsRepo.findById.mockResolvedValue(null); // Not found for org-2

      await expect(
        locationsService.getLocationById('loc-1', 'org-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // 2. Departments
  describe('Departments Service', () => {
    it('creates department and prevents duplicate name/code', async () => {
      deptsRepo.findByName.mockResolvedValue(null);
      deptsRepo.findByCode.mockResolvedValue(null);
      deptsRepo.create.mockResolvedValue({
        id: 'dept-1',
        organizationId: 'org-1',
        name: 'Engineering',
        code: 'ENG',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const dept = await departmentsService.createDepartment('org-1', {
        name: 'Engineering',
        code: 'ENG',
      });

      expect(dept.id).toBe('dept-1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DEPARTMENT_CREATE }),
      );

      // Now test duplicate prevention
      deptsRepo.findByName.mockResolvedValue({ id: 'dept-1', name: 'Engineering' } as any);
      await expect(
        departmentsService.createDepartment('org-1', { name: 'Engineering', code: 'ENG2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('prevents a department from becoming its own parent', async () => {
      deptsRepo.findById.mockResolvedValue({
        id: 'dept-1',
        organizationId: 'org-1',
        name: 'Engineering',
        code: 'ENG',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        departmentsService.updateDepartment('dept-1', 'org-1', {
          parentDepartmentId: 'dept-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents circular department hierarchy (child becoming ancestor parent)', async () => {
      // Dept A -> Dept B -> Dept C
      // Updating Dept A to have parent Dept C must fail!
      deptsRepo.findById.mockImplementation((id: string) => {
        if (id === 'dept-a') {
          return Promise.resolve({
            id: 'dept-a',
            organizationId: 'org-1',
            name: 'Dept A',
            code: 'A',
            parentDepartmentId: null,
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
        }
        if (id === 'dept-c') {
          return Promise.resolve({
            id: 'dept-c',
            organizationId: 'org-1',
            name: 'Dept C',
            code: 'C',
            parentDepartmentId: 'dept-b',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
        }
        if (id === 'dept-b') {
          return Promise.resolve({
            id: 'dept-b',
            organizationId: 'org-1',
            name: 'Dept B',
            code: 'B',
            parentDepartmentId: 'dept-a', // dept-b parent is dept-a!
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
        }
        return Promise.resolve(null);
      });

      await expect(
        departmentsService.updateDepartment('dept-a', 'org-1', {
          parentDepartmentId: 'dept-c',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('builds a nested department tree structure', async () => {
      deptsRepo.findAll.mockResolvedValue([
        {
          id: 'dept-root',
          organizationId: 'org-1',
          name: 'Executive',
          code: 'EXEC',
          parentDepartmentId: null,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dept-child',
          organizationId: 'org-1',
          name: 'Engineering',
          code: 'ENG',
          parentDepartmentId: 'dept-root',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const tree = await departmentsService.getDepartmentTree('org-1');
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('dept-root');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('dept-child');
    });
  });

  // 3. Grades
  describe('Grades Service', () => {
    it('creates grade and prevents duplicate grade level or code', async () => {
      gradesRepo.findByName.mockResolvedValue(null);
      gradesRepo.findByCode.mockResolvedValue(null);
      gradesRepo.findByLevel.mockResolvedValue(null);
      gradesRepo.create.mockResolvedValue({
        id: 'grade-1',
        organizationId: 'org-1',
        name: 'Senior Engineer',
        code: 'L4',
        level: 4,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const grade = await gradesService.createGrade('org-1', {
        name: 'Senior Engineer',
        code: 'L4',
        level: 4,
      });

      expect(grade.level).toBe(4);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.GRADE_CREATE }),
      );

      // Duplicate level prevention
      gradesRepo.findByLevel.mockResolvedValue({ id: 'grade-1', level: 4, name: 'Senior Engineer' } as any);
      await expect(
        gradesService.createGrade('org-1', { name: 'Staff Engineer', code: 'L4B', level: 4 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // 4. Designations
  describe('Designations Service', () => {
    it('creates designation with optional grade and department and enforces uniqueness', async () => {
      designationsRepo.findByName.mockResolvedValue(null);
      designationsRepo.findByCode.mockResolvedValue(null);
      gradesRepo.findById.mockResolvedValue({ id: 'grade-1', level: 4 } as any);
      deptsRepo.findById.mockResolvedValue({ id: 'dept-1', name: 'Engineering' } as any);
      designationsRepo.create.mockResolvedValue({
        id: 'desig-1',
        organizationId: 'org-1',
        name: 'Software Engineer',
        code: 'SWE',
        gradeId: 'grade-1',
        departmentId: 'dept-1',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const desig = await designationsService.createDesignation('org-1', {
        name: 'Software Engineer',
        code: 'SWE',
        gradeId: 'grade-1',
        departmentId: 'dept-1',
      });

      expect(desig.code).toBe('SWE');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DESIGNATION_CREATE }),
      );

      // Duplicate name prevention
      designationsRepo.findByName.mockResolvedValue({ id: 'desig-1', name: 'Software Engineer' } as any);
      await expect(
        designationsService.createDesignation('org-1', { name: 'Software Engineer', code: 'SWE2' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // 5. Workweek & Holidays
  describe('Workweek & Holidays Service', () => {
    it('validates that daily end time must be after daily start time', async () => {
      workweekRepo.findWorkweekConfig.mockResolvedValue({
        id: 'ww-1',
        organizationId: 'org-1',
        weeklyWorkingDays: [DayOfWeek.MONDAY],
        weekendDays: [DayOfWeek.SUNDAY],
        dailyStartTime: '09:00',
        dailyEndTime: '18:00',
        breakDurationMinutes: 60,
        timezone: 'UTC',
        effectiveFrom: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        workweekService.updateWorkweek('org-1', {
          weeklyWorkingDays: [DayOfWeek.MONDAY],
          weekendDays: [DayOfWeek.SUNDAY],
          dailyStartTime: '18:00',
          dailyEndTime: '09:00', // Invalid: end time before start time!
          breakDurationMinutes: 60,
          timezone: 'UTC',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents duplicate holiday on the same date and location', async () => {
      workweekRepo.findHolidayByDateAndLocation.mockResolvedValue({
        id: 'hol-1',
        name: 'New Year Day',
        date: new Date('2026-01-01'),
      } as any);

      await expect(
        workweekService.createHoliday('org-1', {
          name: 'Another Holiday',
          date: '2026-01-01',
          type: HolidayType.PUBLIC,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // 6. Organization Chart Aggregation
  describe('Organization Chart Service', () => {
    it('aggregates company profile, locations, departments tree, designations, and grades', async () => {
      profileRepo.findByOrganizationId.mockResolvedValue({
        id: 'prof-1',
        organizationId: 'org-1',
        legalName: 'Zentra Corp Inc.',
        updatedAt: new Date(),
      } as any);

      locationsRepo.findAll.mockResolvedValue([]);
      deptsRepo.findAll.mockResolvedValue([]);
      designationsRepo.findAll.mockResolvedValue([]);
      gradesRepo.findAll.mockResolvedValue([]);

      const chart = await orgChartService.getOrganizationChart('org-1');

      expect(chart).toHaveProperty('company');
      expect(chart).toHaveProperty('locations');
      expect(chart).toHaveProperty('departmentsTree');
      expect(chart).toHaveProperty('designations');
      expect(chart).toHaveProperty('grades');
      expect(chart.company.name).toBe('Zentra Inc');
    });
  });
});
