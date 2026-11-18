'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  MessageSquare,
  UserCheck,
  Clock,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { ApprovalFlowDto, ApprovalStepStatus } from '@zentra/shared-types';

export default function ApprovalsPendingPage() {
  const { user } = useAuth();
  const [flows, setFlows] = useState<ApprovalFlowDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlowDto | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | 'request_changes' | 'delegate' | 'reassign' | 'escalate'>('approve');
  const [comments, setComments] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.request<{ data: ApprovalFlowDto[]; total: number }>(
        '/approvals/pending'
      );
      setFlows(res.data || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      console.error('Failed to load pending approvals', err);
    } finally {
      setLoading(false);
    }
  };

  const openDecisionModal = (
    flow: ApprovalFlowDto,
    dec: 'approve' | 'reject' | 'request_changes' | 'delegate' | 'reassign' | 'escalate'
  ) => {
    setSelectedFlow(flow);
    setDecision(dec);
    setComments('');
    setTargetUserId('');
    setModalOpen(true);
  };

  const handleDecisionSubmit = async () => {
    if (!selectedFlow) return;

    try {
      setSubmitting(true);
      const payload: any = { decision, comments };
      if (decision === 'delegate') payload.delegateToUserId = targetUserId;
      if (decision === 'reassign') payload.reassignToUserId = targetUserId;

      await ApiClient.request(`/approvals/${selectedFlow.id}/decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setModalOpen(false);
      fetchPendingApprovals();
    } catch (err: any) {
      alert(`Decision failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-[#0F172A]">Approval Inbox</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {totalCount} Pending
                </span>
              </div>
              <p className="text-xs text-[#475569]">
                Requests waiting for your review, decision, delegation, or escalation.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] space-x-6 text-sm font-medium">
          <Link
            href="/approvals/pending"
            className="pb-3 border-b-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold flex items-center space-x-2"
          >
            <Inbox className="w-4 h-4" />
            <span>Pending Approvals ({totalCount})</span>
          </Link>
          <Link
            href="/approvals/history"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>Approval History</span>
          </Link>
          <Link
            href="/approvals/delegations"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Delegation Manager</span>
          </Link>
        </div>

        {/* Pending Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#64748B]">Loading pending requests...</div>
          ) : flows.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-16 text-center shadow-sm space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-semibold text-[#0F172A]">All caught up!</h3>
              <p className="text-xs text-[#64748B]">You have no approval requests waiting for action.</p>
            </div>
          ) : (
            flows.map((flow) => {
              const currentStep = flow.steps?.find((s) => s.status === 'pending') || flow.steps?.[0];
              const changes = (flow.metadata as any)?.requestedChanges;

              return (
                <div
                  key={flow.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-50 text-[#1E3A8A] border border-blue-200">
                          {flow.requestType.replace('_', ' ')}
                        </span>
                        <h3 className="text-sm font-bold text-[#0F172A]">
                          Requested by {flow.requesterName || flow.requesterEmail || 'Employee'}
                        </h3>
                      </div>
                      <span className="text-xs text-[#64748B] block mt-0.5">
                        Target Entity: {flow.entityType} #{flow.entityId} • Initiated:{' '}
                        {new Date(flow.initiatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                        Step: {currentStep?.stepName || 'Pending Review'}
                      </span>
                    </div>
                  </div>

                  {/* Changes preview if profile_change */}
                  {changes && (
                    <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-3 text-xs space-y-1 font-mono">
                      <span className="font-sans font-semibold text-slate-700 block text-[11px]">
                        Proposed Changes:
                      </span>
                      <pre className="text-[11px] text-slate-800 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(changes, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-[#64748B]">
                      {currentStep?.dueDate ? (
                        <span>Due by: {new Date(currentStep.dueDate).toLocaleDateString()}</span>
                      ) : (
                        <span>Standard SLA applies</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDecisionModal(flow, 'request_changes')}
                        className="px-3 py-1.5 border border-[#CBD5E1] text-[#0F172A] hover:bg-slate-50 text-xs font-semibold rounded-lg"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => openDecisionModal(flow, 'delegate')}
                        className="px-3 py-1.5 border border-[#CBD5E1] text-[#0F172A] hover:bg-slate-50 text-xs font-semibold rounded-lg"
                      >
                        Delegate
                      </button>
                      <button
                        onClick={() => openDecisionModal(flow, 'reject')}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => openDecisionModal(flow, 'approve')}
                        className="px-4 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Decision Review Modal */}
      {modalOpen && selectedFlow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] uppercase">
                Confirm Decision: {decision.replace('_', ' ')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Request for {selectedFlow.requestType} from {selectedFlow.requesterName || selectedFlow.requestedBy}.
            </p>

            {(decision === 'delegate' || decision === 'reassign') && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">
                  {decision === 'delegate' ? 'Delegate to User ID *' : 'Reassign to User ID *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Colleague User ID (UUID)"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                Comments {decision === 'reject' || decision === 'request_changes' ? '*' : '(Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder="Reason or feedback for requester..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={submitting || ((decision === 'delegate' || decision === 'reassign') && !targetUserId)}
                onClick={handleDecisionSubmit}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm ${
                  decision === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#1E3A8A] hover:bg-[#1D4ED8]'
                }`}
              >
                {submitting ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
