import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { AuditService } from '../audit/audit.service';
import { EmployeeQueryFilterInput, AuditAction, RoleCode } from '@zentra/shared-types';

@Injectable()
export class EmployeesExportService {
  constructor(
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
  ) {}

  async generateExport(
    organizationId: string,
    filter: EmployeeQueryFilterInput,
    userRoles: string[],
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const isHrOrAdmin =
      userRoles.includes(RoleCode.SUPER_ADMIN) ||
      userRoles.includes(RoleCode.HR_ADMIN);

    // Retrieve all matched records (up to 5000 for export)
    const result = await this.employeesRepo.listEmployees(organizationId, {
      ...filter,
      page: 1,
      limit: 5000,
    });

    const employees = result.data;

    // Build CSV Headers based on permission
    const headers = [
      'Employee Code',
      'First Name',
      'Last Name',
      'Work Email',
      'Phone',
      'Department',
      'Designation',
      'Location',
      'Reporting Manager',
      'Status',
      'Employment Type',
      'Date of Joining',
    ];

    if (isHrOrAdmin) {
      headers.push(
        'Grade',
        'Date of Birth',
        'Gender',
        'Personal Email',
        'City',
        'Country',
        'Emergency Contact Name',
        'Emergency Contact Phone',
      );
    }

    const csvLines = [headers.map((h) => `"${h}"`).join(',')];

    for (const emp of employees) {
      const row = [
        emp.employeeCode,
        emp.firstName,
        emp.lastName,
        emp.workEmail,
        emp.phone,
        emp.department?.name || '',
        emp.designation?.name || '',
        emp.location?.name || '',
        emp.reportingManager
          ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`.trim()
          : '',
        emp.status,
        emp.employmentType,
        emp.dateOfJoining ? emp.dateOfJoining.toISOString().split('T')[0] : '',
      ];

      if (isHrOrAdmin) {
        row.push(
          emp.grade?.name || '',
          emp.dateOfBirth ? emp.dateOfBirth.toISOString().split('T')[0] : '',
          emp.gender || '',
          emp.personalEmail || '',
          emp.city || '',
          emp.country || '',
          emp.emergencyContactName || '',
          emp.emergencyContactPhone || '',
        );
      }

      csvLines.push(
        row.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(','),
      );
    }

    const fileContent = csvLines.join('\n');
    const fileName = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;

    const exportJob = await this.employeesRepo.createExportJob(
      organizationId,
      fileName,
      fileContent,
      employees.length,
      actorUserId,
    );

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_EXPORT,
      entityType: 'EmployeeExportJob',
      entityId: exportJob.id,
      newValues: {
        totalRecords: employees.length,
        fileName,
      },
      ipAddress,
      userAgent,
    });

    return {
      exportId: exportJob.id,
      fileName,
      totalRecords: employees.length,
      downloadUrl: `/api/v1/employees/export/${exportJob.id}`,
    };
  }

  async getExportFile(exportId: string, organizationId: string) {
    const job = await this.employeesRepo.getExportJob(exportId, organizationId);
    if (!job) {
      throw new NotFoundException(`Export file with ID ${exportId} not found`);
    }

    return {
      fileName: job.fileName,
      fileContent: job.fileContent,
    };
  }
}
