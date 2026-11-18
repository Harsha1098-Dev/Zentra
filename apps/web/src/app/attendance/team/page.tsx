'use client';

import React, { useEffect, useState } from 'react';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  Users,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';
import { AttendanceStatus } from '@zentra/shared-types';

export default function TeamAttendancePage() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeam();
  }, [selectedDate]);

  async function loadTeam() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.request<any[]>(`/attendance/team?date=${selectedDate}`);
      setTeamMembers(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team attendance');
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = teamMembers.filter((item) => {
    const fullName = `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`.toLowerCase();
    const code = (item.employee?.employeeCode || '').toLowerCase();
    return fullName.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  const presentCount = teamMembers.filter((m) => m.status === AttendanceStatus.PRESENT).length;
  const absentCount = teamMembers.filter((m) => m.status === AttendanceStatus.ABSENT).length;
  const leaveCount = teamMembers.filter((m) => m.status === AttendanceStatus.ON_LEAVE).length;
  const lateCount = teamMembers.filter((m) => m.record?.isLate).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Attendance</h1>
            <p className="text-xs text-slate-500 mt-1">
              Live attendance status and punch times for your direct and indirect reportees
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Team KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Present Today</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Late Check-Ins</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">On Approved Leave</span>
            <p className="text-2xl font-bold text-purple-600 mt-1">{leaveCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Absent / Not In</span>
            <p className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
          </div>
        </div>

        {/* Team Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">Team Punch-In Roster</h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search team member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Worked</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading team attendance...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No reportees found
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const emp = item.employee;
                    const rec = item.record;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {emp.firstName?.[0]}
                              {emp.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400">{emp.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{emp.designation?.name || '--'}</td>
                        <td className="px-4 py-3 text-slate-600">{rec?.shift?.name || 'Standard Shift'}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {rec?.checkInTime
                            ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--'}
                          {rec?.isLate && (
                            <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                              Late ({rec.lateMinutes}m)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {rec?.checkOutTime
                            ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--'}
                          {rec?.isEarlyExit && (
                            <span className="ml-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded">
                              Early ({rec.earlyMinutes}m)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {rec?.workedMinutes ? `${(rec.workedMinutes / 60).toFixed(1)}h` : '--'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              item.status === AttendanceStatus.PRESENT
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === AttendanceStatus.HALF_DAY
                                ? 'bg-amber-50 text-amber-700'
                                : item.status === AttendanceStatus.ON_LEAVE
                                ? 'bg-purple-50 text-purple-700'
                                : item.status === AttendanceStatus.ON_DUTY
                                ? 'bg-blue-50 text-blue-700'
                                : item.status === AttendanceStatus.WORK_FROM_HOME
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
