'use client';

import React, { useState } from 'react';
import {
  Compass,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  Target,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

export default function MyOkrsPage() {
  const [objectives, setObjectives] = useState<any[]>([
    {
      id: 'obj-1',
      title: 'Accelerate Platform Reliability & Developer Velocity',
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-03-31',
      status: 'ON_TRACK',
      progressPercentage: 82,
      keyResults: [
        {
          id: 'kr-101',
          title: 'Reduce P99 API response latency below 120ms',
          metricType: 'NUMBER',
          startValue: 240,
          targetValue: 120,
          currentValue: 135,
          unit: 'ms',
          weightage: 50,
          progressPercentage: 88,
          dueDate: '2026-03-31',
        },
        {
          id: 'kr-102',
          title: 'Automate CI/CD end-to-end regression testing pipelines',
          metricType: 'BOOLEAN',
          startValue: 0,
          targetValue: 1,
          currentValue: 1,
          unit: 'complete',
          weightage: 50,
          progressPercentage: 100,
          dueDate: '2026-02-28',
        },
      ],
    },
    {
      id: 'obj-2',
      title: 'Enhance India Statutory Compliance Architecture',
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-06-30',
      status: 'ACTIVE',
      progressPercentage: 65,
      keyResults: [
        {
          id: 'kr-201',
          title: 'Roll out automated Form 24Q quarterly return exports',
          metricType: 'PERCENTAGE',
          startValue: 0,
          targetValue: 100,
          currentValue: 65,
          unit: '%',
          weightage: 100,
          progressPercentage: 65,
          dueDate: '2026-05-31',
        },
      ],
    },
  ]);

  const [activeCheckInKr, setActiveCheckInKr] = useState<any | null>(null);
  const [checkInVal, setCheckInVal] = useState<number>(0);
  const [checkInComment, setCheckInComment] = useState('');
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [newObjTitle, setNewObjTitle] = useState('');

  const submitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckInKr) return;

    setObjectives(
      objectives.map((obj) => {
        const hasKr = obj.keyResults.some((k: any) => k.id === activeCheckInKr.id);
        if (!hasKr) return obj;

        const updatedKrs = obj.keyResults.map((k: any) => {
          if (k.id !== activeCheckInKr.id) return k;
          const range = k.targetValue - k.startValue;
          const progress = range === 0 ? 100 : Math.min(100, Math.max(0, Math.round(((checkInVal - k.startValue) / range) * 100)));
          return {
            ...k,
            currentValue: checkInVal,
            progressPercentage: progress,
          };
        });

        const totalW = updatedKrs.reduce((a: number, b: any) => a + b.weightage, 0);
        const weightedP = updatedKrs.reduce((a: number, b: any) => a + b.progressPercentage * b.weightage, 0);
        const avg = totalW > 0 ? Math.round(weightedP / totalW) : 0;

        return {
          ...obj,
          keyResults: updatedKrs,
          progressPercentage: avg,
        };
      }),
    );

    setActiveCheckInKr(null);
    setCheckInComment('');
  };

  const handleCreateObjective = (e: React.FormEvent) => {
    e.preventDefault();
    const newObj = {
      id: `obj-${Date.now()}`,
      title: newObjTitle,
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-06-30',
      status: 'ACTIVE',
      progressPercentage: 0,
      keyResults: [],
    };
    setObjectives([newObj, ...objectives]);
    setIsObjModalOpen(false);
    setNewObjTitle('');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Objectives & Key Results (OKRs)</h1>
            <p className="text-xs text-slate-500 mt-1">
              Ambitious qualitative objectives coupled with quantifiable, measurable key results.
            </p>
          </div>

          <button
            onClick={() => setIsObjModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Objective</span>
          </button>
        </div>

        {/* Objectives List */}
        <div className="space-y-6">
          {objectives.map((obj) => (
            <div
              key={obj.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Objective Header */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {obj.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {obj.periodStartDate} to {obj.periodEndDate}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{obj.title}</h3>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 uppercase">Progress</span>
                    <p className="text-xl font-extrabold text-[#1E3A8A]">{obj.progressPercentage}%</p>
                  </div>
                  <div className="w-24 bg-slate-200 rounded-full h-2.5">
                    <div
                      className="bg-[#1E3A8A] h-2.5 rounded-full transition-all"
                      style={{ width: `${obj.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Key Results */}
              <div className="divide-y divide-slate-100 p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Key Results ({obj.keyResults.length})
                </h4>

                {obj.keyResults.map((kr: any) => (
                  <div
                    key={kr.id}
                    className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <p className="text-sm font-semibold text-slate-900">{kr.title}</p>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span>
                          Current: <strong className="text-slate-800">{kr.currentValue} {kr.unit}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Target: <strong className="text-slate-800">{kr.targetValue} {kr.unit}</strong>
                        </span>
                        <span>•</span>
                        <span>Weight: {kr.weightage}%</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>Progress</span>
                          <span>{kr.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${kr.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveCheckInKr(kr);
                          setCheckInVal(kr.currentValue);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
                      >
                        Check-in
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Check-in Modal */}
        {activeCheckInKr && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Log Check-in</h3>
                <button onClick={() => setActiveCheckInKr(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium">{activeCheckInKr.title}</p>

              <form onSubmit={submitCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Value ({activeCheckInKr.unit})
                  </label>
                  <input
                    type="number"
                    value={checkInVal}
                    onChange={(e) => setCheckInVal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comments & Milestone Accomplishments
                  </label>
                  <textarea
                    rows={3}
                    value={checkInComment}
                    onChange={(e) => setCheckInComment(e.target.value)}
                    placeholder="Describe progress, blocker resolutions, or next steps..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveCheckInKr(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Save Check-in
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Objective Modal */}
        {isObjModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">New Strategic Objective</h3>
                <button onClick={() => setIsObjModalOpen(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateObjective} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Objective Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newObjTitle}
                    onChange={(e) => setNewObjTitle(e.target.value)}
                    placeholder="e.g. Elevate customer satisfaction and platform resilience"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsObjModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Create Objective
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
