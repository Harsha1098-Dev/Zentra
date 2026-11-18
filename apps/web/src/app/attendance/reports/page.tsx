'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  BarChart3,
  Calendar,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Users,
  Search,
  RefreshCw,
  TrendingDown,
  Building2,
  CalendarRange,
} from 'lucide-react';
import { AttendanceStatus } from '@zentra/shared-types';

type ReportType =
  | 'organization'
  | 'late-arrivals'
  | 'early-departures'
  | 'overtime'
  | 'exceptions'
  | 'team'
  | 'my-summary';

export default function AttendanceReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('organization');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportType, startDate, endDate, statusFilter]);

  async function loadReport() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter && reportType === 'organization') params.append('status', statusFilter);

      let endpoint = `/attendance-reports/${reportType}`;
      if (reportType === 'organization') {
        endpoint = `/attendance-reports/organization?${params.toString()}`;
      } else {
        endpoint = `${endpoint}?${params.toString()}`;
      }

      const res = await ApiClient.request<any>(endpoint);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance report');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('reportType', reportType === 'late-arrivals' ? 'late' : reportType === 'early-departures' ? 'early' : reportType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter && reportType === 'organization') params.append('status', statusFilter);

      await ApiClient.downloadFile(
        `/attendance-reports/export?${params.toString()}`,
        `attendance-${reportType}-${startDate}-to-${endDate}.csv`,
      );
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }

  function setQuickRange(type: 'today' | 'this_month' | 'last_month') {
    const now = new Date();
    if (type === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      setStartDate(start);
      setEndDate(end);
    } else if (type === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setStartDate(start);
      setEndDate(end);
    }
  }

  const records: any[] = data?.records || [];
  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const emp = r.employee || {};
    const text = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeCode || ''} ${
      emp.department?.name || ''
    }`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Calculate high-level summary KPIs
  const totalRecords = records.length;
  const totalWorkedHours = records.reduce((acc, r) => acc + (r.workedMinutes || 0), 0) / 60;
  const totalLateRecords = records.filter((r) => r.isLate).length;
  const totalLateMinutes = records.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
  const totalEarlyRecords = records.filter((r) => r.isEarlyExit).length;
  const totalOvertimeMinutes = records.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance Reports & Analytics</h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-sectional operational reports, compliance audits, overtime trends, and team analytics
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating CSV...' : 'Export to CSV'}</span>
            </button>
            <button
              onClick={loadReport}
              className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg bg-white shadow-sm hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Report Type Selector Tabs */}
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
          {[
            { id: 'organization', label: 'Organization Overview', icon: Building2 },
            { id: 'late-arrivals', label: 'Late Arrivals', icon: Clock },
            { id: 'early-departures', label: 'Early Departures', icon: TrendingDown },
            { id: 'overtime', label: 'Overtime Analysis', icon: Flame },
            { id: 'exceptions', label: 'Exceptions & Missing Punches', icon: AlertTriangle },
            { id: 'team', label: 'Team Report', icon: Users },
            { id: 'my-summary', label: 'My Attendance Summary', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as ReportType)}
                className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
              <button
                onClick={() => setQuickRange('today')}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px] font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setQuickRange('this_month')}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px] font-medium"
              >
                This Month
              </button>
              <button
                onClick={() => setQuickRange('last_month')}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-[11px] font-medium"
              >
                Last Month
              </button>
            </div>

            {reportType === 'organization' && (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <span className="font-semibold text-slate-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {Object.values(AttendanceStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Report Entries</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{totalRecords}</span>
              <span className="text-[11px] text-slate-400">records</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Total Worked Time</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-600">{totalWorkedHours.toFixed(1)}</span>
              <span className="text-[11px] text-slate-400">hours</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Late Delays</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-600">{totalLateRecords}</span>
              <span className="text-[11px] text-slate-400">{totalLateMinutes} mins</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Total Overtime</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-600">
                {(totalOvertimeMinutes / 60).toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400">{totalOvertimeMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* Report Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 capitalize">
              {reportType.replace(/-/g, ' ')} Records ({filteredRecords.length})
            </h2>
            <span className="text-xs text-slate-400">
              Period: {startDate} to {endDate}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              Loading report analytics...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No records found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try widening your date range or removing filter conditions
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Shift</th>
                    <th className="px-5 py-3">Check-In</th>
                    <th className="px-5 py-3">Check-Out</th>
                    <th className="px-5 py-3">Worked</th>
                    <th className="px-5 py-3">Late / Early</th>
                    <th className="px-5 py-3">Overtime</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => {
                    const emp = record.employee || {};
                    const shift = record.shift || {};
                    const dateStr = record.attendanceDate
                      ? new Date(record.attendanceDate).toISOString().slice(0, 10)
                      : '-';

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {emp.employeeCode} {emp.department?.name ? `• ${emp.department.name}` : ''}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
                          {shift.name || '-'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {record.checkInTime ? (
                            <span className="font-medium text-slate-800">
                              {new Date(record.checkInTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">--:--</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {record.checkOutTime ? (
                            <span className="font-medium text-slate-800">
                              {new Date(record.checkOutTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">--:--</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                          {record.workedMinutes
                            ? `${Math.floor(record.workedMinutes / 60)}h ${record.workedMinutes % 60}m`
                            : '0m'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            {record.isLate && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                +{record.lateMinutes}m Late
                              </span>
                            )}
                            {record.isEarlyExit && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                -{record.earlyMinutes}m Early
                              </span>
                            )}
                            {!record.isLate && !record.isEarlyExit && (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {record.overtimeMinutes > 0 ? (
                            <span className="text-emerald-700 font-semibold">
                              {Math.floor(record.overtimeMinutes / 60)}h {record.overtimeMinutes % 60}m
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              record.status === AttendanceStatus.PRESENT
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : record.status === AttendanceStatus.HALF_DAY
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : record.status === AttendanceStatus.ABSENT
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : record.status === AttendanceStatus.WORK_FROM_HOME
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : record.status === AttendanceStatus.ON_DUTY
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : record.status === AttendanceStatus.ON_LEAVE
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {record.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
