import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayslipsRepository } from './payslips.repository';
import { PayslipTemplatesRepository } from '../payslip-templates/payslip-templates.repository';
import { PayslipTemplatesService } from '../payslip-templates/payslip-templates.service';
import { EmployeesRepository } from '../../employees/employees.repository';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { SafeFormulaEvaluator } from '../payroll-engine/safe-evaluator';
import {
  AuditAction,
  PayslipStatus,
  PayrollRunStatus,
} from '@zentra/shared-types';

@Injectable()
export class PayslipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PayslipsRepository,
    private readonly templatesRepo: PayslipTemplatesRepository,
    private readonly templatesService: PayslipTemplatesService,
    private readonly employeesRepo: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) { }

  async generatePayslips(
    payrollRunId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
      include: {
        payrollPeriod: true,
        records: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Payroll run '${payrollRunId}' not found`);
    }

    if (run.status !== PayrollRunStatus.PAID) {
      throw new BadRequestException(
        `Cannot generate payslips before payroll run is marked as PAID (current: ${run.status})`,
      );
    }

    // Load default template or create fallback
    let template = await this.templatesRepo.findDefault(organizationId);
    if (!template) {
      const templates = await this.templatesRepo.findAll(organizationId);
      template = templates[0] || null;
    }

    const { payrollPeriod, records } = run;
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const periodName = `${monthNames[payrollPeriod.payrollMonth - 1]} ${payrollPeriod.payrollYear}`;

    let generatedCount = 0;

    for (const rec of records) {
      const emp = rec.employee;
      const snapshot: any = rec.snapshotData || {};
      const breakdowns = snapshot.breakdowns || {};

      const earningsBreakdown = breakdowns.earnings || [];
      const deductionsBreakdown = breakdowns.deductions || [];
      const contributionsBreakdown = breakdowns.contributions || [];

      const payslipNumber = `PS-${payrollPeriod.payrollYear}${String(payrollPeriod.payrollMonth).padStart(2, '0')}-${emp.employeeCode}`;
      const netPayWords = SafeFormulaEvaluator.numberToWords(rec.netPay, 'INR');

      // Calculate YTD (all published/generated payslips in this payroll year)
      const priorPayslips = await this.prisma.payslip.findMany({
        where: {
          employeeId: emp.id,
          organizationId,
          payrollPeriod: { payrollYear: payrollPeriod.payrollYear },
          payrollEmployeeRecordId: { not: rec.id },
        },
      });

      const ytdEarnings = priorPayslips.reduce((acc, p) => acc + p.grossEarnings, 0) + rec.grossEarnings;
      const ytdDeductions = priorPayslips.reduce((acc, p) => acc + p.totalDeductions, 0) + rec.totalDeductions;
      const ytdNetPay = priorPayslips.reduce((acc, p) => acc + p.netPay, 0) + rec.netPay;

      const existingPayslip = await this.repo.findByRecordId(rec.id, organizationId);

      const payslipData = {
        organizationId,
        payrollRunId,
        payrollPeriodId: payrollPeriod.id,
        payrollEmployeeRecordId: rec.id,
        employeeId: emp.id,
        templateId: template?.id || null,
        templateVersion: template?.version || 1,
        payslipNumber,
        periodName,
        payDate: run.paymentDate || payrollPeriod.payDate,
        grossEarnings: rec.grossEarnings,
        totalDeductions: rec.totalDeductions,
        employeePf: rec.employeePf,
        employerPf: rec.employerPf,
        eps: rec.eps,
        edli: rec.edli,
        employeeEsi: rec.employeeEsi,
        employerEsi: rec.employerEsi,
        professionalTax: rec.professionalTax,
        lwfEmployee: rec.lwfEmployee,
        lwfEmployer: rec.lwfEmployer,
        tds: rec.tds,
        netPay: rec.netPay,
        netPayWords,
        earningsBreakdown,
        deductionsBreakdown,
        contributionsBreakdown,
        ytdEarnings: Number(ytdEarnings.toFixed(2)),
        ytdDeductions: Number(ytdDeductions.toFixed(2)),
        ytdNetPay: Number(ytdNetPay.toFixed(2)),
        status: PayslipStatus.GENERATED,
        pdfGeneratedAt: new Date(),
      };

      if (existingPayslip) {
        await this.repo.update(existingPayslip.id, payslipData);
      } else {
        await this.repo.create(payslipData);
      }

      await this.prisma.payrollEmployeeRecord.update({
        where: { id: rec.id },
        data: { payslipStatus: PayslipStatus.GENERATED },
      });

      generatedCount++;
    }

    await this.prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: PayrollRunStatus.PAYSLIP_GENERATED },
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_GENERATE,
      entityType: 'PayrollRun',
      entityId: payrollRunId,
      newValues: { generatedCount, periodName },
      ipAddress,
    });

    return {
      success: true,
      message: `Generated ${generatedCount} payslip(s) for ${periodName}`,
      generatedCount,
    };
  }

  async publishPayslips(
    payrollRunId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
      include: {
        payrollPeriod: true,
        payslips: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!run) throw new NotFoundException('Payroll run not found');

    if (run.payslips.length === 0) {
      throw new BadRequestException('No payslips generated for this run yet. Please generate payslips first.');
    }

    const now = new Date();

    // 1. Publish all payslips in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrollRunId, organizationId },
        data: {
          status: PayslipStatus.PUBLISHED,
          publishedAt: now,
          publishedBy: userId,
        },
      });

      await tx.payrollEmployeeRecord.updateMany({
        where: { payrollRunId, organizationId },
        data: { payslipStatus: PayslipStatus.PUBLISHED },
      });

      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: PayrollRunStatus.PUBLISHED },
      });
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_PUBLISH,
      entityType: 'PayrollRun',
      entityId: payrollRunId,
      newValues: { publishedCount: run.payslips.length, publishedAt: now },
      ipAddress,
    });

    // 2. Dispatch email notification to employees asynchronously
    for (const p of run.payslips) {
      if (p.employee?.workEmail) {
        this.emailService
          .sendNotification(
            p.employee.workEmail,
            `Your Payslip for ${p.periodName} is Available`,
            `Hello ${p.employee.firstName},\n\nYour payslip for ${p.periodName} has been processed and published to your employee portal.\n\nNet Pay: ₹ ${p.netPay.toLocaleString('en-IN')}\n\nYou can view and download your payslip anytime from your self-service portal.`,
          )
          .catch(() => { });
      }
    }

    return {
      success: true,
      message: `Published ${run.payslips.length} payslip(s) to employee portal`,
    };
  }

  async getMyPayslips(userId: string, organizationId: string, year?: number) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    return this.repo.findByEmployeeId(employee.id, organizationId, {
      year,
      status: 'PUBLISHED',
    });
  }

  async getMyPayslip(id: string, userId: string, organizationId: string, ipAddress?: string) {
    const employee = await this.employeesRepo.findByUserId(userId, organizationId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    const payslip = await this.repo.findById(id, organizationId);
    if (!payslip) {
      throw new NotFoundException(`Payslip '${id}' not found`);
    }

    // Access control: Employee can view ONLY own payslip!
    if (payslip.employeeId !== employee.id) {
      throw new ForbiddenException('You are not authorized to view another employee’s payslip');
    }

    if (payslip.status !== 'PUBLISHED') {
      throw new ForbiddenException('This payslip has not been published yet');
    }

    await this.repo.recordView(id);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_VIEW,
      entityType: 'Payslip',
      entityId: id,
      newValues: { payslipNumber: payslip.payslipNumber },
      ipAddress,
    });

    return payslip;
  }

  async downloadMyPayslip(id: string, userId: string, organizationId: string, ipAddress?: string) {
    const payslip = await this.getMyPayslip(id, userId, organizationId, ipAddress);

    await this.repo.recordDownload(id);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_DOWNLOAD,
      entityType: 'Payslip',
      entityId: id,
      newValues: { payslipNumber: payslip.payslipNumber },
      ipAddress,
    });

    // Render HTML template
    let template = payslip.template;
    if (!template) {
      template = await this.templatesRepo.findDefault(organizationId);
    }

    const rendered = await this.templatesService.preview(template?.id || '', organizationId, {
      employee: {
        full_name: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        employee_code: payslip.employee.employeeCode,
        designation: payslip.employee.designation?.name,
        department: payslip.employee.department?.name,
        location: payslip.employee.location?.name,
        date_of_joining: new Date(payslip.employee.dateOfJoining).toLocaleDateString(),
        bank_account_masked: payslip.employee.bankDetail
          ? `XXXX${payslip.employee.bankDetail.accountNumber.slice(-4)}`
          : 'N/A',
      },
      company: {
        name: payslip.organization?.name || 'Zentra HRMS',
        address: payslip.organization?.profile?.address || '',
      },
      payroll: {
        period: payslip.periodName,
        pay_date: new Date(payslip.payDate).toLocaleDateString(),
        gross_earnings: `₹ ${payslip.grossEarnings.toLocaleString('en-IN')}`,
        total_deductions: `₹ ${payslip.totalDeductions.toLocaleString('en-IN')}`,
        net_pay: `₹ ${payslip.netPay.toLocaleString('en-IN')}`,
        net_pay_in_words: payslip.netPayWords,
        earnings_table: (payslip.earningsBreakdown as any[])
          .map((e) => `<tr><td>${e.name}</td><td style="text-align:right">₹ ${Number(e.amount).toLocaleString('en-IN')}</td></tr>`)
          .join(''),
        deductions_table: (payslip.deductionsBreakdown as any[])
          .map((d) => `<tr><td>${d.name}</td><td style="text-align:right">₹ ${Number(d.amount).toLocaleString('en-IN')}</td></tr>`)
          .join(''),
      },
    });

    return {
      payslip,
      html: rendered.previewHtml,
      filename: `Payslip_${payslip.payslipNumber}.html`,
    };
  }

  async getAdminPayslips(
    organizationId: string,
    filter?: { payrollRunId?: string; status?: string; search?: string },
  ) {
    return this.repo.findAll(organizationId, filter);
  }

  async getAdminPayslip(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const payslip = await this.repo.findById(id, organizationId);
    if (!payslip) throw new NotFoundException('Payslip not found');

    await this.repo.recordView(id);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_VIEW,
      entityType: 'Payslip',
      entityId: id,
      newValues: { payslipNumber: payslip.payslipNumber, adminView: true },
      ipAddress,
    });

    return payslip;
  }

  async downloadAdminPayslip(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const payslip = await this.repo.findById(id, organizationId);
    if (!payslip) throw new NotFoundException('Payslip not found');

    await this.repo.recordDownload(id);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_DOWNLOAD,
      entityType: 'Payslip',
      entityId: id,
      newValues: { payslipNumber: payslip.payslipNumber, adminDownload: true },
      ipAddress,
    });

    let template = payslip.template;
    if (!template) {
      template = await this.templatesRepo.findDefault(organizationId);
    }

    const rendered = await this.templatesService.preview(template?.id || '', organizationId, {
      employee: {
        full_name: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        employee_code: payslip.employee.employeeCode,
        designation: payslip.employee.designation?.name,
        department: payslip.employee.department?.name,
        location: payslip.employee.location?.name,
        date_of_joining: new Date(payslip.employee.dateOfJoining).toLocaleDateString(),
        bank_account_masked: payslip.employee.bankDetail
          ? `XXXX${payslip.employee.bankDetail.accountNumber.slice(-4)}`
          : 'N/A',
      },
      company: {
        name: payslip.organization?.name || 'Zentra HRMS',
        address: payslip.organization?.profile?.address || '',
      },
      payroll: {
        period: payslip.periodName,
        pay_date: new Date(payslip.payDate).toLocaleDateString(),
        gross_earnings: `₹ ${payslip.grossEarnings.toLocaleString('en-IN')}`,
        total_deductions: `₹ ${payslip.totalDeductions.toLocaleString('en-IN')}`,
        net_pay: `₹ ${payslip.netPay.toLocaleString('en-IN')}`,
        net_pay_in_words: payslip.netPayWords,
        earnings_table: (payslip.earningsBreakdown as any[])
          .map((e) => `<tr><td>${e.name}</td><td style="text-align:right">₹ ${Number(e.amount).toLocaleString('en-IN')}</td></tr>`)
          .join(''),
        deductions_table: (payslip.deductionsBreakdown as any[])
          .map((d) => `<tr><td>${d.name}</td><td style="text-align:right">₹ ${Number(d.amount).toLocaleString('en-IN')}</td></tr>`)
          .join(''),
      },
    });

    return {
      payslip,
      html: rendered.previewHtml,
      filename: `Payslip_${payslip.payslipNumber}.html`,
    };
  }
}

