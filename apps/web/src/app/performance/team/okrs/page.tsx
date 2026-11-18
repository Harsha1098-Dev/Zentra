'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { PerformanceNav } from '../../performance-nav';

interface KeyResult {
  id: string;
  title: string;
  metricType: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercentage: number;
  weightage: number;
}

interface TeamObjective {
  id: string;
  employeeName: string;
  title: string;
  period: string;
  category: string;
  progressPercentage: number;
  keyResults: KeyResult[];
}

export default function TeamOKRsPage() {
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({
    'obj-1': true,
    'obj-2': true,
  });

  const toggleExpand = (id: string) => {
    setExpandedObjectives((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const objectives: TeamObjective[] = [
    {
      id: 'obj-1',
      employeeName: 'Sarah Jenkins',
      title: 'Accelerate Platform Resilience and Zero-Downtime Deployment',
      period: 'Q1 2026',
      category: 'TECHNICAL',
      progressPercentage: 68,
      keyResults: [
        {
          id: 'kr-1',
          title: 'Deliver 4 production releases with zero regression',
          metricType: 'NUMERIC',
          currentValue: 3,
          targetValue: 4,
          unit: 'releases',
          progressPercentage: 75,
          weightage: 50,
        },
        {
          id: 'kr-2',
          title: 'Maintain p95 API response latency under 120ms',
          metricType: 'NUMERIC',
          currentValue: 140,
          targetValue: 120,
          unit: 'ms',
          progressPercentage: 60,
          weightage: 50,
        },
      ],
    },
    {
      id: 'obj-2',
      employeeName: 'Alex Rivera',
      title: 'Establish Unified Micro-Frontend Component Library',
      period: 'Q1 2026',
      category: 'PRODUCT',
      progressPercentage: 60,
      keyResults: [
        {
          id: 'kr-3',
          title: 'Build and document 30 shared UI atoms in Storybook',
          metricType: 'NUMERIC',
          currentValue: 18,
          targetValue: 30,
          unit: 'components',
          progressPercentage: 60,
          weightage: 60,
        },
        {
          id: 'kr-4',
          title: 'Achieve 100% WCAG 2.1 AA accessibility score across web portal',
          metricType: 'BOOLEAN',
          currentValue: 1,
          targetValue: 1,
          unit: 'status',
          progressPercentage: 100,
          weightage: 40,
        },
      ],
    },
  ];

  const filteredObjectives = objectives.filter((o) => {
    if (selectedMember !== 'ALL' && o.employeeName !== selectedMember) return false;
    return true;
  });

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
              Team OKRs & Key Results
            </h1>
            <p className="text-sm text-slate-500">
              Track quantitative outcome key results, metrics progress, and alignment cascades.
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter by Member:</span>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Team Members ({objectives.length} Objectives)</option>
            <option value="Sarah Jenkins">Sarah Jenkins</option>
            <option value="Alex Rivera">Alex Rivera</option>
          </select>
        </div>

        {/* Objectives Accordion Tree */}
        <div className="space-y-4">
          {filteredObjectives.map((obj) => {
            const isExpanded = !!expandedObjectives[obj.id];
            return (
              <div
                key={obj.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                <div
                  onClick={() => toggleExpand(obj.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <button className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {obj.employeeName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {obj.period}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{obj.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="w-32 text-right">
                      <span className="text-xs font-bold text-blue-900">
                        {obj.progressPercentage}%
                      </span>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${obj.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Key Results ({obj.keyResults.length})
                    </span>

                    <div className="space-y-2">
                      {obj.keyResults.map((kr) => (
                        <div
                          key={kr.id}
                          className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800">{kr.title}</p>
                            <span className="text-[11px] text-slate-500">
                              Target:{' '}
                              <strong className="text-slate-700">
                                {kr.currentValue} / {kr.targetValue} {kr.unit}
                              </strong>{' '}
                              • Weightage: {kr.weightage}%
                            </span>
                          </div>

                          <div className="flex items-center space-x-4">
                            <span className="text-xs font-bold text-slate-900">
                              {kr.progressPercentage}%
                            </span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${kr.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
