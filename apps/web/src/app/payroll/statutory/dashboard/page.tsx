'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Clock,
  Landmark,
  HeartPulse,
  Scale,
  Building,
  Calculator,
  FileCheck2,
  Users,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function StatutoryComplianceDashboardPage() {
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.request(`/payroll/compliance/dashboard?financialYear=${financialYear}`);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load compliance dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [financialYear]);

  const mc = data?.monthlyContributions;
  const totalMonthlyLiability = mc
    ? Number(
        (
          mc.totalPfEmployee +
          mc.totalPfEmployer +
          mc.totalEsiEmployee +
          mc.totalEsiEmployer +
          mc.totalPt +
          mc.totalLwf +
          mc.totalTds
        ).toFixed(2),
      )
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Statutory Compliance Dashboard</h1>
            <p className="text-sm text-slate-500">
              India Statutory Remittances, PAN Compliance, Regime Adoption, and Filing Deadlines.
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

        <StatutoryNav />

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            Loading compliance dashboard...
          </div>
        ) : !data ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            Failed to load dashboard data.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Missing PAN Banner */}
            {data.panStatusSummary?.missingPanCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">
                    Action Required: {data.panStatusSummary.missingPanCount} employee(s) do not have a PAN registered.
                  </span>
                  <p className="mt-0.5 text-amber-800">
                    Under Section 206AA of the Income Tax Act, employees without a valid PAN are subject to TDS at a
                    higher rate of 20% regardless of income slab. Request them to provide their PAN in their Tax Profile.
                  </p>
                </div>
              </div>
            )}

            {/* Top KPI Cards: Monthly Remittance Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total PF (EPF+EPS)</div>
                <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  ₹{mc ? (mc.totalPfEmployee + mc.totalPfEmployer).toLocaleString('en-IN') : 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Emp: ₹{mc?.totalPfEmployee.toLocaleString('en-IN')} | Empr: ₹{mc?.totalPfEmployer.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total ESI</div>
                <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  ₹{mc ? (mc.totalEsiEmployee + mc.totalEsiEmployer).toLocaleString('en-IN') : 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Emp: ₹{mc?.totalEsiEmployee.toLocaleString('en-IN')} | Empr: ₹{mc?.totalEsiEmployer.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prof. Tax (PT)</div>
                <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  ₹{mc?.totalPt.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">State-wise deducted</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Labour Welfare Fund</div>
                <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  ₹{mc?.totalLwf.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cycle remittance</div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">TDS (Sec 192)</div>
                <div className="text-lg font-bold text-blue-600 mt-1 font-mono">
                  ₹{mc?.totalTds.toLocaleString('en-IN') || 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">To remit via Challan 281</div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Grand Remittance
                </div>
                <div className="text-lg font-bold text-white mt-1 font-mono">
                  ₹{totalMonthlyLiability.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">Month {mc?.month}/{mc?.year}</div>
              </div>
            </div>

            {/* Middle Section: Regimes & Compliance Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Regime Adoption */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Tax Regime Adoption</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {data.activeEmployeesCount} Active Staff
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium text-slate-700">
                      <span>New Regime (Sec 115BAC)</span>
                      <span>
                        {data.regimeSelectionSummary.newRegimeCount} (
                        {data.activeEmployeesCount > 0
                          ? Math.round(
                              (data.regimeSelectionSummary.newRegimeCount / data.activeEmployeesCount) * 100,
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            data.activeEmployeesCount > 0
                              ? (data.regimeSelectionSummary.newRegimeCount / data.activeEmployeesCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium text-slate-700">
                      <span>Old Regime (Exemptions)</span>
                      <span>
                        {data.regimeSelectionSummary.oldRegimeCount} (
                        {data.activeEmployeesCount > 0
                          ? Math.round(
                              (data.regimeSelectionSummary.oldRegimeCount / data.activeEmployeesCount) * 100,
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${
                            data.activeEmployeesCount > 0
                              ? (data.regimeSelectionSummary.oldRegimeCount / data.activeEmployeesCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium text-slate-700">
                      <span>Pending Selection (Defaulted)</span>
                      <span>{data.regimeSelectionSummary.pendingCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-slate-300 h-2 rounded-full"
                        style={{
                          width: `${
                            data.activeEmployeesCount > 0
                              ? (data.regimeSelectionSummary.pendingCount / data.activeEmployeesCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAN Status Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">PAN Compliance Status</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="text-xl font-bold text-emerald-700 font-mono">
                      {data.panStatusSummary.verifiedCount}
                    </div>
                    <div className="text-[11px] font-medium text-emerald-800 mt-0.5">Verified PANs</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-xl font-bold text-slate-700 font-mono">
                      {data.panStatusSummary.unverifiedCount}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 mt-0.5">Unverified PANs</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="text-xl font-bold text-amber-700 font-mono">
                      {data.panStatusSummary.missingPanCount}
                    </div>
                    <div className="text-[11px] font-medium text-amber-800 mt-0.5">Missing PANs</div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <div className="text-xl font-bold text-rose-700 font-mono">
                      {data.panStatusSummary.failedCount}
                    </div>
                    <div className="text-[11px] font-medium text-rose-800 mt-0.5">Invalid Format</div>
                  </div>
                </div>
              </div>

              {/* Declarations & Proofs Review Pipeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Declaration &amp; Proof Pipeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="text-xs font-semibold text-blue-900">Submitted Declarations</div>
                    <div className="text-sm font-bold text-blue-700 font-mono">
                      {data.declarationsSummary.totalSubmitted}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                    <div className="text-xs font-semibold text-amber-900">Proofs Awaiting Verification</div>
                    <div className="text-sm font-bold text-amber-700 font-mono">
                      {data.proofsSummary.pendingVerification}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div className="text-xs font-semibold text-emerald-900">Verified Proofs</div>
                    <div className="text-sm font-bold text-emerald-700 font-mono">
                      {data.proofsSummary.verified}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Compliance Deadlines Schedule */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Statutory Compliance Calendar &amp; Deadlines</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical monthly and quarterly government filing due dates.
                  </p>
                </div>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                  On-Track
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {data.upcomingDeadlines.map((item: any, i: number) => (
                  <div key={i} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 font-mono">{item.dueDate}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{item.statutoryType}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
