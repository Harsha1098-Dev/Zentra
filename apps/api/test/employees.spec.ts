import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from '../src/employees/employees.service';
import { EmployeesImportService } from '../src/employees/employees-import.service';
import { EmployeesExportService } from '../src/employees/employees-export.service';
import { EmployeesRepository } from '../src/employees/employees.repository';
import { AuditService } from '../src/audit/audit.service';
import { EmailService } from '../src/email/email.service';
import { UsersService } from '../src/users/users.service';
import { MembershipsService } from '../src/memberships/memberships.service';
import { RolesService } from '../src/roles/roles.service';
import { DepartmentsService } from '../src/organization-setup/departments/departments.service';
import { DesignationsService } from '../src/organization-setup/designations/designations.service';
import { LocationsService } from '../src/organization-setup/locations/locations.service';
import { GradesService } from '../src/organization-setup/grades/grades.service';
import { OrganizationsRepository } from '../src/organizations/organizations.repository';
import {
  AuditAction,
  EmployeeStatus,
  EmploymentType,
  EmploymentEventType,
  RecordStatus,
  RoleCode,
} from '@zentra/shared-types';

describe('Employee Management Module Test Suite', () => {
  let employeesService: EmployeesService;
  let importService: EmployeesImportService;
  let exportService: EmployeesExportService;

  let employeesRepo: jest.Mocked<EmployeesRepository>;
  let auditService: jest.Mocked<AuditService>;
  let emailService: jest.Mocked<EmailService>;
  let usersService: jest.Mocked<UsersService>;
  let membershipsService: jest.Mocked<MembershipsService>;
  let rolesService: jest.Mocked<RolesService>;
  let departmentsService: jest.Mocked<DepartmentsService>;
  let designationsService: jest.Mocked<DesignationsService>;
  let locationsService: jest.Mocked<LocationsService>;
  let gradesService: jest.Mocked<GradesService>;
  let orgsRepo: jest.Mocked<OrganizationsRepository>;

  const orgId = 'org-uuid-111';
  const otherOrgId = 'org-uuid-222';
  const actorUserId = 'admin-user-uuid';

  beforeEach(async () => {
    const mockEmployeesRepo = {
      createEmployee: jest.fn(),
      findById: jest.fn(),
      findByWorkEmail: jest.fn(),
      findByCode: jest.fn(),
      findByUserId: jest.fn(),
      updateEmployee: jest.fn(),
      softDeleteEmployee: jest.fn(),
      listEmployees: jest.fn(),
      getEmploymentHistory: jest.fn(),
      getDirectReportees: jest.fn(),
      getNextEmployeeCode: jest.fn(),
      createImportJob: jest.fn(),
      updateImportJob: jest.fn(),
      getImportJob: jest.fn(),
      createExportJob: jest.fn(),
      getExportJob: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' } as any),
    };

    const mockEmailService = {
      sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue({ id: actorUserId, email: 'admin@acme.com' } as any),
      getOrCreateForInvitation: jest.fn(),
      createInvitedUser: jest.fn(),
    };

    const mockMembershipsService = {
      createOrReactivateMembership: jest.fn(),
    };

    const mockRolesService = {
      getAvailableRoles: jest.fn(),
      assignRoleToMembership: jest.fn(),
    };

    const mockDeptsService = {
      getDepartmentById: jest.fn(),
      getDepartments: jest.fn(),
    };

    const mockDesignationsService = {
      getDesignationById: jest.fn(),
      getDesignations: jest.fn(),
    };

    const mockLocationsService = {
      getLocationById: jest.fn(),
      getLocations: jest.fn(),
    };

    const mockGradesService = {
      getGradeById: jest.fn(),
      getGrades: jest.fn(),
    };

    const mockOrgsRepo = {
      createInvitation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        EmployeesImportService,
        EmployeesExportService,
        { provide: EmployeesRepository, useValue: mockEmployeesRepo },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MembershipsService, useValue: mockMembershipsService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: DepartmentsService, useValue: mockDeptsService },
        { provide: DesignationsService, useValue: mockDesignationsService },
        { provide: LocationsService, useValue: mockLocationsService },
        { provide: GradesService, useValue: mockGradesService },
        { provide: OrganizationsRepository, useValue: mockOrgsRepo },
      ],
    }).compile();

    employeesService = module.get<EmployeesService>(EmployeesService);
    importService = module.get<EmployeesImportService>(EmployeesImportService);
    exportService = module.get<EmployeesExportService>(EmployeesExportService);

    employeesRepo = module.get(EmployeesRepository);
    auditService = module.get(AuditService);
    emailService = module.get(EmailService);
    usersService = module.get(UsersService);
    membershipsService = module.get(MembershipsService);
    rolesService = module.get(RolesService);
    departmentsService = module.get(DepartmentsService);
    designationsService = module.get(DesignationsService);
    locationsService = module.get(LocationsService);
    gradesService = module.get(GradesService);
    orgsRepo = module.get(OrganizationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Employee Creation & Validations', () => {
    const validCreateInput = {
      firstName: 'Alice',
      lastName: 'Smith',
      workEmail: 'alice.smith@acme.com',
      phone: '+1 555-0101',
      dateOfJoining: '2026-02-01',
      employmentType: EmploymentType.FULL_TIME,
      locationId: 'loc-1',
      departmentId: 'dept-1',
      designationId: 'desig-1',
      sendInvitation: false,
    };

    it('should successfully create an employee without user account', async () => {
      employeesRepo.findByWorkEmail.mockResolvedValue(null);
      employeesRepo.getNextEmployeeCode.mockResolvedValue('ZEN-0001');

      departmentsService.getDepartmentById.mockResolvedValue({
        id: 'dept-1',
        name: 'Engineering',
        status: RecordStatus.ACTIVE,
      } as any);

      designationsService.getDesignationById.mockResolvedValue({
        id: 'desig-1',
        name: 'Staff Engineer',
        status: RecordStatus.ACTIVE,
      } as any);

      locationsService.getLocationById.mockResolvedValue({
        id: 'loc-1',
        name: 'HQ Office',
        status: RecordStatus.ACTIVE,
      } as any);

      employeesRepo.createEmployee.mockResolvedValue({
        employee: {
          id: 'emp-1',
          organizationId: orgId,
          employeeCode: 'ZEN-0001',
          firstName: 'Alice',
          lastName: 'Smith',
          workEmail: 'alice.smith@acme.com',
          phone: '+1 555-0101',
          status: EmployeeStatus.ACTIVE,
          employmentType: EmploymentType.FULL_TIME,
          dateOfJoining: new Date('2026-02-01'),
          departmentId: 'dept-1',
          designationId: 'desig-1',
          locationId: 'loc-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        history: { id: 'hist-1' } as any,
      });

      const result = await employeesService.createEmployee(
        orgId,
        validCreateInput,
        actorUserId,
      );

      expect(result.id).toBe('emp-1');
      expect(result.employeeCode).toBe('ZEN-0001');
      expect(result.userId).toBeUndefined();

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.EMPLOYEE_CREATE,
          organizationId: orgId,
          entityId: 'emp-1',
        }),
      );
      expect(emailService.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it('should reject employee creation if work email already exists in organization', async () => {
      employeesRepo.findByWorkEmail.mockResolvedValue({
        id: 'existing-emp',
      } as any);

      await expect(
        employeesService.createEmployee(orgId, validCreateInput, actorUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject employee creation if employee code already exists', async () => {
      employeesRepo.findByWorkEmail.mockResolvedValue(null);
      employeesRepo.findByCode.mockResolvedValue({ id: 'existing-code' } as any);

      await expect(
        employeesService.createEmployee(
          orgId,
          { ...validCreateInput, employeeCode: 'CUSTOM-01' },
          actorUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject employee creation if department is inactive or missing', async () => {
      employeesRepo.findByWorkEmail.mockResolvedValue(null);
      employeesRepo.getNextEmployeeCode.mockResolvedValue('ZEN-0002');

      departmentsService.getDepartmentById.mockResolvedValue({
        id: 'dept-1',
        name: 'Archived Dept',
        status: RecordStatus.INACTIVE,
      } as any);

      await expect(
        employeesService.createEmployee(orgId, validCreateInput, actorUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create employee, link existing user without duplication, and send invitation', async () => {
      employeesRepo.findByWorkEmail.mockResolvedValue(null);
      employeesRepo.getNextEmployeeCode.mockResolvedValue('ZEN-0003');

      departmentsService.getDepartmentById.mockResolvedValue({
        id: 'dept-1',
        name: 'Design',
        status: RecordStatus.ACTIVE,
      } as any);
      designationsService.getDesignationById.mockResolvedValue({
        id: 'desig-1',
        name: 'UI Designer',
        status: RecordStatus.ACTIVE,
      } as any);
      locationsService.getLocationById.mockResolvedValue({
        id: 'loc-1',
        name: 'HQ',
        status: RecordStatus.ACTIVE,
      } as any);

      // Existing global user identity
      usersService.getOrCreateForInvitation.mockResolvedValue({
        user: { id: 'existing-user-uuid', email: 'alice.smith@acme.com' },
        isNew: false,
      } as any);

      membershipsService.createOrReactivateMembership.mockResolvedValue({
        id: 'membership-uuid',
      } as any);

      rolesService.getAvailableRoles.mockResolvedValue([
        { id: 'role-emp-uuid', code: RoleCode.EMPLOYEE, name: 'Employee' },
      ] as any);

      orgsRepo.createInvitation.mockResolvedValue({ id: 'invite-uuid' } as any);

      employeesRepo.createEmployee.mockResolvedValue({
        employee: {
          id: 'emp-3',
          organizationId: orgId,
          userId: 'existing-user-uuid',
          employeeCode: 'ZEN-0003',
          firstName: 'Alice',
          lastName: 'Smith',
          workEmail: 'alice.smith@acme.com',
          phone: '+1 555-0101',
          status: EmployeeStatus.INVITED,
          employmentType: EmploymentType.FULL_TIME,
          dateOfJoining: new Date('2026-02-01'),
          departmentId: 'dept-1',
          designationId: 'desig-1',
          locationId: 'loc-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        history: { id: 'hist-3' } as any,
      });

      const result = await employeesService.createEmployee(
        orgId,
        { ...validCreateInput, sendInvitation: true },
        actorUserId,
      );

      expect(result.userId).toBe('existing-user-uuid');
      expect(usersService.getOrCreateForInvitation).toHaveBeenCalledWith(
        'alice.smith@acme.com',
        'Alice',
        'Smith',
      );
      expect(membershipsService.createOrReactivateMembership).toHaveBeenCalledWith(
        'existing-user-uuid',
        orgId,
        'INVITED',
        actorUserId,
      );
      expect(rolesService.assignRoleToMembership).toHaveBeenCalledWith(
        'membership-uuid',
        'role-emp-uuid',
        orgId,
        actorUserId,
      );
      expect(emailService.sendInvitationEmail).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.EMPLOYEE_INVITE }),
      );
    });
  });

  describe('Circular Reporting Manager Prevention', () => {
    it('should reject assigning an employee as their own reporting manager', async () => {
      employeesRepo.findById.mockResolvedValue({
        id: 'emp-self',
        organizationId: orgId,
        reportingManagerId: null,
      } as any);

      await expect(
        employeesService.changeReportingManager(
          'emp-self',
          orgId,
          { reportingManagerId: 'emp-self', effectiveDate: '2026-02-10' },
          actorUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect and prevent multi-level circular reporting relationships', async () => {
      // Chain: Manager B reports to Manager A.
      // Now, someone tries to set Manager B as Manager A's reporting manager!
      // Path: Candidate Manager B -> Manager A -> Cycle!
      employeesRepo.findById
        .mockResolvedValueOnce({
          id: 'emp-A',
          organizationId: orgId,
          reportingManagerId: null,
        } as any) // target employee
        .mockResolvedValueOnce({
          id: 'emp-B',
          organizationId: orgId,
          reportingManagerId: 'emp-A', // candidate manager reports to emp-A
        } as any)
        .mockResolvedValueOnce({
          id: 'emp-A',
          organizationId: orgId,
          reportingManagerId: null,
        } as any);

      await expect(
        employeesService.changeReportingManager(
          'emp-A',
          orgId,
          { reportingManagerId: 'emp-B', effectiveDate: '2026-02-10' },
          actorUserId,
        ),
      ).rejects.toThrow('Circular reporting-manager relationship detected');
    });

    it('should reject inactive/exited employees as candidate reporting managers', async () => {
      employeesRepo.findById
        .mockResolvedValueOnce({
          id: 'emp-1',
          organizationId: orgId,
        } as any)
        .mockResolvedValueOnce({
          id: 'emp-exited',
          organizationId: orgId,
          status: EmployeeStatus.EXITED,
        } as any);

      await expect(
        employeesService.changeReportingManager(
          'emp-1',
          orgId,
          { reportingManagerId: 'emp-exited', effectiveDate: '2026-02-10' },
          actorUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully update reporting manager when valid and record history', async () => {
      employeesRepo.findById
        .mockResolvedValueOnce({
          id: 'emp-1',
          organizationId: orgId,
          reportingManagerId: 'old-mgr',
        } as any)
        .mockResolvedValueOnce({
          id: 'new-mgr',
          organizationId: orgId,
          status: EmployeeStatus.ACTIVE,
          reportingManagerId: null,
        } as any);

      employeesRepo.updateEmployee.mockResolvedValue({
        employee: {
          id: 'emp-1',
          organizationId: orgId,
          employeeCode: 'EMP-01',
          firstName: 'John',
          lastName: 'Doe',
          workEmail: 'john@acme.com',
          phone: '123',
          reportingManagerId: 'new-mgr',
          dateOfJoining: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        history: null as any,
      });

      const res = await employeesService.changeReportingManager(
        'emp-1',
        orgId,
        {
          reportingManagerId: 'new-mgr',
          effectiveDate: '2026-02-10',
          remarks: 'Reassigned after reorg',
        },
        actorUserId,
      );

      expect(res.reportingManagerId).toBe('new-mgr');
      expect(employeesRepo.updateEmployee).toHaveBeenCalledWith(
        'emp-1',
        orgId,
        { reportingManagerId: 'new-mgr' },
        expect.objectContaining({
          eventType: EmploymentEventType.REPORTING_MANAGER_CHANGED,
          remarks: 'Reassigned after reorg',
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.EMPLOYEE_REPORTING_MANAGER_CHANGE,
        }),
      );
    });
  });

  describe('Status Transitions & Lifecycle', () => {
    it('should update employee status to RESIGNED and record exit details', async () => {
      employeesRepo.findById.mockResolvedValue({
        id: 'emp-1',
        organizationId: orgId,
        status: EmployeeStatus.ACTIVE,
        employeeCode: 'ZEN-01',
        firstName: 'Jane',
        lastName: 'Doe',
        workEmail: 'jane@acme.com',
        phone: '123',
        dateOfJoining: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      employeesRepo.updateEmployee.mockResolvedValue({
        employee: {
          id: 'emp-1',
          organizationId: orgId,
          employeeCode: 'ZEN-01',
          firstName: 'Jane',
          lastName: 'Doe',
          workEmail: 'jane@acme.com',
          phone: '123',
          status: EmployeeStatus.RESIGNED,
          dateOfExit: new Date('2026-03-31'),
          exitReason: 'Relocating to another country',
          dateOfJoining: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        history: null as any,
      });

      const result = await employeesService.changeStatus(
        'emp-1',
        orgId,
        {
          status: EmployeeStatus.RESIGNED,
          effectiveDate: '2026-03-31',
          exitReason: 'Relocating to another country',
        },
        actorUserId,
      );

      expect(result.status).toBe(EmployeeStatus.RESIGNED);
      expect(employeesRepo.updateEmployee).toHaveBeenCalledWith(
        'emp-1',
        orgId,
        expect.objectContaining({
          status: EmployeeStatus.RESIGNED,
          exitReason: 'Relocating to another country',
        }),
        expect.objectContaining({
          eventType: EmploymentEventType.RESIGNED,
          employeeStatus: EmployeeStatus.RESIGNED,
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.EMPLOYEE_STATUS_CHANGE,
        }),
      );
    });
  });

  describe('Tenant Isolation & Role Scoping', () => {
    it('should enforce tenant boundary on employee lookup', async () => {
      employeesRepo.findById.mockResolvedValue(null);

      await expect(
        employeesService.getEmployeeById('emp-1', otherOrgId, [RoleCode.HR_ADMIN]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should mask sensitive personal data for regular colleague directory view', async () => {
      const mockEmployee = {
        id: 'emp-colleague',
        organizationId: orgId,
        employeeCode: 'ZEN-0099',
        firstName: 'Bob',
        lastName: 'Builder',
        workEmail: 'bob@acme.com',
        personalEmail: 'bob.private@gmail.com', // sensitive
        phone: '+1 555-9999',
        dateOfBirth: new Date('1985-04-12'), // sensitive
        currentAddress: '123 Secret Lane', // sensitive
        emergencyContactName: 'Spouse', // sensitive
        emergencyContactPhone: '+1 555-0000', // sensitive
        status: EmployeeStatus.ACTIVE,
        employmentType: EmploymentType.FULL_TIME,
        dateOfJoining: new Date('2025-01-01'),
        department: { name: 'Operations' },
        designation: { name: 'Coordinator' },
        location: { name: 'Main Office' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      employeesRepo.findById.mockResolvedValue(mockEmployee as any);

      // Viewed by standard employee (colleague)
      const res: any = await employeesService.getEmployeeById(
        'emp-colleague',
        orgId,
        [RoleCode.EMPLOYEE],
        'some-other-user-uuid',
      );

      expect(res.workEmail).toBe('bob@acme.com');
      expect(res.fullName).toBe('Bob Builder');
      // Sensitive fields must be undefined/masked
      expect(res.personalEmail).toBeUndefined();
      expect(res.dateOfBirth).toBeUndefined();
      expect(res.currentAddress).toBeUndefined();
      expect(res.emergencyContactName).toBeUndefined();
    });

    it('should unmask full details for HR Admin and Super Admin', async () => {
      const mockEmployee = {
        id: 'emp-colleague',
        organizationId: orgId,
        employeeCode: 'ZEN-0099',
        firstName: 'Bob',
        lastName: 'Builder',
        workEmail: 'bob@acme.com',
        personalEmail: 'bob.private@gmail.com',
        phone: '+1 555-9999',
        dateOfBirth: new Date('1985-04-12'),
        currentAddress: '123 Secret Lane',
        status: EmployeeStatus.ACTIVE,
        employmentType: EmploymentType.FULL_TIME,
        dateOfJoining: new Date('2025-01-01'),
        department: { name: 'Operations' },
        designation: { name: 'Coordinator' },
        location: { name: 'Main Office' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      employeesRepo.findById.mockResolvedValue(mockEmployee as any);

      const res: any = await employeesService.getEmployeeById(
        'emp-colleague',
        orgId,
        [RoleCode.HR_ADMIN],
        actorUserId,
      );

      expect(res.personalEmail).toBe('bob.private@gmail.com');
      expect(res.currentAddress).toBe('123 Secret Lane');
      expect(res.dateOfBirth).toBe('1985-04-12');
    });
  });

  describe('CSV Import Service', () => {
    it('should validate CSV rows, matching department/designation/location by code and name', async () => {
      departmentsService.getDepartments.mockResolvedValue([
        { id: 'dept-eng', code: 'ENG', name: 'Engineering', status: RecordStatus.ACTIVE },
      ] as any);
      designationsService.getDesignations.mockResolvedValue([
        { id: 'desig-se', code: 'SE', name: 'Software Engineer', status: RecordStatus.ACTIVE },
      ] as any);
      locationsService.getLocations.mockResolvedValue([
        { id: 'loc-ny', code: 'NY-01', name: 'New York', status: RecordStatus.ACTIVE },
      ] as any);
      gradesService.getGrades.mockResolvedValue([]);
      employeesRepo.findByWorkEmail.mockResolvedValue(null);
      employeesRepo.findByCode.mockResolvedValue(null);

      const csv = `first_name,last_name,work_email,employee_code,date_of_joining,department,designation,location
John,Doe,john.import@acme.com,ZEN-9001,2026-03-01,ENG,Software Engineer,New York`;

      const result = await importService.parseAndValidateCsv(csv, orgId);

      expect(result.preview.validRowsCount).toBe(1);
      expect(result.preview.invalidRowsCount).toBe(0);
      expect(result.validRows[0].locationId).toBe('loc-ny');
      expect(result.validRows[0].departmentId).toBe('dept-eng');
      expect(result.validRows[0].designationId).toBe('desig-se');
    });

    it('should detect duplicate codes and invalid emails within the CSV file', async () => {
      departmentsService.getDepartments.mockResolvedValue([]);
      designationsService.getDesignations.mockResolvedValue([]);
      locationsService.getLocations.mockResolvedValue([]);
      gradesService.getGrades.mockResolvedValue([]);

      const csv = `first_name,last_name,work_email,employee_code,date_of_joining,department,designation,location
John,Doe,invalid-email,DUP-01,2026-03-01,ENG,SE,NY
Jane,Doe,invalid-email,DUP-01,2026-03-01,ENG,SE,NY`;

      const result = await importService.parseAndValidateCsv(csv, orgId);

      expect(result.preview.validRowsCount).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
    });
  });

  describe('CSV Export Service', () => {
    it('should export permitted employee fields to CSV and log audit event', async () => {
      employeesRepo.listEmployees.mockResolvedValue({
        data: [
          {
            employeeCode: 'ZEN-001',
            firstName: 'Alice',
            lastName: 'Wonder',
            workEmail: 'alice@acme.com',
            phone: '555-1234',
            status: EmployeeStatus.ACTIVE,
            employmentType: EmploymentType.FULL_TIME,
            dateOfJoining: new Date('2026-01-01'),
            department: { name: 'Engineering' },
            designation: { name: 'Lead' },
            location: { name: 'HQ' },
            reportingManager: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 5000,
        totalPages: 1,
      });

      employeesRepo.createExportJob.mockResolvedValue({
        id: 'export-job-uuid',
        fileName: 'employees_export_2026-01-01.csv',
      } as any);

      const res = await exportService.generateExport(
        orgId,
        {},
        [RoleCode.HR_ADMIN],
        actorUserId,
      );

      expect(res.exportId).toBe('export-job-uuid');
      expect(res.totalRecords).toBe(1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.EMPLOYEE_EXPORT }),
      );
    });
  });
});
