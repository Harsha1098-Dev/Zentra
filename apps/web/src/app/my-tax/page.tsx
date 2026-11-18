'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../payroll/payroll-nav';
import { MyTaxNav } from './my-tax-nav';
import { ApiClient } from '../../lib/api';
import {
  Calculator,
  ShieldCheck,
  Sparkles,
  FileText,
  UploadCloud,
  FileCheck2,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { TaxRegime } from '@zentra/shared-types';

export default function MyTaxOverviewPage() {
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [taxSummary, setTaxSummary] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [sumRes, profRes] = await Promise.all([
          ApiClient.request(`/me/tax-summary?financialYear=${financialYear}`).catch(() => null),
          ApiClient.request('/me/tax-profile').catch(() => null),
        ]);
        setTaxSummary(sumRes);
        setProfile(profRes);
      } catch (err: any) {
        console.error('Failed to load my tax data:', err);
        setError(err.message || 'Failed to load tax information');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [financialYear]);

  const activeCalc = taxSummary?.activeCalculation;
  const comparison = taxSummary?.regimeComparison;

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Income Tax &amp; TDS Portal</h1>
            <p className="text-sm text-slate-500">
              Manage your tax regime, submit investment declarations &amp; proofs, track TDS deductions, and download Form 16.
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
            Loading your income tax details...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Regime & Key Information Banner */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">Current Tax Regime:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {taxSummary?.selectedRegime === TaxRegime.NEW_REGIME
                        ? 'New Regime (Section 115BAC)'
                        : 'Old Regime (Exemptions & Deductions)'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>
                      PAN:{' '}
                      <strong className="text-slate-700 font-mono">
                        {profile?.panNumber || taxSummary?.employee?.panNumber || 'Not Provided'}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Status:{' '}
                      <span className="text-emerald-700 font-medium">
                        {profile?.panVerificationStatus || 'Verified'}
                      </span>
                    </span>
                    <span>&bull;</span>
                    <span>Financial Year: {financialYear}</span>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  href="/my-tax/profile"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Compare &amp; Switch Regime</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Top KPI Cards */}
            {activeCalc && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Projected Gross Income
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                    ₹{activeCalc.grossAnnualSalary.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Based on active compensation</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Net Taxable Income
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                    ₹{activeCalc.netTaxableIncome.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Std. Ded: ₹{activeCalc.standardDeduction.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Estimated Annual Tax
                  </div>
                  <div className="text-xl font-bold text-rose-600 mt-1 font-mono">
                    ₹{activeCalc.totalAnnualTaxLiability.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Includes 4% Health &amp; Education Cess</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Monthly TDS (To Deduct)
                  </div>
                  <div className="text-xl font-bold text-blue-600 mt-1 font-mono">
                    ₹{activeCalc.monthlyTds.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Divided across {activeCalc.remainingMonths} remaining month(s)
                  </div>
                </div>
              </div>
            )}

            {/* Smart Regime Recommendation Banner */}
            {comparison && (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <h3 className="text-base font-bold">Tax Regime Recommendation</h3>
                    </div>
                    <p className="text-xs text-slate-200">
                      Based on your current salary and submitted declarations, the{' '}
                      <strong className="text-amber-300 font-bold">
                        {comparison.recommendedRegime === TaxRegime.NEW_REGIME
                          ? 'New Tax Regime (Section 115BAC)'
                          : 'Old Tax Regime'}
                      </strong>{' '}
                      results in the lowest total income tax liability.
                    </p>
                    {comparison.taxDifference !== 0 && (
                      <p className="text-xs text-emerald-300 font-medium">
                        Potential Annual Tax Savings: ₹{Math.abs(comparison.taxDifference).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <div>
                    <Link
                      href="/my-tax/profile"
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>Review &amp; Switch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Quick Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/my-tax/declarations"
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Investment Declarations</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Declare tax-saving investments under 80C, 80D, 80CCD, Section 24, and HRA to optimize your tax liability.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-blue-600">
                  <span>Manage Declarations</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>

              <Link
                href="/my-tax/proofs"
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Investment Proofs</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload supporting premium receipts, mutual fund statements, and rent agreements for verification.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-purple-600">
                  <span>Upload &amp; Track Proofs</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>

              <Link
                href="/my-tax/form16"
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Form 16 Certificates</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Download official Part A &amp; Part B annual tax deduction certificates issued by the employer for ITR filing.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-emerald-600">
                  <span>Download Form 16</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
