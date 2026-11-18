'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  Ticket,
  Clock,
  Star,
  ShieldCheck,
  ShieldAlert,
  Folder,
} from 'lucide-react';
import { HelpdeskNav } from '../helpdesk-nav';
import { ApiClient } from '../../../lib/api';

export default function HelpdeskReportsPage() {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const res = await ApiClient.request('/helpdesk/reports/summary');
        setSummary(res);
      } catch (err) {
        console.error('Failed to load helpdesk report summary', err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('zentra_access_token') : '';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/helpdesk/reports/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `helpdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Helpdesk Analytics & SLA Performance</h1>
            <p className="text-xs text-slate-500 mt-1">
              Track support workload, team efficiency, resolution timelines, and customer satisfaction (CSAT)
            </p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCsv}
            className="inline-flex items-center px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 disabled:opacity-50 transition"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {exporting ? 'Exporting...' : 'Export Tickets CSV'}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading analytics dashboard...
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Volume
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.totalTicketsCount}
                </h3>
                <div className="mt-2 text-[11px] text-slate-400">
                  {summary.openTicketsCount} open &bull; {summary.inProgressTicketsCount} in progress
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  SLA Compliance
                </span>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                  {summary.slaComplianceRate}%
                </h3>
                <div className="mt-2 text-[11px] text-slate-400">
                  {summary.slaBreachedCount} breach incidents
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Avg. Resolution Time
                </span>
                <h3 className="text-2xl font-bold text-[#1E3A8A] mt-1">
                  {summary.averageResolutionHours} hrs
                </h3>
                <div className="mt-2 text-[11px] text-slate-400">
                  {summary.resolvedTicketsCount + summary.closedTicketsCount} resolved tickets
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  CSAT Satisfaction
                </span>
                <h3 className="text-2xl font-bold text-amber-500 mt-1 flex items-center">
                  <Star className="w-5 h-5 fill-amber-500 mr-1.5" />
                  {summary.averageSatisfactionRating || '0.0'}/5
                </h3>
                <div className="mt-2 text-[11px] text-slate-400">
                  Average customer rating
                </div>
              </div>
            </div>

            {/* Distribution Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                  <Folder className="w-4 h-4 mr-1.5 text-[#1E3A8A]" />
                  Volume by Category
                </h3>
                <div className="space-y-2.5">
                  {summary.categoryDistribution && summary.categoryDistribution.length > 0 ? (
                    summary.categoryDistribution.map((cd: any) => (
                      <div key={cd.categoryName} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="font-medium truncate max-w-[160px]">{cd.categoryName}</span>
                          <span className="font-bold">{cd.count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-[#1E3A8A] h-1.5 rounded-full"
                            style={{
                              width: `${
                                summary.totalTicketsCount > 0
                                  ? (cd.count / summary.totalTicketsCount) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">No category data</div>
                  )}
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Volume by Priority
                </h3>
                <div className="space-y-2.5">
                  {summary.priorityDistribution && summary.priorityDistribution.length > 0 ? (
                    summary.priorityDistribution.map((pd: any) => (
                      <div key={pd.priority} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="font-medium">{pd.priority}</span>
                          <span className="font-bold">{pd.count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              pd.priority === 'CRITICAL'
                                ? 'bg-rose-500'
                                : pd.priority === 'URGENT'
                                ? 'bg-orange-500'
                                : pd.priority === 'HIGH'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${
                                summary.totalTicketsCount > 0
                                  ? (pd.count / summary.totalTicketsCount) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">No priority data</div>
                  )}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Volume by Status
                </h3>
                <div className="space-y-2.5">
                  {summary.statusDistribution && summary.statusDistribution.length > 0 ? (
                    summary.statusDistribution.map((sd: any) => (
                      <div key={sd.status} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="font-medium">{sd.status}</span>
                          <span className="font-bold">{sd.count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{
                              width: `${
                                summary.totalTicketsCount > 0
                                  ? (sd.count / summary.totalTicketsCount) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">No status data</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
