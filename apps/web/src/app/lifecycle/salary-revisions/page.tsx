'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  DollarSign,
  PlusCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export default function SalaryRevisionsListPage() {
  const { activeOrganization } = useAuth();
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrganization) {
      loadRevisions();
    }
  }, [activeOrganization]);

  const loadRevisions = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get('/salary-revisions');
      setRevisions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve salary revision? A new active salary assignment will be created and previous records superseded.')) return;
    try {
      await ApiClient.post(`/salary-revisions/${id}/approve`);
      loadRevisions();
    } catch (err: any) {
      alert(err.message || 'Failed to approve revision');
    }
  };

  const handleReject = async (id: string) => {
    const comments = prompt('Enter rejection reason:');
    if (comments === null) return;
    try {
      await ApiClient.post(`/salary-revisions/${id}/reject`, { comments });
      loadRevisions();
    } catch (err: any) {
      alert(err.message || 'Failed to reject revision');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Salary Revisions & Increments
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Annual increments, market corrections, and retention adjustments with strict historical salary structure preservation.
            </p>
          </div>

          <Link
            href="/lifecycle/salary-revisions/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Revision</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading revisions...
          </div>
        ) : revisions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No salary revisions recorded</h3>
            <p className="text-xs text-slate-500 mt-1">Initiate a compensation change or annual increment.</p>
            <Link
              href="/lifecycle/salary-revisions/new"
              className="mt-4 inline-block px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Initiate Revision
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Current CTC</th>
                  <th className="py-3 px-4">Revised CTC</th>
                  <th className="py-3 px-4">Change %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {revisions.map((r) => {
                  const isPending = r.status === 'PENDING_APPROVAL';
                  const pct = r.currentAnnualCtc > 0
                    ? (((r.newAnnualCtc - r.currentAnnualCtc) / r.currentAnnualCtc) * 100).toFixed(1)
                    : 'N/A';

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
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {r.revisionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(r.effectiveFrom).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        ₹{Number(r.currentAnnualCtc).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-bold">
                        ₹{Number(r.newAnnualCtc).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-700 font-semibold text-xs">
                          +{pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                              onClick={() => handleApprove(r.id)}
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
      </main>
    </div>
  );
}
