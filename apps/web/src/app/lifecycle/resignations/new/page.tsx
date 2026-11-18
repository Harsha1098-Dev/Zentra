'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LifecycleNav } from '../../lifecycle-nav';
import { ApiClient } from '../../../../lib/api';
import { useAuth } from '../../../../context/auth-context';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function NewResignationOnBehalfPage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrganization) {
      ApiClient.get('/employees')
        .then((data) => setEmployees(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [activeOrganization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !lastWorkingDate || !reason.trim()) {
      setError('Please specify employee, last working date, and resignation reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ApiClient.post('/resignation-requests', {
        employeeId,
        lastWorkingDate,
        noticePeriodDays: Number(noticePeriodDays),
        reason,
        comments: comments || undefined,
      });

      router.push('/lifecycle/resignations');
    } catch (err: any) {
      setError(err.message || 'Failed to submit resignation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/lifecycle/resignations"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Resignations</span>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Submit Resignation (On Behalf)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Record a formal employee resignation notification on behalf of an employee.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Last Working Date *
                </label>
                <input
                  type="date"
                  required
                  value={lastWorkingDate}
                  onChange={(e) => setLastWorkingDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Period (Days) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  required
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resignation Reason *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Pursuing higher education / Better career opportunity elsewhere..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Remarks / Communication
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes or discussion details..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <Link
                href="/lifecycle/resignations"
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Submitting...' : 'Record Resignation'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
