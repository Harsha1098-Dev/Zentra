'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../../payroll/payroll-nav';
import { MyTaxNav } from '../my-tax-nav';
import { ApiClient } from '../../../lib/api';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Send,
  HelpCircle,
  Building,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { DeclarationType, DeclarationStatus } from '@zentra/shared-types';

const SUB_CATEGORIES: Record<DeclarationType, string[]> = {
  [DeclarationType.SECTION_80C]: [
    'Public Provident Fund (PPF)',
    'Employee Provident Fund (EPF/VPF)',
    'Equity Linked Savings Scheme (ELSS)',
    'Life Insurance Premium (LIC)',
    'National Savings Certificate (NSC)',
    '5-Year Tax Saving Bank FD',
    'Children Tuition Fees',
    'Sukanya Samriddhi Yojana (SSY)',
    'Principal Repayment on Home Loan',
  ],
  [DeclarationType.SECTION_80D]: [
    'Health Insurance - Self, Spouse, Children (Max ₹25,000)',
    'Health Insurance - Parents (Max ₹25,000)',
    'Health Insurance - Senior Citizen Parents (Max ₹50,000)',
    'Preventive Health Checkup (Max ₹5,000)',
  ],
  [DeclarationType.SECTION_80CCD_1B]: [
    'National Pension System (NPS) - Employee Additional (Max ₹50,000)',
    'Atal Pension Yojana (APY)',
  ],
  [DeclarationType.SECTION_24_HOME_LOAN]: [
    'Interest on Housing Loan - Self Occupied Property (Max ₹2,00,000)',
    'Interest on Housing Loan - Let Out Property',
  ],
  [DeclarationType.HRA]: [
    'House Rent Paid (Monthly Metro/Non-Metro)',
  ],
  [DeclarationType.OTHER_EXEMPTION]: [
    'Section 80E - Interest on Higher Education Loan',
    'Section 80G - Donations to Charitable Institutions',
    'Section 80TTA/80TTB - Savings Account Interest',
  ],
};

