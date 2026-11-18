'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  X,
  Search,
} from 'lucide-react';
import { LeaveRequestDto, LeaveRequestStatus } from '@zentra/shared-types';

export default function MyLeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestDto | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  async function loadRequests() {
    setIsLoading(true);
    setError(null);
    try {
      let query = '/leave-requests/me?limit=50';
      if (statusFilter !== 'ALL') {
        query += `&status=${statusFilter}`;
      }
      const res = await ApiClient.request<{ data: LeaveRequestDto[] }>(query);
      setRequests(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }

  function openCancelModal(req: LeaveRequestDto) {
    setSelectedRequest(req);
    setCancellationReason('');
    setCancelModalOpen(true);
  }

  async function handleConfirmCancel() {
    if (!selectedRequest) return;
    if (!cancellationReason.trim() || cancellationReason.trim().length < 3) {
      setError('Please provide a reason for cancellation (min 3 characters)');
      return;
    }

    setIsCancelling(true);
    setError(null);
    try {
      await ApiClient.request(`/leave-requests/${selectedRequest.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancellationReason }),
      });

      setCancelModalOpen(false);
      setActionSuccess(
        selectedRequest.status === LeaveRequestStatus.APPROVED
          ? 'Cancellation request submitted for manager approval.'
          : 'Leave request cancelled successfully. Balance released.',
      );
      setTimeout(() => setActionSuccess(null), 4000);
      loadRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel leave request');
    } finally {
      setIsCancelling(false);
    }
  }

  const filteredRequests = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.leaveTypeName?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Leave Applications</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review history, check approval status, and manage or cancel your leave requests.
            </p>
          </div>
          <Link
            href="/leave/apply"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply Leave</span>
          </Link>
        </div>

        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'PENDING_APPROVAL', label: 'Pending' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#1E3A8A] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No leave requests found</p>
              <p className="text-xs text-slate-400">You do not have any requests matching current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Dates</th>
                    <th className="px-5 py-3.5">Days</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Applied On</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.map((req) => {
                    let statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending Approval
                      </span>
                    );
                    if (req.status === 'APPROVED') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approved
                        </span>
                      );
                    } else if (req.status === 'REJECTED') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected
                        </span>
                      );
                    } else if (req.status === 'CANCEL_REQUESTED') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                          Cancel Requested
                        </span>
                      );
                    } else if (req.status.includes('CANCEL')) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Cancelled
                        </span>
                      );
                    }

                    const canCancel =
                      req.status === 'PENDING_APPROVAL' || req.status === 'APPROVED';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {req.leaveTypeName}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                          {req.fromDate.slice(0, 10)} to {req.toDate.slice(0, 10)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{req.numberOfDays}</td>
                        <td className="px-5 py-3.5 capitalize text-slate-600">{req.durationType.replace('_', ' ')}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">{statusBadge}</td>
                        <td className="px-5 py-3.5 max-w-xs truncate text-slate-500" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{req.appliedOn.slice(0, 10)}</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {canCancel && (
                            <button
                              onClick={() => openCancelModal(req)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                            >
                              {req.status === 'APPROVED' ? 'Request Cancellation' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cancellation Reason Modal */}
        {cancelModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedRequest.status === 'APPROVED'
                    ? 'Request Cancellation of Approved Leave'
                    : 'Cancel Leave Application'}
                </h3>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                {selectedRequest.status === 'APPROVED'
                  ? 'Since this leave is already approved, your cancellation will be routed to your manager for approval.'
                  : 'Cancelling this pending application will instantly release reserved leave days back to your available balance.'}
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Reason for Cancellation *</label>
                <textarea
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Travel plan postponed, medical appointment rescheduled..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
