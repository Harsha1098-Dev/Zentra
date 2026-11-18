'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll/payroll-nav';
import { MyTaxNav } from '../my-tax-nav';
import { ApiClient } from '../../../lib/api';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { TaxRegime } from '@zentra/shared-types';

export default function MyTaxProfilePage() {
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [profile, setProfile] = useState<any | null>(null);
  const [taxSummary, setTaxSummary] = useState<any | null>(null);
  const [selectedRegime, setSelectedRegime] = useState<TaxRegime>(TaxRegime.NEW_REGIME);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [profData, sumData] = await Promise.all([
        ApiClient.request('/me/tax-profile').catch(() => null),
        ApiClient.request(`/me/tax-summary?financialYear=${financialYear}`).catch(() => null),
      ]);
      setProfile(profData);
      setTaxSummary(sumData);
      if (profData?.selectedRegime) {
        setSelectedRegime(profData.selectedRegime);
      } else if (sumData?.selectedRegime) {
        setSelectedRegime(sumData.selectedRegime);
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [financialYear]);

  const handleSaveRegime = async () => {
    setUpdating(true);
    setFeedback(null);
    try {
      await ApiClient.request('/me/tax-regime', {
        method: 'PUT',
        body: JSON.stringify({
          selectedRegime,
          financialYear,
        }),
      });
      setFeedback({
        type: 'success',
        message: `Tax regime successfully switched to ${selectedRegime === TaxRegime.NEW_REGIME ? 'New Regime (Section 115BAC)' : 'Old Regime'}!`,
      });
      await loadProfile();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update tax regime' });
    } finally {
      setUpdating(false);
    }
  };

  const comparison = taxSummary?.regimeComparison;

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Profile &amp; Regime Selector</h1>
            <p className="text-sm text-slate-500">
              Manage your corporate PAN verification status, PF/ESI numbers, and choose between New vs Old tax regimes.
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

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            Loading your statutory profile...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Statutory Identifiers Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">Government Identifiers &amp; Eligibility</h2>
              <p className="text-xs text-slate-500 mb-4">
                Statutory registration numbers mapped to your employee record by HR.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    PAN (Permanent Account No.)
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-1">
                    {profile?.panNumber || taxSummary?.employee?.panNumber || 'Not Provided'}
                  </div>
                  <div className="mt-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {profile?.panVerificationStatus || 'VERIFIED'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    EPFO UAN (Universal Account No.)
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-1">
                    {profile?.uanNumber || taxSummary?.employee?.uanNumber || 'Not Linked'}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">
                    PF Eligible: {profile?.isPfEligible !== false ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    ESIC IP Number
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-1">
                    {profile?.esiNumber || taxSummary?.employee?.esiNumber || 'Not Applicable'}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">
                    ESI Eligible: {profile?.isEsiEligible !== false ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Professional Tax (PT)
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {profile?.isPtEligible !== false ? 'Applicable' : 'Exempt'}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">State-specific slabs</div>
                </div>
              </div>
            </div>

            {/* Regime Selector & Side-by-Side Comparison */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Choose Tax Regime for FY {financialYear}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your preferred regime below. Your monthly TDS deductions will be calculated accordingly.
                  </p>
                </div>

                {comparison && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>
                      Recommended:{' '}
                      <strong>
                        {comparison.recommendedRegime === TaxRegime.NEW_REGIME ? 'New Regime' : 'Old Regime'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option 1: New Regime */}
                  <div
                    onClick={() => setSelectedRegime(TaxRegime.NEW_REGIME)}
                    className={`cursor-pointer rounded-2xl p-6 border-2 transition-all relative ${
                      selectedRegime === TaxRegime.NEW_REGIME
                        ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="regime"
                          checked={selectedRegime === TaxRegime.NEW_REGIME}
                          onChange={() => setSelectedRegime(TaxRegime.NEW_REGIME)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <h3 className="text-sm font-bold text-slate-900">New Tax Regime (Section 115BAC)</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Default
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      Concessional lower tax rates with zero investment proof requirements. Standard deduction of ₹75,000
                      and full tax rebate under Section 87A up to ₹7,00,000 taxable income.
                    </p>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Standard Deduction:</span>
                        <span className="font-mono font-semibold text-slate-900">₹75,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Section 87A Rebate:</span>
                        <span className="font-mono text-emerald-600">Up to ₹25,000 (Income $\le$ 7L)</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Investment Proofs Needed:</span>
                        <span className="font-semibold text-slate-900">None</span>
                      </div>
                      {comparison && (
                        <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-slate-900">
                          <span>Simulated Annual Tax:</span>
                          <span className="font-mono text-blue-600">
                            ₹{comparison.newRegime.totalAnnualTaxLiability.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option 2: Old Regime */}
                  <div
                    onClick={() => setSelectedRegime(TaxRegime.OLD_REGIME)}
                    className={`cursor-pointer rounded-2xl p-6 border-2 transition-all relative ${
                      selectedRegime === TaxRegime.OLD_REGIME
                        ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="regime"
                          checked={selectedRegime === TaxRegime.OLD_REGIME}
                          onChange={() => setSelectedRegime(TaxRegime.OLD_REGIME)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <h3 className="text-sm font-bold text-slate-900">Old Tax Regime (With Deductions)</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Exemptions
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      Higher standard tax rates, but allows claims for Chapter VI-A deductions (80C, 80D, 80CCD), Home
                      Loan interest (Section 24), and House Rent Allowance (HRA).
                    </p>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Standard Deduction:</span>
                        <span className="font-mono font-semibold text-slate-900">₹50,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Section 80C Exemption:</span>
                        <span className="font-mono text-emerald-600">Up to ₹1,50,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Section 80D + Sec 24 + HRA:</span>
                        <span className="font-semibold text-slate-900">Allowed with proofs</span>
                      </div>
                      {comparison && (
                        <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-slate-900">
                          <span>Simulated Annual Tax:</span>
                          <span className="font-mono text-blue-600">
                            ₹{comparison.oldRegime.totalAnnualTaxLiability.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={handleSaveRegime}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                    <span>{updating ? 'Saving Selection...' : 'Save & Confirm Regime'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
