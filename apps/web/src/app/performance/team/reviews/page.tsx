'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  ArrowLeft,
  Star,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  X,
  User,
} from 'lucide-react';
import { PerformanceNav } from '../../performance-nav';

interface TeamReviewItem {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  status: 'PENDING_SELF_REVIEW' | 'READY_FOR_MANAGER_REVIEW' | 'COMPLETED';
  selfScore?: number;
  selfAccomplishments?: string;
  managerScore?: number;
  managerComments?: string;
  promotionRecommended?: boolean;
  incrementPercentage?: number;
}

export default function TeamReviewsPage() {
  const [reviews, setReviews] = useState<TeamReviewItem[]>([
    {
      id: 'rev-1',
      employeeName: 'Sarah Jenkins',
      role: 'Senior Software Engineer',
      department: 'Core Platform',
      status: 'READY_FOR_MANAGER_REVIEW',
      selfScore: 4.2,
      selfAccomplishments:
        'Engineered multi-tenant isolation, implemented zero-downtime database migrations, and led core API performance optimizations.',
    },
    {
      id: 'rev-2',
      employeeName: 'Maya Patel',
      role: 'Product Designer',
      department: 'Design & UX',
      status: 'READY_FOR_MANAGER_REVIEW',
      selfScore: 4.0,
      selfAccomplishments:
        'Redesigned complete employee management and directory workflows. Created 40+ atomic components for modern HR experience.',
    },
    {
      id: 'rev-3',
      employeeName: 'Alex Rivera',
      role: 'Frontend Engineer',
      department: 'Core Platform',
      status: 'PENDING_SELF_REVIEW',
    },
    {
      id: 'rev-4',
      employeeName: 'David Kim',
      role: 'DevOps / SRE Engineer',
      department: 'Infrastructure',
      status: 'COMPLETED',
      selfScore: 4.5,
      managerScore: 4.7,
      managerComments:
        'Outstanding dedication to zero-downtime automation and CI/CD pipelines.',
      promotionRecommended: true,
      incrementPercentage: 15,
    },
  ]);

  const [selectedReview, setSelectedReview] = useState<TeamReviewItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    managerScore: 4.5,
    managerComments: '',
    promotionRecommended: false,
    incrementPercentage: 10,
    promotionTitle: '',
  });

  const handleOpenEvaluate = (item: TeamReviewItem) => {
    setSelectedReview(item);
    setForm({
      managerScore: item.managerScore || 4.0,
      managerComments: item.managerComments || '',
      promotionRecommended: item.promotionRecommended || false,
      incrementPercentage: item.incrementPercentage || 10,
      promotionTitle: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setReviews(
      reviews.map((r) =>
        r.id === selectedReview.id
          ? {
              ...r,
              status: 'COMPLETED',
              managerScore: Number(form.managerScore),
              managerComments: form.managerComments,
              promotionRecommended: form.promotionRecommended,
              incrementPercentage: Number(form.incrementPercentage),
            }
          : r
      )
    );
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/performance/team"
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Team Hub</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Manager Appraisal Submissions
            </h1>
            <p className="text-sm text-slate-500">
              Review direct reports, score competencies, and submit merit compensation recommendations.
            </p>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-sm">
                    {rev.employeeName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{rev.employeeName}</h3>
                    <p className="text-xs text-slate-500">
                      {rev.role} • {rev.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      rev.status === 'READY_FOR_MANAGER_REVIEW'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : rev.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rev.status.replace(/_/g, ' ')}
                  </span>

                  {rev.status === 'READY_FOR_MANAGER_REVIEW' && (
                    <button
                      onClick={() => handleOpenEvaluate(rev)}
                      className="px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      Evaluate & Submit
                    </button>
                  )}

                  {rev.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleOpenEvaluate(rev)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                    >
                      View / Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Self-Accomplishments preview */}
              {rev.selfAccomplishments && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Employee Self-Summary: </span>
                  &ldquo;{rev.selfAccomplishments}&rdquo;
                  {rev.selfScore && (
                    <span className="ml-2 font-bold text-blue-900">
                      (Self-Rating: {rev.selfScore} / 5.0)
                    </span>
                  )}
                </div>
              )}

              {/* Concluded manager rating */}
              {rev.status === 'COMPLETED' && (
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <strong>Your Rating: </strong>
                    <span className="font-bold text-emerald-900">{rev.managerScore} / 5.0</span>
                    <p className="text-emerald-800 mt-0.5">{rev.managerComments}</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-semibold text-emerald-900">
                    {rev.promotionRecommended && (
                      <span className="bg-emerald-200/70 px-2 py-0.5 rounded">
                        ★ Promotion Recommended
                      </span>
                    )}
                    {rev.incrementPercentage && (
                      <span className="bg-emerald-200/70 px-2 py-0.5 rounded">
                        +{rev.incrementPercentage}% Merit Increment
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Evaluate Modal */}
      {isModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Evaluate {selectedReview.employeeName}
                </h2>
                <p className="text-xs text-slate-500">{selectedReview.role}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              {selectedReview.selfAccomplishments && (
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 text-xs text-blue-950">
                  <strong>Self-Review Score: {selectedReview.selfScore} / 5.0</strong>
                  <p className="mt-1">{selectedReview.selfAccomplishments}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Overall Rating (1.0 to 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  required
                  value={form.managerScore}
                  onChange={(e) => setForm({ ...form, managerScore: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Performance Feedback & Evaluation Summary
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail achievements against goals, demonstrated competencies, and feedback..."
                  value={form.managerComments}
                  onChange={(e) => setForm({ ...form, managerComments: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Advancement & Compensation Recommendations
                </span>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="promoCheck"
                    checked={form.promotionRecommended}
                    onChange={(e) => setForm({ ...form, promotionRecommended: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label
                    htmlFor="promoCheck"
                    className="text-xs text-slate-700 font-semibold cursor-pointer"
                  >
                    Recommend for Promotion
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Merit Salary Increment (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={form.incrementPercentage}
                    onChange={(e) =>
                      setForm({ ...form, incrementPercentage: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
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
                  Submit Manager Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
