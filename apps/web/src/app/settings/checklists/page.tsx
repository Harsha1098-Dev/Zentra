'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  Layers,
  Plus,
  Play,
  CheckSquare,
  Clock,
  GitPullRequest,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { ChecklistDto, ChecklistRunDto } from '@zentra/shared-types';

export default function ChecklistsPage() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<ChecklistDto[]>([]);
  const [runs, setRuns] = useState<ChecklistRunDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'runs'>('templates');

  // Instantiate run modal
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistDto | null>(null);
  const [targetEntityId, setTargetEntityId] = useState('');
  const [startingRun, setStartingRun] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'templates') {
        const res = await ApiClient.request<ChecklistDto[]>('/checklists');
        setChecklists(res || []);
      } else {
        const res = await ApiClient.request<{ data: ChecklistRunDto[] }>('/checklists/runs');
        setRuns(res.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load checklists', err);
    } finally {
      setLoading(false);
    }
  };

  const startChecklistRun = async () => {
    if (!selectedChecklist) return;
    try {
      setStartingRun(true);
      await ApiClient.request(`/checklists/${selectedChecklist.id}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          entityType: selectedChecklist.entityType,
          entityId: targetEntityId || 'manual',
        }),
      });
      setRunModalOpen(false);
      setTargetEntityId('');
      setActiveTab('runs');
    } catch (err: any) {
      alert(`Failed to start run: ${err.message}`);
    } finally {
      setStartingRun(false);
    }
  };

  const deleteChecklist = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete checklist template "${name}"?`)) return;
    try {
      await ApiClient.request(`/checklists/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">Checklist Templates & Runs</h1>
              <p className="text-xs text-[#475569]">
                Standardize onboarding, offboarding, and recurring HR processes with task assignment.
              </p>
            </div>
          </div>

          <Link
            href="/settings/checklists/new"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Checklist</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] space-x-6 text-sm font-medium">
          <Link
            href="/settings/workflows"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Workflow Rules</span>
          </Link>
          <Link
            href="/settings/approvals"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approval Chains</span>
          </Link>
          <Link
            href="/settings/checklists"
            className="pb-3 border-b-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold flex items-center space-x-2"
          >
            <Layers className="w-4 h-4" />
            <span>Checklists</span>
          </Link>
          <Link
            href="/settings/tasks"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Tasks</span>
          </Link>
        </div>

        {/* Sub-tabs: Templates vs Active Runs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'templates'
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-white text-slate-700 border border-[#CBD5E1]'
            }`}
          >
            Checklist Templates ({checklists.length})
          </button>
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'runs'
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-white text-slate-700 border border-[#CBD5E1]'
            }`}
          >
            Checklist Runs & History
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-xs text-[#64748B]">Loading checklists...</div>
            ) : checklists.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <CheckSquare className="w-10 h-10 text-[#94A3B8] mx-auto" />
                <h3 className="text-sm font-semibold text-[#0F172A]">No checklist templates yet</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Create reusable checklist templates to automatically generate tasks for HR, IT, and managers.
                </p>
                <Link
                  href="/settings/checklists/new"
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Template</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Checklist Name</th>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">Items Count</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {checklists.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                          {c.name}
                          {c.description && (
                            <span className="block text-[11px] text-[#64748B] font-normal">{c.description}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-[#0F172A]">
                            {c.entityType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {c.items?.length || 0} tasks
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedChecklist(c);
                                setRunModalOpen(true);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Instantiate</span>
                            </button>
                            <button
                              onClick={() => deleteChecklist(c.id, c.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Runs Tab */}
        {activeTab === 'runs' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            {runs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#64748B]">
                No checklist runs started yet. Click "Instantiate" on any checklist template to start a run.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Checklist</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Started At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {runs.map((r) => {
                      const completedCount = r.items?.filter((i) => i.status === 'completed').length || 0;
                      const totalCount = r.items?.length || 0;
                      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                            {r.checklistName || 'Checklist Run'}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {r.entityType} #{r.entityId}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="text-[11px] text-[#64748B]">
                                {completedCount} / {totalCount} completed ({pct}%)
                              </span>
                              <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#1E3A8A] h-1.5 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                r.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B]">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Instantiate Modal */}
      {runModalOpen && selectedChecklist && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Instantiate Checklist Run</h3>
            <p className="text-xs text-[#64748B]">
              This will create a new checklist run and auto-generate task assignments for "{selectedChecklist.name}".
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Target Entity ID (e.g. Employee ID)</label>
              <input
                type="text"
                placeholder="e.g. emp-1001"
                value={targetEntityId}
                onChange={(e) => setTargetEntityId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRunModalOpen(false)}
                className="px-3 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={startingRun}
                onClick={startChecklistRun}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8]"
              >
                {startingRun ? 'Starting...' : 'Start Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
