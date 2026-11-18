'use client';

import React, { useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import {
  FileSpreadsheet,
  Download,
  Landmark,
  HeartPulse,
  Scale,
  Building,
  FileCheck2,
  Calendar,
  Layers,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ComplianceReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const downloadFile = (endpoint: string) => {
    const url = `${API_BASE}${endpoint}`;
    window.open(url, '_blank');
  };

  const reports = [
    {
      id: 'pf-ecr',
      title: 'PF Electronic Challan cum Return (ECR)',
      description:
        'Standard EPFO upload format containing UAN, Member Name, Gross Wages, EPF/EPS wages, employee contribution, and employer share split.',
      icon: Landmark,
      color: 'blue',
      periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      downloadUrl: `/payroll/statutory/pf/report/export?month=${month}&year=${year}`,
      supportsMonth: true,
      supportsQuarter: false,
    },
    {
      id: 'esi-register',
      title: 'ESI Form 5 Contribution Register',
      description:
        'Monthly ESIC contribution register with IP Numbers, working days, gross wages, employee 0.75% contribution, and employer 3.25% share.',
      icon: HeartPulse,
      color: 'rose',
      periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      downloadUrl: `/payroll/statutory/esi/report/export?month=${month}&year=${year}`,
      supportsMonth: true,
      supportsQuarter: false,
    },
    {
      id: 'pt-register',
      title: 'State Professional Tax (PT) Register',
      description:
        'State-specific monthly professional tax register categorized by employee work location and applicable slab deductions.',
      icon: Scale,
      color: 'amber',
      periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      downloadUrl: `/payroll/statutory/professional-tax/report/export?month=${month}&year=${year}`,
      supportsMonth: true,
      supportsQuarter: false,
    },
    {
      id: 'lwf-register',
      title: 'Labour Welfare Fund (LWF) Register',
      description:
        'Periodic state labor welfare fund contributions for eligible workers and employer liability schedules.',
      icon: Building,
      color: 'indigo',
      periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      downloadUrl: `/payroll/statutory/lwf/report/export?month=${month}&year=${year}`,
      supportsMonth: true,
      supportsQuarter: false,
    },
    {
      id: 'tds-24q',
      title: 'TDS Quarterly Return (Form 24Q)',
      description:
        'Salary TDS details for TRACES quarterly electronic returns under Section 200(3), detailing PAN, gross salary, and TDS deducted/deposited.',
      icon: FileCheck2,
      color: 'emerald',
      periodLabel: `${quarter} &bull; FY ${financialYear}`,
      downloadUrl: `/payroll/compliance/tds-24q/export?financialYear=${financialYear}&quarter=${quarter}`,
      supportsMonth: false,
      supportsQuarter: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Statutory Compliance Reports &amp; Exports</h1>
          <p className="text-sm text-slate-500">
            Generate and export official government compliance files, registers, and returns (EPFO, ESIC, State PT, LWF, TRACES 24Q).
          </p>
        </div>

        <StatutoryNav />

        {/* Filters Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Select Report Periods</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Month (For PF, ESI, PT, LWF)</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Calendar Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Financial Year (For Form 24Q)</label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quarter (For Form 24Q)</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as any)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Q1">Q1 (Apr - Jun)</option>
                <option value="Q2">Q2 (Jul - Sep)</option>
                <option value="Q3">Q3 (Oct - Dec)</option>
                <option value="Q4">Q4 (Jan - Mar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((rep) => {
            const Icon = rep.icon;
            return (
              <div
                key={rep.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Period: {rep.supportsMonth ? `${MONTH_NAMES[month - 1]} ${year}` : `${quarter} &bull; FY ${financialYear}`}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">{rep.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => downloadFile(rep.downloadUrl)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Register</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
