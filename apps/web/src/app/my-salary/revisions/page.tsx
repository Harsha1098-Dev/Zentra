'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../../payroll/payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import { ArrowLeft, History, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';

export default function MySalaryRevisionsPage() {
  const { activeOrganization } = useAuth();
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await ApiClient.get('/me/salary-revisions');
        setRevisions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load salary revisions', err);
      } finally {
        setLoading(false);
      }
    }

    if (activeOrganization) {
      load();
    }
  }, [activeOrganization]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/my-salary"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Salary Overview</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Salary Revision Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical log of all appraisals, adjustments, and compensation changes.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading revision history...</div>
        ) : revisions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No revisions on record.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
            {revisions.map((rev) => (
              <div key={rev.id} className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white" />
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-slate-900">
                        ₹ {Number(rev.annualCtc).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">/ year</span>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rev.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      Structure:{' '}
                      <span className="font-semibold text-slate-800">
                        {rev.salaryStructure?.name}
                      </span>
                    </div>
                    <div>
                      Effective Date:{' '}
                      <span className="font-mono text-slate-800">
                        {new Date(rev.effectiveFrom).toLocaleDateString()}
                      </span>
                      {rev.effectiveTo
                        ? ` to ${new Date(rev.effectiveTo).toLocaleDateString()}`
                        : ' (Current active)'}
                    </div>
                  </div>

                  {rev.revisionReason && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <span className="font-semibold">Reason: </span>
                      {rev.revisionReason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
