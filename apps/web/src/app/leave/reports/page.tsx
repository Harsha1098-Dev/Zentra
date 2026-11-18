'use client';

import React, { useEffect, useState } from 'react';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  Download,
  PieChart,
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';

export default function LeaveReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'dept' | 'org'>('my');

  const [mySummary, setMySummary] = useState<any | null>(null);
  const [teamSummary, setTeamSummary] = useState<any | null>(null);
  const [deptSummary, setDeptSummary] = useState<any | null>(null);
  const [orgSummary, setOrgSummary] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { roles, permissions } = useAuth();
  const isManagerOrAdmin = roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(r));
  const isHrOrAdmin = roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r));

  useEffect(() => {
    loadReport();
  }, [year, activeTab]);

  async function loadReport() {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'my') {
        const res = await ApiClient.request(`/leave-reports/my-summary?year=${year}`);
        setMySummary(res);
      } else if (activeTab === 'team') {
        const res = await ApiClient.request(`/leave-reports/team-summary?year=${year}`);
        setTeamSummary(res);
      } else if (activeTab === 'dept') {
        const res = await ApiClient.request(`/leave-reports/department-summary?year=${year}`);
        setDeptSummary(res);
      } else if (activeTab === 'org') {
        const res = await ApiClient.request(`/leave-reports/organization-summary?year=${year}`);
        setOrgSummary(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExport(type: 'balances' | 'requests') {
    setIsExporting(true);
    try {
      await ApiClient.downloadFile(
        `/leave-reports/export?type=${type}&year=${year}`,
        `zentra-leave-${type}-${year}.csv`,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Analytics & Reports</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Generate summaries, review utilization trends, and export CSV audit reports.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleExport('balances')}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Balances CSV</span>
            </button>

            <button
              onClick={() => handleExport('requests')}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Requests CSV</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex space-x-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Summary
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab('team')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'team'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Team Summary
            </button>
          )}
          {isHrOrAdmin && (
            <>
              <button
                onClick={() => setActiveTab('dept')}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'dept'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Department Statistics
              </button>
              <button
                onClick={() => setActiveTab('org')}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'org'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Organization Metrics
              </button>
            </>
          )}
        </div>

        {/* Tab Content: My Summary */}
        {activeTab === 'my' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading summary...</div>
            ) : mySummary ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Opening Balance</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{mySummary.totals.totalOpening} days</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Granted / Accrued</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{mySummary.totals.totalGranted} days</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Leaves Used</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{mySummary.totals.totalUsed} days</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Available Balance</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{mySummary.totals.totalAvailable} days</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
                    Breakdown by Leave Type ({year})
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Leave Type</th>
                        <th className="px-5 py-3 font-semibold text-right">Allocated</th>
                        <th className="px-5 py-3 font-semibold text-right">Used</th>
                        <th className="px-5 py-3 font-semibold text-right">Pending</th>
                        <th className="px-5 py-3 font-semibold text-right font-bold text-[#1E3A8A]">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {mySummary.balances.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-semibold text-slate-900">{b.leaveTypeName}</td>
                          <td className="px-5 py-3 text-right">
                            {b.openingBalance + b.accrued + b.granted + b.carryForward + b.adjustment}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-purple-700">{b.used}</td>
                          <td className="px-5 py-3 text-right text-amber-600">{b.pending}</td>
                          <td className="px-5 py-3 text-right font-black text-sm text-[#1E3A8A]">
                            {b.availableBalance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Tab Content: Team Summary */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading team summary...</div>
            ) : teamSummary?.members.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No direct reports found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Designation</th>
                      <th className="px-5 py-3.5 text-right">Leaves Used</th>
                      <th className="px-5 py-3.5 text-right">Pending</th>
                      <th className="px-5 py-3.5 text-right font-bold text-[#1E3A8A]">Available Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {teamSummary?.members.map((m: any) => (
                      <tr key={m.employeeId} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <div>{m.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal">{m.employeeCode}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{m.department || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-600">{m.designation || '—'}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-purple-700">{m.totalUsed}</td>
                        <td className="px-5 py-3.5 text-right text-amber-600">{m.totalPending}</td>
                        <td className="px-5 py-3.5 text-right font-black text-sm text-[#1E3A8A]">{m.totalAvailable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Department Statistics */}
        {activeTab === 'dept' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading department statistics...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5 text-right">Employees</th>
                    <th className="px-5 py-3.5 text-right">Total Leaves Used</th>
                    <th className="px-5 py-3.5 text-right">Total Pending</th>
                    <th className="px-5 py-3.5 text-right font-bold text-[#1E3A8A]">Total Available Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {deptSummary?.departments.map((d: any) => (
                    <tr key={d.departmentId} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{d.departmentName}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{d.totalEmployees}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-purple-700">{d.totalUsed}</td>
                      <td className="px-5 py-3.5 text-right text-amber-600">{d.totalPending}</td>
                      <td className="px-5 py-3.5 text-right font-black text-sm text-[#1E3A8A]">{d.totalAvailable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Organization Metrics */}
        {activeTab === 'org' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading metrics...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Paid / Unpaid</th>
                    <th className="px-5 py-3.5 text-right">Total Allocated</th>
                    <th className="px-5 py-3.5 text-right">Total Used</th>
                    <th className="px-5 py-3.5 text-right">Pending</th>
                    <th className="px-5 py-3.5 text-right font-bold text-[#1E3A8A]">Total Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orgSummary?.leaveTypes.map((t: any) => (
                    <tr key={t.leaveTypeId} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{t.leaveTypeName}</td>
                      <td className="px-5 py-3.5 capitalize text-slate-500">{t.category.replace('_', ' ')}</td>
                      <td className="px-5 py-3.5 font-medium">{t.isPaid ? 'Paid' : 'Unpaid'}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{t.totalAllocated}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-purple-700">{t.totalUsed}</td>
                      <td className="px-5 py-3.5 text-right text-amber-600">{t.totalPending}</td>
                      <td className="px-5 py-3.5 text-right font-black text-sm text-[#1E3A8A]">{t.totalAvailable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
