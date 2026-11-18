'use client';

import React, { useEffect, useState } from 'react';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { LeaveRequestDto, LeaveRequestStatus } from '@zentra/shared-types';

export default function TeamLeavesPage() {
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadTeamRequests();
  }, [statusFilter]);

  async function loadTeamRequests() {
    setIsLoading(true);
    setError(null);
    try {
      let query = '/leave-requests/team?limit=50';
      if (statusFilter !== 'ALL') {
        query += `&status=${statusFilter}`;
      }
      const res = await ApiClient.request<{ data: LeaveRequestDto[] }>(query);
      setRequests(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team leave requests');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(req: LeaveRequestDto) {
    setIsProcessing(true);
    setError(null);
    try {
      await ApiClient.request(`/leave-requests/${req.id}/approve`, {
        method: 'POST',
      });
      setActionSuccess(`Leave request for ${req.employeeName || 'employee'} approved successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadTeamRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  }

  function openRejectModal(req: LeaveRequestDto) {
    setSelectedRequest(req);
    setRejectionReason('');
    setRejectModalOpen(true);
  }

  async function handleConfirmReject() {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await ApiClient.request(`/leave-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      });
      setRejectModalOpen(false);
      setActionSuccess(`Leave request for ${selectedRequest.employeeName || 'employee'} rejected.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadTeamRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage leave applications and time-off requests submitted by your direct reportees.
          </p>
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

        {/* Status Filter Tabs */}
        <div className="flex space-x-1 border-b border-slate-200">
          {[
            { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'ALL', label: 'All Requests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                statusFilter === tab.id
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading team requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No requests found</p>
              <p className="text-xs text-slate-400">
                {statusFilter === 'PENDING_APPROVAL'
                  ? 'No pending leave requests from your team.'
                  : 'No team requests matching the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Dates</th>
                    <th className="px-5 py-3.5">Days</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Applied On</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{req.employeeName || 'Unknown Employee'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{req.employeeCode}</div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{req.leaveTypeName}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {req.fromDate.slice(0, 10)} to {req.toDate.slice(0, 10)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{req.numberOfDays}</td>
                      <td className="px-5 py-3.5 capitalize text-slate-600">{req.durationType.replace('_', ' ')}</td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-500" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{req.appliedOn.slice(0, 10)}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {req.status === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(req)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">
                            {req.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {rejectModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Reject Leave Request ({selectedRequest.employeeName})
              </h3>
              <p className="text-xs text-slate-500">
                Provide a reason for rejecting this leave application. The employee will be notified and reserved days
                will be released back to their balance.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Critical project sprint milestone, overlapping team coverage..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
