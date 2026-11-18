'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  TrendingUp,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

export default function PromotionsListPage() {
  const { activeOrganization } = useAuth();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrganization) {
      loadPromotions();
    }
  }, [activeOrganization]);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get('/employee-promotions');
      setPromotions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this promotion? The designation, grade, and salary will be updated atomically.')) return;
    try {
      await ApiClient.post(`/employee-promotions/${id}/approve`);
      loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Failed to approve promotion');
    }
  };

  const handleReject = async (id: string) => {
    const comments = prompt('Enter rejection comments:');
    if (comments === null) return;
    try {
      await ApiClient.post(`/employee-promotions/${id}/reject`, { comments });
      loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Failed to reject promotion');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Employee Promotions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Role advancements, grade elevations, and linked compensation structure updates.
            </p>
          </div>

          <Link
            href="/lifecycle/promotions/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Promotion</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading promotions...
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No promotions recorded</h3>
            <p className="text-xs text-slate-500 mt-1">Submit a promotion request for eligible employees.</p>
            <Link
              href="/lifecycle/promotions/new"
              className="mt-4 inline-block px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Initiate Promotion
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Current Designation</th>
                  <th className="py-3 px-4">Promoted Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {promotions.map((p) => {
                  const isPending = p.status === 'PENDING_APPROVAL';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {p.employee?.firstName} {p.employee?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.employee?.employeeCode} • {p.employee?.department?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(p.effectiveFrom).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.currentDesignation?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold text-blue-900">
                        {p.newDesignation?.name || 'Same'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
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
