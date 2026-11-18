'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LifecycleNav } from '../../lifecycle-nav';
import { ApiClient } from '../../../../lib/api';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Shield,
  Upload,
} from 'lucide-react';

export default function OnboardingRunDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [run, setRun] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRun();
    }
  }, [id]);

  const loadRun = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get(`/onboarding-runs/${id}`);
      setRun(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load onboarding run');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (itemId: string, status: string) => {
    setUpdatingTaskId(itemId);
    try {
      await ApiClient.patch(`/onboarding-runs/${id}/items/${itemId}`, {
        status,
      });
      loadRun();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCompleteRun = async () => {
    if (!confirm('Are you sure you want to finalize and complete this onboarding run?')) return;
    try {
      await ApiClient.post(`/onboarding-runs/${id}/complete`, { overrideMandatory: false });
      loadRun();
    } catch (err: any) {
      alert(err.message || 'Failed to complete run');
    }
  };

  if (loading || !run) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <LifecycleNav />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
          Loading onboarding details...
        </div>
      </div>
    );
  }

  const items = run.items || [];
  const completedCount = items.filter((i: any) => i.status === 'COMPLETED').length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/lifecycle/onboarding"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Onboarding Runs</span>
        </Link>

        {/* Header Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {run.employee?.firstName} {run.employee?.lastName}
                </h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  run.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {run.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Employee Code: <span className="font-semibold text-slate-700">{run.employee?.employeeCode}</span> • Template: {run.onboardingFlow?.name}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {run.status !== 'COMPLETED' && (
                <button
                  onClick={handleCompleteRun}
                  className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-blue-800 shadow-sm"
                >
                  Finalize Onboarding
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Checklist Progress</span>
              <span className="text-blue-700 font-bold">{progress}% Complete ({completedCount}/{items.length} tasks)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900">Assigned Tasks ({items.length})</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((task: any) => {
              const isCompleted = task.status === 'COMPLETED';
              return (
                <div key={task.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="pt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{task.title}</span>
                        {task.isMandatory && (
                          <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-semibold border border-red-200">
                            Required
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {task.ownerType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{task.description || 'No description'}</p>
                      {task.attachmentUrl && (
                        <div className="mt-2 text-[11px] text-blue-600 font-medium flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Submitted Attachment: {task.attachmentUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isCompleted ? (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'PENDING')}
                        disabled={updatingTaskId === task.id}
                        className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded border border-slate-200"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                        disabled={updatingTaskId === task.id}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded shadow-sm"
                      >
                        Sign Off
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
