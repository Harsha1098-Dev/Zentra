'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import {
  CheckSquare,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { DeclarationStatus, ProofVerificationStatus } from '@zentra/shared-types';

export default function DeclarationsAndProofsAdminPage() {
  const [activeTab, setActiveTab] = useState<'declarations' | 'proofs'>('declarations');
  const [financialYear, setFinancialYear] = useState('2025-2026');

  // Declarations state
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loadingDeclarations, setLoadingDeclarations] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<any | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');

  // Proofs state
  const [proofs, setProofs] = useState<any[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any | null>(null);
  const [verifiedProofAmount, setVerifiedProofAmount] = useState<number>(0);
  const [proofRejectionReason, setProofRejectionReason] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDeclarations = async () => {
    setLoadingDeclarations(true);
    try {
      const data = await ApiClient.request(`/payroll/tax-declarations?financialYear=${financialYear}`);
      setDeclarations(data || []);
    } catch (err: any) {
      console.error('Failed to load declarations:', err);
    } finally {
      setLoadingDeclarations(false);
    }
  };

  const loadProofs = async () => {
    setLoadingProofs(true);
    try {
      const data = await ApiClient.request(`/payroll/investment-proofs?financialYear=${financialYear}`);
      setProofs(data || []);
    } catch (err: any) {
      console.error('Failed to load proofs:', err);
    } finally {
      setLoadingProofs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'declarations') {
      loadDeclarations();
    } else {
      loadProofs();
    }
  }, [activeTab, financialYear]);

  const handleReviewDeclaration = async (status: DeclarationStatus) => {
    if (!selectedDeclaration) return;
    try {
      await ApiClient.request(`/payroll/tax-declarations/${selectedDeclaration.id}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          approvedAmount: status === DeclarationStatus.APPROVED ? Number(approvedAmount) : 0,
          rejectionReason: status === DeclarationStatus.REJECTED ? rejectionReason : null,
        }),
      });
      setFeedback({
        type: 'success',
        message: `Declaration ${status.toLowerCase()} successfully`,
      });
      setSelectedDeclaration(null);
      await loadDeclarations();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to review declaration' });
    }
  };

  const handleVerifyProof = async (status: ProofVerificationStatus) => {
    if (!selectedProof) return;
    try {
      await ApiClient.request(`/payroll/investment-proofs/${selectedProof.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({
          verificationStatus: status,
          verifiedAmount: status === ProofVerificationStatus.VERIFIED ? Number(verifiedProofAmount) : 0,
          rejectionReason: status === ProofVerificationStatus.REJECTED ? proofRejectionReason : null,
        }),
      });
      setFeedback({
        type: 'success',
        message: `Proof ${status.toLowerCase()} successfully`,
      });
      setSelectedProof(null);
      await loadProofs();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to verify proof' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investment Declarations &amp; Proofs</h1>
            <p className="text-sm text-slate-500">
              Review and verify employee Section 80C, 80D, 80CCD, Section 24, and HRA tax declarations and proofs.
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

        {/* Tab Toggle */}
        <div className="flex items-center space-x-2 border-b border-slate-200 mb-6 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('declarations')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'declarations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Employee Declarations ({declarations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proofs')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'proofs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Uploaded Proofs ({proofs.length})
          </button>
        </div>

        {/* Tab 1: Declarations Review */}
        {activeTab === 'declarations' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Submitted Declarations</h3>
              <button
                type="button"
                onClick={loadDeclarations}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Refresh List
              </button>
            </div>

            {loadingDeclarations ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading declarations...</div>
            ) : declarations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No declarations found for financial year {financialYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Section / Type</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Declared (₹)</th>
                      <th className="px-4 py-3 text-right">Approved (₹)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {declarations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {d.employee?.firstName} {d.employee?.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.employee?.employeeCode}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{d.declarationType}</td>
                        <td className="px-4 py-3 text-slate-600">{d.category || 'Standard'}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                          ₹{Number(d.amountDeclared).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                          ₹{Number(d.amountApproved).toLocaleString('en-IN')}
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
                                    : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeclaration(d);
                              setApprovedAmount(Number(d.amountApproved || d.amountDeclared));
                              setRejectionReason(d.rejectionReason || '');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Proofs Verification */}
        {activeTab === 'proofs' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Uploaded Investment Proofs</h3>
              <button
                type="button"
                onClick={loadProofs}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Refresh List
              </button>
            </div>

            {loadingProofs ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading proofs...</div>
            ) : proofs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No investment proofs uploaded for financial year {financialYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Document Name</th>
                      <th className="px-4 py-3 text-right">Declared (₹)</th>
                      <th className="px-4 py-3 text-right">Verified (₹)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Attachment</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proofs.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {p.employee?.firstName} {p.employee?.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.employee?.employeeCode}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{p.documentName}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                          ₹{Number(p.amountDeclared).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                          ₹{Number(p.amountVerified).toLocaleString('en-IN')}
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
                              <span>View File</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProof(p);
                              setVerifiedProofAmount(Number(p.amountVerified || p.amountDeclared));
                              setProofRejectionReason(p.rejectionRemarks || '');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Review Declaration Modal */}
      {selectedDeclaration && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Review Tax Declaration</h3>
              <p className="text-xs text-slate-500 mt-1">
                {selectedDeclaration.declarationType} &bull; Declared Amount: ₹
                {Number(selectedDeclaration.amountDeclared).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Approved Exemption Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rejection Remarks (If rejecting)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this declaration is being rejected or reduced..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDeclaration(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewDeclaration(DeclarationStatus.REJECTED)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewDeclaration(DeclarationStatus.APPROVED)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs"
                >
                  Approve Amount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Verify Investment Proof</h3>
              <p className="text-xs text-slate-500 mt-1">
                {selectedProof.documentName} &bull; Claimed Amount: ₹
                {Number(selectedProof.amountDeclared).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Verified Approved Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={verifiedProofAmount}
                  onChange={(e) => setVerifiedProofAmount(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rejection Remarks (If rejecting)
                </label>
                <textarea
                  rows={3}
                  value={proofRejectionReason}
                  onChange={(e) => setProofRejectionReason(e.target.value)}
                  placeholder="Explain why this proof is invalid or rejected..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProof(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyProof(ProofVerificationStatus.REJECTED)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs"
                >
                  Reject Proof
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyProof(ProofVerificationStatus.VERIFIED)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs"
                >
                  Verify &amp; Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
