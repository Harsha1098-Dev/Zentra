'use client';

import React, { useEffect, useState } from 'react';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Paperclip,
  Calendar,
} from 'lucide-react';
import { CompOffRequestDto, CompOffStatus } from '@zentra/shared-types';

export default function CompOffPage() {
  const [requests, setRequests] = useState<CompOffRequestDto[]>([]);
  const [workedDate, setWorkedDate] = useState('');
  const [workedHours, setWorkedHours] = useState('8');
  const [creditedDays, setCreditedDays] = useState('1.0');
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCompOffRequests();
  }, []);

  async function loadCompOffRequests() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.request<{ data: CompOffRequestDto[] }>('/comp-off/me');
      setRequests(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load compensatory off requests');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!workedDate) throw new Error('Please select the date worked');
      if (!reason || reason.trim().length < 3) {
        throw new Error('Please describe the work performed (min 3 characters)');
      }

      await ApiClient.request('/comp-off', {
        method: 'POST',
        body: JSON.stringify({
          workedDate,
          workedHours: workedHours ? parseFloat(workedHours) : undefined,
          creditedDays: parseFloat(creditedDays) || 1.0,
          reason,
          attachmentUrl: attachmentUrl.trim() || undefined,
        }),
      });

      setSuccess('Compensatory off request submitted for manager approval!');
      setWorkedDate('');
      setReason('');
      setAttachmentUrl('');
      setTimeout(() => setSuccess(null), 4000);
      loadCompOffRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to submit comp-off request');
    } finally {
      setIsSubmitting(false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compensatory Off (Comp-Off)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Claim compensatory leave credit for authorized work performed during scheduled weekends or public holidays.
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Claim Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Claim New Comp-Off</h2>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Date Worked *</label>
                <input
                  type="date"
                  max={todayStr}
                  value={workedDate}
                  onChange={(e) => setWorkedDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                />
                <span className="text-[10px] text-slate-400">Must be a past weekend or official holiday</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Hours Worked</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={workedHours}
                    onChange={(e) => setWorkedHours(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Days to Credit *</label>
                  <select
                    value={creditedDays}
                    onChange={(e) => setCreditedDays(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="0.5">0.5 Day</option>
                    <option value="1.0">1.0 Day (Full)</option>
                    <option value="1.5">1.5 Days</option>
                    <option value="2.0">2.0 Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Reason / Project Deliverable *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Critical production release deployment, client outage support..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 flex items-center space-x-1">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>Timesheet / Ticket URL (Optional)</span>
                </label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://jira.company.com/browse/PROJ-123"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Comp-Off Claim'}
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your Comp-Off Claims</h3>
                <p className="text-xs text-slate-500 mt-0.5">Approved comp-offs expire after 90 days if unused</p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading claims...</div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No comp-off claims yet</p>
                <p className="text-xs text-slate-400">
                  When you work on holidays or weekends, fill out the claim form to receive leave credits.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Worked Date</th>
                      <th className="px-5 py-3.5">Hours</th>
                      <th className="px-5 py-3.5">Credit</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Expiry Date</th>
                      <th className="px-5 py-3.5">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {requests.map((req) => {
                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Approval
                        </span>
                      );
                      if (req.status === CompOffStatus.APPROVED) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved
                          </span>
                        );
                      } else if (req.status === CompOffStatus.REJECTED) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Rejected
                          </span>
                        );
                      }

                      return (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {req.workedDate.slice(0, 10)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">{req.workedHours || '—'} hrs</td>
                          <td className="px-5 py-3.5 font-bold text-emerald-600">+{req.creditedDays} day</td>
                          <td className="px-5 py-3.5 whitespace-nowrap">{statusBadge}</td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                            {req.expiryDate ? req.expiryDate.slice(0, 10) : '—'}
                          </td>
                          <td className="px-5 py-3.5 max-w-xs truncate text-slate-500" title={req.reason}>
                            {req.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
