'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll/payroll-nav';
import { MyTaxNav } from '../my-tax-nav';
import { ApiClient } from '../../../lib/api';
import {
  FileCheck2,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  Calendar,
} from 'lucide-react';
import { Form16Status } from '@zentra/shared-types';

export default function MyForm16Page() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await ApiClient.request('/me/form16');
      setRecords(data || []);
    } catch (err: any) {
      console.error('Failed to load Form 16 certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDownloadCertificate = async (recordId: string) => {
    setDownloadingId(recordId);
    setFeedback(null);
    try {
      const cert = await ApiClient.request(`/me/form16/${recordId}/download`);
      setSelectedCertificate(cert);

      // Create downloadable JSON certificate file
      const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Form16_${cert.financialYear}_${cert.employee.code}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: `Form 16 Certificate downloaded for FY ${cert.financialYear}`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to download certificate' });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Form 16 Tax Deduction Certificates</h1>
          <p className="text-sm text-slate-500">
            Official employer certificates under Section 203 of the Income Tax Act, 1961 for filing your annual Income Tax Return (ITR).
          </p>
        </div>

        <MyTaxNav />

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Certificate Cards */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Loading your Form 16 certificates...
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 text-sm font-semibold">No Form 16 published yet</p>
            <p className="text-slate-400 text-xs mt-1">
              Form 16 certificates are issued annually by HR/Payroll upon completion of the financial year and Q4 TDS filing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {records.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Form 16 &bull; FY {r.financialYear}
                        </h3>
                        <div className="text-xs text-slate-500">Assessment Year {r.assessmentYear}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {r.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs border border-slate-200/60 mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Selected Tax Regime:</span>
                      <span className="font-semibold text-slate-900">{r.selectedRegime}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Salary (Annual):</span>
                      <span className="font-mono font-medium text-slate-900">
                        ₹{Number(r.grossSalary).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Taxable Income:</span>
                      <span className="font-mono font-medium text-slate-900">
                        ₹{Number(r.totalTaxableIncome).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total TDS Deducted:</span>
                      <span className="font-mono font-bold text-blue-600">
                        ₹{Number(r.totalTdsDeducted).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total TDS Deposited to Govt:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        ₹{Number(r.totalTdsDeposited).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Includes Part A (Challan and TAN deduction particulars) and Part B (salary breakup, Chapter VI-A
                    exemptions, and tax computation).
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Issued: {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : 'Active'}
                  </div>
                  <button
                    type="button"
                    disabled={downloadingId === r.id}
                    onClick={() => handleDownloadCertificate(r.id)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === r.id ? 'Downloading...' : 'Download Certificate'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
