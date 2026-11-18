'use client';

import React, { useEffect, useState } from 'react';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  Flame,
  Briefcase,
  Check,
  X,
} from 'lucide-react';

export default function AttendanceApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'regularisation' | 'overtime' | 'requests'>('regularisation');
  const [regularisations, setRegularisations] = useState<any[]>([]);
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, [activeTab]);

  async function loadApprovals() {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'regularisation') {
        const res = await ApiClient.request<any[]>('/attendance-regularisations?status=PENDING_APPROVAL');
        setRegularisations(res || []);
      } else if (activeTab === 'overtime') {
        const res = await ApiClient.request<any[]>('/overtime-requests?status=PENDING_APPROVAL');
        setOvertimes(res || []);
      } else {
        const res = await ApiClient.request<any[]>('/attendance-requests?status=PENDING_APPROVAL');
        setRequests(res || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegularisationDecision(id: string, status: 'APPROVED' | 'REJECTED') {
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      const reason = window.prompt('Please provide a reason for rejection:');
      if (!reason) return;
      rejectionReason = reason;
    }

    try {
      await ApiClient.request(`/attendance-regularisations/${id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      setSuccessMsg(`Regularisation request successfully ${status.toLowerCase()}`);
      await loadApprovals();
    } catch (err: any) {
      setError(err.message || 'Decision failed');
    }
  }

  async function handleOvertimeDecision(id: string, status: 'APPROVED' | 'REJECTED') {
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      const reason = window.prompt('Please provide a reason for rejection:');
      if (!reason) return;
      rejectionReason = reason;
    }

    try {
      await ApiClient.request(`/overtime-requests/${id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      setSuccessMsg(`Overtime claim successfully ${status.toLowerCase()}`);
      await loadApprovals();
    } catch (err: any) {
      setError(err.message || 'Decision failed');
    }
  }

  async function handleAttendanceRequestDecision(id: string, status: 'APPROVED' | 'REJECTED') {
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      const reason = window.prompt('Please provide a reason for rejection:');
      if (!reason) return;
      rejectionReason = reason;
    }

    try {
      await ApiClient.request(`/attendance-requests/${id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      setSuccessMsg(`Request successfully ${status.toLowerCase()}`);
      await loadApprovals();
    } catch (err: any) {
      setError(err.message || 'Decision failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and sign off on regularisations, overtime claims, and on-duty/WFH requests from your team
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('regularisation')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'regularisation'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Regularisations ({regularisations.length})
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overtime'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overtime Claims ({overtimes.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            On-Duty & WFH ({requests.length})
          </button>
        </div>

        {/* Tab 1: Regularisations */}
        {activeTab === 'regularisation' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Attendance Date</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Requested In</th>
                    <th className="px-4 py-3">Requested Out</th>
                    <th className="px-4 py-3">Explanation</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Loading pending requests...
                      </td>
                    </tr>
                  ) : regularisations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No pending regularisation requests
                      </td>
                    </tr>
                  ) : (
                    regularisations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {reg.employee?.firstName} {reg.employee?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{reg.employee?.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {reg.attendanceRecord?.attendanceDate
                            ? new Date(reg.attendanceRecord.attendanceDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '--'}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{reg.reason}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {reg.requestedCheckIn
                            ? new Date(reg.requestedCheckIn).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '--'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {reg.requestedCheckOut
                            ? new Date(reg.requestedCheckOut).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '--'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{reg.explanation}</td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleRegularisationDecision(reg.id, 'APPROVED')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegularisationDecision(reg.id, 'REJECTED')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Overtime Claims */}
        {activeTab === 'overtime' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Overtime Hours</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Loading overtime claims...
                      </td>
                    </tr>
                  ) : overtimes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No pending overtime claims
                      </td>
                    </tr>
                  ) : (
                    overtimes.map((ot) => (
                      <tr key={ot.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {ot.employee?.firstName} {ot.employee?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{ot.employee?.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {new Date(ot.date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-700">
                          {(ot.overtimeMinutes / 60).toFixed(1)}h ({ot.overtimeMinutes} mins)
                        </td>
                        <td className="px-4 py-3 uppercase text-slate-600">{ot.overtimeType}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{ot.reason}</td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOvertimeDecision(ot.id, 'APPROVED')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOvertimeDecision(ot.id, 'REJECTED')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: On-Duty & WFH Requests */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">From Date</th>
                    <th className="px-4 py-3">To Date</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Loading requests...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No pending on-duty or WFH requests
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {req.employee?.firstName} {req.employee?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{req.employee?.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-indigo-700">
                          {req.requestType === 'ON_DUTY' ? 'On Duty' : 'Work From Home'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {new Date(req.fromDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {new Date(req.toDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{req.reason}</td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleAttendanceRequestDecision(req.id, 'APPROVED')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceRequestDecision(req.id, 'REJECTED')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
