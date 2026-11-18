'use client';

import React, { useEffect, useState } from 'react';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  Check,
  X,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { ProbationStatus } from '@zentra/shared-types';

export default function ProbationListPage() {
  const { activeOrganization } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal action state
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'CONFIRM' | 'EXTEND' | 'TERMINATE'>('CONFIRM');
  const [comments, setComments] = useState('');
  const [extensionDate, setExtensionDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      loadReviews();
    }
  }, [activeOrganization]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get('/probation-reviews');
      setReviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setSubmitting(true);
    try {
      await ApiClient.post(`/probation-reviews/${selectedReview.id}/approve`, {
        action: actionType,
        extensionDate: actionType === 'EXTEND' ? extensionDate : undefined,
        comments,
      });
      setSelectedReview(null);
      setComments('');
      setExtensionDate('');
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to process probation review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Probation Tracking & Confirmations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor probation end dates, review manager feedback scorecards, and execute confirmations or extensions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading probation records...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No probation reviews found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Probation reviews are scheduled automatically for employees on probation.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Probation End Date</th>
                  <th className="py-3 px-4">Manager Rating</th>
                  <th className="py-3 px-4">Recommendation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reviews.map((r) => {
                  const isPending = ['PENDING_REVIEW', 'SUBMITTED'].includes(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.employee?.employeeCode} • {r.employee?.department?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(r.probationEndDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {r.rating ? (
                          <span className="font-bold text-slate-800">{r.rating} / 5</span>
                        ) : (
                          <span className="text-slate-400 italic">Not rated</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {r.recommendation ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {r.recommendation}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Awaiting review</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'EXTENDED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'TERMINATED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => {
                              setSelectedReview(r);
                              setActionType('CONFIRM');
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-sm"
                          >
                            <span>HR Action</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Finalized</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* HR Decision Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Probation Decision: {selectedReview.employee?.firstName} {selectedReview.employee?.lastName}
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Execute confirmation (sets employee status to ACTIVE), extend probation, or initiate termination.
              </p>

              <form onSubmit={handleDecision} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Action *
                  </label>
                  <select
                    value={actionType}
                    onChange={(e: any) => setActionType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CONFIRM">Confirm Employment (Status ACTIVE)</option>
                    <option value="EXTEND">Extend Probation Period</option>
                    <option value="TERMINATE">Terminate Employment during Probation</option>
                  </select>
                </div>

                {actionType === 'EXTEND' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Probation End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={extensionDate}
                      onChange={(e) => setExtensionDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HR Comments / Justification
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter review remarks or notes for employee record..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-xs bg-[#1E3A8A] text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Confirm Action'}
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
