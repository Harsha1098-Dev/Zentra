'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import {
  Calculator,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  RefreshCw,
} from 'lucide-react';
import { TaxRegime } from '@zentra/shared-types';

export default function TdsWorkbenchPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [updatingRegime, setUpdatingRegime] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Load employees
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await ApiClient.request('/employees');
        const list = Array.isArray(res) ? res : res?.data || [];
        setEmployees(list);
        if (list.length > 0) {
          setSelectedEmployeeId(list[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, []);

  // Load summary for selected employee
  useEffect(() => {
    if (!selectedEmployeeId) return;

    async function loadSummary() {
      setLoadingSummary(true);
      setFeedback(null);
      try {
        const data = await ApiClient.request(
          `/employees/${selectedEmployeeId}/tax-summary?financialYear=${financialYear}`,
        );
        setSummaryData(data);
      } catch (err: any) {
        console.error('Failed to load tax summary:', err);
        setFeedback({ type: 'error', message: err.message || 'Failed to load tax summary' });
      } finally {
        setLoadingSummary(false);
      }
    }

    loadSummary();
  }, [selectedEmployeeId, financialYear]);

  const handleSwitchRegime = async (newRegime: TaxRegime) => {
    if (!selectedEmployeeId) return;
    setUpdatingRegime(true);
    setFeedback(null);
    try {
      await ApiClient.request(`/employees/${selectedEmployeeId}/tax-regime`, {
        method: 'PUT',
        body: JSON.stringify({
          selectedRegime: newRegime,
          financialYear,
        }),
      });
      setFeedback({ type: 'success', message: `Tax regime updated to ${newRegime}` });
      // Refresh summary
      const updated = await ApiClient.request(
        `/employees/${selectedEmployeeId}/tax-summary?financialYear=${financialYear}`,
      );
      setSummaryData(updated);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to switch regime' });
    } finally {
      setUpdatingRegime(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const full = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeCode || ''} ${emp.workEmail || ''}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const activeCalc = summaryData?.activeCalculation;
  const comparison = summaryData?.regimeComparison;

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">TDS Computation &amp; Regime Workbench</h1>
          <p className="text-sm text-slate-500">
            Automated Section 192 TDS computation engine, New vs Old regime side-by-side comparison, and remaining tax breakdown.
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Employee Selector */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col h-[750px]">
            <div className="pb-3 border-b border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Employee
              </label>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search code, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-medium">Financial Year:</span>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 font-medium text-slate-700"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2">
              {loadingEmployees ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading employees...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No employees found</div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = emp.id === selectedEmployeeId;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold uppercase">
                        {(emp.firstName?.[0] || 'E') + (emp.lastName?.[0] || '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs truncate">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{emp.employeeCode}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed Computation & Comparison */}
          <div className="lg:col-span-3 space-y-6">
            {loadingSummary ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                Calculating TDS and comparing regimes...
              </div>
            ) : !summaryData ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Select an employee from the left panel to inspect TDS computation and regime comparison.
              </div>
            ) : (
              <>
                {/* Employee Header Banner */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base">
                      {summaryData.employee.firstName?.[0]}
                      {summaryData.employee.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {summaryData.employee.firstName} {summaryData.employee.lastName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {summaryData.employee.employeeCode}
                        </span>
                        <span>•</span>
                        <span>PAN: {summaryData.employee.panNumber || 'Not Provided'}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">FY {summaryData.financialYear}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Selected Regime</div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 mt-0.5">
                        {summaryData.selectedRegime === TaxRegime.NEW_REGIME
                          ? 'New Regime (Sec 115BAC)'
                          : 'Old Regime (Exemptions)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={updatingRegime}
                      onClick={() =>
                        handleSwitchRegime(
                          summaryData.selectedRegime === TaxRegime.NEW_REGIME
                            ? TaxRegime.OLD_REGIME
                            : TaxRegime.NEW_REGIME,
                        )
                      }
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      {updatingRegime ? 'Switching...' : 'Switch Regime'}
                    </button>
                  </div>
                </div>

                {/* Regime Comparison Box */}
                {comparison && (
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <h3 className="text-base font-semibold">Tax Regime Comparison &amp; Recommendation</h3>
                      </div>
                      <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-medium backdrop-blur-xs">
                        Recommended:{' '}
                        <strong className="text-amber-300 font-bold">
                          {comparison.recommendedRegime === TaxRegime.NEW_REGIME ? 'New Regime' : 'Old Regime'}
                        </strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* New Regime Card */}
                      <div
                        className={`p-4 rounded-xl border ${
                          summaryData.selectedRegime === TaxRegime.NEW_REGIME
                            ? 'bg-white/15 border-blue-300/40 ring-1 ring-blue-300/40'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2">
                          <span>New Regime (Section 115BAC)</span>
                          {comparison.recommendedRegime === TaxRegime.NEW_REGIME && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              Lowest Tax
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Standard Deduction:</span>
                            <span className="font-mono">₹75,000</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Taxable Income:</span>
                            <span className="font-mono">
                              ₹{comparison.newRegime.netTaxableIncome.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Section 87A Rebate:</span>
                            <span className="font-mono">
                              ₹{comparison.newRegime.section87ARebate.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm text-white">
                            <span>Total Annual Tax:</span>
                            <span className="font-mono text-emerald-300">
                              ₹{comparison.newRegime.totalAnnualTaxLiability.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-300 pt-1">
                            <span>Monthly TDS:</span>
                            <span className="font-mono">
                              ₹{comparison.newRegime.monthlyTds.toLocaleString('en-IN')} / mo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Old Regime Card */}
                      <div
                        className={`p-4 rounded-xl border ${
                          summaryData.selectedRegime === TaxRegime.OLD_REGIME
                            ? 'bg-white/15 border-blue-300/40 ring-1 ring-blue-300/40'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2">
                          <span>Old Regime (With Exemptions)</span>
                          {comparison.recommendedRegime === TaxRegime.OLD_REGIME && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              Lowest Tax
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Standard Deduction:</span>
                            <span className="font-mono">₹50,000</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Deductions &amp; Exemptions:</span>
                            <span className="font-mono">
                              ₹
                              {(
                                comparison.oldRegime.chapter6ADeductions +
                                comparison.oldRegime.homeLoanInterestDeduction +
                                comparison.oldRegime.hraExemption
                              ).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Taxable Income:</span>
                            <span className="font-mono">
                              ₹{comparison.oldRegime.netTaxableIncome.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm text-white">
                            <span>Total Annual Tax:</span>
                            <span className="font-mono text-emerald-300">
                              ₹{comparison.oldRegime.totalAnnualTaxLiability.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-300 pt-1">
                            <span>Monthly TDS:</span>
                            <span className="font-mono">
                              ₹{comparison.oldRegime.monthlyTds.toLocaleString('en-IN')} / mo
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {comparison.taxDifference !== 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-200 flex items-center justify-between">
                        <span>
                          Choosing <strong>{comparison.recommendedRegime}</strong> saves approximately{' '}
                          <span className="text-amber-300 font-bold">
                            ₹{Math.abs(comparison.taxDifference).toLocaleString('en-IN')}
                          </span>{' '}
                          per year.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Summary KPI Cards */}
                {activeCalc && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Gross Annual Salary
                      </div>
                      <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                        ₹{activeCalc.grossAnnualSalary.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Net Taxable Income
                      </div>
                      <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                        ₹{activeCalc.netTaxableIncome.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Total Annual Tax (Inc. Cess)
                      </div>
                      <div className="text-xl font-bold text-rose-600 mt-1 font-mono">
                        ₹{activeCalc.totalAnnualTaxLiability.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Monthly TDS (To Deduct)
                      </div>
                      <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
                        ₹{activeCalc.monthlyTds.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Over {activeCalc.remainingMonths} remaining month(s)
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Tax Computation Breakdown */}
                {activeCalc && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Step-by-Step Computation Statement</h3>
                      <span className="text-xs text-slate-500">
                        Regime: <strong>{summaryData.selectedRegime}</strong>
                      </span>
                    </div>

                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="px-6 py-3 font-medium">1. Gross Salary Income (Annual Projected)</td>
                          <td className="px-6 py-3 text-right font-mono font-semibold text-slate-900">
                            ₹{activeCalc.grossAnnualSalary.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                            Less: Standard Deduction (Section 16(ia))
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-rose-600">
                            - ₹{activeCalc.standardDeduction.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                            Less: Professional Tax (Section 16(iii))
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-rose-600">
                            - ₹{activeCalc.professionalTaxDeduction.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        {summaryData.selectedRegime === TaxRegime.OLD_REGIME && (
                          <>
                            <tr>
                              <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                                Less: House Rent Allowance (HRA) Exemption (Section 10(13A))
                              </td>
                              <td className="px-6 py-3 text-right font-mono text-rose-600">
                                - ₹{activeCalc.hraExemption.toLocaleString('en-IN')}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                                Less: Home Loan Interest (Section 24(b))
                              </td>
                              <td className="px-6 py-3 text-right font-mono text-rose-600">
                                - ₹{activeCalc.homeLoanInterestDeduction.toLocaleString('en-IN')}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                                Less: Chapter VI-A Deductions (80C, 80D, 80CCD, etc.)
                              </td>
                              <td className="px-6 py-3 text-right font-mono text-rose-600">
                                - ₹{activeCalc.chapter6ADeductions.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </>
                        )}
                        <tr className="bg-slate-50 font-bold">
                          <td className="px-6 py-3 text-slate-900">2. Net Taxable Income</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-900 text-sm">
                            ₹{activeCalc.netTaxableIncome.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 font-medium">3. Tax Computed at Applicable Slabs</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-900">
                            ₹{activeCalc.annualTaxBeforeRebate.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                            Less: Rebate under Section 87A
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-emerald-600">
                            - ₹{activeCalc.section87ARebate.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                            Add: Health &amp; Education Cess @ 4%
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-slate-900">
                            + ₹{activeCalc.cess.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr className="bg-blue-50/50 font-bold">
                          <td className="px-6 py-3 text-blue-950">4. Total Annual Tax Liability</td>
                          <td className="px-6 py-3 text-right font-mono text-blue-900 text-sm">
                            ₹{activeCalc.totalAnnualTaxLiability.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                            Less: Tax Already Deducted (YTD)
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-emerald-600">
                            - ₹{activeCalc.taxPaidYtd.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                          <td className="px-6 py-3 text-slate-900">5. Remaining Tax to Deduct</td>
                          <td className="px-6 py-3 text-right font-mono text-rose-600 text-sm">
                            ₹{activeCalc.remainingTaxLiability.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr className="bg-emerald-50/60 font-bold">
                          <td className="px-6 py-3 text-emerald-950">
                            6. Monthly TDS (Remaining ÷ {activeCalc.remainingMonths} month(s))
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-emerald-800 text-base">
                            ₹{activeCalc.monthlyTds.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
