'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  Compass,
  Award,
  CheckCircle2,
  MessageSquareHeart,
  Users2,
  FileCheck2,
  Flame,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PerformanceNav } from './performance-nav';
import { useAuth } from '../../context/auth-context';

export default function PerformanceOverviewPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>({
    goals: { total: 4, completed: 2, averageProgress: 68 },
    okrs: { total: 2, averageProgress: 75 },
    krasCount: 3,
    feedbackCount: 5,
    latestAppraisal: {
      cycleName: 'Annual Review 2026',
      status: 'IN_PROGRESS',
      finalRating: null,
    },
  });

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-[#1E3A8A] text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Performance & Growth Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Welcome back, {user?.firstName || 'Colleague'}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Track your goals, align OKRs, log regular progress check-ins, celebrate continuous feedback, and complete appraisal reviews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/performance/my-goals"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Goal</span>
            </Link>
            <Link
              href="/performance/check-ins"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Log Check-in</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Goals</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{summary.goals.total}</span>
              <span className="text-xs font-medium text-emerald-600">
                {summary.goals.completed} Completed
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${summary.goals.averageProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">Avg progress: {summary.goals.averageProgress}%</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My OKRs</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{summary.okrs.total}</span>
              <span className="text-xs font-medium text-indigo-600">Objectives</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${summary.okrs.averageProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">Overall Key Results: {summary.okrs.averageProgress}%</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Continuous Feedback</span>
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{summary.feedbackCount}</span>
              <span className="text-xs font-medium text-pink-600">Shoutouts & Praise</span>
            </div>
            <p className="text-xs text-slate-500">Peer recognitions and constructive coaching</p>
            <Link
              href="/performance/feedback"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-pink-600 hover:text-pink-700"
            >
              <span>View Wall</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Appraisal Status</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-sm font-bold text-slate-900">
                {summary.latestAppraisal?.cycleName || 'Current Cycle'}
              </span>
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {summary.latestAppraisal?.status || 'IN_PROGRESS'}
            </span>
            <Link
              href="/performance/my-reviews"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-[#1E3A8A] hover:underline"
            >
              <span>Open Review Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Access Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Key Result Areas (KRAs)</h3>
                <p className="text-xs text-slate-500">Core functional and strategic expectations</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Your KRAs establish clear responsibilities and weightages across your core role.
            </p>
            <Link
              href="/performance/my-kras"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline"
            >
              <span>Manage KRAs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1:1 Connect Meetings</h3>
                <p className="text-xs text-slate-500">Regular syncs with your manager</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Schedule meetings, prepare agendas, log private discussion notes, and track action items.
            </p>
            <Link
              href="/performance/one-on-one"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 hover:underline"
            >
              <span>View Meetings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Performance Improvement (PIP)</h3>
                <p className="text-xs text-slate-500">Growth plans and turnaround coaching</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Track structured turnaround programs, measurable success criteria, and required support.
            </p>
            <Link
              href="/performance/improvement-plans"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-purple-700 hover:underline"
            >
              <span>View Improvement Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
