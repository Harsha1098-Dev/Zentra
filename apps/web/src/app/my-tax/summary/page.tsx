'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll/payroll-nav';
import { MyTaxNav } from '../my-tax-nav';
import { ApiClient } from '../../../lib/api';
import {
  Calculator,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { TaxRegime } from '@zentra/shared-types';

export default function MyTaxSummaryPage() {
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await ApiClient.request(`/me/tax-summary?financialYear=${financialYear}`);
        setData(res);
      } catch (err: any) {
        console.error('Failed to load tax summary:', err);
        setError(err.message || 'Failed to load tax computation details');
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [financialYear]);

  const activeCalc = data?.activeCalculation;
  const pastRecords = data?.pastMonthlyTds || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly TDS Computation Statement</h1>
            <p className="text-sm text-slate-500">
              Detailed step-by-step income tax calculation, applicable slab rates, and monthly TDS deduction schedule.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Financial Year:</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-white shadow-xs"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
        </div>

        <MyTaxNav />

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            Calculating income tax computation statement...
          </div>
        ) : !data || !activeCalc ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            No tax computation data available for FY {financialYear}.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Annual Income</div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  ₹{activeCalc.grossAnnualSalary.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Projected CTC/Wages</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Taxable Income</div>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  ₹{activeCalc.netTaxableIncome.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">After deductions</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Annual Tax</div>
                <div className="text-xl font-bold text-rose-600 mt-1 font-mono">
                  ₹{activeCalc.totalAnnualTaxLiability.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Includes 4% cess</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monthly TDS Deduction</div>
                <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
                  ₹{activeCalc.monthlyTds.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Over {activeCalc.remainingMonths} remaining month(s)</div>
              </div>
            </div>

            {/* Detailed Step-by-Step Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Annual Tax Computation Statement</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calculated under{' '}
                    <strong>
                      {data.selectedRegime === TaxRegime.NEW_REGIME
                        ? 'New Tax Regime (Section 115BAC)'
                        : 'Old Tax Regime'}
                    </strong>
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {data.selectedRegime}
                </span>
              </div>

              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-6 py-3 font-medium">1. Gross Salary (Projected Annual)</td>
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
                  {data.selectedRegime === TaxRegime.OLD_REGIME && (
                    <>
                      <tr>
                        <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                          Less: House Rent Allowance (HRA) Exemption
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-rose-600">
                          - ₹{activeCalc.hraExemption.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                          Less: Interest on Housing Loan (Section 24)
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-rose-600">
                          - ₹{activeCalc.homeLoanInterestDeduction.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                          Less: Chapter VI-A Deductions (80C, 80D, 80CCD)
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
                    <td className="px-6 py-3 font-medium">3. Tax Computed at Slabs</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-900">
                      ₹{activeCalc.annualTaxBeforeRebate.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-600 pl-8">
                      Less: Tax Rebate under Section 87A
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
                    <td className="px-6 py-3 text-slate-900">5. Remaining Tax Balance</td>
                    <td className="px-6 py-3 text-right font-mono text-rose-600 text-sm">
                      ₹{activeCalc.remainingTaxLiability.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold">
                    <td className="px-6 py-3 text-emerald-950">
                      6. Monthly TDS (Remaining ÷ {activeCalc.remainingMonths} remaining month(s))
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-emerald-800 text-base">
                      ₹{activeCalc.monthlyTds.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Past Monthly TDS Deductions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Monthly TDS Deduction History</h3>
                <span className="text-xs text-slate-500 font-medium">FY {financialYear}</span>
              </div>

              {pastRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No payroll runs processed yet for this financial year.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Payroll Month</th>
                        <th className="px-4 py-3">Regime</th>
                        <th className="px-4 py-3 text-right">Taxable Salary (₹)</th>
                        <th className="px-4 py-3 text-right">TDS Deducted (₹)</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pastRecords.map((rec: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            Month {rec.month}/{rec.year}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">{rec.selectedRegime}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800">
                            ₹{Number(rec.netTaxableIncome || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                            ₹{Number(rec.monthlyTds || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Deducted
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
