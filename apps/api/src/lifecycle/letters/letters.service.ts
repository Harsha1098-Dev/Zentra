import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LettersRepository } from './letters.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  LifecycleLetterType,
} from '@zentra/shared-types';

@Injectable()
export class LettersService {
  constructor(
    private readonly repository: LettersRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    organizationId: string,
    filters: { employeeId?: string; letterType?: string } = {},
  ) {
    return this.repository.findAll(organizationId, filters);
  }

  async findById(id: string, organizationId: string) {
    const letter = await this.repository.findById(id, organizationId);
    if (!letter) {
      throw new NotFoundException(`Lifecycle letter '${id}' not found`);
    }
    return letter;
  }

  private interpolate(template: string, vars: Record<string, any>): string {
    return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match;
    });
  }

  private getDefaultTemplate(letterType: LifecycleLetterType): { title: string; template: string } {
    switch (letterType) {
      case LifecycleLetterType.OFFER:
        return {
          title: 'Offer of Employment',
          template: `Dear {{employee_name}},

We are pleased to extend an offer of employment with {{company_name}} for the position of {{designation}} in the {{department}} department.

Your date of joining will be {{date_of_joining}}. Your starting annual Cost to Company (CTC) will be ₹{{annual_ctc}}. You will be based out of our {{location}} office.

Please review this offer and signify your acceptance.

Warm regards,
{{company_name}} HR Team
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.APPOINTMENT:
        return {
          title: 'Appointment Letter',
          template: `Dear {{employee_name}},

Consequent to your acceptance of our offer, we are pleased to confirm your appointment as {{designation}} at {{company_name}} with effect from {{date_of_joining}}.

You will be in the {{department}} department at our {{location}} facility. You will be on probation for a period of six months from your date of joining.

We look forward to a long and mutually rewarding association.

Yours sincerely,
{{company_name}} Management
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.CONFIRMATION:
        return {
          title: 'Letter of Confirmation',
          template: `Dear {{employee_name}},

Following the successful completion of your probation period and review of your performance, we are delighted to inform you that your services with {{company_name}} have been confirmed in the role of {{designation}} effective {{effective_date}}.

All other terms and conditions of your employment contract remain unchanged. We appreciate your dedication and contribution to {{company_name}}.

Best wishes for continued success.

Sincerely,
Human Resources Department
{{company_name}}
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.TRANSFER:
        return {
          title: 'Internal Transfer Letter',
          template: `Dear {{employee_name}},

This is to confirm your internal transfer within {{company_name}} effective {{effective_date}}.

Effective from this date, you will be assigned to:
- Department: {{department}}
- Designation: {{designation}}
- Location: {{location}}

All other terms of your employment contract remain intact. We wish you success in your new assignment.

Sincerely,
Human Resources Department
{{company_name}}
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.PROMOTION:
        return {
          title: 'Promotion Letter',
          template: `Dear {{employee_name}},

In recognition of your outstanding performance, dedication, and value to {{company_name}}, we are pleased to promote you to the position of {{designation}} in the {{department}} department, effective {{effective_date}}.

Your new annual Cost to Company (CTC) will be ₹{{annual_ctc}}.

We congratulate you on this well-deserved promotion and trust that you will continue to achieve excellence in your expanded responsibilities.

Warm regards,
Leadership Team
{{company_name}}
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.INCREMENT:
        return {
          title: 'Annual Salary Increment Letter',
          template: `Dear {{employee_name}},

In appreciation of your contribution towards {{company_name}}'s success, we are pleased to inform you that your compensation has been revised effective {{effective_date}}.

Your revised annual Cost to Company (CTC) is ₹{{annual_ctc}}.

We thank you for your ongoing commitment and look forward to your continued contributions.

Sincerely,
Human Resources & Compensation
{{company_name}}
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.RESIGNATION_ACKNOWLEDGEMENT:
        return {
          title: 'Resignation Acknowledgement Letter',
          template: `Dear {{employee_name}},

We acknowledge receipt of your resignation. As per your employment agreement, your proposed last working day is {{last_working_date}}.

Please ensure you complete all handover formalities and exit clearance tasks prior to this date.

Sincerely,
Human Resources
{{company_name}}
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.RELIEVING:
        return {
          title: 'Relieving Letter',
          template: `Dear {{employee_name}},

This has reference to your resignation letter. We hereby confirm that you are relieved from your duties and services with {{company_name}} as {{designation}} at the close of working hours on {{last_working_date}}.

All exit formalities and organizational clearances have been completed. We thank you for your services to {{company_name}} and wish you all success in your future endeavors.

Yours sincerely,
Human Resources Department
{{company_name}}
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.EXPERIENCE:
        return {
          title: 'Certificate of Employment and Experience',
          template: `TO WHOMSOEVER IT MAY CONCERN

This is to certify that {{employee_name}} (Employee ID: {{employee_number}}) was employed with {{company_name}} from {{date_of_joining}} to {{last_working_date}}.

During this period, {{employee_name}} held the position of {{designation}} in the {{department}} department at our {{location}} office.

During their tenure with us, {{employee_name}} proved to be diligent, sincere, and professional in performing assigned responsibilities. Their conduct and character were found to be exemplary.

We wish {{employee_name}} the very best in all future professional and personal endeavors.

Authorized Signatory
Human Resources Department
{{company_name}}
Date: {{issue_date}}`,
        };

      case LifecycleLetterType.EXIT:
      default:
        return {
          title: 'Official Employment Correspondence',
          template: `Dear {{employee_name}},

This official correspondence certifies your employment details at {{company_name}}.

- Employee ID: {{employee_number}}
- Designation: {{designation}}
- Department: {{department}}
- Location: {{location}}
- Date of Joining: {{date_of_joining}}

Sincerely,
Human Resources
{{company_name}}
Date: {{issue_date}}`,
        };
    }
  }

  async generate(
    organizationId: string,
    data: {
      employeeId: string;
      letterType: LifecycleLetterType;
      customFields?: Record<string, any>;
      referenceId?: string | null;
      isSharedWithEmployee?: boolean;
    },
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId, deletedAt: null },
      include: {
        department: true,
        designation: true,
        location: true,
        organization: true,
        salaryAssignments: {
          where: { status: 'ACTIVE' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee '${data.employeeId}' not found`);
    }

    const org = employee.organization;
    const currentAssignment = employee.salaryAssignments[0];
    const annualCtcStr = currentAssignment ? currentAssignment.annualCtc.toLocaleString('en-IN') : 'N/A';

    const defaultTpl = this.getDefaultTemplate(data.letterType);

    const variables: Record<string, any> = {
      employee_name: `${employee.firstName} ${employee.lastName}`,
      employee_number: employee.employeeCode,
      designation: employee.designation?.name || 'Team Member',
      department: employee.department?.name || 'General',
      location: employee.location?.name || 'Headquarters',
      date_of_joining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A',
      last_working_date: employee.dateOfExit
        ? new Date(employee.dateOfExit).toLocaleDateString()
        : new Date().toLocaleDateString(),
      effective_date: new Date().toLocaleDateString(),
      annual_ctc: annualCtcStr,
      company_name: org.name,
      issue_date: new Date().toLocaleDateString(),
      ...(data.customFields || {}),
    };

    const title = `${defaultTpl.title} - ${employee.firstName} ${employee.lastName}`;
    const content = this.interpolate(defaultTpl.template, variables);

    const letter = await this.repository.create(
      organizationId,
      {
        employeeId: employee.id,
        letterType: data.letterType,
        title,
        content,
        issuedDate: new Date(),
        isSharedWithEmployee: data.isSharedWithEmployee !== false,
        referenceId: data.referenceId || null,
      },
      userId,
    );

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.LETTER_GENERATE,
      resource: 'lifecycle_letters',
      resourceId: letter.id,
      details: {
        employeeId: employee.id,
        letterType: data.letterType,
        title,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return letter;
  }

  async download(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    const letter = await this.findById(id, organizationId);

    await this.auditService.log({
      organizationId,
      userId,
      action: AuditAction.LETTER_DOWNLOAD,
      resource: 'lifecycle_letters',
      resourceId: id,
      details: {
        letterType: letter.letterType,
        title: letter.title,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      letter,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${letter.title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1E293B; line-height: 1.6; }
    .header { border-bottom: 2px solid #1E3A8A; padding-bottom: 12px; margin-bottom: 24px; }
    .company { font-size: 24px; font-weight: bold; color: #1E3A8A; }
    .title { font-size: 18px; font-weight: 600; margin: 20px 0 10px; color: #0F172A; }
    .content { white-space: pre-wrap; font-size: 14px; }
    .footer { margin-top: 40px; border-top: 1px solid #CBD5E1; padding-top: 12px; font-size: 12px; color: #64748B; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">${letter.organization?.name || 'Zentra'}</div>
  </div>
  <div class="title">${letter.title}</div>
  <div class="content">${letter.content}</div>
  <div class="footer">
    Issued on: ${letter.issuedDate ? new Date(letter.issuedDate).toLocaleDateString() : 'N/A'} | Reference: ${letter.id}
  </div>
</body>
</html>
      `.trim(),
    };
  }

  async revoke(
    id: string,
    organizationId: string,
    userId: string,
    ip?: string,
    ua?: string,
  ) {
    await this.findById(id, organizationId);
    return this.repository.delete(id, organizationId);
  }
}
