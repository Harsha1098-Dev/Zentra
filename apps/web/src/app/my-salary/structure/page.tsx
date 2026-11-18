'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../../payroll/payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import { ArrowLeft, Layers, CheckCircle2 } from 'lucide-react';

export default function MySalaryStructurePage() {
  const { activeOrganization } = useAuth();
  const [assignment, setAssignment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await ApiClient.get('/me/salary-structure');
        setAssignment(data);
      } catch (err) {
        console.error('Failed to load salary structure', err);
      } finally {
        setLoading(false);
      }
    }

    if (activeOrganization) {
      load();
    }
  }, [activeOrganization]);

  const structure = assignment?.salaryStructure;
  const components = structure?.components || [];
  const annualCtc = Number(assignment?.annualCtc || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/my-salary"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Salary Overview</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Salary Structure Breakdown
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Component rules and distribution applied to your compensation package.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading structure...</div>
        ) : !assignment ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No salary structure assigned.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{structure?.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Code: {structure?.code || 'N/A'} • Effective:{' '}
                  {new Date(assignment.effectiveFrom).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block uppercase">Annual CTC</span>
                <span className="text-lg font-bold text-slate-900">
                  ₹ {annualCtc.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Salary Component</th>
                    <th className="py-3 px-6">Code</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Calculation Basis</th>
                    <th className="py-3 px-6 text-right">Taxable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {components.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {c.salaryComponent?.name}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-600">
                        {c.salaryComponent?.componentCode}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.salaryComponent?.componentType === 'EARNING'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {c.salaryComponent?.componentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-700">
                        {c.overrideFormula ||
                          (c.overrideAmount
                            ? `₹ ${Number(c.overrideAmount).toLocaleString('en-IN')}`
                            : c.overridePercentage
                            ? `${c.overridePercentage}%`
                            : c.salaryComponent?.calculationType?.replace(/_/g, ' '))}
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-600">
                        {c.salaryComponent?.isTaxable ? 'Yes' : 'Exempt'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
