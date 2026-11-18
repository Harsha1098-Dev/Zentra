'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import {
  FileCheck2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { Form16Status, TaxRegime } from '@zentra/shared-types';

export default function Form16AdminPage() {
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [assessmentYear, setAssessmentYear] = useState('2026-2027');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.request(`/payroll/form16?financialYear=${financialYear}`);
      setRecords(data || []);
    } catch (err: any) {
      console.error('Failed to load Form 16 records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [financialYear]);

  const handlePrepare = async () => {
    setPreparing(true);
    setFeedback(null);
    try {
      const res = await ApiClient.request('/payroll/form16/prepare', {
        method: 'POST',
        body: JSON.stringify({
          financialYear,
          assessmentYear,
        }),
      });
      setFeedback({
        type: 'success',
        message: `Prepared ${res.recordsCount || 0} Form 16 certificates for FY ${financialYear}`,
      });
      await loadRecords();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to prepare Form 16' });
    } finally {
      setPreparing(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish Form 16 certificates? Employees will be able to download them.')) {
      return;
    }
    setPublishing(true);
    setFeedback(null);
    try {
      const res = await ApiClient.request('/payroll/form16/publish', {
        method: 'POST',
        body: JSON.stringify({
          financialYear,
        }),
      });
      setFeedback({
        type: 'success',
        message: `Published ${res.publishedCount || 0} Form 16 certificates to Employee Portal!`,
      });
      await loadRecords();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish Form 16' });
    } finally {
      setPublishing(false);
    }
  };

  const filtered = records.filter((r) => {
    const full = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''} ${r.employee?.employeeCode || ''} ${r.employee?.panNumber || ''}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Form 16 Certificate Management</h1>
            <p className="text-sm text-slate-500">
              Prepare Part A &amp; Part B certificates, review annual taxable incomes and TDS deposited, and publish for employee download.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-600">FY:</span>
              <select
                value={financialYear}
                onChange={(e) => {
                  setFinancialYear(e.target.value);
                  const start = parseInt(e.target.value.split('-')[0], 10);
                  setAssessmentYear(`${start + 1}-${start + 2}`);
                }}
                className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-xs"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-600">AY:</span>
              <span className="text-xs font-mono font-medium px-2 py-1 bg-slate-100 rounded border border-slate-200">
                {assessmentYear}
              </span>
            </div>
          </div>
        </div>

        <StatutoryNav />

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

        {/* Action Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Annual Form 16 Preparation Pipeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step 1: Compute annual gross, exemptions &amp; quarterly TDS &bull; Step 2: Review records &bull; Step 3: Publish to ESS.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={preparing}
              onClick={handlePrepare}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${preparing ? 'animate-spin' : ''}`} />
              <span>{preparing ? 'Compiling Form 16...' : 'Prepare Form 16'}</span>
            </button>
            <button
              type="button"
              disabled={publishing || records.length === 0}
              onClick={handlePublish}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publishing...' : 'Publish to ESS'}</span>
            </button>
          </div>
        </div>

        {/* Records Table Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee or PAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filtered.length} of {records.length} records
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading Form 16 records...</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm font-medium">No Form 16 records generated for FY {financialYear}.</p>
              <p className="text-slate-400 text-xs mt-1">
                Click &apos;Prepare Form 16&apos; above to compile annual statements for all active employees.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Regime</th>
                    <th className="px-4 py-3 text-right">Gross Salary (₹)</th>
                    <th className="px-4 py-3 text-right">Taxable Income (₹)</th>
                    <th className="px-4 py-3 text-right">TDS Deducted (₹)</th>
                    <th className="px-4 py-3 text-right">TDS Deposited (₹)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.employee?.employeeCode} &bull; PAN: {r.employee?.panNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {r.selectedRegime}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        ₹{Number(r.grossSalary).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        ₹{Number(r.totalTaxableIncome).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600">
                        ₹{Number(r.totalTdsDeducted).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                        ₹{Number(r.totalTdsDeposited).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === Form16Status.PUBLISHED
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Form 16 Certificate &bull; FY {selectedRecord.financialYear} (AY {selectedRecord.assessmentYear})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedRecord.employee?.firstName} {selectedRecord.employee?.lastName} ({selectedRecord.employee?.employeeCode})
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedRecord.status === Form16Status.PUBLISHED
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {selectedRecord.status}
              </span>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
                  Part A: Tax Deducted &amp; Deposited
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-500">Employee PAN:</span>{' '}
                    <span className="font-mono font-semibold">{selectedRecord.employee?.panNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Selected Tax Regime:</span>{' '}
                    <span className="font-semibold">{selectedRecord.selectedRegime}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Tax Deducted:</span>{' '}
                    <span className="font-mono font-semibold text-blue-600">
                      ₹{Number(selectedRecord.totalTdsDeducted).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Tax Deposited:</span>{' '}
                    <span className="font-mono font-semibold text-emerald-600">
                      ₹{Number(selectedRecord.totalTdsDeposited).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
                  Part B: Income &amp; Deductions Breakdown
                </h4>
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between py-2 text-slate-700">
                    <span>1. Gross Salary (Annual)</span>
                    <span className="font-mono font-semibold">
                      ₹{Number(selectedRecord.grossSalary).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Less: Standard Deduction</span>
                    <span className="font-mono text-rose-600">
                      - ₹{Number(selectedRecord.standardDeduction).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Less: Professional Tax</span>
                    <span className="font-mono text-rose-600">
                      - ₹{Number(selectedRecord.professionalTax).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Less: Section 10 Exemptions (HRA)</span>
                    <span className="font-mono text-rose-600">
                      - ₹{Number(selectedRecord.exemptionsUs10).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Less: Chapter VI-A Deductions (80C, 80D, etc.)</span>
                    <span className="font-mono text-rose-600">
                      - ₹{Number(selectedRecord.totalDeductionsChapterVIA).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                    <span>2. Total Taxable Income</span>
                    <span className="font-mono">
                      ₹{Number(selectedRecord.totalTaxableIncome).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-700">
                    <span>3. Gross Tax on Income</span>
                    <span className="font-mono">
                      ₹{Number(selectedRecord.totalTaxPayable).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Less: Section 87A Rebate</span>
                    <span className="font-mono text-emerald-600">
                      - ₹{Number(selectedRecord.section87ARebate).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Add: Health &amp; Education Cess (4%)</span>
                    <span className="font-mono">
                      + ₹{Number(selectedRecord.cess).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-blue-900 bg-blue-50/50 px-2 rounded">
                    <span>4. Net Tax Payable</span>
                    <span className="font-mono">
                      ₹{Number(selectedRecord.netTaxPayable).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
