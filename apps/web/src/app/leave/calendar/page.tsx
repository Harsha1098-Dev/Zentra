'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  AlertCircle,
  X,
  Info,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  type: 'leave' | 'holiday' | 'weekend';
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  color?: string;
  status?: string;
  employee?: {
    id: string;
    employeeCode?: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string | null;
    departmentName?: string;
  };
  reason?: string;
  leaveTypeName?: string;
  isSelf: boolean;
}

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scope, setScope] = useState<'me' | 'team' | 'department' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadEvents();
  }, [year, month, scope]);

  async function loadEvents() {
    setIsLoading(true);
    setError(null);
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startStr = firstDay.toISOString().slice(0, 10);
      const endStr = lastDay.toISOString().slice(0, 10);

      const res = await ApiClient.request<CalendarEvent[]>(
        `/leave-calendar?startDate=${startStr}&endDate=${endStr}&scope=${scope}`,
      );
      setEvents(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  }

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{ date: number; fullDate: string; isCurrentMonth: boolean; isWeekend: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateStr = new Date(year, month - 1, d).toISOString().slice(0, 10);
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      days.push({
        date: d,
        fullDate: dateStr,
        isCurrentMonth: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toISOString().slice(0, 10);
      const dayOfWeek = dateObj.getDay();
      days.push({
        date: d,
        fullDate: dateStr,
        isCurrentMonth: true,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Next month padding to fill complete grid of 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const dateObj = new Date(year, month + 1, i);
      const dateStr = dateObj.toISOString().slice(0, 10);
      const dayOfWeek = dateObj.getDay();
      days.push({
        date: i,
        fullDate: dateStr,
        isCurrentMonth: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return days;
  }, [year, month]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Leave Calendar</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              View public holidays, team schedules, and upcoming time-off across the organization.
            </p>
          </div>

          {/* Scope Filter */}
          <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm self-start sm:self-auto">
            {[
              { id: 'all', label: 'All Company' },
              { id: 'team', label: 'My Team' },
              { id: 'department', label: 'Department' },
              { id: 'me', label: 'My Leaves' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setScope(tab.id as any)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  scope === tab.id ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Month Navigation & Legend Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-slate-900">
              {monthNames[month]} {year}
            </h2>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-600 flex-wrap gap-y-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Public Holiday</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>My Leave</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Colleague Leave</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span>Weekend</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((day, idx) => {
              const isToday = day.fullDate === todayStr;
              const dayEvents = events.filter((e) => {
                return day.fullDate >= e.startDate && day.fullDate <= e.endDate;
              });

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                    !day.isCurrentMonth
                      ? 'bg-slate-50/50 text-slate-400'
                      : day.isWeekend
                      ? 'bg-slate-50/70 text-slate-700'
                      : 'bg-white text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-[#1E3A8A] text-white font-bold'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.date}
                    </span>
                    {day.isWeekend && day.isCurrentMonth && (
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Weekend</span>
                    )}
                  </div>

                  {/* Events Badges */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] scrollbar-none">
                    {dayEvents.map((evt) => {
                      const isHoliday = evt.type === 'holiday';
                      const badgeBg = isHoliday
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : evt.isSelf
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold'
                        : 'bg-slate-100 text-slate-800 border border-slate-200';

                      return (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className={`w-full text-left truncate px-1.5 py-0.5 rounded text-[11px] leading-tight block hover:opacity-80 transition-opacity ${badgeBg}`}
                          title={evt.title}
                        >
                          {evt.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedEvent.type === 'holiday' ? 'Public Holiday' : 'Leave Details'}
                </h3>
                <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-500">Event:</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedEvent.title}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500">Date Range:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedEvent.startDate}
                    {selectedEvent.endDate !== selectedEvent.startDate ? ` to ${selectedEvent.endDate}` : ''}
                  </p>
                </div>

                {selectedEvent.employee && (
                  <div>
                    <span className="font-semibold text-slate-500">Employee:</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {selectedEvent.employee.firstName} {selectedEvent.employee.lastName}
                      {selectedEvent.employee.departmentName ? ` • ${selectedEvent.employee.departmentName}` : ''}
                    </p>
                  </div>
                )}

                {selectedEvent.leaveTypeName && (
                  <div>
                    <span className="font-semibold text-slate-500">Type:</span>
                    <p className="font-medium text-slate-800 mt-0.5">{selectedEvent.leaveTypeName}</p>
                  </div>
                )}

                {selectedEvent.reason && (
                  <div>
                    <span className="font-semibold text-slate-500">Note / Reason:</span>
                    <p className="font-medium text-slate-800 mt-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                      {selectedEvent.reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
