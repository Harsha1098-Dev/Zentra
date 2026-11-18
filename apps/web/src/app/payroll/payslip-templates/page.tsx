'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import {
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PermissionCode } from '@zentra/shared-types';

export default function PayslipTemplatesPage() {
  const { permissions, roles, activeOrganization } = useAuth();

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const canManage =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_TEMPLATE_CREATE);

  async function loadTemplates() {
    try {
      setLoading(true);
      const data = await ApiClient.get('/payroll/payslip-templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load payslip templates', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadTemplates();
    }
  }, [activeOrganization]);

  async function openPreview(tpl: any) {
    try {
      setPreviewName(tpl.name);
      const res = await ApiClient.get(`/payroll/payslip-templates/${tpl.id}/preview`);
      setPreviewHtml(res.previewHtml);
    } catch (err: any) {
      alert(err.message || 'Failed to generate preview');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payslip Templates
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Design and preview brand-compliant payslip layouts for PDF and HTML employee statements.
            </p>
          </div>

          {canManage && (
            <Link
              href="/payroll/payslip-templates/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Template</span>
            </Link>
          )}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-400">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900">No payslip templates</h4>
              <p className="text-xs text-slate-500 mt-1">
                Create a customized HTML/CSS payslip design with merge tags.
              </p>
            </div>
          ) : (
            templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      v{tpl.version || 1}.0
                    </span>
                    {tpl.isDefault && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Default Template</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">{tpl.name}</h3>
                  {tpl.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openPreview(tpl)}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    {new Date(tpl.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Preview Modal */}
        {previewHtml && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Preview: {previewName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Rendered with sample employee compensation figures
                  </p>
                </div>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <div
                  className="border border-slate-200 rounded-lg p-6 shadow-xs max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
