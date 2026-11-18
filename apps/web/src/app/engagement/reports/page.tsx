'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Flame,
  Heart,
  TrendingUp,
  Smile,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function EngagementReportsPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const reportData = {
    overallEnps: 42,
    totalResponses: 120,
    promoters: 65, // 54%
    passives: 40,  // 33%
    detractors: 15, // 13%
    // eNPS = 54 - 13 = +41%
    recognitionsTotal: 156,
    pointsDistributed: 8450,
    wellnessParticipationRate: 72,
    categories: [
      { name: 'Collaboration', count: 48, pct: 31 },
      { name: 'Teamwork', count: 36, pct: 23 },
      { name: 'Innovation', count: 28, pct: 18 },
      { name: 'Customer Focus', count: 24, pct: 15 },
      { name: 'Ownership', count: 20, pct: 13 },
    ],
  };

  const handleExport = (type: string) => {
    setDownloading(true);
    setTimeout(() => {
      // Create a mock download blob
      const csvContent =
        type === 'enps'
          ? 'eNPS Score,Total Responses,Promoters,Passives,Detractors\n42,120,65,40,15'
          : 'ID,Category,Points,Date\nrec-1,Collaboration,50,2026-11-18\nrec-2,Innovation,100,2026-11-17';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `zentra-engagement-${type}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloading(false);
      setDownloadSuccess(`Export of ${type.toUpperCase()} completed successfully!`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Engagement Analytics & Reports</h1>
            <p className="text-xs text-slate-500 mt-1">
              Organization-wide eNPS scores, value category metrics, and data export.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('enps')}
              disabled={downloading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Export eNPS CSV</span>
            </button>
            <button
              onClick={() => handleExport('recognitions')}
              disabled={downloading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] text-white hover:bg-blue-900 rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Praises</span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* High-Level Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Overall eNPS Rating</span>
            <div className="text-3xl font-black text-[#1E3A8A]">+{reportData.overallEnps}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">+8 pts from last quarter</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Total Praises Given</span>
            <div className="text-3xl font-black text-pink-600">{reportData.recognitionsTotal}</div>
            <div className="text-[11px] text-slate-500">Across 6 departments</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Points Awarded</span>
            <div className="text-3xl font-black text-amber-600">{reportData.pointsDistributed}</div>
            <div className="text-[11px] text-slate-500">Peer & wellness incentives</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Wellness Participation</span>
            <div className="text-3xl font-black text-emerald-600">{reportData.wellnessParticipationRate}%</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Healthy habit adherence</div>
          </div>
        </div>

        {/* eNPS Gauge & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">eNPS Distribution Breakdown</h2>
              <span className="text-xs text-slate-400">{reportData.totalResponses} Anonymous Responses</span>
            </div>

            {/* Proportion Bar */}
            <div className="space-y-2">
              <div className="flex h-5 w-full rounded-xl overflow-hidden shadow-inner">
                <div
                  className="bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white"
                  style={{ width: `${Math.round((reportData.promoters / reportData.totalResponses) * 100)}%` }}
                >
                  54%
                </div>
                <div
                  className="bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-900"
                  style={{ width: `${Math.round((reportData.passives / reportData.totalResponses) * 100)}%` }}
                >
                  33%
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-[10px] font-black text-white"
                  style={{ width: `${Math.round((reportData.detractors / reportData.totalResponses) * 100)}%` }}
                >
                  13%
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">
                    Promoters (9-10): {reportData.promoters} (54%)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="font-semibold text-slate-800">
                    Passives (7-8): {reportData.passives} (33%)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-semibold text-slate-800">
                    Detractors (0-6): {reportData.detractors} (13%)
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Explanation Callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-900">How eNPS is calculated:</div>
              <div>eNPS = % Promoters (54%) − % Detractors (13%) = <strong>+41 eNPS Score</strong></div>
              <div className="text-[11px] text-slate-500">Scores above 30 are considered great; above 50 are world-class.</div>
            </div>
          </div>

          {/* Core Values Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Praise by Core Values</h2>

            <div className="space-y-3">
              {reportData.categories.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{c.name}</span>
                    <span>{c.count} praises ({c.pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1E3A8A] rounded-full"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
