'use client';

import React, { useEffect, useState } from 'react';
import { MyLifecycleNav } from '../my-lifecycle/my-lifecycle-nav';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function MyOnboardingPage() {
  const { user, activeOrganization } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeOrganization) {
      loadMyTasks();
    }
  }, [activeOrganization]);

  const loadMyTasks = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get('/onboarding-runs/my-tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task: any) => {
    setUploadingTaskId(task.id);
    try {
      await ApiClient.patch(`/onboarding-runs/${task.onboardingRunId}/items/${task.id}`, {
        status: 'COMPLETED',
        notes: notes[task.id] || 'Completed via Employee Self-Service portal',
      });
      loadMyTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to submit task');
    } finally {
      setUploadingTaskId(null);
    }
  };

  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <MyLifecycleNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Onboarding Journey
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your mandatory employee verification steps, upload identification, and sign off on company agreements.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-slate-700">Checklist Completion</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {completed} of {tasks.length} items completed
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-700">{progress}%</div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Task Cards */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading your onboarding tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">
              You do not have any pending onboarding tasks at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl border p-5 transition-all shadow-sm ${
                    isCompleted ? 'border-slate-200 opacity-90' : 'border-blue-200 ring-1 ring-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="pt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                          {task.isMandatory && (
                            <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-semibold border border-red-200">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{task.description}</p>

                        {!isCompleted && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Add optional completion notes or submission details..."
                              value={notes[task.id] || ''}
                              onChange={(e) => setNotes({ ...notes, [task.id]: e.target.value })}
                              className="text-xs border border-slate-200 rounded px-3 py-1.5 w-full max-w-md bg-slate-50 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteTask(task)}
                          disabled={uploadingTaskId === task.id}
                          className="px-4 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          {uploadingTaskId === task.id ? 'Saving...' : 'Mark Done'}
                        </button>
                      )}
                    </div>
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
