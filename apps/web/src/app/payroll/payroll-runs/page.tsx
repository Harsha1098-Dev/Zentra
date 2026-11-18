'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PayrollNav } from '../payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import {
  PlayCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Building2,
  Lock,
} from 'lucide-react';
import {
  PayrollRunStatus,
  PayrollRunType,
  PermissionCode,
} from '@zentra/shared-types';

export default function PayrollRunsPage() {
  const router = useRouter();
  const { permissions, roles, activeOrganization } = useAuth();

  const [runs, setRuns] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [runName, setRunName] = useState('');
  const [runType, setRunType] = useState<string>(PayrollRunType.REGULAR);

  const canCreate =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_RUN_CREATE);

  async function loadData() {
    try {
      setLoading(true);
      const [runsData, periodsData] = await Promise.all([
        ApiClient.get('/payroll/runs').catch(() => []),
        ApiClient.get('/payroll/periods').catch(() => []),
      ]);
      setRuns(Array.isArray(runsData) ? runsData : []);
      const pList = Array.isArray(periodsData) ? periodsData : [];
      setPeriods(pList);

      if (pList.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(pList[0].id);
        setRunName(`${pList[0].payrollMonth} Regular Payroll`);
      }
    } catch (err) {
      console.error('Failed to load payroll runs', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  async function handleCreateRun(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const created = await ApiClient.post('/payroll/runs', {
        payrollPeriodId: selectedPeriodId,
        runName: runName.trim(),
        runType,
      });

      setShowModal(false);
      router.push(`/payroll/payroll-runs/${created.id}`);
    } catch (err: any) {
      setModalError(err.message || 'Failed to initialize payroll run');
    } finally {
      setModalLoading(false);
    }
  }

  const filtered = runs.filter((r) => {
    const matchesSearch =
      r.runName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.payrollPeriod?.payrollMonth || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payroll Runs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Initialize, calculate, review, disburse, and publish employee salary cycles.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setModalError(null);
                setShowModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Initialize Payroll Run</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by run name or period..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            {['ALL', 'DRAFT', 'CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'PUBLISHED'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Runs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading payroll runs...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <PlayCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900">No payroll runs found</h4>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm
                  ? 'Try a different filter or search term'
                  : 'Start a new payroll cycle by clicking "Initialize Payroll Run".'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Payroll Run</th>
                    <th className="py-3 px-6">Period</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Staff Count</th>
                    <th className="py-3 px-6">Total Gross</th>
                    <th className="py-3 px-6">Total Deductions</th>
                    <th className="py-3 px-6">Net Payable</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <Link
                          href={`/payroll/payroll-runs/${run.id}`}
                          className="font-semibold text-slate-900 hover:underline block"
                        >
                          {run.runName}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          Created {new Date(run.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-700">
                        {run.payrollPeriod?.payrollMonth || '—'}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600">
                        {run.runType}
                      </td>
                      <td className="py-3.5 px-6 text-slate-800 font-semibold">
                        {run.totalEmployeeCount || 0}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        ₹ {Number(run.totalGrossEarnings || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 text-rose-600 font-medium">
                        ₹ {Number(run.totalDeductions || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        ₹ {Number(run.totalNetPay || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            run.status === 'PAID' || run.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : run.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : run.status === 'UNDER_REVIEW'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : run.status === 'CALCULATED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/payroll/payroll-runs/${run.id}`}
                          className="text-xs font-semibold text-slate-900 hover:text-indigo-600 inline-flex items-center space-x-1"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Start Payroll Run */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Initialize Payroll Run
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRun} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Payroll Period *
                </label>
                <select
                  required
                  value={selectedPeriodId}
                  onChange={(e) => {
                    setSelectedPeriodId(e.target.value);
                    const p = periods.find((item) => item.id === e.target.value);
                    if (p) setRunName(`${p.payrollMonth} Regular Payroll`);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.payrollMonth} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Run Label / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. November 2026 Regular Payroll"
                  value={runName}
                  onChange={(e) => setRunName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Run Type *
                </label>
                <select
                  value={runType}
                  onChange={(e) => setRunType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value={PayrollRunType.REGULAR}>REGULAR</option>
                  <option value={PayrollRunType.OFF_CYCLE}>OFF_CYCLE</option>
                  <option value={PayrollRunType.BONUS}>BONUS</option>
                  <option value={PayrollRunType.FINAL_SETTLEMENT}>
                    FINAL_SETTLEMENT
                  </option>
                </select>
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
                  {modalLoading ? 'Creating...' : 'Initialize & Open Workbench'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
