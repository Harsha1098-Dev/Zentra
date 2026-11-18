'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  X,
  Edit2,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

interface CalibrationCandidate {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  managerName: string;
  managerScore: number;
  calibratedScore: number;
  justification?: string;
  status: 'PENDING' | 'MODIFIED' | 'CONFIRMED';
}

export default function CalibrationPage() {
  const [candidates, setCandidates] = useState<CalibrationCandidate[]>([
    {
      id: 'cal-1',
      employeeName: 'Sarah Jenkins',
      role: 'Senior Software Engineer',
      department: 'Core Platform',
      managerName: 'Marcus Vance',
      managerScore: 4.5,
      calibratedScore: 4.5,
      status: 'CONFIRMED',
    },
    {
      id: 'cal-2',
      employeeName: 'David Kim',
      role: 'DevOps / SRE Engineer',
      department: 'Infrastructure',
      managerName: 'Marcus Vance',
      managerScore: 4.7,
      calibratedScore: 4.7,
      status: 'CONFIRMED',
    },
    {
      id: 'cal-3',
      employeeName: 'Alex Rivera',
      role: 'Frontend Engineer',
      department: 'Core Platform',
      managerName: 'Marcus Vance',
      managerScore: 4.2,
      calibratedScore: 3.8,
      justification:
        'Adjusted to normalize with peer frontend engineers across mobile squad; meets expectations solidly on L3 scope.',
      status: 'MODIFIED',
    },
    {
      id: 'cal-4',
      employeeName: 'Chris Robinson',
      role: 'Software Engineer',
      department: 'Engineering',
      managerName: 'Elena Rostova',
      managerScore: 2.8,
      calibratedScore: 2.5,
      justification: 'Aligned with active PIP milestones and defect escape rate.',
      status: 'MODIFIED',
    },
  ]);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CalibrationCandidate | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    calibratedScore: 4.0,
    justification: '',
  });

  const [isPublished, setIsPublished] = useState(false);

  const handleOpenAdjust = (cand: CalibrationCandidate) => {
    setSelectedCandidate(cand);
    setAdjustForm({
      calibratedScore: cand.calibratedScore,
      justification: cand.justification || '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setCandidates(
      candidates.map((c) =>
        c.id === selectedCandidate.id
          ? {
              ...c,
              calibratedScore: Number(adjustForm.calibratedScore),
              justification: adjustForm.justification,
              status: 'MODIFIED',
            }
          : c
      )
    );
    setIsAdjustModalOpen(false);
    setSelectedCandidate(null);
  };

  const handlePublishAll = () => {
    setIsPublished(true);
    alert('Calibrated decisions successfully published and synchronized with appraisal records.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Calibration Sessions & Moderation
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                Committee Session
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Normalize ratings across teams to prevent skew, ensure equity, and balance the bell curve.
            </p>
          </div>

          <button
            onClick={handlePublishAll}
            disabled={isPublished}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
              isPublished
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-[#1E3A8A] hover:bg-blue-800 text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublished ? 'Decisions Published' : 'Publish Calibrated Decisions'}</span>
          </button>
        </div>

        {/* Bell Curve Target vs Actual Overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Bell Curve Distribution Comparison</span>
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Distribution Normalized
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3 text-center text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-900 block">Level 1</span>
              <span className="text-[10px] text-slate-400">Unsatisfactory</span>
              <div className="mt-2 text-sm font-bold text-slate-700">0%</div>
              <span className="text-[10px] text-slate-400">Target: 0-5%</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-900 block">Level 2</span>
              <span className="text-[10px] text-slate-400">Needs Dev</span>
              <div className="mt-2 text-sm font-bold text-slate-700">25%</div>
              <span className="text-[10px] text-slate-400">Target: 10-15%</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-900 block">Level 3</span>
              <span className="text-[10px] text-slate-400">Meets / Proficient</span>
              <div className="mt-2 text-sm font-bold text-slate-700">25%</div>
              <span className="text-[10px] text-slate-400">Target: 50-60%</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-900 block">Level 4</span>
              <span className="text-[10px] text-slate-400">Exceeds</span>
              <div className="mt-2 text-sm font-bold text-slate-700">25%</div>
              <span className="text-[10px] text-slate-400">Target: 20-25%</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-900 block">Level 5</span>
              <span className="text-[10px] text-slate-400">Role Model</span>
              <div className="mt-2 text-sm font-bold text-slate-700">25%</div>
              <span className="text-[10px] text-slate-400">Target: 5-10%</span>
            </div>
          </div>
        </div>

        {/* Candidates Calibration Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Engineering Department Ratings Calibration ({candidates.length} candidates)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Manager Rating</th>
                  <th className="py-3 px-4">Calibrated Rating</th>
                  <th className="py-3 px-4">Variance</th>
                  <th className="py-3 px-4">Committee Justification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((cand) => {
                  const diff = cand.calibratedScore - cand.managerScore;
                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cand.employeeName}</div>
                        <div className="text-[11px] text-slate-500">
                          {cand.role} • {cand.department}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">{cand.managerName}</td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {cand.managerScore} / 5.0
                      </td>

                      <td className="py-3.5 px-4 font-bold text-blue-900">
                        {cand.calibratedScore} / 5.0
                      </td>

                      <td className="py-3.5 px-4">
                        {diff === 0 ? (
                          <span className="text-slate-400 font-medium">0.0</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-700 font-bold">+{diff.toFixed(1)}</span>
                        ) : (
                          <span className="text-rose-700 font-bold">{diff.toFixed(1)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {cand.justification || (
                          <span className="text-slate-400 italic">No adjustment made</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(cand)}
                          className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Adjust Modal */}
      {isAdjustModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Calibrate Rating for {selectedCandidate.employeeName}
                </h2>
                <p className="text-xs text-slate-500">
                  Manager: {selectedCandidate.managerName} (Initial Score:{' '}
                  {selectedCandidate.managerScore})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Calibrated Score (1.0 - 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  required
                  value={adjustForm.calibratedScore}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, calibratedScore: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Committee Justification (Mandatory for audits)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this score was modified relative to peers or level expectations..."
                  value={adjustForm.justification}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, justification: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Apply Calibration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
