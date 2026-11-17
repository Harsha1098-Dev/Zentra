'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../../lib/api';
import {
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Globe,
  Info,
} from 'lucide-react';
import { DayOfWeek, WorkweekDto } from '@zentra/shared-types';

const ALL_DAYS: { code: DayOfWeek; label: string; short: string }[] = [
  { code: DayOfWeek.MONDAY, label: 'Monday', short: 'Mon' },
  { code: DayOfWeek.TUESDAY, label: 'Tuesday', short: 'Tue' },
  { code: DayOfWeek.WEDNESDAY, label: 'Wednesday', short: 'Wed' },
  { code: DayOfWeek.THURSDAY, label: 'Thursday', short: 'Thu' },
  { code: DayOfWeek.FRIDAY, label: 'Friday', short: 'Fri' },
  { code: DayOfWeek.SATURDAY, label: 'Saturday', short: 'Sat' },
  { code: DayOfWeek.SUNDAY, label: 'Sunday', short: 'Sun' },
];

export default function WorkweekSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>([
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
  ]);

  const [dailyStartTime, setDailyStartTime] = useState('09:00');
  const [dailyEndTime, setDailyEndTime] = useState('18:00');
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(60);
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    loadWorkweek();
  }, []);

  const loadWorkweek = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.request<WorkweekDto>('/workweek');
      if (data) {
        setWorkingDays(data.weeklyWorkingDays || []);
        setDailyStartTime(data.dailyStartTime || '09:00');
        setDailyEndTime(data.dailyEndTime || '18:00');
        setBreakDurationMinutes(data.breakDurationMinutes ?? 60);
        setTimezone(data.timezone || 'UTC');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load workweek configuration' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) {
        setMessage({ type: 'error', text: 'At least one working day must be configured.' });
        return;
      }
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Calculate gross and net work hours
  const calculateHours = () => {
    const [startH, startM] = dailyStartTime.split(':').map(Number);
    const [endH, endM] = dailyEndTime.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      return { grossHours: 0, netHours: 0, totalWeeklyHours: 0 };
    }

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diffMinutes = Math.max(0, endMinutes - startMinutes);

    const grossHours = diffMinutes / 60;
    const netHours = Math.max(0, (diffMinutes - breakDurationMinutes) / 60);
    const totalWeeklyHours = netHours * workingDays.length;

    return {
      grossHours: Number(grossHours.toFixed(1)),
      netHours: Number(netHours.toFixed(1)),
      totalWeeklyHours: Number(totalWeeklyHours.toFixed(1)),
    };
  };

  const stats = calculateHours();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (dailyEndTime <= dailyStartTime) {
      setMessage({ type: 'error', text: 'Daily end time must be later than start time.' });
      setSaving(false);
      return;
    }

    if (workingDays.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one working day.' });
      setSaving(false);
      return;
    }

    const weekendDays = ALL_DAYS.map((d) => d.code).filter(
      (code) => !workingDays.includes(code),
    );

    try {
      const payload = {
        weeklyWorkingDays: workingDays,
        weekendDays,
        dailyStartTime,
        dailyEndTime,
        breakDurationMinutes: Number(breakDurationMinutes),
        timezone: timezone.trim(),
      };

      await ApiClient.request<WorkweekDto>('/workweek', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setMessage({ type: 'success', text: 'Workweek configuration updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update workweek' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Workweek & Schedule</h1>
        <p className="text-sm text-[#475569] mt-1">
          Configure default company working days, daily shift hours, meal break deductions, and organizational timezone.
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-[#059669] border-emerald-200'
              : 'bg-red-50 text-[#DC2626] border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-semibold">
            <Calendar className="w-4 h-4 text-[#1E3A8A]" />
            <span>Weekly Work Days</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#0F172A]">{workingDays.length}</span>
            <span className="text-xs text-[#64748B]">days / week</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-semibold">
            <Clock className="w-4 h-4 text-[#1E3A8A]" />
            <span>Net Daily Hours</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#0F172A]">{stats.netHours}</span>
            <span className="text-xs text-[#64748B]">hours / day ({stats.grossHours}h gross)</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-semibold">
            <Info className="w-4 h-4 text-[#1E3A8A]" />
            <span>Standard Weekly Load</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#0F172A]">{stats.totalWeeklyHours}</span>
            <span className="text-xs text-[#64748B]">hours / week</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Working Days Selector */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Working Days Selection</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select which days of the week are regular working days. Unselected days are treated as weekends.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {ALL_DAYS.map((day) => {
              const isWorking = workingDays.includes(day.code);
              return (
                <button
                  type="button"
                  key={day.code}
                  onClick={() => toggleDay(day.code)}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                    isWorking
                      ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-sm'
                      : 'bg-slate-50 border-[#E2E8F0] text-[#64748B] hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-semibold">{day.short}</span>
                  <span className="text-[11px] opacity-80">{isWorking ? 'Working' : 'Weekend'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Shift Timings & Break */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#1E3A8A]" />
            <span>Shift Timings & Break Deduction</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Standard Shift Start Time *
              </label>
              <input
                type="time"
                required
                value={dailyStartTime}
                onChange={(e) => setDailyStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Standard Shift End Time *
              </label>
              <input
                type="time"
                required
                value={dailyEndTime}
                onChange={(e) => setDailyEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Unpaid Break (Minutes) *
              </label>
              <div className="relative">
                <Coffee className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  max="360"
                  required
                  value={breakDurationMinutes}
                  onChange={(e) =>
                    setBreakDurationMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">Lunch & coffee break deduction</p>
            </div>
          </div>
        </div>

        {/* Timezone Configuration */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#1E3A8A]" />
            <span>Schedule Timezone</span>
          </h2>

          <div className="max-w-md">
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Primary Workweek Timezone *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. America/New_York, Europe/London, Asia/Kolkata, UTC"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
            <p className="text-[11px] text-[#64748B] mt-1">
              Timezone used to evaluate shift attendance and daily working hour boundaries.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Workweek Schedule'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
