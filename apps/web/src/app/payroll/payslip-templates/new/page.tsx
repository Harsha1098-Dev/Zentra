'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PayrollNav } from '../../payroll-nav';
import { useAuth } from '../../../../context/auth-context';
import { ApiClient } from '../../../../lib/api';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Copy, Code } from 'lucide-react';

export default function NewPayslipTemplatePage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 24px;">
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #0f172a;">{{company.name}}</h1>
    <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">{{company.address}}</p>
    <h2 style="margin: 12px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #334155;">Payslip for {{payroll.period}}</h2>
  </div>

  <table style="width: 100%; font-size: 11px; margin-bottom: 24px; border-collapse: collapse;">
    <tr>
      <td style="padding: 4px 0; color: #64748b; width: 25%;">Employee Name:</td>
      <td style="padding: 4px 0; font-weight: 600; width: 25%;">{{employee.full_name}}</td>
      <td style="padding: 4px 0; color: #64748b; width: 25%;">Employee Code:</td>
      <td style="padding: 4px 0; font-weight: 600; width: 25%;">{{employee.employee_code}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #64748b;">Designation:</td>
      <td style="padding: 4px 0; font-weight: 600;">{{employee.designation}}</td>
      <td style="padding: 4px 0; color: #64748b;">Department:</td>
      <td style="padding: 4px 0; font-weight: 600;">{{employee.department}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #64748b;">Bank Account:</td>
      <td style="padding: 4px 0; font-weight: 600;">{{employee.bank_account_masked}}</td>
      <td style="padding: 4px 0; color: #64748b;">Disbursement Date:</td>
      <td style="padding: 4px 0; font-weight: 600;">{{payroll.pay_date}}</td>
    </tr>
  </table>

  <div style="display: flex; gap: 20px; margin-bottom: 24px;">
    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
      <div style="background: #f8fafc; padding: 8px 12px; font-size: 11px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Earnings</div>
      <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
        {{payroll.earnings_table}}
        <tr style="border-top: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">
          <td style="padding: 8px 12px;">Gross Earnings</td>
          <td style="padding: 8px 12px; text-align: right;">{{payroll.gross_earnings}}</td>
        </tr>
      </table>
    </div>

    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
      <div style="background: #f8fafc; padding: 8px 12px; font-size: 11px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Deductions</div>
      <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
        {{payroll.deductions_table}}
        <tr style="border-top: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">
          <td style="padding: 8px 12px;">Total Deductions</td>
          <td style="padding: 8px 12px; text-align: right; color: #dc2626;">{{payroll.total_deductions}}</td>
        </tr>
      </table>
    </div>
  </div>

  <div style="background: #0f172a; color: white; padding: 14px 18px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
    <div>
      <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase;">Net Payable Amount</div>
      <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">{{payroll.net_pay_in_words}}</div>
    </div>
    <div style="font-size: 18px; font-weight: bold;">{{payroll.net_pay}}</div>
  </div>

  <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
    This is a computer-generated payslip and does not require a physical signature.
  </div>
</div>`;

  const [htmlContent, setHtmlContent] = useState(defaultHtml);

  const mergeTags = [
    { label: 'Company Name', tag: '{{company.name}}' },
    { label: 'Company Address', tag: '{{company.address}}' },
    { label: 'Employee Name', tag: '{{employee.full_name}}' },
    { label: 'Employee Code', tag: '{{employee.employee_code}}' },
    { label: 'Designation', tag: '{{employee.designation}}' },
    { label: 'Department', tag: '{{employee.department}}' },
    { label: 'Masked Bank Acct', tag: '{{employee.bank_account_masked}}' },
    { label: 'Pay Period', tag: '{{payroll.period}}' },
    { label: 'Pay Date', tag: '{{payroll.pay_date}}' },
    { label: 'Earnings Table', tag: '{{payroll.earnings_table}}' },
    { label: 'Gross Earnings', tag: '{{payroll.gross_earnings}}' },
    { label: 'Deductions Table', tag: '{{payroll.deductions_table}}' },
    { label: 'Total Deductions', tag: '{{payroll.total_deductions}}' },
    { label: 'Net Pay', tag: '{{payroll.net_pay}}' },
    { label: 'Net Pay in Words', tag: '{{payroll.net_pay_in_words}}' },
  ];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await ApiClient.post('/payroll/payslip-templates', {
        name: name.trim(),
        description: description.trim() || undefined,
        htmlContent,
        isDefault,
      });

      router.push('/payroll/payslip-templates');
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/payroll/payslip-templates"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Templates</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Payslip Template
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author brand-compliant HTML statements with dynamic employee and payroll merge tags.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Corporate Payslip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Official branded salary voucher layout"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    HTML Layout Code *
                  </label>
                  <span className="text-[11px] text-slate-400">Inline CSS supported</span>
                </div>
                <textarea
                  required
                  rows={18}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium">Set as default payslip template</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <Link
                href="/payroll/payslip-templates"
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

          {/* Merge Tags Reference Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Available Merge Tags
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any tag below to copy it to your clipboard:
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-[500px] overflow-y-auto">
                {mergeTags.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.tag);
                      alert(`Copied ${item.tag} to clipboard`);
                    }}
                    className="w-full text-left p-2 rounded-lg border border-slate-100 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
