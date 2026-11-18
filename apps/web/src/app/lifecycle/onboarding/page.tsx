'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  UserCheck,
  PlusCircle,
  PlayCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function OnboardingListPage() {
  const { activeOrganization } = useAuth();
  const [flows, setFlows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'runs' | 'flows'>('runs');

  // Trigger modal
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [triggerLoading, setTriggerLoading] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, rData, eData] = await Promise.all([
        ApiClient.get('/onboarding-flows').catch(() => []),
        ApiClient.get('/onboarding-runs').catch(() => []),
        ApiClient.get('/employees').catch(() => []),
      ]);
      setFlows(Array.isArray(fData) ? fData : []);
      setRuns(Array.isArray(rData) ? rData : []);
      setEmployees(Array.isArray(eData) ? eData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlowId || !selectedEmployeeId) return;

    setTriggerLoading(true);
    try {
      await ApiClient.post('/onboarding-runs', {
        onboardingFlowId: selectedFlowId,
        employeeId: selectedEmployeeId,
      });
      setShowTriggerModal(false);
      setSelectedFlowId('');
      setSelectedEmployeeId('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger onboarding');
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Onboarding Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated onboarding task sequences, document collection & employee ramp-up tracking.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTriggerModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5 text-blue-200" />
              <span>Start Onboarding Run</span>
            </button>
            <Link
              href="/lifecycle/onboarding/new"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>New Flow Template</span>
            </Link>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex space-x-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('runs')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'runs'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Onboarding Runs ({runs.length})
          </button>
          <button
            onClick={() => setActiveTab('flows')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'flows'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Flow Templates ({flows.length})
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading onboarding data...
          </div>
        ) : activeTab === 'runs' ? (
          runs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No onboarding runs</h3>
              <p className="text-xs text-slate-500 mt-1">Start an onboarding run for a newly joined employee.</p>
              <button
                onClick={() => setShowTriggerModal(true)}
                className="mt-4 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Start Onboarding
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Flow Template</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {runs.map((r) => {
                    const completedTasks = r.items?.filter((i: any) => i.status === 'COMPLETED').length || 0;
                    const totalTasks = r.items?.length || 1;
                    const progress = Math.round((completedTasks / totalTasks) * 100);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {r.employee?.firstName} {r.employee?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.employee?.employeeCode} • {r.employee?.workEmail}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {r.onboardingFlow?.name || 'Onboarding'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(r.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-36">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>{completedTasks}/{totalTasks} tasks</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/lifecycle/onboarding/${r.id}`}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flows.map((flow) => (
              <div key={flow.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    flow.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {flow.isActive ? 'Active Template' : 'Inactive'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {flow.items?.length || 0} Steps
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{flow.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {flow.description || 'Standard automated checklist with departmental task assignments.'}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Trigger: {flow.triggerEvent}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFlowId(flow.id);
                      setShowTriggerModal(true);
                    }}
                    className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trigger Modal */}
        {showTriggerModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Initiate Onboarding Run</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Select an employee and a template to spin up their task checklist.
              </p>

              <form onSubmit={handleTriggerRun} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee *
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.department?.name || 'General'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Onboarding Template *
                  </label>
                  <select
                    value={selectedFlowId}
                    onChange={(e) => setSelectedFlowId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Template</option>
                    {flows.map((flow) => (
                      <option key={flow.id} value={flow.id}>
                        {flow.name} ({flow.items?.length || 0} steps)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTriggerModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={triggerLoading}
                    className="px-4 py-1.5 text-xs bg-[#1E3A8A] text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    {triggerLoading ? 'Initiating...' : 'Start Onboarding'}
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
