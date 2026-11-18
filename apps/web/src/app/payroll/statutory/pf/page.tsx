'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import { Landmark, Save, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PfSettingsAndReportPage() {
  const [config, setConfig] = useState({
    pfEnabled: true,
    epfRateEmployee: 12.0,
    epfRateEmployer: 3.67,
    epsRateEmployer: 8.33,
    edliRate: 0.5,
    adminChargesRate: 0.5,
    wageCeiling: 15000,
    restrictEmployerShareToCeiling: true,
    allowVpf: true,
    proRatePensionBasis: true,
  });

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [ecrRows, setEcrRows] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await ApiClient.request('/payroll/statutory/pf');
        if (data) setConfig(data);
      } catch (err: any) {
        console.error('Failed to load PF config:', err);
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
      await ApiClient.request('/payroll/statutory/pf', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setFeedback({ type: 'success', message: 'PF configuration updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update PF config' });
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const data = await ApiClient.request(`/payroll/statutory/pf/report?month=${month}&year=${year}`);
      setEcrRows(data || []);
    } catch (err: any) {
      console.error('Failed to load ECR report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const exportEcrCsv = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('zentra_access_token') : null;
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/payroll/statutory/pf/report/export?month=${month}&year=${year}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employees Provident Fund (EPF)</h1>
              <p className="text-sm text-gray-500">Contribution rates, ₹15,000 wage ceiling, EPS allocation & ECR returns</p>
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

        {/* Tab / Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: PF Configuration Parameters */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">PF Configuration</h2>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Employee Share (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="epfRateEmployee"
                  value={config.epfRateEmployee}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Statutory standard: 12%</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Employer EPF Share (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="epfRateEmployer"
                  value={config.epfRateEmployer}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Statutory standard: 3.67% (EPF difference)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Employer EPS Pension (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="epsRateEmployer"
                  value={config.epsRateEmployer}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Statutory standard: 8.33%</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">EDLI Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="edliRate"
                  value={config.edliRate}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Statutory standard: 0.5% (Max ₹75)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Admin Charges Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="adminChargesRate"
                  value={config.adminChargesRate}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Statutory standard: 0.5%</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Wage Ceiling (₹)</label>
                <input
                  type="number"
                  name="wageCeiling"
                  value={config.wageCeiling}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">EPFO statutory threshold: ₹15,000</p>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-3">
                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="restrictEmployerShareToCeiling"
                    checked={config.restrictEmployerShareToCeiling}
                    onChange={handleConfigChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Restrict Employer share to ₹15k ceiling</span>
                </label>

                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowVpf"
                    checked={config.allowVpf}
                    onChange={handleConfigChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Allow Voluntary PF (VPF)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating...' : 'Save PF Settings'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Monthly PF ECR Register & Return Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">PF Electronic Challan cum Return (ECR)</h2>
                  <p className="text-sm text-gray-500">Monthly EPFO submission breakdown for filing return</p>
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
                    onClick={exportEcrCsv}
                    className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {ecrRows.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="font-medium">No PF records found for selected period</p>
                  <p className="text-xs text-gray-400 mt-1">Run and calculate payroll for this month to generate ECR register</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">UAN</th>
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Gross Wages</th>
                        <th className="py-2.5 px-3">EPF Wages</th>
                        <th className="py-2.5 px-3">EE Share (12%)</th>
                        <th className="py-2.5 px-3">EPS (8.33%)</th>
                        <th className="py-2.5 px-3">ER EPF (3.67%)</th>
                        <th className="py-2.5 px-3">NCP Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ecrRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/40">
                          <td className="py-2.5 px-3 font-mono font-medium text-gray-800">{r.uan}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-gray-900 block">{r.memberName}</span>
                            <span className="text-gray-400 text-[10px]">{r.memberCode}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium">₹{r.grossWages.toLocaleString()}</td>
                          <td className="py-2.5 px-3">₹{r.epfWages.toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-semibold text-blue-700">₹{r.epfContributionEmployee.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-emerald-700">₹{r.epsContributionEmployer.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-indigo-700">₹{r.epfContributionEmployerDifference.toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-medium">{r.ncpDays}</td>
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
