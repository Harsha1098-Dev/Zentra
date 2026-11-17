import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { AuditService } from '../audit/audit.service';
import { DepartmentsService } from '../organization-setup/departments/departments.service';
import { DesignationsService } from '../organization-setup/designations/designations.service';
import { LocationsService } from '../organization-setup/locations/locations.service';
import { GradesService } from '../organization-setup/grades/grades.service';
import {
  AuditAction,
  EmploymentType,
  EmployeeStatus,
  EmploymentEventType,
  RecordStatus,
} from '@zentra/shared-types';

export interface ImportErrorDetail {
  row: number;
  field?: string;
  message: string;
  data?: Record<string, string>;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  previewRows: Array<{
    rowNumber: number;
    isValid: boolean;
    errors: string[];
    parsed: Record<string, any>;
  }>;
}

@Injectable()
export class EmployeesImportService {
  constructor(
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly departmentsService: DepartmentsService,
    private readonly designationsService: DesignationsService,
    private readonly locationsService: LocationsService,
    private readonly gradesService: GradesService,
  ) {}

  getImportTemplate(): { fileName: string; content: string } {
    const headers = [
      'first_name',
      'middle_name',
      'last_name',
      'work_email',
      'personal_email',
      'phone',
      'employee_code',
      'date_of_joining',
      'date_of_birth',
      'gender',
      'employment_type',
      'department',
      'designation',
      'location',
      'grade',
      'reporting_manager_email',
    ];

    const sampleRow = [
      'Jane',
      '',
      'Doe',
      'jane.doe@example.com',
      'jane.personal@gmail.com',
      '+1 (555) 012-3456',
      'ZEN-1001',
      '2026-01-15',
      '1992-05-20',
      'FEMALE',
      'FULL_TIME',
      'ENG',
      'SSE-01',
      'HQ-01',
      'GR-L3',
      'manager@example.com',
    ];

    const content = `${headers.join(',')}\n${sampleRow.join(',')}\n`;
    return {
      fileName: 'zentra_employees_import_template.csv',
      content,
    };
  }

  async parseAndValidateCsv(
    csvContent: string,
    organizationId: string,
  ): Promise<{
    preview: ImportPreviewResult;
    validRows: any[];
    errors: ImportErrorDetail[];
  }> {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or missing headers');
    }

    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    // Cache lookup sets
    const [departments, designations, locations, grades] = await Promise.all([
      this.departmentsService.getDepartments(organizationId, 'ACTIVE'),
      this.designationsService.getDesignations(organizationId, 'ACTIVE'),
      this.locationsService.getLocations(organizationId, 'ACTIVE'),
      this.gradesService.getGrades(organizationId, 'ACTIVE'),
    ]);

    const seenCodesInCsv = new Set<string>();
    const seenEmailsInCsv = new Set<string>();

    const errors: ImportErrorDetail[] = [];
    const validRows: any[] = [];
    const previewRows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const rawCols = this.parseCsvLine(lines[i]);
      const row: Record<string, string> = {};

