'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LifecycleNav } from '../../lifecycle-nav';
import { ApiClient } from '../../../../lib/api';
import { useAuth } from '../../../../context/auth-context';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { SalaryRevisionType } from '@zentra/shared-types';

export default function NewSalaryRevisionPage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);

  const [employeeId, setEmployeeId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [revisionType, setRevisionType] = useState<SalaryRevisionType>(SalaryRevisionType.ANNUAL_INCREMENT);
  const [newSalaryStructureId, setNewSalaryStructureId] = useState('');
  const [newAnnualCtc, setNewAnnualCtc] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  const loadData = async () => {
    try {
      const [empData, structData] = await Promise.all([
        ApiClient.get('/employees').catch(() => []),
        ApiClient.get('/salary-structures').catch(() => []),
      ]);
      setEmployees(Array.isArray(empData) ? empData : []);
      setSalaryStructures(Array.isArray(structData) ? structData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedEmp = employees.find((e) => e.id === employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !effectiveFrom || !newAnnualCtc || !reason.trim()) {
      setError('Please fill in employee, effective date, revised CTC, and reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ApiClient.post('/salary-revisions', {
        employeeId,
        effectiveFrom,
        revisionType,
        newAnnualCtc: Number(newAnnualCtc),
        newSalaryStructureId: newSalaryStructureId || undefined,
        reason,
        remarks: remarks || undefined,
      });

      router.push('/lifecycle/salary-revisions');
    } catch (err: any) {
      setError(err.message || 'Failed to submit salary revision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/lifecycle/salary-revisions"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Salary Revisions</span>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Initiate Salary Revision
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Record annual appraisals, performance raises, and market adjustments with non-overwriting historical tracking.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee *
                </label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Type *
                </label>
                <select
                  value={revisionType}
                  onChange={(e: any) => setRevisionType(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={SalaryRevisionType.ANNUAL_INCREMENT}>Annual Increment / Appraisal</option>
                  <option value={SalaryRevisionType.PROMOTION_INCREMENT}>Promotion Increment</option>
                  <option value={SalaryRevisionType.MARKET_ADJUSTMENT}>Market Benchmarking Adjustment</option>
                  <option value={SalaryRevisionType.RETENTION_REVISION}>Retention Revision</option>
                  <option value={SalaryRevisionType.CORRECTION}>Payroll Correction</option>
                  <option value={SalaryRevisionType.OTHER}>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effective From *
                </label>
                <input
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revised Annual CTC (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  placeholder="e.g. 1500000"
                  value={newAnnualCtc}
                  onChange={(e) => setNewAnnualCtc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Salary Structure
                </label>
                <select
                  value={newSalaryStructureId}
                  onChange={(e) => setNewSalaryStructureId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Existing / Default Salary Structure</option>
                  {salaryStructures.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Reason & Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. FY26 performance rating 4.5/5.0 with stellar client delivery..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Internal Note
                </label>
                <input
                  type="text"
                  placeholder="Optional compensation committee remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
              <Link
                href="/lifecycle/salary-revisions"
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Submitting...' : 'Submit Revision'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
