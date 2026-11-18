'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Target,
  Compass,
  FileCheck2,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';
import { useAuth } from '../../../context/auth-context';

export default function TeamPerformancePage() {
  const teamMembers = [
    {
      id: 'emp-1',
      name: 'Sarah Jenkins',
      role: 'Senior Software Engineer',
      department: 'Core Platform',
      activeGoalsCount: 3,
      avgGoalProgress: 72,
      okrProgress: 68,
      lastOneOnOne: '2026-03-12',
      reviewStatus: 'READY_FOR_MANAGER_REVIEW',
    },
    {
      id: 'emp-2',
      name: 'Alex Rivera',
      role: 'Frontend Engineer',
      department: 'Core Platform',
      activeGoalsCount: 2,
      avgGoalProgress: 55,
      okrProgress: 60,
      lastOneOnOne: '2026-03-18',
      reviewStatus: 'PENDING_SELF_REVIEW',
    },
    {
      id: 'emp-3',
      name: 'David Kim',
      role: 'DevOps / SRE Engineer',
      department: 'Infrastructure',
      activeGoalsCount: 4,
      avgGoalProgress: 88,
      okrProgress: 85,
      lastOneOnOne: '2026-03-10',
      reviewStatus: 'COMPLETED',
    },
    {
      id: 'emp-4',
      name: 'Maya Patel',
      role: 'Product Designer',
      department: 'Design & UX',
      activeGoalsCount: 2,
      avgGoalProgress: 60,
      okrProgress: 65,
      lastOneOnOne: '2026-03-05',
      reviewStatus: 'READY_FOR_MANAGER_REVIEW',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Team Performance Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your direct reports&apos; goals, OKRs, check-ins, and performance appraisals.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/performance/team/goals"
              className="inline-flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Team Goals</span>
            </Link>
            <Link
              href="/performance/team/reviews"
              className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Manager Reviews</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Direct Reports</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">4</span>
              <span className="text-xs font-semibold text-slate-600">Active</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Avg Goal Progress
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-blue-900">68.7%</span>
              <span className="text-xs font-semibold text-emerald-600">+12% vs last month</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Pending Check-ins
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-amber-600">2</span>
              <Link
                href="/performance/check-ins"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Review &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Appraisals Pending Review
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-purple-700">2</span>
              <Link
                href="/performance/team/reviews"
                className="text-xs font-semibold text-purple-600 hover:underline"
              >
                Evaluate &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Team Members Roster */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Direct Reports Roster</h2>
            <span className="text-xs text-slate-500">Sorted by next action required</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Goals</th>
                  <th className="py-3 px-4">Goal Progress</th>
                  <th className="py-3 px-4">OKR Progress</th>
                  <th className="py-3 px-4">Last 1:1</th>
                  <th className="py-3 px-4">Appraisal Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{member.name}</p>
                          <p className="text-[11px] text-slate-500">{member.role}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{member.department}</td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {member.activeGoalsCount} Goals
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>{member.avgGoalProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${member.avgGoalProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>{member.okrProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${member.okrProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(member.lastOneOnOne).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          member.reviewStatus === 'READY_FOR_MANAGER_REVIEW'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : member.reviewStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.reviewStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {member.reviewStatus === 'READY_FOR_MANAGER_REVIEW' ? (
                        <Link
                          href="/performance/team/reviews"
                          className="text-xs bg-[#1E3A8A] hover:bg-blue-800 text-white font-semibold px-2.5 py-1 rounded shadow-2xs"
                        >
                          Review Now
                        </Link>
                      ) : (
                        <Link
                          href="/performance/one-on-one"
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Sync 1:1 &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
