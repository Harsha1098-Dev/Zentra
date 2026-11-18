'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  UserCheck,
  Phone,
  Info,
  ArrowLeft,
} from 'lucide-react';
import {
  LeaveTypeDto,
  LeaveBalanceDto,
  LeaveDurationType,
} from '@zentra/shared-types';

function ApplyLeaveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLeaveTypeId = searchParams.get('leaveTypeId') || '';

  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceDto[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState(initialLeaveTypeId);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [durationType, setDurationType] = useState<LeaveDurationType>(LeaveDurationType.FULL_DAY);
  const [halfDayType, setHalfDayType] = useState<'first_half' | 'second_half'>('first_half');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [coveringEmployeeId, setCoveringEmployeeId] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  async function loadPrerequisites() {
    try {
      const year = new Date().getFullYear();
      const [typesRes, balancesRes, empsRes] = await Promise.all([
        ApiClient.request<{ data: LeaveTypeDto[] }>('/leave-types?isActive=true'),
        ApiClient.request<LeaveBalanceDto[]>(`/leave-balances/me?year=${year}`).catch(() => []),
        ApiClient.request<{ data: any[] }>('/employees?limit=100').catch(() => ({ data: [] })),
      ]);

      setLeaveTypes(typesRes.data || []);
      setBalances(balancesRes || []);
      setEmployees(empsRes.data || []);

      if (!leaveTypeId && typesRes.data && typesRes.data.length > 0) {
        setLeaveTypeId(typesRes.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load leave configuration');
    }
  }

  // Selected leave type details
  const selectedType = useMemo(
    () => leaveTypes.find((t) => t.id === leaveTypeId),
    [leaveTypes, leaveTypeId],
  );

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leaveTypeId === leaveTypeId),
    [balances, leaveTypeId],
  );

  // Estimate number of days
  const estimatedDays = useMemo(() => {
    if (!fromDate) return 0;
    if (durationType === LeaveDurationType.HALF_DAY) return 0.5;
    if (durationType === LeaveDurationType.QUARTER_DAY) return 0.25;
    if (durationType === LeaveDurationType.HOURLY) return 0.25;

    if (!toDate) return 1;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      // Exclude weekends roughly for preview
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }, [fromDate, toDate, durationType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!leaveTypeId) throw new Error('Please select a leave type');
      if (!fromDate) throw new Error('Please select a start date');
      if (!toDate && durationType === LeaveDurationType.FULL_DAY) {
        throw new Error('Please select an end date');
      }
      if (!reason || reason.trim().length < 3) {
        throw new Error('Please provide a reason (minimum 3 characters)');
      }

      await ApiClient.request('/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId,
          fromDate,
          toDate: durationType === LeaveDurationType.FULL_DAY ? toDate : fromDate,
          durationType,
          halfDayType: durationType === LeaveDurationType.HALF_DAY ? halfDayType : undefined,
          startTime: durationType === LeaveDurationType.HOURLY ? startTime : undefined,
          endTime: durationType === LeaveDurationType.HOURLY ? endTime : undefined,
          reason,
          attachmentUrl: attachmentUrl.trim() || undefined,
          coveringEmployeeId: coveringEmployeeId || undefined,
          contactNumber: contactNumber.trim() || undefined,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/leave/my-requests');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">Apply for Leave</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Submit a time-off application. Working days and weekends will be automatically calculated.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Leave application submitted successfully! Redirecting to your requests...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Leave Type & Balance Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Leave Type *</label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                required
              >
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code}) {type.isPaid ? '• Paid' : '• Unpaid'}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex flex-col justify-center">
              <span className="text-[11px] font-medium text-slate-500">Available Balance</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-[#1E3A8A]">
                  {selectedBalance ? selectedBalance.availableBalance : 0}
                </span>
                <span className="text-xs text-slate-500">days</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {selectedType?.allowsNegativeBalance ? 'Negative balance permitted' : 'Requires positive balance'}
              </span>
            </div>
          </div>

          {/* Duration Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Duration *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: LeaveDurationType.FULL_DAY, label: 'Full Day' },
                ...(selectedType?.allowsHalfDay ? [{ type: LeaveDurationType.HALF_DAY, label: 'Half Day' }] : []),
                ...(selectedType?.allowsQuarterDay ? [{ type: LeaveDurationType.QUARTER_DAY, label: 'Quarter Day' }] : []),
                ...(selectedType?.allowsHourly ? [{ type: LeaveDurationType.HOURLY, label: 'Hourly' }] : []),
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => {
                    setDurationType(opt.type);
                    if (opt.type !== LeaveDurationType.FULL_DAY && fromDate) {
                      setToDate(fromDate);
                    }
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    durationType === opt.type
                      ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Half-Day Type Selector */}
          {durationType === LeaveDurationType.HALF_DAY && (
            <div className="flex items-center space-x-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <span className="font-semibold text-blue-900">Session:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="halfDay"
                  checked={halfDayType === 'first_half'}
                  onChange={() => setHalfDayType('first_half')}
                  className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span>First Half (Morning)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="halfDay"
                  checked={halfDayType === 'second_half'}
                  onChange={() => setHalfDayType('second_half')}
                  className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span>Second Half (Afternoon)</span>
              </label>
            </div>
          )}

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">From Date *</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  if (durationType !== LeaveDurationType.FULL_DAY || !toDate) {
                    setToDate(e.target.value);
                  }
                }}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                required
              />
            </div>

            {durationType === LeaveDurationType.FULL_DAY && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">To Date *</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                />
              </div>
            )}
          </div>

          {/* Estimated Days Callout */}
          {fromDate && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-600">
                <Info className="w-4 h-4 text-[#1E3A8A]" />
                <span>Estimated working days (excluding weekends & holidays):</span>
              </div>
              <span className="font-extrabold text-[#1E3A8A] text-sm">{estimatedDays} day(s)</span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Reason for Leave *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details regarding your leave request..."
              className="w-full text-xs font-medium border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              required
            />
          </div>

          {/* Covering Employee & Contact Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Covering Colleague (Optional)</span>
              </label>
              <select
                value={coveringEmployeeId}
                onChange={(e) => setCoveringEmployeeId(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              >
                <option value="">Select a colleague</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Emergency Contact Number</span>
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          {/* Attachment URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              <span>Medical / Supporting Document URL</span>
            </label>
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://example.com/medical-certificate.pdf"
              className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
            {selectedType?.requiresAttachment && (
              <p className="text-[11px] text-amber-600 font-medium">
                Note: A supporting document is required for this leave type when taking more than{' '}
                {selectedType.attachmentRequiredDays} consecutive days.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="px-6 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function ApplyLeavePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading leave form...</div>}>
      <ApplyLeaveContent />
    </Suspense>
  );
}
