'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AttendanceNav } from './attendance-nav';
import { ApiClient } from '../../lib/api';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Flame,
  Briefcase,
  Laptop,
  Check,
  X,
  Play,
  Square,
} from 'lucide-react';
import { AttendanceStatus, CheckInSource } from '@zentra/shared-types';

export default function AttendanceDashboardPage() {
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Clock updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [todayRes, summaryRes, recordsRes] = await Promise.all([
        ApiClient.request<any>('/attendance/today').catch(() => null),
        ApiClient.request<any>('/attendance/my-summary').catch(() => null),
        ApiClient.request<any[]>('/attendance/my-records?limit=7').catch(() => []),
      ]);

      setTodayStatus(todayRes);
      setSummary(summaryRes);
      setRecentRecords(recordsRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance details');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePunchIn() {
    setIsPunching(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await ApiClient.request('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({
          source: CheckInSource.WEB,
          checkInTime: new Date().toISOString(),
        }),
      });
      setSuccessMsg('Successfully checked in!');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setIsPunching(false);
    }
  }

  async function handlePunchOut() {
    setIsPunching(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await ApiClient.request('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({
          source: CheckInSource.WEB,
          checkOutTime: new Date().toISOString(),
        }),
      });
      setSuccessMsg('Successfully checked out!');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Check-out failed');
    } finally {
      setIsPunching(false);
    }
  }

  const record = todayStatus?.record;
  const isCheckedIn = todayStatus?.isCheckedIn;
  const isCheckedOut = todayStatus?.isCheckedOut;
  const isLocked = todayStatus?.isLocked;
  const shift = todayStatus?.shift;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Attendance Period Locked</p>
              <p className="text-xs text-amber-700">
                This attendance period is frozen for payroll cutoff. Punch-in/out and regularisations are disabled.
              </p>
            </div>
          </div>
        )}

        {/* Top Punch & Shift Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Punch In / Out Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Attendance Punch Clock</h2>
                  <p className="text-xs text-slate-500">Record your daily work presence</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isCheckedIn
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isCheckedOut
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isCheckedIn ? 'Checked In' : isCheckedOut ? 'Checked Out' : 'Not Punched In'}
                  </span>
                </div>
              </div>

              {/* Big Digital Clock Display */}
              <div className="py-6 text-center">
                <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-slate-900">
                  {currentTime || '--:--:--'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Timings Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-3 text-center border border-slate-100 mb-6">
                <div>
                  <p className="text-xs text-slate-500">Check-In</p>
                  <p className="text-sm font-bold text-slate-800">
                    {record?.checkInTime
                      ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Check-Out</p>
                  <p className="text-sm font-bold text-slate-800">
                    {record?.checkOutTime
                      ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Worked Hours</p>
                  <p className="text-sm font-bold text-slate-800">
                    {record?.workedMinutes ? `${(record.workedMinutes / 60).toFixed(1)}h` : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Overtime</p>
                  <p className="text-sm font-bold text-slate-800">
                    {record?.overtimeMinutes ? `${(record.overtimeMinutes / 60).toFixed(1)}h` : '0h'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={isCheckedIn || isCheckedOut || isLocked || isPunching}
                onClick={handlePunchIn}
                className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isPunching ? 'Punching...' : 'Punch In'}</span>
              </button>

              <button
                type="button"
                disabled={!isCheckedIn || isCheckedOut || isLocked || isPunching}
                onClick={handlePunchOut}
                className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>{isPunching ? 'Punching...' : 'Punch Out'}</span>
              </button>
            </div>
          </div>

          {/* Assigned Shift & Schedule Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Today's Shift</h3>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Shift Name</span>
                  <span className="text-sm font-semibold text-slate-800">{shift?.name || 'Standard Day Shift'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Timings</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {shift?.startTime || '09:00'} - {shift?.endTime || '17:00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Break Duration</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {shift?.breakDurationMinutes || 60} mins
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Shift Type</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {shift?.isOvernight ? 'Overnight Shift' : 'Regular Shift'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href="/attendance/shifts"
                className="text-xs font-semibold text-[#1E3A8A] hover:text-[#1D4ED8] flex items-center justify-between"
              >
                <span>View Monthly Roster</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Monthly Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Present Days</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary?.presentDays ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Half Days</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary?.halfDays ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Absent Days</span>
            <p className="text-2xl font-bold text-rose-600 mt-1">{summary?.absentDays ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Worked Hours</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary?.totalWorkedHours ?? 0}h</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Late Check-Ins</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary?.lateDays ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Overtime Hours</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">{summary?.totalOvertimeHours ?? 0}h</p>
          </div>
        </div>

        {/* Quick Action Hub */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Quick Self-Service Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/attendance/regularisation"
              className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-[#1E3A8A] flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-[#1E3A8A]">
                  Regularise Attendance
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Missed a punch or transit delay? Request correction</p>
              </div>
            </Link>

            <Link
              href="/attendance/overtime"
              className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-700">Claim Overtime</p>
                <p className="text-xs text-slate-500 mt-0.5">Submit extra worked hours for manager approval</p>
              </div>
            </Link>

            <Link
              href="/attendance/on-duty"
              className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">Apply On-Duty</p>
                <p className="text-xs text-slate-500 mt-0.5">Client site visit, official travel, or external duty</p>
              </div>
            </Link>

            <Link
              href="/attendance/work-from-home"
              className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-purple-700">Request WFH</p>
                <p className="text-xs text-slate-500 mt-0.5">Submit remote work days for manager sign-off</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Attendance Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recent Attendance Records</h3>
            <Link
              href="/attendance/my-attendance"
              className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center space-x-1"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Worked</th>
                  <th className="px-4 py-3">Deviations</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No attendance records found for recent days
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {new Date(r.attendanceDate).toLocaleDateString([], {
                          weekday: 'short',
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
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {r.workedMinutes ? `${(r.workedMinutes / 60).toFixed(1)} hrs` : '--'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          {r.isLate && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Late ({r.lateMinutes}m)
                            </span>
                          )}
                          {r.isEarlyExit && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Early Exit ({r.earlyMinutes}m)
                            </span>
                          )}
                          {!r.isLate && !r.isEarlyExit && <span className="text-slate-400">None</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
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
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/attendance/regularisation?recordId=${r.id}`}
                          className="text-xs text-[#1E3A8A] hover:underline font-semibold"
                        >
                          Regularise
                        </Link>
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
