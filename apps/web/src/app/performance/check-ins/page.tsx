'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Clock,
  Check,
  X,
  AlertTriangle,
  FileText,
  Filter,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';
import { useAuth } from '../../../context/auth-context';

interface CheckInItem {
  id: string;
  itemType: 'GOAL' | 'KEY_RESULT';
  itemTitle: string;
  previousValue: number;
  currentValue: number;
  unit: string;
  progressPercentage: number;
  notes: string;
  blockers?: string;
  managerFeedback?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  employeeName: string;
}

export default function CheckInsPage() {
  const { roles } = useAuth();
  const isManager = roles.some((r) => ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(r));

  const [activeTab, setActiveTab] = useState<'MY_CHECKINS' | 'TEAM_CHECKINS'>('MY_CHECKINS');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [checkIns, setCheckIns] = useState<CheckInItem[]>([
    {
      id: 'chk-1',
      itemType: 'KEY_RESULT',
      itemTitle: 'KR 1: Deliver 4 production releases with zero regression',
      previousValue: 1,
      currentValue: 3,
      unit: 'releases',
      progressPercentage: 75,
      notes: 'Completed sprint 14 and sprint 15 deployments smoothly. All unit & e2e suites passed.',
      blockers: 'None at the moment.',
      managerFeedback: 'Great momentum! Keep up the rigorous automated verification.',
      status: 'APPROVED',
      createdAt: '2026-03-10T10:30:00Z',
      employeeName: 'Sarah Jenkins',
    },
    {
      id: 'chk-2',
      itemType: 'GOAL',
      itemTitle: 'Goal: Achieve 90%+ Test Coverage on Payroll Engine',
      previousValue: 30,
      currentValue: 65,
      unit: '%',
      progressPercentage: 65,
      notes: 'Added statutory formula tests for PF, ESI, and Professional Tax calculations.',
      blockers: 'Waiting on edge-case tax slab specs from finance.',
      managerFeedback: '',
      status: 'SUBMITTED',
      createdAt: '2026-03-15T14:15:00Z',
      employeeName: 'Sarah Jenkins',
    },
    {
      id: 'chk-3',
      itemType: 'KEY_RESULT',
      itemTitle: 'KR 2: Maintain p95 API response latency under 120ms',
      previousValue: 180,
      currentValue: 140,
      unit: 'ms',
      progressPercentage: 60,
      notes: 'Implemented redis query caching for employee profile and hierarchy fetch endpoints.',
      blockers: 'Database indexing required on audit log queries.',
      managerFeedback: '',
      status: 'SUBMITTED',
      createdAt: '2026-03-16T09:00:00Z',
      employeeName: 'Alex Rivera',
    },
    {
      id: 'chk-4',
      itemType: 'GOAL',
      itemTitle: 'Goal: Complete AWS Solutions Architect Certification',
      previousValue: 20,
      currentValue: 30,
      unit: '%',
      progressPercentage: 30,
      notes: 'Finished module 3 of the training course.',
      status: 'REJECTED',
      managerFeedback: 'Please provide the test quiz completion certificates as agreed in 1:1.',
      createdAt: '2026-03-01T11:00:00Z',
      employeeName: 'Sarah Jenkins',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    itemType: 'GOAL',
    itemTitle: '',
    previousValue: 0,
    currentValue: 10,
    unit: '%',
    progressPercentage: 50,
    notes: '',
    blockers: '',
  });

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleCreateCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const newCheckIn: CheckInItem = {
      id: `chk-${Date.now()}`,
      itemType: formData.itemType as any,
      itemTitle: formData.itemTitle,
      previousValue: Number(formData.previousValue),
      currentValue: Number(formData.currentValue),
      unit: formData.unit,
      progressPercentage: Number(formData.progressPercentage),
      notes: formData.notes,
      blockers: formData.blockers,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      employeeName: 'Sarah Jenkins',
    };
    setCheckIns([newCheckIn, ...checkIns]);
    setIsModalOpen(false);
    setFormData({
      itemType: 'GOAL',
      itemTitle: '',
      previousValue: 0,
      currentValue: 10,
      unit: '%',
      progressPercentage: 50,
      notes: '',
      blockers: '',
    });
  };

  const handleReviewAction = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedCheckIn) return;
    setCheckIns(
      checkIns.map((chk) =>
        chk.id === selectedCheckIn.id
          ? { ...chk, status, managerFeedback: reviewNotes }
          : chk
      )
    );
    setReviewModalOpen(false);
    setSelectedCheckIn(null);
    setReviewNotes('');
  };

  const filteredCheckIns = checkIns.filter((chk) => {
    if (activeTab === 'MY_CHECKINS' && chk.employeeName !== 'Sarah Jenkins') return false;
    if (activeTab === 'TEAM_CHECKINS' && chk.employeeName === 'Sarah Jenkins') return false;
    if (filterStatus !== 'ALL' && chk.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Progress Check-ins</h1>
            <p className="text-sm text-slate-500 mt-1">
              Log progress, share blockers, and get regular validation from your manager.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Check-in</span>
          </button>
        </div>

        {/* Tab & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('MY_CHECKINS')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'MY_CHECKINS'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              My Check-ins
            </button>
            {isManager && (
              <button
                onClick={() => setActiveTab('TEAM_CHECKINS')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'TEAM_CHECKINS'
                    ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Team Check-ins
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {checkIns.filter((c) => c.status === 'SUBMITTED' && c.employeeName !== 'Sarah Jenkins').length}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Needs Revision</option>
            </select>
          </div>
        </div>

        {/* Check-ins list */}
        <div className="space-y-4">
          {filteredCheckIns.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No check-ins found</p>
              <p className="text-xs text-slate-400 mt-1">
                Log regular check-ins to keep goals up-to-date and maintain continuous alignment.
              </p>
            </div>
          ) : (
            filteredCheckIns.map((chk) => (
              <div
                key={chk.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {chk.itemType}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">{chk.itemTitle}</h3>
                      <span className="text-xs text-slate-400">• by {chk.employeeName}</span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-slate-600 pt-1">
                      <div className="flex items-center space-x-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span>
                          Value:{' '}
                          <span className="font-medium text-slate-900">
                            {chk.previousValue} → {chk.currentValue} {chk.unit}
                          </span>
                        </span>
                      </div>
                      <div>
                        Progress:{' '}
                        <span className="font-bold text-blue-900">{chk.progressPercentage}%</span>
                      </div>
                      <div className="text-slate-400">
                        {new Date(chk.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                      <strong className="text-slate-900 font-medium">Notes: </strong>
                      {chk.notes}
                    </p>

                    {chk.blockers && (
                      <div className="text-xs text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Blockers: </strong> {chk.blockers}
                        </div>
                      </div>
                    )}

                    {chk.managerFeedback && (
                      <div className="text-xs text-blue-900 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Manager Feedback: </strong> {chk.managerFeedback}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 ${
                        chk.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : chk.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {chk.status === 'APPROVED' && <Check className="w-3 h-3 mr-0.5" />}
                      {chk.status === 'REJECTED' && <X className="w-3 h-3 mr-0.5" />}
                      {chk.status === 'SUBMITTED' && <Clock className="w-3 h-3 mr-0.5" />}
                      {chk.status === 'SUBMITTED' ? 'Pending Approval' : chk.status}
                    </span>

                    {isManager && chk.status === 'SUBMITTED' && activeTab === 'TEAM_CHECKINS' && (
                      <button
                        onClick={() => {
                          setSelectedCheckIn(chk);
                          setReviewModalOpen(true);
                        }}
                        className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                      >
                        Review Check-in
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Log Check-in Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Log Progress Check-in</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCheckIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Type</label>
                <select
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="GOAL">Performance Goal</option>
                  <option value="KEY_RESULT">OKR Key Result</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Item / Objective
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deliver Core Microservices Architecture"
                  value={formData.itemTitle}
                  onChange={(e) => setFormData({ ...formData, itemTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Previous Val</label>
                  <input
                    type="number"
                    value={formData.previousValue}
                    onChange={(e) => setFormData({ ...formData, previousValue: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Val</label>
                  <input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progressPercentage}
                    onChange={(e) => setFormData({ ...formData, progressPercentage: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accomplishments & Progress Notes
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="What milestones or achievements were completed since the last check-in?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blockers or Challenges (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Any dependencies or issues blocking progress?"
                  value={formData.blockers}
                  onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
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
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-medium shadow-sm"
                >
                  Submit Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Review Check-in</h2>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p>
                <strong>Employee:</strong> {selectedCheckIn.employeeName}
              </p>
              <p>
                <strong>Item:</strong> {selectedCheckIn.itemTitle}
              </p>
              <p>
                <strong>Reported Progress:</strong> {selectedCheckIn.progressPercentage}% (
                {selectedCheckIn.previousValue} → {selectedCheckIn.currentValue} {selectedCheckIn.unit})
              </p>
              <p className="bg-slate-50 p-2 rounded border border-slate-100">
                <strong>Notes:</strong> {selectedCheckIn.notes}
              </p>
              {selectedCheckIn.blockers && (
                <p className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-800">
                  <strong>Blockers:</strong> {selectedCheckIn.blockers}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Manager Feedback / Coaching Note
              </label>
              <textarea
                rows={3}
                placeholder="Share guidance, acknowledge effort, or suggest next steps..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => handleReviewAction('REJECTED')}
                className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium"
              >
                Request Revision
              </button>
              <button
                onClick={() => handleReviewAction('APPROVED')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm"
              >
                Approve Check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
