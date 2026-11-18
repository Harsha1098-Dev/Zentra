'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll/payroll-nav';
import { MyTaxNav } from '../my-tax-nav';
import { ApiClient } from '../../../lib/api';
import {
  UploadCloud,
  FileCheck2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { ProofVerificationStatus } from '@zentra/shared-types';

export default function MyInvestmentProofsPage() {
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [proofs, setProofs] = useState<any[]>([]);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New proof form
  const [formData, setFormData] = useState({
    declarationId: '',
    documentName: '',
    documentUrl: '',
    amountDeclared: 0,
    amountSubmitted: 0,
    remarks: '',
  });

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [proofsRes, declRes] = await Promise.all([
        ApiClient.request('/me/investment-proofs'),
        ApiClient.request(`/me/investment-declarations?financialYear=${financialYear}`),
      ]);
      setProofs(proofsRes || []);
      setDeclarations(declRes || []);
      if (declRes && declRes.length > 0 && !formData.declarationId) {
        setFormData((prev) => ({
          ...prev,
          declarationId: declRes[0].id,
          amountDeclared: Number(declRes[0].declaredAmount || 0),
          amountSubmitted: Number(declRes[0].declaredAmount || 0),
        }));
      }
    } catch (err: any) {
      console.error('Failed to load proofs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [financialYear]);

  const handleDeclarationSelect = (declId: string) => {
    const selected = declarations.find((d) => d.id === declId);
    setFormData((prev) => ({
      ...prev,
      declarationId: declId,
      amountDeclared: selected ? Number(selected.declaredAmount) : 0,
      amountSubmitted: selected ? Number(selected.declaredAmount) : 0,
    }));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await ApiClient.request('/me/investment-proofs', {
        method: 'POST',
        body: JSON.stringify({
          declarationId: formData.declarationId,
          documentName: formData.documentName,
          documentUrl: formData.documentUrl || 'https://zentra-hrms.storage/proofs/sample-receipt.pdf',
          amountDeclared: Number(formData.amountDeclared),
          amountSubmitted: Number(formData.amountSubmitted),
          remarks: formData.remarks || null,
        }),
      });

      setShowUploadModal(false);
      setFormData({
        declarationId: declarations[0]?.id || '',
        documentName: '',
        documentUrl: '',
        amountDeclared: declarations[0]?.declaredAmount || 0,
        amountSubmitted: declarations[0]?.declaredAmount || 0,
        remarks: '',
      });
      setFeedback({ type: 'success', message: 'Proof submitted for HR verification!' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit proof' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investment Proofs &amp; Verification</h1>
            <p className="text-sm text-slate-500">
              Upload actual payment receipts, insurance certificates, and rent agreements to verify your tax deductions.
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

        {/* Upload Action Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upload Investment Evidence</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved proof amounts will update your final Form 16 and protect you from high TDS deductions in Q4.
            </p>
          </div>
          <div>
            <button
              type="button"
              disabled={declarations.length === 0}
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload New Proof</span>
            </button>
          </div>
        </div>

        {/* Proofs List Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Submitted Proof Documents</h3>
            <span className="text-xs text-slate-500 font-medium">Total: {proofs.length}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading uploaded proofs...</div>
          ) : proofs.length === 0 ? (
            <div className="p-12 text-center">
              <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm font-medium">No investment proofs uploaded yet.</p>
              <p className="text-slate-400 text-xs mt-1">
                Attach receipts or policy statements for your tax declarations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Declaration Category</th>
                    <th className="px-4 py-3 text-right">Claimed (₹)</th>
                    <th className="px-4 py-3 text-right">Verified (₹)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proofs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.documentName}</div>
                        {p.remarks && <div className="text-[11px] text-slate-400">{p.remarks}</div>}
                        {p.rejectionRemarks && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                            Rejection Note: {p.rejectionRemarks}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {p.declaration?.subCategory || p.declaration?.declarationType || 'Investment Item'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        ₹{Number(p.amountSubmitted || p.amountDeclared).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                        ₹{Number(p.amountVerified || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.verificationStatus === ProofVerificationStatus.VERIFIED
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.verificationStatus === ProofVerificationStatus.REJECTED
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.documentUrl ? (
                          <a
                            href={p.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-medium"
                          >
                            <span>View Proof</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Upload Proof Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Upload Investment Proof</h3>
              <p className="text-xs text-slate-500 mt-1">
                Attach proof document and specify claimed receipt amount.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Investment Declaration Item
                </label>
                <select
                  required
                  value={formData.declarationId}
                  onChange={(e) => handleDeclarationSelect(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
                >
                  {declarations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.declarationType} - {d.subCategory} (Declared: ₹{Number(d.declaredAmount).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LIC_Premium_Receipt_2025.pdf"
                  value={formData.documentName}
                  onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document URL / File Link</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... or cloud storage URL"
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave empty to use sample receipt URL.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount on Receipt (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formData.amountSubmitted || ''}
                  onChange={(e) => setFormData({ ...formData, amountSubmitted: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes for HR review..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Submit Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
