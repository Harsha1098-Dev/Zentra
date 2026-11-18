'use client';

import React, { useState } from 'react';
import {
  Flame,
  AlertCircle,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  User,
  Calendar,
  X,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';
import { useAuth } from '../../../context/auth-context';

interface ImprovementPlanItem {
  id: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  title: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'SUCCESSFUL' | 'EXTENDED' | 'FAILED';
  successCriteria: string[];
  supportRequired: string[];
  finalOutcome?: string;
}

export default function ImprovementPlansPage() {
  const { roles } = useAuth();
  const isManagerOrAdmin = roles.some((r) =>
    ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(r)
  );

  const [plans, setPlans] = useState<ImprovementPlanItem[]>([
    {
      id: 'pip-1',
      employeeName: 'Chris Robinson',
      employeeRole: 'Software Engineer',
      department: 'Engineering',
      title: 'Code Quality and Test Coverage Turnaround Plan',
      reason:
        'Repeated production hotfixes resulting from unverified branch merges and low unit test coverage over the past 2 sprints.',
      startDate: '2026-02-15',
      endDate: '2026-04-15',
      status: 'ACTIVE',
      successCriteria: [
        'Maintain minimum 85% unit test coverage on all PRs',
        'Zero critical severity defect escapes to staging/production for 60 consecutive days',
        'Complete internal secure coding training module',
      ],
      supportRequired: [
        'Dedicated pairing mentor (Senior Engineer Elena Rostova) for 3 hrs/week',
        'Weekly review check-in with Engineering Manager Marcus Vance',
        'Full access to testing academy learning materials',
      ],
    },
    {
      id: 'pip-2',
      employeeName: 'Priya Sharma',
      employeeRole: 'Customer Success Specialist',
      department: 'Customer Experience',
      title: 'First-Contact Resolution & SLA Adherence Turnaround',
      reason:
        'Ticket SLA adherence dropped below target threshold of 92% during Q4.',
      startDate: '2025-11-01',
      endDate: '2026-01-01',
      status: 'SUCCESSFUL',
      successCriteria: [
        'Achieve SLA compliance >= 95% on P1 and P2 priority tickets',
        'Score >= 4.5/5 on customer CSAT satisfaction surveys',
      ],
      supportRequired: [
        'Weekly ticket triage shadowing sessions with lead specialist',
        'Refresher on CRM macros and escalations matrix',
      ],
      finalOutcome:
        'Priya exceeded expectations with 97.4% SLA adherence and 4.8/5 CSAT rating over the 60-day period. Plan successfully concluded.',
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ImprovementPlanItem | null>(null);

  const [createForm, setCreateForm] = useState({
    employeeName: '',
    employeeRole: '',
    department: 'Engineering',
    title: '',
    reason: '',
    startDate: '',
    endDate: '',
    successCriteriaText: '',
    supportRequiredText: '',
  });

  const [outcomeForm, setOutcomeForm] = useState({
    status: 'SUCCESSFUL' as 'SUCCESSFUL' | 'EXTENDED' | 'FAILED',
    outcomeNotes: '',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: ImprovementPlanItem = {
      id: `pip-${Date.now()}`,
      employeeName: createForm.employeeName,
      employeeRole: createForm.employeeRole,
      department: createForm.department,
      title: createForm.title,
      reason: createForm.reason,
      startDate: createForm.startDate,
      endDate: createForm.endDate,
      status: 'ACTIVE',
      successCriteria: createForm.successCriteriaText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      supportRequired: createForm.supportRequiredText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setPlans([newPlan, ...plans]);
    setIsCreateModalOpen(false);
    setCreateForm({
      employeeName: '',
      employeeRole: '',
      department: 'Engineering',
      title: '',
      reason: '',
      startDate: '',
      endDate: '',
      successCriteriaText: '',
      supportRequiredText: '',
    });
  };

  const handleOutcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setPlans(
      plans.map((p) =>
        p.id === selectedPlan.id
          ? {
              ...p,
              status: outcomeForm.status,
              finalOutcome: outcomeForm.outcomeNotes,
            }
          : p
      )
    );
    setIsOutcomeModalOpen(false);
    setSelectedPlan(null);
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
                Performance Improvement Plans (PIP)
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Confidential
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Structured support frameworks, measurable turnaround criteria, and transparent milestones.
            </p>
          </div>

          {isManagerOrAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Initiate Improvement Plan</span>
            </button>
          )}
        </div>

        {/* Plans List */}
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        plan.status === 'ACTIVE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : plan.status === 'SUCCESSFUL'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : plan.status === 'EXTENDED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {plan.status}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{plan.title}</h2>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-900">{plan.employeeName}</strong> ({plan.employeeRole} •{' '}
                    {plan.department})
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Duration: {plan.startDate} to {plan.endDate}</span>
                    </span>
                  </div>
                </div>

                {isManagerOrAdmin && plan.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsOutcomeModalOpen(true);
                    }}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-2xs self-start"
                  >
                    Record Outcome
                  </button>
                )}
              </div>

              {/* Reason */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Background & Performance Gaps: </span>
                {plan.reason}
              </div>

              {/* 2-column: Criteria & Support */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Success Criteria & Milestones</span>
                  </h3>
                  <ul className="space-y-1.5">
                    {plan.successCriteria.map((c, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-700 flex items-start space-x-2 bg-blue-50/40 p-2 rounded border border-blue-100/60"
                      >
                        <span className="font-bold text-blue-700">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                    <span>Support & Enablement Provided</span>
                  </h3>
                  <ul className="space-y-1.5">
                    {plan.supportRequired.map((s, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-700 flex items-start space-x-2 bg-purple-50/40 p-2 rounded border border-purple-100/60"
                      >
                        <span className="font-bold text-purple-700">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Final outcome banner if completed */}
              {plan.finalOutcome && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                    <span>Concluded Outcome: {plan.status}</span>
                  </div>
                  <p>{plan.finalOutcome}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Create PIP Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Initiate Performance Plan (PIP)</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chris Robinson"
                    value={createForm.employeeName}
                    onChange={(e) => setCreateForm({ ...createForm, employeeName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={createForm.employeeRole}
                    onChange={(e) => setCreateForm({ ...createForm, employeeRole: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality and SLA Turnaround Plan"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason & Specific Performance Gaps
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detail objective deficiencies and previous coaching attempts..."
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Success Criteria (one per line)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Minimum 85% test coverage&#10;Zero critical defects in production..."
                  value={createForm.successCriteriaText}
                  onChange={(e) => setCreateForm({ ...createForm, successCriteriaText: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support & Resources Provided (one per line)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Weekly mentor pairing&#10;SLA refresher course access..."
                  value={createForm.supportRequiredText}
                  onChange={(e) => setCreateForm({ ...createForm, supportRequiredText: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Initiate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outcome Modal */}
      {isOutcomeModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Record PIP Outcome</h2>
              <button
                onClick={() => setIsOutcomeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOutcomeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision / Outcome</label>
                <select
                  value={outcomeForm.status}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, status: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="SUCCESSFUL">Successful (Target criteria fully achieved)</option>
                  <option value="EXTENDED">Extended (Additional 30-day runway required)</option>
                  <option value="FAILED">Unsuccessful (Failed to meet mandatory criteria)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outcome Summary & Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the metrics achieved or missed, rationale for extension or completion..."
                  value={outcomeForm.outcomeNotes}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, outcomeNotes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOutcomeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
