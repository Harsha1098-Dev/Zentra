'use client';

import React, { useEffect, useState } from 'react';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  Calendar,
  Clock,
  AlertCircle,
  Briefcase,
  Layers,
} from 'lucide-react';

export default function ShiftsPage() {
  const [shift, setShift] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [todayRes, assignmentsRes] = await Promise.all([
        ApiClient.request<any>('/attendance/today').catch(() => null),
        ApiClient.request<any[]>('/shift-assignments').catch(() => []),
      ]);

      setShift(todayRes?.shift || null);
      setAssignments(assignmentsRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load shift information');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Schedule & Rosters</h1>
          <p className="text-xs text-slate-500 mt-1">
            View your assigned work shifts, roster calendar, and planned working hours
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Active Shift Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Current Active Shift</span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{shift?.name || 'General Day Shift'}</h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                shift?.isOvernight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {shift?.isOvernight ? 'Overnight Shift' : 'Regular Daytime'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500">Working Hours</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {shift?.startTime || '09:00'} - {shift?.endTime || '17:00'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500">Break Duration</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {shift?.breakDurationMinutes || 60} mins ({shift?.isPaidBreak ? 'Paid' : 'Unpaid'})
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500">Check-In Margin</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {shift?.checkInMarginBeforeMinutes || 60} mins before
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500">Check-Out Margin</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {shift?.checkOutMarginAfterMinutes || 120} mins after
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Rosters Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Shift Assignments & Rosters</h3>
            <span className="text-xs text-slate-500">{assignments.length} assignments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Shift Name</th>
                  <th className="px-4 py-3">Shift Timings</th>
                  <th className="px-4 py-3">Roster</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Loading schedule...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No specific shift assignments found. You are currently on the default organization shift.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{a.shift?.name}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {a.shift?.startTime} - {a.shift?.endTime}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{a.roster?.name || 'Standing Assignment'}</td>
                      <td className="px-4 py-3 text-slate-700">{new Date(a.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Ongoing'}
                      </td>
                      <td className="px-4 py-3">
                        {a.isOverride ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Override
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            Standard
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
