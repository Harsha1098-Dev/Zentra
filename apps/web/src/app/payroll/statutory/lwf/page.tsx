'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import {
  Building,
  Plus,
  Trash2,
  Edit2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';
import { DeductionFrequency } from '@zentra/shared-types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function LwfManagerPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    state: '',
    stateCode: '',
    employeeContribution: 12,
    employerContribution: 36,
    deductionFrequency: DeductionFrequency.HALF_YEARLY,
    deductionMonths: [6, 12],
    isActive: true,
  });

  // Report state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRules = async () => {
    try {
      const data = await ApiClient.request('/payroll/statutory/lwf');
      setRules(data || []);
    } catch (err: any) {
      console.error('Failed to load LWF rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request('/payroll/statutory/lwf', {
        method: 'POST',
        body: JSON.stringify({
          state: newRuleData.state,
          stateCode: newRuleData.stateCode.toUpperCase(),
          employeeContribution: Number(newRuleData.employeeContribution),
          employerContribution: Number(newRuleData.employerContribution),
          deductionFrequency: newRuleData.deductionFrequency,
          deductionMonths: newRuleData.deductionMonths,
          isActive: newRuleData.isActive,
        }),
      });
      setShowRuleModal(false);
      setNewRuleData({
        state: '',
        stateCode: '',
        employeeContribution: 12,
        employerContribution: 36,
        deductionFrequency: DeductionFrequency.HALF_YEARLY,
        deductionMonths: [6, 12],
        isActive: true,
      });
      setFeedback({ type: 'success', message: 'LWF rule created successfully!' });
      await loadRules();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create LWF rule' });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this LWF rule?')) return;
    try {
      await ApiClient.request(`/payroll/statutory/lwf/${ruleId}`, {
        method: 'DELETE',
      });
      setFeedback({ type: 'success', message: 'LWF rule deleted successfully' });
      await loadRules();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete LWF rule' });
    }
  };

  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const data = await ApiClient.request(`/payroll/statutory/lwf/report?month=${month}&year=${year}`);
      setReportRows(data || []);
    } catch (err: any) {
      console.error('Failed to load LWF report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const exportCsv = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/payroll/statutory/lwf/report/export?month=${month}&year=${year}`;
    window.open(url, '_blank');
  };

  const toggleMonth = (m: number) => {
    setNewRuleData((prev) => {
      const exists = prev.deductionMonths.includes(m);
      return {
        ...prev,
        deductionMonths: exists
          ? prev.deductionMonths.filter((x) => x !== m)
          : [...prev.deductionMonths, m].sort((a, b) => a - b),
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Labour Welfare Fund (LWF)</h1>
          <p className="text-sm text-slate-500">
            Configure state-specific Labour Welfare Fund rules, employee/employer contribution schedules, and monthly registers.
          </p>
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules List & Config */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">State LWF Rules</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Defined rules for state statutory labor welfare funds and deduction schedules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add State Rule</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading LWF rules...</div>
              ) : rules.length === 0 ? (
                <div className="p-12 text-center">
                  <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm font-medium">No LWF rules defined yet.</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Click &apos;Add State Rule&apos; to configure LWF contributions for your states of operation (e.g., Maharashtra, Karnataka).
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-6 py-3">State</th>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Employee Contrib.</th>
                        <th className="px-6 py-3">Employer Contrib.</th>
                        <th className="px-6 py-3">Frequency</th>
                        <th className="px-6 py-3">Deduction Months</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{rule.state}</td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-700">{rule.stateCode}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">₹{Number(rule.employeeContribution).toFixed(2)}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">₹{Number(rule.employerContribution).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {rule.deductionFrequency}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {((rule.deductionMonths as number[]) || []).map((m) => (
                                <span
                                  key={m}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]"
                                >
                                  {MONTH_NAMES[m - 1]?.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                rule.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Monthly LWF Register Report */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Monthly LWF Contribution Register</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate the state-wise employee & employer LWF register for payroll periods.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
                  >
                    {[year - 1, year, year + 1].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={loadReport}
                    disabled={loadingReport}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{loadingReport ? 'Generating...' : 'View Register'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                {reportRows.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Select a month and click &quot;View Register&quot; to review employee &amp; employer LWF deductions.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="px-4 py-3">Employee Code</th>
                          <th className="px-4 py-3">Employee Name</th>
                          <th className="px-4 py-3">State</th>
                          <th className="px-4 py-3 text-right">Employee LWF</th>
                          <th className="px-4 py-3 text-right">Employer LWF</th>
                          <th className="px-4 py-3 text-right">Total Contrib.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-medium text-slate-900">{row.employeeCode}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{row.employeeName}</td>
                            <td className="px-4 py-3 text-slate-600">{row.state || 'N/A'}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">₹{Number(row.employeeLwf || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">₹{Number(row.employerLwf || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-blue-600">
                              ₹{(Number(row.employeeLwf || 0) + Number(row.employerLwf || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Add State LWF Rule</h3>
              <p className="text-xs text-slate-500 mt-1">Define LWF rates and schedule for a state.</p>
            </div>
            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra"
                  value={newRuleData.state}
                  onChange={(e) => setNewRuleData({ ...newRuleData, state: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH"
                  maxLength={10}
                  value={newRuleData.stateCode}
                  onChange={(e) => setNewRuleData({ ...newRuleData, stateCode: e.target.value.toUpperCase() })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Employee Contrib. (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={newRuleData.employeeContribution}
                    onChange={(e) => setNewRuleData({ ...newRuleData, employeeContribution: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Employer Contrib. (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={newRuleData.employerContribution}
                    onChange={(e) => setNewRuleData({ ...newRuleData, employerContribution: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deduction Frequency</label>
                <select
                  value={newRuleData.deductionFrequency}
                  onChange={(e) => setNewRuleData({ ...newRuleData, deductionFrequency: e.target.value as DeductionFrequency })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                >
                  <option value={DeductionFrequency.MONTHLY}>Monthly</option>
                  <option value={DeductionFrequency.HALF_YEARLY}>Half Yearly</option>
                  <option value={DeductionFrequency.YEARLY}>Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Deduction Months</label>
                <div className="grid grid-cols-4 gap-2">
                  {MONTH_NAMES.map((name, i) => {
                    const monthNum = i + 1;
                    const selected = newRuleData.deductionMonths.includes(monthNum);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleMonth(monthNum)}
                        className={`text-[11px] py-1.5 rounded-md font-medium border transition-colors ${
                          selected
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newRuleData.isActive}
                  onChange={(e) => setNewRuleData({ ...newRuleData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="isActive" className="text-xs text-slate-700">Rule is Active</label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
