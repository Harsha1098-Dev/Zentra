'use client';

import React, { useEffect, useState } from 'react';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  UserX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Package,
} from 'lucide-react';
import { OffboardingStatus } from '@zentra/shared-types';

export default function OffboardingListPage() {
  const { activeOrganization } = useAuth();
  const [offboardings, setOffboardings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Execution modal
  const [selectedOffboarding, setSelectedOffboarding] = useState<any | null>(null);
  const [reassignedManagerId, setReassignedManagerId] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [genRelieving, setGenRelieving] = useState(true);
  const [genExperience, setGenExperience] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [offData, empData] = await Promise.all([
        ApiClient.get('/offboarding-requests').catch(() => []),
        ApiClient.get('/employees').catch(() => []),
      ]);
      setOffboardings(Array.isArray(offData) ? offData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffboarding) return;

    setExecuting(true);
    setModalError(null);

    try {
      await ApiClient.post(`/offboarding-requests/${selectedOffboarding.id}/complete`, {
        reassignedReportingManagerId: reassignedManagerId || undefined,
        exitReason: exitReason || undefined,
        generateRelievingLetter: genRelieving,
        generateExperienceLetter: genExperience,
      });

      setSelectedOffboarding(null);
      setReassignedManagerId('');
      setExitReason('');
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to complete offboarding');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Final Offboarding & Exit Execution
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify clearances and asset returns, reassign direct reportees, record exit date, and generate relieving & experience letters.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading offboarding cases...
          </div>
        ) : offboardings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No offboarding requests</h3>
            <p className="text-xs text-slate-500 mt-1">Offboarding requests are initiated when resignations or terminations are approved.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Exit Type</th>
                  <th className="py-3 px-4">Last Working Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {offboardings.map((o) => {
                  const isReady = ['PENDING_CLEARANCE', 'CLEARANCE_COMPLETED'].includes(o.status);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {o.employee?.firstName} {o.employee?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {o.employee?.employeeCode} • {o.employee?.department?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {o.exitType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(o.lastWorkingDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          o.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.status === 'CLEARANCE_COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isReady && (
                          <button
                            onClick={() => {
                              setSelectedOffboarding(o);
                              setExitReason(o.exitType);
                              setModalError(null);
                            }}
                            className="px-3 py-1 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded font-semibold text-xs shadow-sm"
                          >
                            Finalize Exit
                          </button>
                        )}
                        {o.status === 'COMPLETED' && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Offboarded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Final Offboarding Modal */}
        {selectedOffboarding && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Execute Final Offboarding: {selectedOffboarding.employee?.firstName} {selectedOffboarding.employee?.lastName}
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                This will atomically set the employee status to <span className="font-semibold text-red-600">EXITED</span>, reassign active reportees, record exit dates, and issue official letters.
              </p>

              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleExecute} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reassign Direct Reportees To (If applicable)
                  </label>
                  <select
                    value={reassignedManagerId}
                    onChange={(e) => setReassignedManagerId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select New Reporting Manager</option>
                    {employees
                      .filter((e) => e.id !== selectedOffboarding.employeeId)
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">Required if the exiting employee has active direct reportees.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exit Reason
                  </label>
                  <input
                    type="text"
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs">
                  <span className="font-semibold text-slate-800 block text-[11px]">Automatic Document Generation:</span>
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={genRelieving}
                      onChange={(e) => setGenRelieving(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Generate Official Relieving Letter</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={genExperience}
                      onChange={(e) => setGenExperience(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Generate Experience Certificate</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedOffboarding(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={executing}
                    className="px-4 py-1.5 text-xs bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 shadow-sm"
                  >
                    {executing ? 'Executing Exit...' : 'Execute Offboarding'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
