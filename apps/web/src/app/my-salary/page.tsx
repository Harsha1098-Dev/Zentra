'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../payroll/payroll-nav';
import { useAuth } from '../../context/auth-context';
import { ApiClient } from '../../lib/api';
import {
  DollarSign,
  TrendingUp,
  Layers,
  History,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function MySalaryOverviewPage() {
  const { user, activeOrganization } = useAuth();

  const [assignment, setAssignment] = useState<any | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSalary() {
      try {
        setLoading(true);
        setError(null);
        const [assignData, revData] = await Promise.all([
          ApiClient.get('/me/salary-structure').catch(() => null),
          ApiClient.get('/me/salary-revisions').catch(() => []),
        ]);

        setAssignment(assignData);
        setRevisions(Array.isArray(revData) ? revData : []);
      } catch (err: any) {
        console.error('Failed to load employee salary', err);
        setError(err.message || 'Could not load your salary information');
      } finally {
        setLoading(false);
      }
    }

    if (activeOrganization) {
      loadSalary();
    }
  }, [activeOrganization]);

  const annualCtc = assignment ? Number(assignment.annualCtc) : 0;
  const monthlyCtc = Math.round(annualCtc / 12);
  const structure = assignment?.salaryStructure || null;

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Compensation & Salary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your active salary structure, monthly breakdown, revision history, and bank details.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sub Navigation */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold">
          <Link
            href="/my-salary"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white"
          >
            Overview
          </Link>
          <Link
            href="/my-salary/structure"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Structure Breakdown
          </Link>
          <Link
            href="/my-salary/revisions"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Revision Timeline ({revisions.length})
          </Link>
          <Link
            href="/my-payslips"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            My Payslips
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your compensation details...</div>
        ) : !assignment ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
            <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-900">No active salary structure assigned</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your salary structure has not been finalized yet. Please contact your HR administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Annual Cost to Company (CTC)
                </span>
                <div className="text-3xl font-bold text-slate-900 mt-2">
                  ₹ {annualCtc.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mt-1">Gross annual compensation package</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Monthly Baseline
                </span>
                <div className="text-3xl font-bold text-emerald-600 mt-2">
                  ₹ {monthlyCtc.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mt-1">Approximate monthly gross</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Structure
                </span>
                <div className="text-xl font-bold text-slate-900 mt-2 truncate">
                  {structure?.name || 'Standard'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Effective from {new Date(assignment.effectiveFrom).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/my-salary/structure"
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      View Component Structure
                    </h3>
                    <p className="text-xs text-slate-500">
                      See Basic, HRA, Special Allowance, and PF contributions.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/my-salary/revisions"
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Appraisal & Revision History
                    </h3>
                    <p className="text-xs text-slate-500">
                      Track salary increments and effective date milestones.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
