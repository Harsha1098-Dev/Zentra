'use client';

import React, { useEffect, useState } from 'react';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  Flame,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Calendar,
  X,
} from 'lucide-react';
import { OvertimeType } from '@zentra/shared-types';

export default function OvertimePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [overtimeMinutes, setOvertimeMinutes] = useState<number>(60);
  const [overtimeType, setOvertimeType] = useState<string>(OvertimeType.DAILY);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.request<any[]>('/overtime-requests');
      setRequests(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load overtime claims');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the overtime claim');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await ApiClient.request('/overtime-requests', {
        method: 'POST',
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          overtimeMinutes: Number(overtimeMinutes),
          overtimeType,
          reason,
        }),
      });

      setSuccessMsg('Overtime claim submitted successfully for manager approval!');
      setShowModal(false);
      setReason('');
      setOvertimeMinutes(60);
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
            <h1 className="text-2xl font-bold text-slate-900">Overtime Claims</h1>
            <p className="text-xs text-slate-500 mt-1">
              Submit and track extra working hours for payroll computation and manager sign-off
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Claim Overtime</span>
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

        {/* Overtime List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">My Overtime Claims</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Claimed Hours</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Loading overtime claims...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No overtime claims found
                    </td>
                  </tr>
                ) : (
                  requests.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {new Date(ot.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 uppercase text-slate-600 font-medium">{ot.overtimeType}</td>
                      <td className="px-4 py-3 font-bold text-blue-700">
                        {(ot.overtimeMinutes / 60).toFixed(1)} hrs ({ot.overtimeMinutes}m)
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm truncate">{ot.reason}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            ot.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ot.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ot.status}
                        </span>
                        {ot.rejectionReason && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{ot.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(ot.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Claim Overtime Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Claim Overtime Hours</h3>
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
                  <label className="block font-semibold text-slate-700 mb-1">Overtime Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Minutes Worked</label>
                    <input
                      type="number"
                      step={15}
                      min={15}
                      max={480}
                      value={overtimeMinutes}
                      onChange={(e) => setOvertimeMinutes(Number(e.target.value))}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      = {(overtimeMinutes / 60).toFixed(1)} hours
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Overtime Type</label>
                    <select
                      value={overtimeType}
                      onChange={(e) => setOvertimeType(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value={OvertimeType.DAILY}>Daily Overtime</option>
                      <option value={OvertimeType.REST_DAY}>Rest Day / Weekend</option>
                      <option value={OvertimeType.HOLIDAY}>Public Holiday</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason & Work Accomplished</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="Describe tasks completed during overtime..."
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
                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
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
