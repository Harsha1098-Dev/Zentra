'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LifecycleNav } from '../../lifecycle-nav';
import { ApiClient } from '../../../../lib/api';
import { useAuth } from '../../../../context/auth-context';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export default function NewPromotionPage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);

  const [employeeId, setEmployeeId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [newDesignationId, setNewDesignationId] = useState('');
  const [newGradeId, setNewGradeId] = useState('');
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
      const [empData, desigData, gradeData, structData] = await Promise.all([
        ApiClient.get('/employees').catch(() => []),
        ApiClient.get('/designations').catch(() => []),
        ApiClient.get('/grades').catch(() => []),
        ApiClient.get('/salary-structures').catch(() => []),
      ]);
      setEmployees(Array.isArray(empData) ? empData : []);
      setDesignations(Array.isArray(desigData) ? desigData : []);
      setGrades(Array.isArray(gradeData) ? gradeData : []);
      setSalaryStructures(Array.isArray(structData) ? structData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedEmp = employees.find((e) => e.id === employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !effectiveFrom || !newDesignationId || !reason.trim()) {
      setError('Please fill in employee, effective date, new designation, and reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ApiClient.post('/employee-promotions', {
        employeeId,
        effectiveFrom,
        newDesignationId,
        newGradeId: newGradeId || undefined,
        newSalaryStructureId: newSalaryStructureId || undefined,
        newAnnualCtc: newAnnualCtc ? Number(newAnnualCtc) : undefined,
        reason,
        remarks: remarks || undefined,
      });

      router.push('/lifecycle/promotions');
    } catch (err: any) {
      setError(err.message || 'Failed to submit promotion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/lifecycle/promotions"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Promotions</span>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Initiate Employee Promotion
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Elevate employee role, grade, and optionally adjust their annual CTC & salary structure.
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
                  Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedEmp && (
                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Current Designation:</span>{' '}
                  {selectedEmp.designation?.name || 'None'} • Department: {selectedEmp.department?.name || 'None'}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Promoted Designation *
                </label>
                <select
                  required
                  value={newDesignationId}
                  onChange={(e) => setNewDesignationId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Target Designation</option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>{des.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Promoted Grade
                </label>
                <select
                  value={newGradeId}
                  onChange={(e) => setNewGradeId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep / Select Grade</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Annual CTC (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 1800000"
                  value={newAnnualCtc}
                  onChange={(e) => setNewAnnualCtc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked Salary Structure
                </label>
                <select
                  value={newSalaryStructureId}
                  onChange={(e) => setNewSalaryStructureId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current Structure</option>
                  {salaryStructures.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Promotion Justification & Achievement *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Proven track record of system architecture delivery and mentoring junior team members..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional internal remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
              <Link
                href="/lifecycle/promotions"
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Submitting...' : 'Submit Promotion'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
