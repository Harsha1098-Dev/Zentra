'use client';

import React, { useEffect, useState } from 'react';
import { MyLifecycleNav } from '../my-lifecycle/my-lifecycle-nav';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import {
  LogOut,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';

export default function MyResignationPage() {
  const { user, activeOrganization } = useAuth();
  const [activeResignation, setActiveResignation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [calculatedNoticeDays, setCalculatedNoticeDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrganization) {
      loadMyResignation();
    }
  }, [activeOrganization]);

  const loadMyResignation = async () => {
    setLoading(true);
    try {
      // Find resignation requests for the user
      const list = await ApiClient.get('/resignation-requests');
      if (Array.isArray(list) && list.length > 0) {
        // Active one if any
        const active = list.find((r) => ['PENDING_APPROVAL', 'APPROVED'].includes(r.status));
        setActiveResignation(active || list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (val: string) => {
    setLastWorkingDate(val);
    if (val) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(val);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setCalculatedNoticeDays(diffDays > 0 ? diffDays : 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastWorkingDate || !reason.trim()) {
      setError('Please select a proposed last working date and enter a reason');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await ApiClient.post('/resignation-requests', {
        lastWorkingDate,
        noticePeriodDays: calculatedNoticeDays,
        reason,
        comments: comments || undefined,
      });

      loadMyResignation();
    } catch (err: any) {
      setError(err.message || 'Failed to submit resignation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!activeResignation) return;
    if (!confirm('Are you sure you want to withdraw your resignation? This will cancel pending clearances.')) return;

    try {
      await ApiClient.post(`/resignation-requests/${activeResignation.id}/withdraw`);
      loadMyResignation();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw resignation');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <MyLifecycleNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Resignation & Separation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit your formal resignation, calculate proposed notice period days, and view clearance status.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Checking status...
          </div>
        ) : activeResignation && ['PENDING_APPROVAL', 'APPROVED'].includes(activeResignation.status) ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Active Resignation Request</h2>
                  <p className="text-xs text-slate-500">
                    Submitted on {new Date(activeResignation.resignationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeResignation.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {activeResignation.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Confirmed Last Working Day</span>
                <span className="font-bold text-slate-900 text-sm">
                  {new Date(activeResignation.lastWorkingDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Notice Period</span>
                <span className="font-semibold text-slate-800">
                  {activeResignation.noticePeriodDays} days
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Reason</span>
                <span className="text-slate-700">{activeResignation.reason}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                You can withdraw this request prior to final exit completion.
              </span>
              <button
                onClick={handleWithdraw}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-red-700 hover:border-red-200 rounded-lg text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Withdraw Resignation</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Submit Resignation Notice</h2>
              <p className="text-xs text-slate-500 mt-1">
                Standard organizational notice period is 30 days. Please discuss your proposed last working day with your manager.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Last Working Date *
                </label>
                <input
                  type="date"
                  required
                  value={lastWorkingDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                {lastWorkingDate && (
                  <p className="text-[11px] text-blue-600 mt-1 font-medium">
                    Calculated notice duration: {calculatedNoticeDays} calendar days from today.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Resignation *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Exploring higher education / new professional opportunities..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Handover Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details regarding ongoing projects or preferred transition timelines..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Resignation Notice'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
