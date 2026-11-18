'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LifecycleNav } from '../../lifecycle-nav';
import { ApiClient } from '../../../../lib/api';
import { useAuth } from '../../../../context/auth-context';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';

export default function NewTransferPage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  const [employeeId, setEmployeeId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [newLocationId, setNewLocationId] = useState('');
  const [newDesignationId, setNewDesignationId] = useState('');
  const [newGradeId, setNewGradeId] = useState('');
  const [newReportingManagerId, setNewReportingManagerId] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrganization) {
      loadDropdowns();
    }
  }, [activeOrganization]);

  const loadDropdowns = async () => {
    try {
      const [empData, deptData, locData, desigData, gradeData] = await Promise.all([
        ApiClient.get('/employees').catch(() => []),
        ApiClient.get('/departments').catch(() => []),
        ApiClient.get('/locations').catch(() => []),
        ApiClient.get('/designations').catch(() => []),
        ApiClient.get('/grades').catch(() => []),
      ]);
      setEmployees(Array.isArray(empData) ? empData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setLocations(Array.isArray(locData) ? locData : []);
      setDesignations(Array.isArray(desigData) ? desigData : []);
      setGrades(Array.isArray(gradeData) ? gradeData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedEmp = employees.find((e) => e.id === employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !effectiveFrom || !reason.trim()) {
      setError('Please fill in all mandatory fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ApiClient.post('/employee-transfers', {
        employeeId,
        effectiveFrom,
        newDepartmentId: newDepartmentId || undefined,
        newLocationId: newLocationId || undefined,
        newDesignationId: newDesignationId || undefined,
        newGradeId: newGradeId || undefined,
        newReportingManagerId: newReportingManagerId || undefined,
        reason,
        remarks: remarks || undefined,
      });

      router.push('/lifecycle/transfers');
    } catch (err: any) {
      setError(err.message || 'Failed to submit transfer request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/lifecycle/transfers"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Transfers</span>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Initiate Employee Transfer
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Submit an internal transfer across departments, work locations, designations, or reporting managers.
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
                  <span className="font-semibold text-slate-800">Current Assignment:</span>{' '}
                  {selectedEmp.department?.name || 'No Dept'} • {selectedEmp.location?.name || 'No Loc'} • Manager: {selectedEmp.reportingManager?.firstName ? `${selectedEmp.reportingManager.firstName} ${selectedEmp.reportingManager.lastName}` : 'None'}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Department
                </label>
                <select
                  value={newDepartmentId}
                  onChange={(e) => setNewDepartmentId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Location
                </label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Reporting Manager
                </label>
                <select
                  value={newReportingManagerId}
                  onChange={(e) => setNewReportingManagerId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current Manager</option>
                  {employees
                    .filter((e) => e.id !== employeeId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.employeeCode})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Designation
                </label>
                <select
                  value={newDesignationId}
                  onChange={(e) => setNewDesignationId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep Current Designation</option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>{des.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Transfer *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Relocating to headquarters to lead regional operations..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional internal handover remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
              <Link
                href="/lifecycle/transfers"
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Submitting...' : 'Submit Transfer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
