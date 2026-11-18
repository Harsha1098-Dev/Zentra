'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

export default function AdminGeneratedPayslipsPage() {
  const { activeOrganization } = useAuth();

  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewNumber, setPreviewNumber] = useState<string>('');

  async function loadPayslips() {
    try {
      setLoading(true);
      const data = await ApiClient.get('/payroll/payslips');
      setPayslips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load payslips', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadPayslips();
    }
  }, [activeOrganization]);

  async function handleDownload(id: string) {
    try {
      const res = await ApiClient.get(`/payroll/payslips/${id}/download`);
      const blob = new Blob([res.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  }

  async function handlePreview(id: string, num: string) {
    try {
      setPreviewNumber(num);
      const res = await ApiClient.get(`/payroll/payslips/${id}/download`);
      setPreviewHtml(res.html);
    } catch (err: any) {
      alert(err.message || 'Preview failed');
    }
  }

  const filtered = payslips.filter((p) => {
    const q = searchTerm.toLowerCase();
    const name = `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.toLowerCase();
    const num = (p.payslipNumber || '').toLowerCase();
    const code = (p.employee?.employeeCode || '').toLowerCase();
    return name.includes(q) || num.includes(q) || code.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Payslips Archive
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, preview, and download all generated and published employee payslips across cycles.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by employee name or payslip #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} payslips recorded
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading payslips...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900">No payslips found</h4>
              <p className="text-xs text-slate-500 mt-1">
                Payslips appear here after generating them in an approved and paid payroll run.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Payslip #</th>
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-6">Pay Period</th>
                    <th className="py-3 px-6">Gross Pay</th>
                    <th className="py-3 px-6">Deductions</th>
                    <th className="py-3 px-6">Net Pay</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-900">
                        {p.payslipNumber}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        {p.employee?.firstName} {p.employee?.lastName}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {p.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">{p.periodName}</td>
                      <td className="py-3.5 px-6 text-slate-700">
                        ₹ {Number(p.grossEarnings).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 text-rose-600 font-medium">
                        ₹ {Number(p.totalDeductions).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        ₹ {Number(p.netPay).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        <button
                          onClick={() => handlePreview(p.id, p.payslipNumber)}
                          className="inline-flex items-center space-x-1 text-slate-700 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownload(p.id)}
                          className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Preview Payslip */}
        {previewHtml && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">
                  Payslip: {previewNumber}
                </h3>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="text-slate-400 hover:text-slate-600 font-semibold text-sm"
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
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
