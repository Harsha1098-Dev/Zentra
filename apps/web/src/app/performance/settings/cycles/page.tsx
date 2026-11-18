'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Play,
  CheckCircle,
  Clock,
  ArrowLeft,
  X,
  Lock,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { PerformanceNav } from '../../performance-nav';

interface ReviewCycleItem {
  id: string;
  name: string;
  cycleType: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY';
  startDate: string;
  endDate: string;
  selfReviewDeadline: string;
  managerReviewDeadline: string;
  status: 'DRAFT' | 'ACTIVE' | 'IN_REVIEW' | 'CALIBRATION' | 'PUBLISHED' | 'CLOSED';
  assignmentsCount: number;
}

export default function PerformanceCyclesPage() {
  const [cycles, setCycles] = useState<ReviewCycleItem[]>([
    {
      id: 'cyc-1',
      name: 'FY 2025-26 Annual Performance Appraisal Cycle',
      cycleType: 'ANNUAL',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      selfReviewDeadline: '2026-02-28',
      managerReviewDeadline: '2026-03-15',
      status: 'PUBLISHED',
      assignmentsCount: 48,
    },
    {
      id: 'cyc-2',
      name: 'Q2 2026 Mid-Year Check-in Cycle',
      cycleType: 'QUARTERLY',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      selfReviewDeadline: '2026-06-15',
      managerReviewDeadline: '2026-06-25',
      status: 'DRAFT',
      assignmentsCount: 0,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cycleType: 'ANNUAL' as const,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    selfReviewDeadline: '2027-02-15',
    managerReviewDeadline: '2027-03-01',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCycle: ReviewCycleItem = {
      id: `cyc-${Date.now()}`,
      name: formData.name,
      cycleType: formData.cycleType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      selfReviewDeadline: formData.selfReviewDeadline,
      managerReviewDeadline: formData.managerReviewDeadline,
      status: 'DRAFT',
      assignmentsCount: 0,
    };
    setCycles([newCycle, ...cycles]);
    setIsModalOpen(false);
    setFormData({
      name: '',
      cycleType: 'ANNUAL',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      selfReviewDeadline: '2027-02-15',
      managerReviewDeadline: '2027-03-01',
    });
  };

  const handleStartCycle = (cycleId: string) => {
    setCycles(
      cycles.map((c) =>
        c.id === cycleId ? { ...c, status: 'ACTIVE', assignmentsCount: 52 } : c
      )
    );
  };

  const handlePublishCycle = (cycleId: string) => {
    setCycles(
      cycles.map((c) => (c.id === cycleId ? { ...c, status: 'PUBLISHED' } : c))
    );
  };

  const handleCloseCycle = (cycleId: string) => {
    setCycles(
      cycles.map((c) => (c.id === cycleId ? { ...c, status: 'CLOSED' } : c))
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/performance/settings"
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Performance Review Cycles
            </h1>
            <p className="text-sm text-slate-500">
              Configure appraisal timeframes, trigger automated review assignments, and publish outcomes.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Cycle</span>
          </button>
        </div>

        {/* Cycles list */}
        <div className="space-y-4">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                      {cycle.cycleType}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{cycle.name}</h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span>
                      Period: <strong className="text-slate-700">{cycle.startDate}</strong> to{' '}
                      <strong className="text-slate-700">{cycle.endDate}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Self-Review Deadline:{' '}
                      <strong className="text-slate-700">{cycle.selfReviewDeadline}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Manager Review Deadline:{' '}
                      <strong className="text-slate-700">{cycle.managerReviewDeadline}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      cycle.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : cycle.status === 'ACTIVE'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : cycle.status === 'CLOSED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {cycle.status}
                  </span>

                  {cycle.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStartCycle(cycle.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Cycle</span>
                    </button>
                  )}

                  {cycle.status === 'ACTIVE' && (
                    <button
                      onClick={() => handlePublishCycle(cycle.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Ratings</span>
                    </button>
                  )}

                  {cycle.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleCloseCycle(cycle.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Close Cycle</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Assigned Employees:{' '}
                  <strong className="text-slate-900">{cycle.assignmentsCount}</strong> participants
                </span>
                <Link
                  href="/performance/calibration"
                  className="font-semibold text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>View Calibration Sessions &rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create Cycle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Create Review Cycle</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cycle Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY 2026-27 Annual Performance Appraisal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cycle Type</label>
                <select
                  value={formData.cycleType}
                  onChange={(e) =>
                    setFormData({ ...formData, cycleType: e.target.value as any })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="ANNUAL">Annual Performance Appraisal</option>
                  <option value="SEMI_ANNUAL">Semi-Annual Mid-Year Review</option>
                  <option value="QUARTERLY">Quarterly OKR & Appraisal Sync</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evaluation Period Start
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evaluation Period End
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Self-Review Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.selfReviewDeadline}
                    onChange={(e) =>
                      setFormData({ ...formData, selfReviewDeadline: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manager Review Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.managerReviewDeadline}
                    onChange={(e) =>
                      setFormData({ ...formData, managerReviewDeadline: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
