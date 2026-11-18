'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LeaveNav } from './leave-nav';
import { ApiClient } from '../../lib/api';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { LeaveBalanceDto, LeaveRequestDto } from '@zentra/shared-types';

export default function LeaveDashboardPage() {
  const [balances, setBalances] = useState<LeaveBalanceDto[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequestDto[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setIsLoading(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      const [balancesRes, requestsRes, calendarRes] = await Promise.all([
        ApiClient.request<LeaveBalanceDto[]>(`/leave-balances/me?year=${year}`).catch(() => []),
        ApiClient.request<{ data: LeaveRequestDto[] }>('/leave-requests/me?limit=5').catch(() => ({ data: [] })),
        ApiClient.request<any[]>('/leave-calendar').catch(() => []),
      ]);

      setBalances(balancesRes || []);
      setRecentRequests(requestsRes.data || []);
      // Filter upcoming holidays
      const todayStr = new Date().toISOString().slice(0, 10);
      const holidays = (calendarRes || [])
        .filter((e: any) => e.type === 'holiday' && e.startDate >= todayStr)
        .slice(0, 4);
      setUpcomingHolidays(holidays);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  const totalAvailable = balances.reduce((sum, b) => sum + (b.availableBalance || 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + (b.used || 0), 0);
  const totalPending = balances.reduce((sum, b) => sum + (b.pending || 0), 0);
  const compOffBalance = balances.find((b) => b.leaveTypeCode === 'COMP_OFF')?.availableBalance || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Quick Action Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your available leave balances, upcoming holidays, and manage time-off requests.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/leave/comp-off"
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Claim Comp-Off</span>
            </Link>
            <Link
              href="/leave/apply"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Apply for Leave</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6 text-[#1E3A8A]" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Available Balance</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalAvailable} days</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Ready to use</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Leaves Taken</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalUsed} days</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">This calendar year</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pending Approval</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalPending} days</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting manager</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Comp-Off Days</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{compOffBalance} days</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">From weekend/holiday work</p>
            </div>
          </div>
        </div>

        {/* Balances Breakdown Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your Leave Balances</h2>
            <Link
              href="/leave/my-balance"
              className="text-xs font-medium text-[#1E3A8A] hover:underline flex items-center space-x-1"
            >
              <span>View Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : balances.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              No leave balances assigned yet. Please contact your HR administrator.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {balances.map((bal) => {
                const totalAlloc = bal.openingBalance + bal.granted + bal.accrued + bal.carryForward + bal.adjustment;
                const percent = totalAlloc > 0 ? Math.min(100, Math.round((bal.used / totalAlloc) * 100)) : 0;
                return (
                  <div
                    key={bal.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: bal.leaveTypeColor || '#3B82F6' }}
                          />
                          <h3 className="text-sm font-semibold text-slate-800">{bal.leaveTypeName}</h3>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-100 text-slate-600">
                          {bal.leaveTypeCode}
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline justify-between">
                        <div>
                          <span className="text-3xl font-extrabold text-slate-900">{bal.availableBalance}</span>
                          <span className="text-xs text-slate-500 ml-1">days left</span>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <div>Allocated: {totalAlloc}</div>
                          <div>Used: {bal.used}</div>
                        </div>
                      </div>

                      <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: bal.leaveTypeColor || '#1E3A8A',
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {bal.pending > 0 ? `${bal.pending} pending approval` : 'No pending requests'}
                      </span>
                      <Link
                        href={`/leave/apply?leaveTypeId=${bal.leaveTypeId}`}
                        className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                      >
                        Apply
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Section: Recent Requests & Upcoming Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Requests Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Leave Applications</h3>
                <p className="text-xs text-slate-500 mt-0.5">Your most recent leave submissions</p>
              </div>
              <Link
                href="/leave/my-requests"
                className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading requests...</div>
            ) : recentRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                You haven&apos;t applied for any leaves yet. Click &quot;Apply for Leave&quot; above to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Leave Type</th>
                      <th className="px-5 py-3 font-semibold">Dates</th>
                      <th className="px-5 py-3 font-semibold">Days</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentRequests.map((req) => {
                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      );
                      if (req.status === 'APPROVED') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved
                          </span>
                        );
                      } else if (req.status === 'REJECTED') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Rejected
                          </span>
                        );
                      } else if (req.status.includes('CANCEL')) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Cancelled
                          </span>
                        );
                      }

                      return (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900">{req.leaveTypeName}</td>
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                            {req.fromDate.slice(0, 10)} to {req.toDate.slice(0, 10)}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{req.numberOfDays}</td>
                          <td className="px-5 py-3">{statusBadge}</td>
                          <td className="px-5 py-3 text-right text-slate-500 truncate max-w-xs">{req.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Holidays Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Upcoming Holidays</span>
                </h3>
                <Link href="/leave/calendar" className="text-xs text-[#1E3A8A] hover:underline font-semibold">
                  Calendar
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {upcomingHolidays.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No upcoming public holidays this month.</p>
                ) : (
                  upcomingHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{h.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{h.startDate}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">
                        Public Holiday
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100">
              <Link
                href="/leave/calendar"
                className="w-full inline-flex items-center justify-center space-x-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <span>Open Company Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
