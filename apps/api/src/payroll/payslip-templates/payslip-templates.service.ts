import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PayslipTemplatesRepository } from './payslip-templates.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@zentra/shared-types';
import { SafeFormulaEvaluator } from '../payroll-engine/safe-evaluator';

@Injectable()
export class PayslipTemplatesService {
  constructor(
    private readonly repo: PayslipTemplatesRepository,
    private readonly auditService: AuditService,
  ) { }

  async findAll(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async findById(id: string, organizationId: string) {
    const template = await this.repo.findById(id, organizationId);
    if (!template) {
      throw new NotFoundException(`Payslip template '${id}' not found`);
    }
    return template;
  }

  async create(organizationId: string, input: any, userId: string, ipAddress?: string) {
    if (input.isDefault) {
      await this.repo.clearDefault(organizationId);
    }

    const created = await this.repo.create(organizationId, input);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_TEMPLATE_CREATE,
      entityType: 'PayslipTemplate',
      entityId: created.id,
      newValues: created,
      ipAddress,
    });

    return created;
  }

  async update(id: string, organizationId: string, input: any, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);

    if (input.isDefault && !existing.isDefault) {
      await this.repo.clearDefault(organizationId);
    }

    const updated = await this.repo.update(id, organizationId, input);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_TEMPLATE_UPDATE,
      entityType: 'PayslipTemplate',
      entityId: id,
      prevValues: existing,
      newValues: updated,
      ipAddress,
    });

    return updated;
  }

  async delete(id: string, organizationId: string, userId: string, ipAddress?: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.isDefault) {
      throw new BadRequestException('Cannot delete default payslip template');
    }

    await this.repo.softDelete(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.PAYSLIP_TEMPLATE_DELETE,
      entityType: 'PayslipTemplate',
      entityId: id,
      prevValues: existing,
      ipAddress,
    });

    return { success: true, message: `Payslip template '${existing.name}' deleted` };
  }

  async preview(id: string, organizationId: string, customData?: any) {
    const template = await this.findById(id, organizationId);

    // Merge mock data or supplied custom data
    const mock = {
      employee: {
        full_name: 'Harsha Vardhan',
        employee_code: 'EMP-001',
        designation: 'Senior Full Stack Engineer',
        department: 'Engineering',
        location: 'Bengaluru HQ',
        date_of_joining: '2024-01-15',
        bank_account_masked: 'XXXX5678',
        ...(customData?.employee || {}),
      },
      company: {
        name: 'Zentra Technologies Pvt Ltd',
        legal_name: 'Zentra Technologies Private Limited',
        address: '100 Feet Road, Indiranagar, Bengaluru, KA 560038',
        logo: '',
        ...(customData?.company || {}),
      },
      payroll: {
        period: 'November 2026',
        pay_date: '2026-11-30',
        gross_earnings: '₹ 1,25,000.00',
        total_deductions: '₹ 18,500.00',
        net_pay: '₹ 1,06,500.00',
        net_pay_in_words: SafeFormulaEvaluator.numberToWords(106500, 'INR'),
        earnings_table: `
          <tr><td>Basic Salary</td><td style="text-align:right">₹ 60,000.00</td></tr>
          <tr><td>House Rent Allowance (HRA)</td><td style="text-align:right">₹ 24,000.00</td></tr>
          <tr><td>Special Allowance</td><td style="text-align:right">₹ 35,000.00</td></tr>
          <tr><td>Conveyance Allowance</td><td style="text-align:right">₹ 6,000.00</td></tr>
        `,
        deductions_table: `
          <tr><td>Provident Fund (EPF)</td><td style="text-align:right">₹ 1,800.00</td></tr>
          <tr><td>Professional Tax (PT)</td><td style="text-align:right">₹ 200.00</td></tr>
          <tr><td>Income Tax (TDS)</td><td style="text-align:right">₹ 16,500.00</td></tr>
        `,
        employer_contributions_table: `
          <tr><td>Employer PF</td><td style="text-align:right">₹ 1,800.00</td></tr>
          <tr><td>Gratuity Provision</td><td style="text-align:right">₹ 2,886.00</td></tr>
        `,
        ...(customData?.payroll || {}),
      },
    };

    return {
      template,
      renderedVariables: mock,
      previewHtml: this.renderHtml(template, mock),
    };
  }

  renderHtml(template: any, data: any): string {
    let html =
      template.htmlTemplate ||
      `
      <div style="font-family:${template.fontFamily}; padding:24px; color:#0F172A; max-width:800px; margin:auto;">
        <div style="border-bottom:2px solid ${template.primaryColor}; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between;">
          <div>
            <h1 style="color:${template.primaryColor}; margin:0; font-size:24px;">{{company.name}}</h1>
            <p style="margin:4px 0; color:#64748B; font-size:12px;">{{company.address}}</p>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0; font-size:18px;">PAYSLIP</h2>
            <p style="margin:4px 0; font-size:12px; color:#64748B;">For {{payroll.period}}</p>
            <p style="margin:2px 0; font-size:12px; color:#64748B;">Pay Date: {{payroll.pay_date}}</p>
          </div>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin-bottom:24px; display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
          <div><strong>Employee Name:</strong> {{employee.full_name}}</div>
          <div><strong>Employee Code:</strong> {{employee.employee_code}}</div>
          <div><strong>Designation:</strong> {{employee.designation}}</div>
          <div><strong>Department:</strong> {{employee.department}}</div>
          <div><strong>Date of Joining:</strong> {{employee.date_of_joining}}</div>
          <div><strong>Bank Account:</strong> {{employee.bank_account_masked}}</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; font-size:12px;">
          <div>
            <h3 style="border-bottom:1px solid #E2E8F0; padding-bottom:6px; color:${template.primaryColor};">EARNINGS</h3>
            <table style="width:100%; border-collapse:collapse;">
              {{payroll.earnings_table}}
              <tr style="font-weight:bold; border-top:1px solid #E2E8F0;">
                <td style="padding-top:8px;">Gross Earnings</td>
                <td style="text-align:right; padding-top:8px;">{{payroll.gross_earnings}}</td>
              </tr>
            </table>
          </div>

          <div>
            <h3 style="border-bottom:1px solid #E2E8F0; padding-bottom:6px; color:${template.primaryColor};">DEDUCTIONS</h3>
            <table style="width:100%; border-collapse:collapse;">
              {{payroll.deductions_table}}
              <tr style="font-weight:bold; border-top:1px solid #E2E8F0;">
                <td style="padding-top:8px;">Total Deductions</td>
                <td style="text-align:right; padding-top:8px;">{{payroll.total_deductions}}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <div>
            <div style="font-size:11px; color:#1E3A8A; font-weight:600;">NET TAKE HOME PAY</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">{{payroll.net_pay_in_words}}</div>
          </div>
          <div style="font-size:24px; font-weight:bold; color:#1E3A8A;">{{payroll.net_pay}}</div>
        </div>

        <div style="border-top:1px solid #E2E8F0; padding-top:16px; text-align:center; font-size:11px; color:#94A3B8;">
          This is a system-generated document and does not require a physical signature.
        </div>
      </div>
    `;

    // Replace merge variables
    for (const [section, values] of Object.entries(data)) {
      if (typeof values === 'object' && values !== null) {
        for (const [key, val] of Object.entries(values as Record<string, any>)) {
          const pattern = new RegExp(`{{${section}.${key}}}`, 'g');
          html = html.replace(pattern, String(val ?? ''));
        }
      }
    }

    return html;
  }
}

