'use client';

import React, { useEffect, useState } from 'react';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ClearanceStatus } from '@zentra/shared-types';

export default function ExitClearancesPage() {
  const { activeOrganization } = useAuth();
  const [clearances, setClearances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (activeOrganization) {
      loadClearances();
    }
  }, [activeOrganization]);

  const loadClearances = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get('/exit-clearances');
      setClearances(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string, status: 'COMPLETED' | 'WAIVED') => {
    const comments = prompt(`Enter comments for marking task as ${status}:`) || undefined;
    try {
      await ApiClient.post(`/exit-clearances/${id}/complete`, {
        status,
        comments,
      });
      loadClearances();
    } catch (err: any) {
      alert(err.message || 'Failed to update clearance');
    }
  };

  const filtered = clearances.filter((c) => {
    if (filterType === 'ALL') return true;
    return c.status === filterType;
  });

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Departmental Exit Clearances
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track IT revocation, asset handover, finance clearance, and knowledge transfer signoffs prior to final offboarding.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Statuses ({clearances.length})</option>
              <option value="PENDING">Pending Tasks</option>
              <option value="COMPLETED">Completed</option>
              <option value="WAIVED">Waived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading exit clearances...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No clearances found</h3>
            <p className="text-xs text-slate-500 mt-1">Clearances are automatically spawned upon resignation approval.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Clearance Task</th>
                  <th className="py-3 px-4">Mandatory</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Signoff Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((c) => {
                  const isPending = c.status === 'PENDING';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {c.employee?.firstName} {c.employee?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.employee?.employeeCode} • {c.employee?.department?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {c.clearanceType.replace(/_/g, ' ')}
                        </span>
                        {c.comments && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {c.comments}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.isMandatory ? (
                          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-semibold border border-red-200">
                            Mandatory
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'WAIVED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleComplete(c.id, 'COMPLETED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => handleComplete(c.id, 'WAIVED')}
                              className="px-2 py-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded font-medium text-[11px]"
                            >
                              Waive
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Signed off {c.completedAt ? new Date(c.completedAt).toLocaleDateString() : ''}
                          </span>
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
