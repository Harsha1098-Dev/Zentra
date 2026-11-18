'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PayrollNav } from './payroll-nav';
import { useAuth } from '../../context/auth-context';
import { ApiClient } from '../../lib/api';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  PlayCircle,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  PlusCircle,
  Building2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { RoleCode, PermissionCode } from '@zentra/shared-types';

export default function PayrollOverviewPage() {
  const router = useRouter();
  const { activeOrganization, permissions, roles } = useAuth();

  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [structuresCount, setStructuresCount] = useState(0);
  const [componentsCount, setComponentsCount] = useState(0);
  const [recentPeriod, setRecentPeriod] = useState<any | null>(null);

  const isPayrollAdmin =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN', 'FINANCE'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_RUN_CREATE);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [runsData, periodsData, structuresData, componentsData] = await Promise.all([
          ApiClient.get('/payroll/runs').catch(() => []),
          ApiClient.get('/payroll/periods').catch(() => []),
          ApiClient.get('/payroll/salary-structures').catch(() => []),
          ApiClient.get('/payroll/salary-components').catch(() => []),
        ]);

        setRuns(Array.isArray(runsData) ? runsData : []);
        setPeriods(Array.isArray(periodsData) ? periodsData : []);
        setStructuresCount(Array.isArray(structuresData) ? structuresData.length : 0);
        setComponentsCount(Array.isArray(componentsData) ? componentsData.length : 0);

        if (Array.isArray(periodsData) && periodsData.length > 0) {
          setRecentPeriod(periodsData[0]);
        }
      } catch (err) {
        console.error('Failed to load payroll overview', err);
      } finally {
        setLoading(false);
      }
    }

    if (activeOrganization) {
      loadDashboard();
    }
  }, [activeOrganization]);

  const latestRun = runs[0] || null;
  const totalNetPay = runs.reduce(
    (acc, r) => acc + (r.status === 'PAID' || r.status === 'PUBLISHED' ? Number(r.totalNetPay || 0) : 0),
    0,
  );
  const pendingApprovals = runs.filter((r) => r.status === 'UNDER_REVIEW').length;
  const draftRuns = runs.filter((r) => ['DRAFT', 'CALCULATED'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payroll Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              End-to-end automated salary processing, calculation formulas, bank transfers, and payslips.
            </p>
          </div>

          {isPayrollAdmin && (
            <div className="flex items-center space-x-3">
              <Link
                href="/payroll/payroll-periods"
                className="inline-flex items-center space-x-2 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Manage Periods</span>
              </Link>
              <Link
                href="/payroll/payroll-runs"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors"
              >
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <span>Start Payroll Run</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Net Disbursed
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-bold text-slate-900">
                ₹ {totalNetPay.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">All completed payroll cycles</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Under Review
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-bold text-slate-900">{pendingApprovals}</span>
              <span className="text-xs text-slate-500 ml-2">runs awaiting signoff</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Requires HR/Finance approval</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Salary Structures
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-bold text-slate-900">{structuresCount}</span>
              <span className="text-xs text-slate-500 ml-2">configured</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{componentsCount} active salary components</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Active Period
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base font-bold text-slate-900 truncate block">
                {recentPeriod ? recentPeriod.payrollMonth : 'No Open Period'}
              </span>
              <span className="text-xs font-medium text-emerald-600">
                {recentPeriod ? recentPeriod.status : 'Setup Required'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pay Date:{' '}
              {recentPeriod ? new Date(recentPeriod.payDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <PlayCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Payroll Runs & Register</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Initiate monthly payroll, import approved attendance and leaves, resolve exceptions, and generate payroll register snapshots.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{runs.length} runs on record</span>
              <Link
                href="/payroll/payroll-runs"
                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 inline-flex items-center space-x-1"
              >
                <span>Go to Runs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Salary Structures & CTC</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Define earnings, deductions, PF, ESI, professional tax, and CTC formulas. Assign templates to employees with revision histories.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{structuresCount} structures active</span>
              <Link
                href="/payroll/salary-structures"
                className="text-xs font-semibold text-slate-900 hover:text-emerald-600 inline-flex items-center space-x-1"
              >
                <span>Configure</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Payslip Templates & Portal</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Customize payslip brand layouts with merge tags. Publish payslips to employee self-service portal upon finance payment completion.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">PDF & HTML export ready</span>
              <Link
                href="/payroll/payslip-templates"
                className="text-xs font-semibold text-slate-900 hover:text-blue-600 inline-flex items-center space-x-1"
              >
                <span>Templates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Payroll Runs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Payroll Cycles</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Current and past payroll processing batches
              </p>
            </div>
            <Link
              href="/payroll/payroll-runs"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              View all runs →
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading payroll runs...</div>
          ) : runs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <PlayCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">No payroll runs yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Get started by creating your monthly period and running your first payroll calculation.
              </p>
              {isPayrollAdmin && (
                <Link
                  href="/payroll/payroll-runs"
                  className="mt-4 inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create First Run</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Payroll Run</th>
                    <th className="py-3 px-6">Period</th>
                    <th className="py-3 px-6">Employees</th>
                    <th className="py-3 px-6">Gross Pay</th>
                    <th className="py-3 px-6">Total Net Pay</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runs.slice(0, 5).map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        <Link
                          href={`/payroll/payroll-runs/${run.id}`}
                          className="hover:underline text-slate-900 font-semibold"
                        >
                          {run.runName}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-normal">
                          Type: {run.runType}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {run.payrollPeriod?.payrollMonth || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 font-medium">
                        {run.totalEmployeeCount || 0}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        ₹ {Number(run.totalGrossEarnings || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 text-slate-900 font-semibold">
                        ₹ {Number(run.totalNetPay || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
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
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors inline-block"
                        >
                          Manage Run
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
    </div>
  );
}
