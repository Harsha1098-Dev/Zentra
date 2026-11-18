'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import {
  Users,
  Search,
  Plus,
  History,
  CreditCard,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { PermissionCode } from '@zentra/shared-types';

export default function EmployeeSalaryAssignmentsPage() {
  const { permissions, roles, activeOrganization } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Assign/Revise Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [annualCtc, setAnnualCtc] = useState<number | ''>(600000);
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [revisionReason, setRevisionReason] = useState('New Assignment');
  const [revisionNotes, setRevisionNotes] = useState('');

  // Revisions History Modal State
  const [historyModalEmployee, setHistoryModalEmployee] = useState<any | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canManage =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_SALARY_REVISION_CREATE);

  async function loadData() {
    try {
      setLoading(true);
      const [empData, structData] = await Promise.all([
        ApiClient.get('/employees').catch(() => []),
        ApiClient.get('/payroll/salary-structures').catch(() => []),
      ]);
      setEmployees(Array.isArray(empData) ? empData : []);
      setStructures(Array.isArray(structData) ? structData : []);
    } catch (err) {
      console.error('Failed to load employee salary data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  async function openRevisionHistory(employee: any) {
    setHistoryModalEmployee(employee);
    setHistoryLoading(true);
    try {
      const data = await ApiClient.get(`/employees/${employee.id}/salary-revisions`);
      setRevisions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load revisions', err);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAssignSalary(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await ApiClient.post('/payroll/employee-salaries/assign', {
        employeeId: selectedEmployeeId,
        salaryStructureId: selectedStructureId,
        annualCtc: Number(annualCtc),
        effectiveFrom,
        revisionReason,
        notes: revisionNotes || undefined,
      });

      setShowAssignModal(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to assign salary structure');
    } finally {
      setModalLoading(false);
    }
  }

  const filtered = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employee Salary Assignments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Assign compensation templates to staff, adjust annual CTCs, and maintain full revision history.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => {
                setModalError(null);
                if (employees.length > 0) setSelectedEmployeeId(employees[0].id);
                if (structures.length > 0) setSelectedStructureId(structures[0].id);
                setShowAssignModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Assign / Revise Salary</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading employees...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900">No employees found</h4>
              <p className="text-xs text-slate-500 mt-1">Make sure you have added employees in the directory.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-6">Department & Role</th>
                    <th className="py-3 px-6">Active Salary Structure</th>
                    <th className="py-3 px-6">Annual CTC</th>
                    <th className="py-3 px-6">Monthly Approx</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((emp) => {
                    const activeAssignment = emp.salaryAssignments?.[0] || null;
                    const ctc = activeAssignment ? Number(activeAssignment.annualCtc) : null;
                    const monthly = ctc ? Math.round(ctc / 12) : null;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {emp.employeeCode || 'NO-CODE'}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="text-slate-800 font-medium">
                            {emp.department?.name || 'General'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {emp.designation?.name || 'Staff'}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          {activeAssignment?.salaryStructure ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px]">
                              <Layers className="w-3 h-3 text-slate-500" />
                              <span>{activeAssignment.salaryStructure.name}</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium text-[11px]">
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          {ctc ? `₹ ${ctc.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-medium">
                          {monthly ? `₹ ${monthly.toLocaleString('en-IN')} / mo` : '—'}
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-2">
                          <button
                            onClick={() => openRevisionHistory(emp)}
                            className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                          >
                            <History className="w-3 h-3 text-slate-400" />
                            <span>History</span>
                          </button>

                          {canManage && (
                            <button
                              onClick={() => {
                                setSelectedEmployeeId(emp.id);
                                if (activeAssignment?.salaryStructureId) {
                                  setSelectedStructureId(activeAssignment.salaryStructureId);
                                } else if (structures[0]) {
                                  setSelectedStructureId(structures[0].id);
                                }
                                if (ctc) setAnnualCtc(ctc);
                                setRevisionReason('Salary Revision');
                                setShowAssignModal(true);
                              }}
                              className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50"
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span>Revise</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Assign / Revise Salary */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Assign / Revise Salary Structure
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSalary} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee *
                </label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salary Structure Blueprint *
                </label>
                <select
                  required
                  value={selectedStructureId}
                  onChange={(e) => setSelectedStructureId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isDefault ? '(Default Template)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Annual Cost to Company (CTC) in ₹ *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={annualCtc}
                  onChange={(e) => setAnnualCtc(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-400">
                  Monthly CTC:{' '}
                  {annualCtc
                    ? `₹ ${Math.round(Number(annualCtc) / 12).toLocaleString('en-IN')}`
                    : '—'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effective From Date *
                </label>
                <input
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Appraisal / Promotion / Market Correction"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {modalLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revision History Timeline */}
      {historyModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Salary Revision History
                </h3>
                <p className="text-xs text-slate-500">
                  {historyModalEmployee.firstName} {historyModalEmployee.lastName} (
                  {historyModalEmployee.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setHistoryModalEmployee(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {historyLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading history...</div>
              ) : revisions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No salary revisions logged yet for this employee.
                </p>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white" />
                      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 text-sm">
                            ₹ {Number(rev.annualCtc).toLocaleString('en-IN')} / yr
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {rev.status}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-1">
                          Structure: <span className="font-medium text-slate-900">{rev.salaryStructure?.name}</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Effective:{' '}
                          <span className="font-mono text-slate-700">
                            {new Date(rev.effectiveFrom).toLocaleDateString()}
                          </span>
                          {rev.effectiveTo ? ` to ${new Date(rev.effectiveTo).toLocaleDateString()}` : ' onwards'}
                        </div>
                        {rev.revisionReason && (
                          <div className="mt-2 text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-600">
                            <span className="font-semibold text-slate-700">Reason: </span>
                            {rev.revisionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setHistoryModalEmployee(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
