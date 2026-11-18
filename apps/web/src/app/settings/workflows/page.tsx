'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  GitPullRequest,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  History,
  Sliders,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  WorkflowRuleDto,
  WorkflowTriggerEvent,
  ConditionMatchType,
} from '@zentra/shared-types';

export default function WorkflowsListPage() {
  const router = useRouter();
  const { user, activeOrganization, roles, permissions } = useAuth();

  const [rules, setRules] = useState<WorkflowRuleDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Test simulation modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<WorkflowRuleDto | null>(null);
  const [testPayload, setTestPayload] = useState('{\n  "employee": {\n    "departmentId": "dept-1",\n    "status": "active"\n  }\n}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [currentPage, search, triggerFilter, activeFilter]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (triggerFilter) params.set('triggerEvent', triggerFilter);
      if (activeFilter !== '') params.set('isActive', activeFilter);

      const res = await ApiClient.request<{ data: WorkflowRuleDto[]; total: number; totalPages: number }>(
        `/workflows?${params.toString()}`
      );
      setRules(res.data || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load workflow rules', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleActive = async (rule: WorkflowRuleDto) => {
    try {
      const endpoint = rule.isActive
        ? `/workflows/${rule.id}/deactivate`
        : `/workflows/${rule.id}/activate`;
      await ApiClient.request(endpoint, { method: 'POST' });
      fetchRules();
    } catch (err: any) {
      alert(`Failed to update rule status: ${err.message}`);
    }
  };

  const deleteRule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete workflow rule "${name}"?`)) {
      return;
    }
    try {
      await ApiClient.request(`/workflows/${id}`, { method: 'DELETE' });
      fetchRules();
    } catch (err: any) {
      alert(`Failed to delete rule: ${err.message}`);
    }
  };

  const runTestSimulation = async () => {
    if (!selectedRule) return;
    try {
      setTesting(true);
      setTestResult(null);
      let parsedContext = {};
      try {
        parsedContext = JSON.parse(testPayload);
      } catch {
        alert('Invalid JSON in simulation context');
        return;
      }

      const res = await ApiClient.request(`/workflows/${selectedRule.id}/test`, {
        method: 'POST',
        body: JSON.stringify({ context: parsedContext }),
      });
      setTestResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Top Header */}
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
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-[#0F172A]">Workflow Automation Rules</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                  {totalCount} Total
                </span>
              </div>
              <p className="text-xs text-[#475569]">
                Automate event triggers, conditions, notifications, tasks, checklists, and approvals.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/settings/workflows/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] space-x-6 text-sm font-medium">
          <Link
            href="/settings/workflows"
            className="pb-3 border-b-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold flex items-center space-x-2"
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
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
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

        {/* Filter Bar */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search workflows by rule name or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={triggerFilter}
              onChange={(e) => {
                setTriggerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All Trigger Events</option>
              <option value="record_created">Record Created</option>
              <option value="record_updated">Record Updated</option>
              <option value="field_changed">Field Changed</option>
              <option value="status_changed">Status Changed</option>
              <option value="manual_trigger">Manual Trigger</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Workflow Rules List */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#64748B]">Loading workflow rules...</div>
          ) : rules.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <GitPullRequest className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-semibold text-[#0F172A]">No workflow rules defined yet</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Create event-driven automated workflows to trigger tasks, approval chains, and email notifications.
              </p>
              <Link
                href="/settings/workflows/new"
                className="inline-flex items-center space-x-2 px-3 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workflow</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Rule Name & Details</th>
                    <th className="py-3 px-4">Entity & Trigger</th>
                    <th className="py-3 px-4">Conditions</th>
                    <th className="py-3 px-4">Actions Configured</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/settings/workflows/${rule.id}`}
                          className="font-semibold text-[#0F172A] hover:text-[#1E3A8A] text-xs block"
                        >
                          {rule.name}
                        </Link>
                        {rule.description && (
                          <span className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                            {rule.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-[#0F172A]">
                            {rule.entityType}
                          </span>
                          <span className="block text-[11px] text-[#475569]">
                            {rule.triggerEvent}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {rule.conditions?.length || 0} Conditions ({rule.conditionMatchType || 'ALL'})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rule.actions?.map((a, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-[#1E3A8A] border border-indigo-100"
                            >
                              {a.actionType}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        {rule.priority}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleRuleActive(rule)}
                          className="inline-flex items-center space-x-1"
                        >
                          {rule.isActive ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold text-xs">
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-slate-400 font-medium text-xs">
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRule(rule);
                              setTestResult(null);
                              setTestModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Dry Run Test Simulation"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/settings/workflows/${rule.id}`}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="Execution History"
                          >
                            <History className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteRule(rule.id, rule.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-[#E2E8F0] p-4 flex items-center justify-between text-xs text-[#64748B]">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-[#CBD5E1] rounded disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-[#CBD5E1] rounded disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dry Run Test Simulation Modal */}
      {testModalOpen && selectedRule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Simulate Workflow Dry Run</h3>
                <p className="text-xs text-[#64748B]">Rule: {selectedRule.name}</p>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0F172A]">Test Context Payload (JSON)</label>
              <textarea
                rows={6}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
              <p className="text-[11px] text-[#64748B]">
                Provides sample fields evaluated by conditions without executing actual actions.
              </p>
            </div>

            {testResult && (
              <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-semibold">
                  <span>Match Result:</span>
                  {testResult.matched ? (
                    <span className="text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MATCHED (Would Trigger)</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center space-x-1">
                      <XCircle className="w-4 h-4" />
                      <span>NOT MATCHED</span>
                    </span>
                  )}
                </div>

                {testResult.conditionResults && testResult.conditionResults.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-semibold text-slate-700">Condition Evaluations:</span>
                    <ul className="space-y-1">
                      {testResult.conditionResults.map((cr: any, idx: number) => (
                        <li key={idx} className="flex items-center space-x-2 text-[11px]">
                          {cr.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span className="font-mono">{cr.field} {cr.operator} {JSON.stringify(cr.expected)}</span>
                          <span className="text-[#64748B]">(Actual: {JSON.stringify(cr.actual)})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-slate-50"
              >
                Close
              </button>
              <button
                disabled={testing}
                onClick={runTestSimulation}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{testing ? 'Evaluating...' : 'Run Simulation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
