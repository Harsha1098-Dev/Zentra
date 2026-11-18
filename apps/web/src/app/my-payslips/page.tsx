'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../payroll/payroll-nav';
import { useAuth } from '../../context/auth-context';
import { ApiClient } from '../../lib/api';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function MyPayslipsPage() {
  const { user, activeOrganization } = useAuth();

  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewNumber, setPreviewNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  async function loadMyPayslips() {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.get('/me/payslips');
      setPayslips(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load employee payslips', err);
      setError(err.message || 'Could not load payslips');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadMyPayslips();
    }
  }, [activeOrganization]);

  async function handleDownload(id: string) {
    try {
      const res = await ApiClient.get(`/me/payslips/${id}/download`);
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

  async function handleView(id: string, num: string) {
    try {
      setPreviewNumber(num);
      const res = await ApiClient.get(`/me/payslips/${id}/download`);
      setPreviewHtml(res.html);
    } catch (err: any) {
      alert(err.message || 'Preview failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Payslips
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access, view, and download your monthly salary statements and tax deductions.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payslips Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading your payslips...</div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900">No published payslips yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your monthly payslips will be available here once approved and published by Finance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Pay Period</th>
                    <th className="py-3 px-6">Payslip Number</th>
                    <th className="py-3 px-6">Gross Pay</th>
                    <th className="py-3 px-6">Deductions</th>
                    <th className="py-3 px-6">Net Take-Home</th>
                    <th className="py-3 px-6">Pay Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payslips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {p.periodName}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-600">
                        {p.payslipNumber}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        ₹ {Number(p.grossEarnings).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 text-rose-600 font-medium">
                        ₹ {Number(p.totalDeductions).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        ₹ {Number(p.netPay).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {new Date(p.payDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleView(p.id, p.payslipNumber)}
                          className="inline-flex items-center space-x-1 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownload(p.id)}
                          className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1 rounded border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50"
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

        {/* Modal: View Payslip */}
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
