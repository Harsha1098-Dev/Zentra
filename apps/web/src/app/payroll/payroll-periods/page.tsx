'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { PayrollPeriodStatus, PermissionCode } from '@zentra/shared-types';

export default function PayrollPeriodsPage() {
  const { permissions, roles, activeOrganization } = useAuth();

  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payDate, setPayDate] = useState('');
  const [attendanceCutoff, setAttendanceCutoff] = useState('');
  const [leaveCutoff, setLeaveCutoff] = useState('');
  const [payrollCutoff, setPayrollCutoff] = useState('');

  const canManage =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_PERIOD_CREATE);

  async function loadPeriods() {
    try {
      setLoading(true);
      const data = await ApiClient.get(`/payroll/periods?year=${selectedYear}`);
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load periods', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadPeriods();
    }
  }, [activeOrganization, selectedYear]);

  function initDatesForMonth(m: number, y: number) {
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 0)); // last day of month
    const pay = new Date(Date.UTC(y, m, 0));
    const attCut = new Date(Date.UTC(y, m - 1, Math.min(25, end.getDate())));
    const lveCut = new Date(Date.UTC(y, m - 1, Math.min(25, end.getDate())));
    const payCut = new Date(Date.UTC(y, m - 1, Math.min(27, end.getDate())));

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setPayDate(pay.toISOString().split('T')[0]);
    setAttendanceCutoff(attCut.toISOString().split('T')[0]);
    setLeaveCutoff(lveCut.toISOString().split('T')[0]);
    setPayrollCutoff(payCut.toISOString().split('T')[0]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const payrollMonth = `${monthNames[month - 1]} ${year}`;

    try {
      await ApiClient.post('/payroll/periods', {
        payrollYear: Number(year),
        payrollMonth: Number(month),
        periodStartDate: startDate,
        periodEndDate: endDate,
        payDate,
        attendanceCutoffDate: attendanceCutoff,
        leaveCutoffDate: leaveCutoff,
        payrollCutoffDate: payrollCutoff,
      });

      setShowModal(false);
      await loadPeriods();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create payroll period');
    } finally {
      setModalLoading(false);
    }
  }

  async function toggleStatus(id: string, action: 'open' | 'lock') {
    try {
      if (!confirm(`Are you sure you want to ${action} this payroll period?`)) return;
      await ApiClient.post(`/payroll/periods/${id}/${action}`, {});
      await loadPeriods();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} period`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payroll Periods & Calendar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure monthly pay cycles, attendance cutoffs, leave submission dead-lines, and pay dates.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            {canManage && (
              <button
                onClick={() => {
                  initDatesForMonth(month, year);
                  setModalError(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Period</span>
              </button>
            )}
          </div>
        </div>

        {/* Periods Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading payroll periods...</div>
          ) : periods.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900">No periods created for {selectedYear}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Create monthly periods to establish cutoffs for attendance and leave calculation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Period Month</th>
                    <th className="py-3 px-6">Date Range</th>
                    <th className="py-3 px-6">Pay Date</th>
                    <th className="py-3 px-6">Attendance Cutoff</th>
                    <th className="py-3 px-6">Leave Cutoff</th>
                    <th className="py-3 px-6">Payroll Cutoff</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {periods.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {p.payrollMonth}
                        <div className="text-[11px] text-slate-400 font-normal">
                          {p.runs?.length || 0} run(s) logged
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 font-mono text-[11px]">
                        {new Date(p.periodStartDate).toLocaleDateString()} –{' '}
                        {new Date(p.periodEndDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-slate-900 font-medium">
                        {new Date(p.payDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {new Date(p.attendanceCutoffDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {new Date(p.leaveCutoffDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {new Date(p.payrollCutoffDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'LOCKED'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        {canManage && p.status === 'UPCOMING' && (
                          <button
                            onClick={() => toggleStatus(p.id, 'open')}
                            className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 rounded border border-emerald-200 bg-emerald-50"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Open</span>
                          </button>
                        )}
                        {canManage && p.status === 'OPEN' && (
                          <button
                            onClick={() => toggleStatus(p.id, 'lock')}
                            className="inline-flex items-center space-x-1 text-slate-700 hover:text-slate-900 font-semibold px-2 py-1 rounded border border-slate-300 bg-slate-50"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Lock</span>
                          </button>
                        )}
                        {p.status === 'LOCKED' && (
                          <span className="text-[11px] text-slate-400 italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Period */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Create Monthly Payroll Period
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Month *
                  </label>
                  <select
                    value={month}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setMonth(m);
                      initDatesForMonth(m, year);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    {[
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ].map((name, i) => (
                      <option key={i + 1} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      setYear(y);
                      initDatesForMonth(month, y);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Period Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Period End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursement Pay Date *
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Processing Cutoff Deadlines
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Attendance Cutoff *
                    </label>
                    <input
                      type="date"
                      required
                      value={attendanceCutoff}
                      onChange={(e) => setAttendanceCutoff(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Leave Cutoff *
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveCutoff}
                      onChange={(e) => setLeaveCutoff(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Payroll Cutoff *
                    </label>
                    <input
                      type="date"
                      required
                      value={payrollCutoff}
                      onChange={(e) => setPayrollCutoff(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {modalLoading ? 'Creating...' : 'Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
