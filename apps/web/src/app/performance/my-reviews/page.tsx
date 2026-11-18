'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  Calendar,
  Clock,
  CheckCircle,
  Star,
  Award,
  ChevronRight,
  Send,
  Check,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

interface ReviewAssignment {
  id: string;
  cycleName: string;
  templateName: string;
  stage: 'SELF_REVIEW' | 'MANAGER_REVIEW' | 'PUBLISHED' | 'ACKNOWLEDGED';
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  status: 'PENDING_SELF_REVIEW' | 'PENDING_MANAGER_REVIEW' | 'PUBLISHED' | 'ACKNOWLEDGED';
  selfSubmittedAt?: string;
  managerSubmittedAt?: string;
  acknowledgedAt?: string;
  managerComments?: string;
  recommendations?: {
    promotionRecommended: boolean;
    incrementPercentage: number;
    notes: string;
  };
}

export default function MyReviewsPage() {
  const [assignment, setAssignment] = useState<ReviewAssignment>({
    id: 'asgn-101',
    cycleName: 'Annual Performance Appraisal Cycle FY 2025-26',
    templateName: 'Standard Engineering Staff Evaluation (5-Point Scale)',
    stage: 'PUBLISHED',
    status: 'PUBLISHED',
    selfScore: 4.2,
    managerScore: 4.5,
    finalScore: 4.5,
    selfSubmittedAt: '2026-02-28T15:30:00Z',
    managerSubmittedAt: '2026-03-05T18:00:00Z',
    managerComments:
      'Sarah demonstrated exceptional technical leadership across both the multi-tenant architecture and payroll statutory engine projects. Her cross-team collaboration and quality standards set a benchmark for the engineering group.',
    recommendations: {
      promotionRecommended: true,
      incrementPercentage: 14,
      notes: 'Recommended for Staff Engineer promotion in the upcoming cycle.',
    },
  });

  const [isSelfReviewModalOpen, setIsSelfReviewModalOpen] = useState(false);
  const [isAcknowledgeModalOpen, setIsAcknowledgeModalOpen] = useState(false);

  // Self review form state
  const [selfForm, setSelfForm] = useState({
    rating: 4,
    accomplishments:
      'Engineered multi-tenant isolation, implemented zero-downtime database migrations, and led core API performance optimizations.',
    strengths: 'Deep backend design, high automated test rigor, proactive mentoring.',
    growthAreas: 'Expanding into multi-region cloud infrastructure and distributed consensus.',
  });

  const [ackComment, setAckComment] = useState('');

  const handleSelfReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignment({
      ...assignment,
      stage: 'MANAGER_REVIEW',
      status: 'PENDING_MANAGER_REVIEW',
      selfScore: Number(selfForm.rating),
      selfSubmittedAt: new Date().toISOString(),
    });
    setIsSelfReviewModalOpen(false);
  };

  const handleAcknowledgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignment({
      ...assignment,
      stage: 'ACKNOWLEDGED',
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date().toISOString(),
    });
    setIsAcknowledgeModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Appraisals & Reviews
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Participate in 360° review cycles, submit self-evaluations, and review final ratings.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {assignment.status === 'PENDING_SELF_REVIEW' && (
              <button
                onClick={() => setIsSelfReviewModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Submit Self-Review</span>
              </button>
            )}

            {assignment.status === 'PUBLISHED' && (
              <button
                onClick={() => setIsAcknowledgeModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign & Acknowledge Review</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Active Cycle Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Active Cycle
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">{assignment.cycleName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{assignment.templateName}</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Stage Status</span>
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                    assignment.status === 'ACKNOWLEDGED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : assignment.status === 'PUBLISHED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {assignment.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Process Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>1. Goal Setting</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">Completed & Approved</p>
            </div>

            <div
              className={`p-3 rounded-lg border space-y-1 ${
                assignment.selfSubmittedAt
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-500/20'
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    assignment.selfSubmittedAt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {assignment.selfSubmittedAt ? '✓' : '2'}
                </span>
                <span>2. Self-Review</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                {assignment.selfSubmittedAt ? 'Submitted' : 'Action Required'}
              </p>
            </div>

            <div
              className={`p-3 rounded-lg border space-y-1 ${
                assignment.managerSubmittedAt
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    assignment.managerSubmittedAt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {assignment.managerSubmittedAt ? '✓' : '3'}
                </span>
                <span>3. Manager Review</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                {assignment.managerSubmittedAt ? 'Evaluated' : 'Pending'}
              </p>
            </div>

            <div
              className={`p-3 rounded-lg border space-y-1 ${
                assignment.status === 'ACKNOWLEDGED'
                  ? 'border-slate-200 bg-slate-50'
                  : assignment.status === 'PUBLISHED'
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    assignment.status === 'ACKNOWLEDGED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {assignment.status === 'ACKNOWLEDGED' ? '✓' : '4'}
                </span>
                <span>4. Sign-off</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                {assignment.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Pending Sign-off'}
              </p>
            </div>
          </div>

          {/* Published Results & Feedback */}
          {['PUBLISHED', 'ACKNOWLEDGED'].includes(assignment.status) && (
            <div className="space-y-6 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium">Self-Rating</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center justify-center space-x-1">
                    <span>{assignment.selfScore}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-medium">Manager Rating</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center justify-center space-x-1">
                    <span>{assignment.managerScore}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                  </div>
                </div>

                <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 text-center">
                  <span className="text-xs text-blue-900 font-bold">Final Calibrated Rating</span>
                  <div className="text-2xl font-bold text-blue-900 mt-1 flex items-center justify-center space-x-1">
                    <Award className="w-5 h-5 text-amber-500 inline mr-1" />
                    <span>{assignment.finalScore}</span>
                    <span className="text-xs text-blue-700 font-normal">/ 5.0</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 block mt-1">
                    Outstanding Performance
                  </span>
                </div>
              </div>

              {/* Manager Feedback */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Manager Feedback & Appraisal Summary
                </h3>
                <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">
                  {assignment.managerComments}
                </p>
              </div>

              {/* Recommendations */}
              {assignment.recommendations && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <Star className="w-4 h-4 text-emerald-700 fill-emerald-600" />
                    <span>Manager Recommendations</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-emerald-950 pt-1">
                    <div>
                      <strong>Promotion Recommendation: </strong>
                      {assignment.recommendations.promotionRecommended ? 'Yes (Staff Engineer)' : 'No'}
                    </div>
                    <div>
                      <strong>Merit Increment: </strong>
                      {assignment.recommendations.incrementPercentage}%
                    </div>
                  </div>
                  <p className="text-emerald-800 pt-1">{assignment.recommendations.notes}</p>
                </div>
              )}

              {/* Acknowledged Status */}
              {assignment.status === 'ACKNOWLEDGED' && (
                <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    Digitally signed and acknowledged on{' '}
                    {new Date(assignment.acknowledgedAt!).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Self-Review Modal */}
      {isSelfReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Submit Self-Review</h2>
              <button
                onClick={() => setIsSelfReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSelfReviewSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Self-Rating (1.0 to 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  required
                  value={selfForm.rating}
                  onChange={(e) => setSelfForm({ ...selfForm, rating: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Accomplishments & Deliverables
                </label>
                <textarea
                  rows={3}
                  required
                  value={selfForm.accomplishments}
                  onChange={(e) => setSelfForm({ ...selfForm, accomplishments: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Core Strengths Demonstrated
                </label>
                <textarea
                  rows={2}
                  required
                  value={selfForm.strengths}
                  onChange={(e) => setSelfForm({ ...selfForm, strengths: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Areas for Development & Next Cycle Aspirations
                </label>
                <textarea
                  rows={2}
                  required
                  value={selfForm.growthAreas}
                  onChange={(e) => setSelfForm({ ...selfForm, growthAreas: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSelfReviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Submit Self-Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Acknowledge Modal */}
      {isAcknowledgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Acknowledge Performance Appraisal</h2>
              <button
                onClick={() => setIsAcknowledgeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAcknowledgeSubmit} className="space-y-3.5">
              <p className="text-xs text-slate-600">
                By acknowledging this appraisal, you confirm that you have reviewed the ratings, feedback,
                and recommendations with your manager.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share any reflections or closing thoughts..."
                  value={ackComment}
                  onChange={(e) => setAckComment(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAcknowledgeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Sign & Acknowledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
