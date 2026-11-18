'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  Target,
  Compass,
  CheckCircle2,
  Users,
  Award,
  Flame,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';
import { useAuth } from '../../../context/auth-context';

export default function PerformanceReportsPage() {
  const { roles } = useAuth();
  const [reportScope, setReportScope] = useState<'ORG' | 'DEPT' | 'TEAM' | 'MY'>('ORG');
  const [selectedCycle, setSelectedCycle] = useState('FY 2025-26');

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = [
      'Employee Name',
      'Department',
      'Role',
      'Cycle',
      'Goals Count',
      'Goal Completion %',
      'OKR Progress %',
      'Self Rating',
      'Manager Rating',
      'Calibrated Rating',
      'Appraisal Status',
    ];

    const rows = [
      [
        'Sarah Jenkins',
        'Engineering',
        'Senior Software Engineer',
        'FY 2025-26',
        '3',
        '72%',
        '68%',
        '4.2',
        '4.5',
        '4.5',
        'PUBLISHED',
      ],
      [
        'David Kim',
        'Engineering',
        'DevOps / SRE Engineer',
        'FY 2025-26',
        '4',
        '88%',
        '85%',
        '4.5',
        '4.7',
        '4.7',
        'PUBLISHED',
      ],
      [
        'Alex Rivera',
        'Engineering',
        'Frontend Engineer',
        'FY 2025-26',
        '2',
        '55%',
        '60%',
        '4.0',
        '4.2',
        '3.8',
        'PUBLISHED',
      ],
      [
        'Maya Patel',
        'Design',
        'Product Designer',
        'FY 2025-26',
        '2',
        '60%',
        '65%',
        '4.0',
        '4.2',
        '4.2',
        'PUBLISHED',
      ],
      [
        'Chris Robinson',
        'Engineering',
        'Software Engineer',
        'FY 2025-26',
        '2',
        '40%',
        '45%',
        '3.0',
        '2.8',
        '2.5',
        'IN_PIP',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zentra_performance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Performance Analytics & Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Executive insights into goal velocity, OKR progress, rating bell curves, and compliance.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm self-start"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>

        {/* Scope and Cycle Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setReportScope('ORG')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportScope === 'ORG'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Organization Summary
            </button>
            <button
              onClick={() => setReportScope('DEPT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportScope === 'DEPT'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Engineering Dept
            </button>
            <button
              onClick={() => setReportScope('TEAM')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportScope === 'TEAM'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct Team
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Appraisal Cycle:</span>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="FY 2025-26">FY 2025-26 Annual Appraisal</option>
              <option value="Q2 2026">Q2 2026 Mid-Year Check-in</option>
            </select>
          </div>
        </div>

        {/* Top-Level KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Goal Completion Rate
              </span>
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">76.4%</span>
              <span className="text-xs font-semibold text-emerald-600">+8.2% vs last cycle</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Average OKR Progress
              </span>
              <Compass className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-blue-900">72.1%</span>
              <span className="text-xs font-semibold text-emerald-600">On Target</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Average Org Rating
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">3.85</span>
              <span className="text-xs text-slate-400">out of 5.0</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Active PIP Rate
              </span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">1.8%</span>
              <span className="text-xs font-semibold text-emerald-600">Healthy Low Risk</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution Bell Curve */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Calibrated Rating Distribution (Bell Curve)
            </h3>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Level 5 - Outstanding (Role Model)</span>
                  <span className="font-bold text-slate-900">8% (Target: 5-10%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '8%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Level 4 - Exceeds Expectations</span>
                  <span className="font-bold text-slate-900">22% (Target: 20-25%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Level 3 - Meets Expectations / Proficient</span>
                  <span className="font-bold text-slate-900">56% (Target: 50-60%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '56%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Level 2 - Needs Development</span>
                  <span className="font-bold text-slate-900">12% (Target: 10-15%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Level 1 - Unsatisfactory</span>
                  <span className="font-bold text-slate-900">2% (Target: 0-5%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '2%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Department OKR & Goal Velocity Comparison */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Department Performance Breakdown
            </h3>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Core Engineering</p>
                  <span className="text-[11px] text-slate-500">28 members</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-900 block">78.5% OKR Progress</span>
                  <span className="text-[11px] text-emerald-600">82% Goals on track</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Product & Design</p>
                  <span className="text-[11px] text-slate-500">12 members</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-900 block">74.0% OKR Progress</span>
                  <span className="text-[11px] text-emerald-600">79% Goals on track</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Customer Success & Support</p>
                  <span className="text-[11px] text-slate-500">14 members</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-900 block">69.2% OKR Progress</span>
                  <span className="text-[11px] text-emerald-600">75% Goals on track</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
