'use client';

import React, { useEffect, useState } from 'react';
import { MyLifecycleNav } from '../my-lifecycle/my-lifecycle-nav';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function MyExitClearancePage() {
  const { activeOrganization } = useAuth();
  const [clearances, setClearances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const completed = clearances.filter((c) => ['COMPLETED', 'WAIVED'].includes(c.status)).length;
  const progress = clearances.length > 0 ? Math.round((completed / clearances.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <MyLifecycleNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Exit Handover & Department Clearances
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your departmental clearance tasks, asset handover, knowledge transfer, and IT account revocation.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-slate-700">Clearance Status</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {completed} of {clearances.length} tasks signed off
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{progress}%</div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Clearance Items */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading your exit clearance tasks...
          </div>
        ) : clearances.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No active exit clearances</h3>
            <p className="text-xs text-slate-500 mt-1">
              Departmental clearances are initialized upon approval of a resignation request.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clearances.map((c) => {
              const isDone = ['COMPLETED', 'WAIVED'].includes(c.status);
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="pt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {c.clearanceType.replace(/_/g, ' ')}
                        </span>
                        {c.isMandatory && (
                          <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-semibold border border-red-200">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Due Date: {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : 'Upon Exit'}
                      </p>
                      {c.comments && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Signoff Note: {c.comments}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      c.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : c.status === 'WAIVED'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