      headers.forEach((h, idx) => {
        row[h] = rawCols[idx] ? rawCols[idx].trim().replace(/^["']|["']$/g, '') : '';
      });

      const rowErrors: string[] = [];

      // Validate required: first_name, last_name, work_email, employee_code, date_of_joining, department, designation, location
      if (!row['first_name']) rowErrors.push('First name is required');
      if (!row['last_name']) rowErrors.push('Last name is required');

      const workEmail = row['work_email']?.toLowerCase().trim();
      if (!workEmail) {
        rowErrors.push('Work email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
        rowErrors.push('Work email format is invalid');
      } else if (seenEmailsInCsv.has(workEmail)) {
        rowErrors.push(`Duplicate work email "${workEmail}" in CSV file`);
      } else {
        seenEmailsInCsv.add(workEmail);
      }

      const employeeCode = row['employee_code']?.toUpperCase().trim();
      if (!employeeCode) {
        rowErrors.push('Employee code is required');
      } else if (seenCodesInCsv.has(employeeCode)) {
        rowErrors.push(`Duplicate employee code "${employeeCode}" in CSV file`);
      } else {
        seenCodesInCsv.add(employeeCode);
      }

      const dateOfJoining = row['date_of_joining']?.trim();
      if (!dateOfJoining || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfJoining)) {
        rowErrors.push('Date of joining must be in YYYY-MM-DD format');
      }

      // Check DB duplicate email & code
      if (workEmail) {
        const existingEmail = await this.employeesRepo.findByWorkEmail(
          workEmail,
          organizationId,
        );
        if (existingEmail) {
          rowErrors.push(`Work email "${workEmail}" already exists in organization`);
        }
      }

      if (employeeCode) {
        const existingCode = await this.employeesRepo.findByCode(
          employeeCode,
          organizationId,
        );
        if (existingCode) {
          rowErrors.push(`Employee code "${employeeCode}" already exists in organization`);
        }
      }

      // Match Department (by code first, then name)
      const deptInput = row['department']?.trim();
      let matchedDept = departments.find(
        (d) =>
          d.code.toLowerCase() === deptInput?.toLowerCase() ||
          d.name.toLowerCase() === deptInput?.toLowerCase(),
      );
      if (!matchedDept) {
        rowErrors.push(`Department "${deptInput}" not found or inactive`);
      }

      // Match Designation (by code first, then name)
      const desigInput = row['designation']?.trim();
      let matchedDesig = designations.find(
        (d) =>
          d.code.toLowerCase() === desigInput?.toLowerCase() ||
          d.name.toLowerCase() === desigInput?.toLowerCase(),
      );
      if (!matchedDesig) {
        rowErrors.push(`Designation "${desigInput}" not found or inactive`);
      }

      // Match Location (by code first, then name)
      const locInput = row['location']?.trim();
      let matchedLoc = locations.find(
        (l) =>
          l.code.toLowerCase() === locInput?.toLowerCase() ||
          l.name.toLowerCase() === locInput?.toLowerCase(),
      );
      if (!matchedLoc) {
        rowErrors.push(`Location "${locInput}" not found or inactive`);
      }

      // Match Grade (optional)
      let matchedGradeId: string | null = null;
      const gradeInput = row['grade']?.trim();
      if (gradeInput) {
        const g = grades.find(
          (gr) =>
            gr.code.toLowerCase() === gradeInput.toLowerCase() ||
            gr.name.toLowerCase() === gradeInput.toLowerCase(),
        );
        if (g) matchedGradeId = g.id;
        else rowErrors.push(`Grade "${gradeInput}" not found or inactive`);
      }

      // Match Reporting Manager (by email, optional)
      let matchedManagerId: string | null = null;
      const managerEmail = row['reporting_manager_email']?.toLowerCase().trim();
      if (managerEmail) {
        const mgr = await this.employeesRepo.findByWorkEmail(
          managerEmail,
          organizationId,
        );
        if (mgr) {
          matchedManagerId = mgr.id;
        } else {
          rowErrors.push(`Reporting manager with email "${managerEmail}" not found`);
        }
      }

      // Employment Type
      let employmentType = EmploymentType.FULL_TIME;
      const empTypeInput = row['employment_type']?.toUpperCase().trim();
      if (empTypeInput && Object.values(EmploymentType).includes(empTypeInput as any)) {
        employmentType = empTypeInput as EmploymentType;
      }

      const isValid = rowErrors.length === 0;

      if (!isValid) {
        rowErrors.forEach((errMsg) => {
          errors.push({
            row: rowNumber,
            message: errMsg,
            data: row,
          });
        });
      } else {
        validRows.push({
          firstName: row['first_name'],
          middleName: row['middle_name'] || null,
          lastName: row['last_name'],
          workEmail,
          personalEmail: row['personal_email'] || null,
          phone: row['phone'] || 'N/A',
          employeeCode,
          dateOfJoining: new Date(dateOfJoining),
          dateOfBirth: row['date_of_birth'] ? new Date(row['date_of_birth']) : null,
          gender: row['gender'] || null,
          employmentType,
          status: EmployeeStatus.ACTIVE,
          locationId: matchedLoc!.id,
          departmentId: matchedDept!.id,
          designationId: matchedDesig!.id,
          gradeId: matchedGradeId,
          reportingManagerId: matchedManagerId,
        });
      }

      previewRows.push({
        rowNumber,
        isValid,
        errors: rowErrors,
        parsed: {
          ...row,
          matchedDeptName: matchedDept?.name,
          matchedDesigName: matchedDesig?.name,
          matchedLocName: matchedLoc?.name,
        },
      });
    }

    return {
      preview: {
        totalRows: lines.length - 1,
        validRowsCount: validRows.length,
        invalidRowsCount: previewRows.length - validRows.length,
        previewRows: previewRows.slice(0, 50), // first 50 rows preview
      },
      validRows,
      errors,
    };
  }

