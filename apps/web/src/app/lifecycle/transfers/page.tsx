'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  ArrowRightLeft,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Building,
  MapPin,
  User,
} from 'lucide-react';

export default function TransfersListPage() {
  const { activeOrganization } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrganization) {
      loadTransfers();
    }
  }, [activeOrganization]);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get('/employee-transfers');
      setTransfers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this transfer request? The employee record and history will be updated.')) return;
    try {
      await ApiClient.post(`/employee-transfers/${id}/approve`);
      loadTransfers();
    } catch (err: any) {
      alert(err.message || 'Failed to approve transfer');
    }
  };

  const handleReject = async (id: string) => {
    const comments = prompt('Enter rejection reason:');
    if (comments === null) return;
    try {
      await ApiClient.post(`/employee-transfers/${id}/reject`, { comments });
      loadTransfers();
    } catch (err: any) {
      alert(err.message || 'Failed to reject transfer');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Employee Transfers & Moves
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Internal relocations across departments, locations, grades, and reporting managers with circular hierarchy validation.
            </p>
          </div>

          <Link
            href="/lifecycle/transfers/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Transfer</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading transfers...
          </div>
        ) : transfers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No transfer requests</h3>
            <p className="text-xs text-slate-500 mt-1">Initiate an internal transfer for an employee.</p>
            <Link
              href="/lifecycle/transfers/new"
              className="mt-4 inline-block px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Initiate Transfer
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">From Department / Location</th>
                  <th className="py-3 px-4">To Department / Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transfers.map((t) => {
                  const isPending = t.status === 'PENDING_APPROVAL';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {t.employee?.firstName} {t.employee?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {t.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(t.effectiveFrom).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {t.currentDepartment?.name || 'Same'} • {t.currentLocation?.name || 'Same'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {t.newDepartment?.name || 'Same'} • {t.newLocation?.name || 'Same'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(t.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(t.id)}
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
