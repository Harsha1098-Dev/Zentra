'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  LogOut,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { ResignationStatus } from '@zentra/shared-types';

export default function ResignationsListPage() {
  const { activeOrganization } = useAuth();
  const [resignations, setResignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval modal state
  const [selectedResig, setSelectedResig] = useState<any | null>(null);
  const [approvedLwd, setApprovedLwd] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      loadResignations();
    }
  }, [activeOrganization]);

  const loadResignations = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get('/resignation-requests');
      setResignations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResig) return;

    setSubmitting(true);
    try {
      await ApiClient.post(`/resignation-requests/${selectedResig.id}/approve`, {
        lastWorkingDate: approvedLwd || undefined,
        comments: comments || undefined,
      });
      setSelectedResig(null);
      setComments('');
      setApprovedLwd('');
      loadResignations();
    } catch (err: any) {
      alert(err.message || 'Failed to approve resignation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      await ApiClient.post(`/resignation-requests/${id}/reject`, { comments: reason });
      loadResignations();
    } catch (err: any) {
      alert(err.message || 'Failed to reject resignation');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Resignation Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Notice period tracking, manager approvals, auto-generated exit clearance checklists & offboarding requests.
            </p>
          </div>

          <Link
            href="/lifecycle/resignations/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit on Behalf</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading resignations...
          </div>
        ) : resignations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <LogOut className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No resignation requests</h3>
            <p className="text-xs text-slate-500 mt-1">Submitted employee resignations will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Resignation Date</th>
                  <th className="py-3 px-4">Proposed LWD</th>
                  <th className="py-3 px-4">Notice Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {resignations.map((r) => {
                  const isPending = r.status === 'PENDING_APPROVAL';
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
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(r.resignationDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {new Date(r.lastWorkingDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.noticePeriodDays} days
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {r.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'WITHDRAWN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedResig(r);
                                setApprovedLwd(new Date(r.lastWorkingDate).toISOString().split('T')[0]);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              className="px-2.5 py-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded font-semibold text-[11px]"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Approval Modal */}
        {selectedResig && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Approve Resignation: {selectedResig.employee?.firstName} {selectedResig.employee?.lastName}
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Confirming approval will automatically initialize the departmental exit clearance checklist and offboarding case.
              </p>

              <form onSubmit={handleApprove} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmed Last Working Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={approvedLwd}
                    onChange={(e) => setApprovedLwd(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HR Approval Note
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional remarks regarding handover and clearance..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedResig(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submitting ? 'Approving...' : 'Confirm Approval'}
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
