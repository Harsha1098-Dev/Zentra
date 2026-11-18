'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  History,
  Inbox,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { ApprovalFlowDto, ApprovalStatus } from '@zentra/shared-types';

export default function ApprovalsHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ApprovalFlowDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await ApiClient.request<{ data: ApprovalFlowDto[] }>(`/approvals/history?${params.toString()}`);
      setHistory(res.data || []);
    } catch (err: any) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
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
              <h1 className="text-xl font-bold text-[#0F172A]">Approval History</h1>
              <p className="text-xs text-[#475569]">
                Audit log and complete decision trail of past requests.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        <div className="flex border-b border-[#E2E8F0] space-x-6 text-sm font-medium">
          <Link
            href="/approvals/pending"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <Inbox className="w-4 h-4" />
            <span>Pending Approvals</span>
          </Link>
          <Link
            href="/approvals/history"
            className="pb-3 border-b-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold flex items-center space-x-2"
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

        {/* Filter */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center space-x-3">
          <label className="text-xs font-semibold text-[#0F172A]">Filter by Decision Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs bg-white"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>

        {/* History List */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#64748B]">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#64748B]">No historical approvals found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Request Type</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Steps & Decisions</th>
                    <th className="py-3 px-4">Final Outcome</th>
                    <th className="py-3 px-4">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {history.map((flow) => (
                    <tr key={flow.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        {flow.requestType.replace('_', ' ')}
                        <span className="block text-[11px] text-[#64748B] font-normal font-mono">
                          {flow.entityType} #{flow.entityId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {flow.requesterName || flow.requesterEmail || flow.requestedBy}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {flow.steps?.map((s, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5 text-[11px]">
                              {s.status === 'approved' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : s.status === 'rejected' ? (
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span>{s.stepName}:</span>
                              <span className="font-semibold">{s.decision || s.status}</span>
                              {s.comments && <span className="text-[#64748B]">("{s.comments}")</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            flow.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : flow.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {flow.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {flow.completedAt ? new Date(flow.completedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
