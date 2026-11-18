'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  Plus,
  ArrowLeft,
  CheckCircle2,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { PerformanceNav } from '../../performance-nav';

export default function RatingScalesPage() {
  const [scaleLevels, setScaleLevels] = useState([
    {
      score: 5,
      label: 'Outstanding / Role Model',
      percentageTarget: '5% - 10%',
      description:
        'Consistently surpasses all stretch objectives. Recognized as an organizational subject matter authority and cultural multiplier.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      score: 4,
      label: 'Exceeds Expectations',
      percentageTarget: '20% - 25%',
      description:
        'Regularly delivers work of superior quality beyond scope of role. High autonomy, initiative, and proactive leadership.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      score: 3,
      label: 'Meets Expectations / Proficient',
      percentageTarget: '50% - 60%',
      description:
        'Fully satisfies all core competencies and goals with high consistency and reliability. Solid, foundational contributor.',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      score: 2,
      label: 'Needs Development',
      percentageTarget: '10% - 15%',
      description:
        'Meets some expectations but displays inconsistent results or performance gaps. Requires focused mentoring or coaching.',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      score: 1,
      label: 'Unsatisfactory',
      percentageTarget: '0% - 5%',
      description:
        'Fails to meet minimum job requirements despite previous guidance. Active Performance Improvement Plan (PIP) mandatory.',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
  ]);

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
              Enterprise Rating Scales
            </h1>
            <p className="text-sm text-slate-500">
              Configure standardized 5-point performance metrics, descriptors, and target distribution bell curves.
            </p>
          </div>
        </div>

        {/* Info callout */}
        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Standard 5-Point Calibration Guideline: </span>
            The target distribution percentages below represent normalized bell curve benchmarks used
            by HR calibration committees to prevent score inflation and ensure fair equity across teams.
          </div>
        </div>

        {/* Rating Scale Levels */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Default 5-Point Appraisal Scale (Active)
            </h2>
            <span className="text-xs text-slate-500 font-medium">Standard Organization Scale</span>
          </div>

          <div className="divide-y divide-slate-100">
            {scaleLevels.map((lvl) => (
              <div key={lvl.score} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                    {lvl.score}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{lvl.label}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${lvl.badgeColor}`}>
                        Level {lvl.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {lvl.description}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:self-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    Bell Curve Target
                  </span>
                  <span className="text-xs font-bold text-blue-900">
                    {lvl.percentageTarget} of employees
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