export default function MyInvestmentDeclarationsPage() {
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Declaration Form state
  const [formData, setFormData] = useState({
    declarationType: DeclarationType.SECTION_80C,
    subCategory: SUB_CATEGORIES[DeclarationType.SECTION_80C][0],
    declaredAmount: 0,
    particulars: '',
    landlordName: '',
    landlordPan: '',
    landlordAddress: '',
  });

  const loadDeclarations = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await ApiClient.request(
        `/me/investment-declarations?financialYear=${financialYear}`,
      );
      setDeclarations(data || []);
    } catch (err: any) {
      console.error('Failed to load declarations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeclarations();
  }, [financialYear]);

  const handleTypeChange = (type: DeclarationType) => {
    setFormData((prev) => ({
      ...prev,
      declarationType: type,
      subCategory: SUB_CATEGORIES[type][0] || 'Other',
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await ApiClient.request('/me/investment-declarations', {
        method: 'POST',
        body: JSON.stringify({
          financialYear,
          declarationType: formData.declarationType,
          subCategory: formData.subCategory,
          declaredAmount: Number(formData.declaredAmount),
          particulars: formData.particulars || null,
          landlordName: formData.declarationType === DeclarationType.HRA ? formData.landlordName || null : null,
          landlordPan: formData.declarationType === DeclarationType.HRA ? formData.landlordPan || null : null,
          landlordAddress: formData.declarationType === DeclarationType.HRA ? formData.landlordAddress || null : null,
        }),
      });

      setShowAddModal(false);
      setFormData({
        declarationType: DeclarationType.SECTION_80C,
        subCategory: SUB_CATEGORIES[DeclarationType.SECTION_80C][0],
        declaredAmount: 0,
        particulars: '',
        landlordName: '',
        landlordPan: '',
        landlordAddress: '',
      });
      setFeedback({ type: 'success', message: 'Investment declaration saved as draft!' });
      await loadDeclarations();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save declaration' });
    }
  };

  const handleSubmitAll = async () => {
    if (!confirm('Submit all declarations for HR verification and TDS recalculation?')) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await ApiClient.request('/me/investment-declarations/submit', {
        method: 'POST',
        body: JSON.stringify({ financialYear }),
      });
      setFeedback({
        type: 'success',
        message: `Successfully submitted ${res.submittedCount || declarations.length} declarations for approval!`,
      });
      await loadDeclarations();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit declarations' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalDeclared = declarations.reduce((sum, d) => sum + Number(d.declaredAmount || 0), 0);
  const totalApproved = declarations.reduce((sum, d) => sum + Number(d.approvedAmount || 0), 0);
  const hasDrafts = declarations.some((d) => d.status === DeclarationStatus.DRAFT);

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investment Declarations (IT Declarations)</h1>
            <p className="text-sm text-slate-500">
              Declare tax-saving investments for FY {financialYear} under Old Tax Regime to lower your monthly TDS.
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

        {/* Top Summary & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Declared</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ₹{totalDeclared.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 mt-1">{declarations.length} items declared</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Approved</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
              ₹{totalApproved.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 mt-1">Reflected in active TDS calculation</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Submission Status</div>
              <div className="mt-1">
                {hasDrafts ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Drafts Pending Submission
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    All Submitted
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>

              <button
                type="button"
                disabled={submitting || !hasDrafts}
                onClick={handleSubmitAll}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Submit All'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Declarations Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Declared Tax Exemptions &amp; Deductions</h3>
            <span className="text-xs text-slate-500 font-medium">FY {financialYear}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading declarations...</div>
          ) : declarations.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm font-medium">No tax declarations submitted yet.</p>
              <p className="text-slate-400 text-xs mt-1">
                Click &apos;Add Item&apos; above to declare Section 80C, 80D, NPS, Home Loan, or HRA exemptions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Category / Instrument</th>
                    <th className="px-4 py-3 text-right">Declared Amount (₹)</th>
                    <th className="px-4 py-3 text-right">Approved Amount (₹)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Proofs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {declarations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {d.declarationType.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{d.subCategory}</div>
                        {d.particulars && <div className="text-[11px] text-slate-400">{d.particulars}</div>}
                        {d.landlordPan && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Landlord: {d.landlordName} (PAN: {d.landlordPan})
                          </div>
                        )}
                        {d.rejectionReason && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                            Reason: {d.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        ₹{Number(d.declaredAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                        ₹{Number(d.approvedAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === DeclarationStatus.APPROVED
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.status === DeclarationStatus.REJECTED
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : d.status === DeclarationStatus.SUBMITTED
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/my-tax/proofs"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-semibold"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{d.proofs?.length || 0} proof(s)</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Declaration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Investment Declaration</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your projected investment or exemption claim for FY {financialYear}.
              </p>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section / Type</label>
                <select
                  value={formData.declarationType}
                  onChange={(e) => handleTypeChange(e.target.value as DeclarationType)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                >
                  <option value={DeclarationType.SECTION_80C}>Section 80C (PPF, ELSS, EPF, LIC - Max 1.5L)</option>
                  <option value={DeclarationType.SECTION_80D}>Section 80D (Mediclaim / Health Insurance)</option>
                  <option value={DeclarationType.SECTION_80CCD_1B}>Section 80CCD(1B) (NPS Tier 1 - Max 50K)</option>
                  <option value={DeclarationType.SECTION_24_HOME_LOAN}>Section 24 (Home Loan Interest - Max 2L)</option>
                  <option value={DeclarationType.HRA}>House Rent Allowance (HRA Rent Paid)</option>
                  <option value={DeclarationType.OTHER_EXEMPTION}>Other Deductions (80E, 80G, etc.)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Sub-Type</label>
                <select
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                >
                  {SUB_CATEGORIES[formData.declarationType]?.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Declared Annual Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formData.declaredAmount || ''}
                  onChange={(e) => setFormData({ ...formData, declaredAmount: Number(e.target.value) })}
                  placeholder="e.g. 50000"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Particulars / Remarks (Optional)</label>
                <input
                  type="text"
                  value={formData.particulars}
                  onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                  placeholder="Policy / Folio / Account Number"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              {formData.declarationType === DeclarationType.HRA && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-900">Landlord Details (Mandatory if Rent &gt; ₹1,00,000)</div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Landlord Name</label>
                    <input
                      type="text"
                      value={formData.landlordName}
                      onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Landlord PAN</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={formData.landlordPan}
                        onChange={(e) => setFormData({ ...formData, landlordPan: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Rented House Address</label>
                      <input
                        type="text"
                        value={formData.landlordAddress}
                        onChange={(e) => setFormData({ ...formData, landlordAddress: e.target.value })}
                        placeholder="Flat No, Street, City"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Declaration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
