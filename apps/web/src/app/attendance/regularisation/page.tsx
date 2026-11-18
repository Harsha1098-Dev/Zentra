'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  X,
} from 'lucide-react';
import { AttendanceRegularisationReason } from '@zentra/shared-types';

export default function RegularisationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <AttendanceNav />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }
    >
      <RegularisationContent />
    </React.Suspense>
  );
}

function RegularisationContent() {
  const searchParams = useSearchParams();
  const preselectedRecordId = searchParams.get('recordId');

  const [regularisations, setRegularisations] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(!!preselectedRecordId);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [recordId, setRecordId] = useState(preselectedRecordId || '');
  const [requestedCheckIn, setRequestedCheckIn] = useState('');
  const [requestedCheckOut, setRequestedCheckOut] = useState('');
  const [reason, setReason] = useState<string>(AttendanceRegularisationReason.MISSED_PUNCH);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [regsRes, recsRes] = await Promise.all([
        ApiClient.request<any[]>('/attendance-regularisations').catch(() => []),
        ApiClient.request<any[]>('/attendance/my-records?limit=14').catch(() => []),
      ]);
      setRegularisations(regsRes || []);
      setRecentRecords(recsRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load regularisation requests');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recordId) {
      setError('Please select an attendance record to regularise');
      return;
    }
    if (!explanation.trim()) {
      setError('Please provide an explanation for regularisation');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await ApiClient.request('/attendance-regularisations', {
        method: 'POST',
        body: JSON.stringify({
          attendanceRecordId: recordId,
          requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn).toISOString() : undefined,
          requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut).toISOString() : undefined,
          reason,
          explanation,
        }),
      });

      setSuccessMsg('Regularisation request submitted successfully!');
      setShowModal(false);
      setExplanation('');
      setRequestedCheckIn('');
      setRequestedCheckOut('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance Regularisation</h1>
            <p className="text-xs text-slate-500 mt-1">
              Correct missing punches, transit delays, or biometric machine glitches with manager sign-off
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply Regularisation</span>
          </button>
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

        {/* Regularisation History Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Submitted Regularisation Requests</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Attendance Date</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Requested In</th>
                  <th className="px-4 py-3">Requested Out</th>
                  <th className="px-4 py-3">Explanation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading regularisations...
                    </td>
                  </tr>
                ) : regularisations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No regularisation requests found
                    </td>
                  </tr>
                ) : (
                  regularisations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {reg.attendanceRecord?.attendanceDate
                          ? new Date(reg.attendanceRecord.attendanceDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '--'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{reg.reason}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {reg.requestedCheckIn
                          ? new Date(reg.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {reg.requestedCheckOut
                          ? new Date(reg.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{reg.explanation}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            reg.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : reg.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {reg.status}
                        </span>
                        {reg.rejectionReason && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{reg.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Apply Regularisation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Apply for Attendance Regularisation</h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Attendance Date / Record</label>
                  <select
                    value={recordId}
                    onChange={(e) => setRecordId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Choose an attendance day --</option>
                    {recentRecords.map((r) => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.attendanceDate).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        - Status: {r.status} (In: {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Requested Check-In</label>
                    <input
                      type="datetime-local"
                      value={requestedCheckIn}
                      onChange={(e) => setRequestedCheckIn(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Requested Check-Out</label>
                    <input
                      type="datetime-local"
                      value={requestedCheckOut}
                      onChange={(e) => setRequestedCheckOut(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason Category</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={AttendanceRegularisationReason.MISSED_PUNCH}>Missed Punch</option>
                    <option value={AttendanceRegularisationReason.SYSTEM_ERROR}>System / Device Glitch</option>
                    <option value={AttendanceRegularisationReason.ON_DUTY}>On Duty</option>
                    <option value={AttendanceRegularisationReason.WORK_FROM_HOME}>Work From Home</option>
                    <option value={AttendanceRegularisationReason.TRANSIT_DELAY}>Transit / Traffic Delay</option>
                    <option value={AttendanceRegularisationReason.PERSONAL_EMERGENCY}>Personal Emergency</option>
                    <option value={AttendanceRegularisationReason.OTHER}>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Explanation / Remarks</label>
                  <textarea
                    rows={3}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    required
                    placeholder="Provide detailed explanation for your manager..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