  async executeImport(
    csvContent: string,
    fileName: string,
    organizationId: string,
    actorUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const { validRows, errors } = await this.parseAndValidateCsv(
      csvContent,
      organizationId,
    );

    const totalRows = validRows.length + (errors.length > 0 ? new Set(errors.map((e) => e.row)).size : 0);

    const importJob = await this.employeesRepo.createImportJob(
      organizationId,
      fileName,
      actorUserId,
      totalRows,
    );

    let successfulRows = 0;
    const runtimeErrors: ImportErrorDetail[] = [...errors];

    for (const validData of validRows) {
      try {
        await this.employeesRepo.createEmployee(
          {
            ...validData,
            organizationId,
          },
          {
            organizationId,
            employeeId: '',
            eventType: EmploymentEventType.JOINED,
            effectiveFrom: validData.dateOfJoining,
            locationId: validData.locationId,
            departmentId: validData.departmentId,
            designationId: validData.designationId,
            gradeId: validData.gradeId,
            reportingManagerId: validData.reportingManagerId,
            employmentType: validData.employmentType,
            employeeStatus: validData.status,
            remarks: `Bulk imported via CSV file: ${fileName}`,
            changedByUserId: actorUserId,
          },
        );
        successfulRows++;
      } catch (err: any) {
        runtimeErrors.push({
          row: 0,
          message: err.message || 'Error inserting row into database',
        });
      }
    }

    const failedRows = totalRows - successfulRows;
    const finalStatus =
      failedRows === 0 ? 'COMPLETED' : successfulRows > 0 ? 'PARTIAL' : 'FAILED';

    const updatedJob = await this.employeesRepo.updateImportJob(importJob.id, {
      status: finalStatus,
      processedRows: totalRows,
      successfulRows,
      failedRows,
      errors: runtimeErrors as any,
    });

    await this.auditService.log({
      organizationId,
      actorUserId,
      action: AuditAction.EMPLOYEE_IMPORT,
      entityType: 'EmployeeImportJob',
      entityId: importJob.id,
      newValues: {
        fileName,
        totalRows,
        successfulRows,
        failedRows,
        status: finalStatus,
      },
      ipAddress,
      userAgent,
    });

    return updatedJob;
  }

  async getImportJob(importId: string, organizationId: string) {
    const job = await this.employeesRepo.getImportJob(importId, organizationId);
    if (!job) {
      throw new NotFoundException(`Import job with ID ${importId} not found`);
    }
    return job;
  }

  async generateErrorReportCsv(importId: string, organizationId: string): Promise<string> {
    const job = await this.getImportJob(importId, organizationId);
    const errors: ImportErrorDetail[] = (job.errors as any) || [];

    const csvRows = ['Row,Error Message'];
    errors.forEach((err) => {
      csvRows.push(`${err.row},"${err.message.replace(/"/g, '""')}"`);
    });

    return csvRows.join('\n');
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  }
}
