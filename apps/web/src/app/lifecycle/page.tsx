'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifecycleNav } from './lifecycle-nav';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import {
  UserCheck,
  Clock,
  ArrowRightLeft,
  TrendingUp,
  DollarSign,
  LogOut,
  ShieldCheck,
  UserX,
  Package,
  FileText,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  Activity,
  Layers,
} from 'lucide-react';

export default function LifecycleDashboardPage() {
  const { activeOrganization, isLoading: isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOnboardings: 0,
    pendingProbations: 0,
    openTransfers: 0,
    openPromotions: 0,
    pendingSalaryRevisions: 0,
    activeResignations: 0,
    pendingClearances: 0,
    activeOffboardings: 0,
    assignedAssets: 0,
    totalAssets: 0,
    totalLetters: 0,
  });

  const [recentTransitions, setRecentTransitions] = useState<any[]>([]);
  const [recentOnboardings, setRecentOnboardings] = useState<any[]>([]);

  useEffect(() => {
    if (activeOrganization) {
      loadStats();
    }
  }, [activeOrganization]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [
        onboardingRuns,
        probations,
        transfers,
        promotions,
        salaryRevs,
        resignations,
        clearances,
        offboardings,
        assets,
        letters,
      ] = await Promise.all([
        ApiClient.get('/onboarding-runs').catch(() => []),
        ApiClient.get('/probation-reviews').catch(() => []),
        ApiClient.get('/employee-transfers').catch(() => []),
        ApiClient.get('/employee-promotions').catch(() => []),
        ApiClient.get('/salary-revisions').catch(() => []),
        ApiClient.get('/resignation-requests').catch(() => []),
        ApiClient.get('/exit-clearances').catch(() => []),
        ApiClient.get('/offboarding-requests').catch(() => []),
        ApiClient.get('/assets').catch(() => []),
        ApiClient.get('/letters').catch(() => []),
      ]);

      const runs = Array.isArray(onboardingRuns) ? onboardingRuns : [];
      const probs = Array.isArray(probations) ? probations : [];
      const trans = Array.isArray(transfers) ? transfers : [];
      const proms = Array.isArray(promotions) ? promotions : [];
      const revs = Array.isArray(salaryRevs) ? salaryRevs : [];
      const resigs = Array.isArray(resignations) ? resignations : [];
      const clrs = Array.isArray(clearances) ? clearances : [];
      const offs = Array.isArray(offboardings) ? offboardings : [];
      const asts = Array.isArray(assets) ? assets : [];
      const letts = Array.isArray(letters) ? letters : [];

      setStats({
        activeOnboardings: runs.filter((r) => r.status === 'IN_PROGRESS').length,
        pendingProbations: probs.filter((p) => ['PENDING_REVIEW', 'SUBMITTED'].includes(p.status)).length,
        openTransfers: trans.filter((t) => t.status === 'PENDING_APPROVAL').length,
        openPromotions: proms.filter((p) => p.status === 'PENDING_APPROVAL').length,
        pendingSalaryRevisions: revs.filter((r) => r.status === 'PENDING_APPROVAL').length,
        activeResignations: resigs.filter((r) => ['PENDING_APPROVAL', 'APPROVED'].includes(r.status)).length,
        pendingClearances: clrs.filter((c) => c.status === 'PENDING').length,
        activeOffboardings: offs.filter((o) => ['PENDING_CLEARANCE', 'CLEARANCE_COMPLETED'].includes(o.status)).length,
        assignedAssets: asts.filter((a) => a.returnStatus === 'ASSIGNED').length,
        totalAssets: asts.length,
        totalLetters: letts.length,
      });

      setRecentOnboardings(runs.slice(0, 5));
      setRecentTransitions([...trans, ...proms].slice(0, 5));
    } catch (err) {
      console.error('Failed to load lifecycle stats', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Active Onboarding',
      count: stats.activeOnboardings,
      desc: 'Employees currently undergoing onboarding',
      href: '/lifecycle/onboarding',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Probation Reviews',
      count: stats.pendingProbations,
      desc: 'Reviews pending manager rating or HR action',
      href: '/lifecycle/probation',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      title: 'Transfers & Moves',
      count: stats.openTransfers,
      desc: 'Department, location & manager transfers pending',
      href: '/lifecycle/transfers',
      icon: ArrowRightLeft,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Promotions',
      count: stats.openPromotions,
      desc: 'Role advancements & grade changes',
      href: '/lifecycle/promotions',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Salary Revisions',
      count: stats.pendingSalaryRevisions,
      desc: 'Increments & adjustments awaiting approval',
      href: '/lifecycle/salary-revisions',
      icon: DollarSign,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      title: 'Resignations',
      count: stats.activeResignations,
      desc: 'Active resignation notices being served',
      href: '/lifecycle/resignations',
      icon: LogOut,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      title: 'Exit Clearances',
      count: stats.pendingClearances,
      desc: 'Departmental exit tasks pending signoff',
      href: '/lifecycle/exit-clearance',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      title: 'Final Offboarding',
      count: stats.activeOffboardings,
      desc: 'Offboarding cases ready for exit execution',
      href: '/lifecycle/offboarding',
      icon: UserX,
      color: 'text-red-600 bg-red-50 border-red-200',
    },
    {
      title: 'Assets Deployed',
      count: `${stats.assignedAssets}/${stats.totalAssets}`,
      desc: 'Company hardware and access cards tracked',
      href: '/lifecycle/assets',
      icon: Package,
      color: 'text-slate-700 bg-slate-50 border-slate-200',
    },
    {
      title: 'Letters Issued',
      count: stats.totalLetters,
      desc: 'Official offer, relieving & appointment letters',
      href: '/lifecycle/letters',
      icon: FileText,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Employee Lifecycle Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              End-to-end management from day-one onboarding to exit formalities, transitions, assets, and official documentation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/lifecycle/onboarding/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Onboarding Flow</span>
            </Link>
            <Link
              href="/lifecycle/transfers/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-slate-500" />
              <span>Initiate Transfer</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={i}
                href={c.href}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${c.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {loading ? '...' : c.count}
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">
                  {c.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {c.desc}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Onboardings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Active Onboarding Runs</h2>
              </div>
              <Link href="/lifecycle/onboarding" className="text-xs text-blue-600 hover:underline font-medium">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center">Loading onboarding status...</div>
            ) : recentOnboardings.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No active onboarding runs in progress</div>
            ) : (
              <div className="space-y-3">
                {recentOnboardings.map((run) => (
                  <Link
                    key={run.id}
                    href={`/lifecycle/onboarding/${run.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {run.employee?.firstName} {run.employee?.lastName} ({run.employee?.employeeCode})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {run.onboardingFlow?.name || 'Onboarding Flow'} • Started {new Date(run.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        run.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Lifecycle Actions & Policy Guide */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Lifecycle Operations & Policies</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Link
                  href="/lifecycle/probation"
                  className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                >
                  <div className="text-xs font-semibold text-slate-900">Probation Tracking</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Reviews, scorecards & status changes to ACTIVE.</p>
                </Link>

                <Link
                  href="/lifecycle/letters"
                  className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                >
                  <div className="text-xs font-semibold text-slate-900">Generate Letters</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Appointment, Relieving, Experience & Offer letters.</p>
                </Link>

                <Link
                  href="/lifecycle/exit-clearance"
                  className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                >
                  <div className="text-xs font-semibold text-slate-900">Department Clearances</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">IT revocation, asset returns, finance sign-off.</p>
                </Link>

                <Link
                  href="/lifecycle/assets"
                  className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                >
                  <div className="text-xs font-semibold text-slate-900">Asset Inventory</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Laptops, monitors, access badges & conditions.</p>
                </Link>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">Tenant Isolation & RBAC Active:</span> All employee lifecycle transactions are isolated to the active organization. Only authorized HR and management roles have permission to execute state transitions.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
