'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import { HeartPulse, Save, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EsiSettingsAndReportPage() {
  const [config, setConfig] = useState({
    esiEnabled: true,
    employeeContributionRate: 0.75,
    employerContributionRate: 3.25,
    wageCeiling: 21000,
    disabilityWageCeiling: 25000,
  });

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [esiRows, setEsiRows] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await ApiClient.request('/payroll/statutory/esi');
        if (data) setConfig(data);
      } catch (err: any) {
        console.error('Failed to load ESI config:', err);
      }
    }
    loadConfig();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
    }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await ApiClient.request('/payroll/statutory/esi', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setFeedback({ type: 'success', message: 'ESI configuration updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update ESI config' });
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const data = await ApiClient.request(`/payroll/statutory/esi/report?month=${month}&year=${year}`);
      setEsiRows(data || []);
    } catch (err: any) {
      console.error('Failed to load ESI report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const exportEsiCsv = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/payroll/statutory/esi/report/export?month=${month}&year=${year}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee State Insurance (ESI)</h1>
              <p className="text-sm text-gray-500">Wage threshold ceilings, 0.75% employee & 3.25% employer remittance registers</p>
            </div>
          </div>
        </div>

        <StatutoryNav />

        {feedback && (
          <div className={`p-4 rounded-xl mb-6 flex items-center space-x-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ESI Settings Column */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">ESI Settings</h2>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Employee Share (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="employeeContributionRate"
                  value={config.employeeContributionRate}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Statutory standard: 0.75%</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Employer Share (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="employerContributionRate"
                  value={config.employerContributionRate}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Statutory standard: 3.25%</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Eligibility Wage Ceiling (₹)</label>
                <input
                  type="number"
                  name="wageCeiling"
                  value={config.wageCeiling}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">ESIC statutory wage ceiling: ₹21,000 / month</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Disability Wage Ceiling (₹)</label>
                <input
                  type="number"
                  name="disabilityWageCeiling"
                  value={config.disabilityWageCeiling}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Employees with disability threshold: ₹25,000</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating...' : 'Save ESI Settings'}</span>
              </button>
            </form>
          </div>

          {/* ESI Monthly Register Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Monthly ESI Contribution Register</h2>
                  <p className="text-sm text-gray-500">ESIC Form 5 monthly employee and employer contribution statement</p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1).toLocaleString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <button
                    onClick={loadReport}
                    disabled={loadingReport}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    {loadingReport ? 'Loading...' : 'Generate View'}
                  </button>
                  <button
                    onClick={exportEsiCsv}
                    className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {esiRows.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="font-medium">No ESI records found for selected period</p>
                  <p className="text-xs text-gray-400 mt-1">Employees with gross wages $\le$ ₹21,000 will be listed here after payroll calculation</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">IP Number</th>
                        <th className="py-2.5 px-3">IP Name</th>
                        <th className="py-2.5 px-3">Worked Days</th>
                        <th className="py-2.5 px-3">Monthly Wages</th>
                        <th className="py-2.5 px-3">EE (0.75%)</th>
                        <th className="py-2.5 px-3">ER (3.25%)</th>
                        <th className="py-2.5 px-3">Total Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {esiRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/40">
                          <td className="py-2.5 px-3 font-mono font-medium text-gray-800">{r.ipNumber}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-900">{r.ipName}</td>
                          <td className="py-2.5 px-3">{r.noOfDaysWorked}</td>
                          <td className="py-2.5 px-3 font-medium">₹{r.totalMonthlyWages.toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-semibold text-blue-700">₹{r.employeeContribution.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-emerald-700">₹{r.employerContribution.toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">₹{r.totalContribution.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
