'use client';

import React, { useEffect, useState } from 'react';
import { AttendanceNav } from '../attendance-nav';
import { ApiClient } from '../../../lib/api';
import {
  Settings,
  ShieldAlert,
  Clock,
  Layers,
  Lock,
  Unlock,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  FileCheck,
} from 'lucide-react';

export default function AttendanceSettingsPage() {
  const [activeTab, setActiveTab] = useState<'policies' | 'shifts' | 'rosters' | 'locks'>('policies');
  const [policies, setPolicies] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);
  const [locks, setLocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  // New Policy Form
  const [pName, setPName] = useState('');
  const [pCode, setPCode] = useState('');
  const [pMode, setPMode] = useState('STRICT');
  const [pMinHoursFull, setPMinHoursFull] = useState(8.0);
  const [pMinHoursHalf, setPMinHoursHalf] = useState(4.0);
  const [pGraceLate, setPGraceLate] = useState(15);
  const [pGraceEarly, setPGraceEarly] = useState(15);
  const [pAllowOt, setPAllowOt] = useState(true);
  const [pIsDefault, setPIsDefault] = useState(false);

  // New Shift Form
  const [sName, setSName] = useState('');
  const [sCode, setSCode] = useState('');
  const [sStart, setSStart] = useState('09:00');
  const [sEnd, setSEnd] = useState('17:00');
  const [sBreak, setSBreak] = useState(60);
  const [sIsOvernight, setSIsOvernight] = useState(false);
  const [sIsPaidBreak, setSIsPaidBreak] = useState(false);

  // New Lock Form
  const [lockName, setLockName] = useState('November Payroll Cutoff');
  const [lockStart, setLockStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  );
  const [lockEnd, setLockEnd] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().slice(0, 10),
  );
  const [lockRemarks, setLockRemarks] = useState('');

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  async function loadTabContent() {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'policies') {
        const res = await ApiClient.request<any[]>('/attendance-policies');
        setPolicies(res || []);
      } else if (activeTab === 'shifts') {
        const res = await ApiClient.request<any[]>('/shifts');
        setShifts(res || []);
      } else if (activeTab === 'rosters') {
        const res = await ApiClient.request<any[]>('/rosters');
        setRosters(res || []);
      } else if (activeTab === 'locks') {
        const res = await ApiClient.request<any[]>('/attendance-locks');
        setLocks(res || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ApiClient.request('/attendance-policies', {
        method: 'POST',
        body: JSON.stringify({
          name: pName,
          code: pCode.toUpperCase().replace(/\s+/g, '_'),
          mode: pMode,
          minHoursFullDay: Number(pMinHoursFull),
          minHoursHalfDay: Number(pMinHoursHalf),
          gracePeriodLateCheckIn: Number(pGraceLate),
          gracePeriodEarlyCheckOut: Number(pGraceEarly),
          allowOvertime: pAllowOt,
          isDefault: pIsDefault,
        }),
      });
      setSuccessMsg('Attendance policy created successfully!');
      setShowPolicyModal(false);
      setPName('');
      setPCode('');
      await loadTabContent();
    } catch (err: any) {
      setError(err.message || 'Policy creation failed');
    }
  }

  async function handleCreateShift(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ApiClient.request('/shifts', {
        method: 'POST',
        body: JSON.stringify({
          name: sName,
          code: sCode.toUpperCase().replace(/\s+/g, '_'),
          startTime: sStart,
          endTime: sEnd,
          breakDurationMinutes: Number(sBreak),
          isOvernight: sIsOvernight,
          isPaidBreak: sIsPaidBreak,
        }),
      });
      setSuccessMsg('Shift created successfully!');
      setShowShiftModal(false);
      setSName('');
      setSCode('');
      await loadTabContent();
    } catch (err: any) {
      setError(err.message || 'Shift creation failed');
    }
  }

  async function handleCreateLock(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ApiClient.request('/attendance-locks', {
        method: 'POST',
        body: JSON.stringify({
          name: lockName,
          startDate: new Date(lockStart).toISOString(),
          endDate: new Date(lockEnd).toISOString(),
          remarks: lockRemarks,
        }),
      });
      setSuccessMsg('Attendance period locked successfully! All modifications in this date range are now frozen.');
      setShowLockModal(false);
      setLockRemarks('');
      await loadTabContent();
    } catch (err: any) {
      setError(err.message || 'Period lock failed');
    }
  }

  async function handleUnlockPeriod(id: string) {
    if (!window.confirm('Are you sure you want to unlock this attendance period?')) return;
    try {
      await ApiClient.request(`/attendance-locks/${id}/unlock`, {
        method: 'PATCH',
      });
      setSuccessMsg('Attendance period unlocked!');
      await loadTabContent();
    } catch (err: any) {
      setError(err.message || 'Unlock failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AttendanceNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Configuration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage attendance policies, shift timings, overnight schedules, and payroll cutoff period freezes
          </p>
        </div>

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

        {/* Tab Headers */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'policies'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Attendance Policies ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'shifts'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Shifts & Timings ({shifts.length})
          </button>
          <button
            onClick={() => setActiveTab('rosters')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'rosters'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Rosters ({rosters.length})
          </button>
          <button
            onClick={() => setActiveTab('locks')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'locks'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Payroll Period Locks ({locks.length})
          </button>
        </div>

        {/* TAB 1: POLICIES */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Policy</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {policies.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{p.code}</span>
                    </div>
                    {p.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        DEFAULT
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mode:</span>
                      <span className="font-semibold uppercase">{p.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min Full Day:</span>
                      <span className="font-semibold">{Number(p.minHoursFullDay)} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min Half Day:</span>
                      <span className="font-semibold">{Number(p.minHoursHalfDay)} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grace Late:</span>
                      <span className="font-semibold">{p.gracePeriodLateCheckIn} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grace Early:</span>
                      <span className="font-semibold">{p.gracePeriodEarlyCheckOut} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Allow Overtime:</span>
                      <span className="font-semibold">{p.allowOvertime ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SHIFTS */}
        {activeTab === 'shifts' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowShiftModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Shift</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{s.code}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.isOvernight
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {s.isOvernight ? 'OVERNIGHT' : 'DAY SHIFT'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timings:</span>
                      <span className="font-bold text-slate-800">
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Break:</span>
                      <span className="font-semibold">
                        {s.breakDurationMinutes} mins ({s.isPaidBreak ? 'Paid' : 'Unpaid'})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Check-In Margin:</span>
                      <span className="font-semibold">{s.checkInMarginBeforeMinutes} mins before</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Check-Out Margin:</span>
                      <span className="font-semibold">{s.checkOutMarginAfterMinutes} mins after</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ROSTERS */}
        {activeTab === 'rosters' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Work Rosters</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Roster Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">End Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Shifts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rosters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No rosters defined yet
                      </td>
                    </tr>
                  ) : (
                    rosters.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{r.code}</td>
                        <td className="px-4 py-3 text-slate-700">{new Date(r.startDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-700">{new Date(r.endDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r._count?.shiftAssignments || 0} employees</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LOCKS */}
        {activeTab === 'locks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Payroll Cutoff Attendance Locks</h3>
                <p className="text-xs text-slate-500">
                  Freezes all check-ins, check-outs, and regularisations for a given date range ahead of payroll processing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLockModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Attendance Period</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Lock Name</th>
                      <th className="px-4 py-3">Start Date</th>
                      <th className="px-4 py-3">End Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Locked At</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {locks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          No attendance periods locked
                        </td>
                      </tr>
                    ) : (
                      locks.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">{l.name}</td>
                          <td className="px-4 py-3 text-slate-700">{new Date(l.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-slate-700">{new Date(l.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                l.status === 'LOCKED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{new Date(l.lockedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            {l.status === 'LOCKED' && (
                              <button
                                type="button"
                                onClick={() => handleUnlockPeriod(l.id)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold transition-colors"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Policy */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Create Attendance Policy</h3>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Policy Name</label>
                    <input
                      type="text"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      required
                      placeholder="e.g. Headquarters Standard"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Policy Code</label>
                    <input
                      type="text"
                      value={pCode}
                      onChange={(e) => setPCode(e.target.value)}
                      required
                      placeholder="e.g. POLICY_HQ"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mode</label>
                    <select
                      value={pMode}
                      onChange={(e) => setPMode(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="STRICT">Strict</option>
                      <option value="LENIENT">Lenient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Min Full Day (h)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={pMinHoursFull}
                      onChange={(e) => setPMinHoursFull(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Min Half Day (h)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={pMinHoursHalf}
                      onChange={(e) => setPMinHoursHalf(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Grace Late Check-In (mins)</label>
                    <input
                      type="number"
                      value={pGraceLate}
                      onChange={(e) => setPGraceLate(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Grace Early Check-Out (mins)</label>
                    <input
                      type="number"
                      value={pGraceEarly}
                      onChange={(e) => setPGraceEarly(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pAllowOt}
                      onChange={(e) => setPAllowOt(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Allow Overtime Tracking</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pIsDefault}
                      onChange={(e) => setPIsDefault(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Set as Default Policy</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg font-semibold transition-colors"
                  >
                    Create Policy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Shift */}
        {showShiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Create Shift Timing</h3>
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateShift} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Shift Name</label>
                    <input
                      type="text"
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      required
                      placeholder="e.g. Night Shift"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Shift Code</label>
                    <input
                      type="text"
                      value={sCode}
                      onChange={(e) => setSCode(e.target.value)}
                      required
                      placeholder="e.g. SHIFT_NIGHT"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time (HH:mm)</label>
                    <input
                      type="text"
                      value={sStart}
                      onChange={(e) => setSStart(e.target.value)}
                      required
                      placeholder="22:00"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Time (HH:mm)</label>
                    <input
                      type="text"
                      value={sEnd}
                      onChange={(e) => setSEnd(e.target.value)}
                      required
                      placeholder="06:00"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Break Duration (mins)</label>
                  <input
                    type="number"
                    value={sBreak}
                    onChange={(e) => setSBreak(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sIsOvernight}
                      onChange={(e) => setSIsOvernight(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Overnight Shift (Spans across midnight)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sIsPaidBreak}
                      onChange={(e) => setSIsPaidBreak(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">Paid Break Minutes</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowShiftModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg font-semibold transition-colors"
                  >
                    Create Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Lock Attendance Period */}
        {showLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Lock Attendance Period</h3>
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLock} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lock Name / Cutoff Batch</label>
                  <input
                    type="text"
                    value={lockName}
                    onChange={(e) => setLockName(e.target.value)}
                    required
                    placeholder="e.g. November Payroll Cutoff"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={lockStart}
                      onChange={(e) => setLockStart(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={lockEnd}
                      onChange={(e) => setLockEnd(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={lockRemarks}
                    onChange={(e) => setLockRemarks(e.target.value)}
                    placeholder="Reason for locking..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLockModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Lock Period
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
