'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  Calendar,
  Filter,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AttendanceStatus } from '@zentra/shared-types';

export default function MyAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, [startDate, endDate, statusFilter]);

  async function loadRecords() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter) params.append('status', statusFilter);

      const res = await ApiClient.request<any[]>(`/attendance/my-records?${params.toString()}`);
      setRecords(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load personal attendance records');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Attendance Logs</h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete personal check-in/out records, shift assignments, and daily deviations
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/attendance/regularisation"
              className="px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Request Regularisation
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
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

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value={AttendanceStatus.PRESENT}>Present</option>
              <option value={AttendanceStatus.HALF_DAY}>Half Day</option>
              <option value={AttendanceStatus.ABSENT}>Absent</option>
              <option value={AttendanceStatus.ON_LEAVE}>On Leave</option>
              <option value={AttendanceStatus.HOLIDAY}>Holiday</option>
              <option value={AttendanceStatus.WEEKEND}>Weekend</option>
              <option value={AttendanceStatus.ON_DUTY}>On Duty</option>
              <option value={AttendanceStatus.WORK_FROM_HOME}>Work From Home</option>
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{records.length}</span> records
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Worked</th>
                  <th className="px-4 py-3">Break</th>
                  <th className="px-4 py-3">Late Mins</th>
                  <th className="px-4 py-3">Early Mins</th>
                  <th className="px-4 py-3">Overtime</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      No attendance logs found matching the selected filters
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {new Date(r.attendanceDate).toLocaleDateString([], {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.shift?.name || 'Default Shift'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.checkInTime
                          ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.checkOutTime
                          ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {r.workedMinutes ? `${(r.workedMinutes / 60).toFixed(1)}h` : '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.breakMinutes || 0}m</td>
                      <td className="px-4 py-3">
                        {r.isLate ? (
                          <span className="font-semibold text-amber-700">{r.lateMinutes}m</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.isEarlyExit ? (
                          <span className="font-semibold text-rose-700">{r.earlyMinutes}m</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-blue-700 font-semibold">
                        {r.overtimeMinutes ? `${(r.overtimeMinutes / 60).toFixed(1)}h` : '--'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            r.status === AttendanceStatus.PRESENT
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.status === AttendanceStatus.HALF_DAY
                              ? 'bg-amber-50 text-amber-700'
                              : r.status === AttendanceStatus.ON_LEAVE
                              ? 'bg-purple-50 text-purple-700'
                              : r.status === AttendanceStatus.ON_DUTY
                              ? 'bg-blue-50 text-blue-700'
                              : r.status === AttendanceStatus.WORK_FROM_HOME
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.isRegularised && (
                          <span className="ml-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">
                            REG
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!r.isLocked ? (
                          <Link
                            href={`/attendance/regularisation?recordId=${r.id}`}
                            className="text-xs text-[#1E3A8A] hover:underline font-semibold"
                          >
                            Regularise
                          </Link>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center justify-end space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
