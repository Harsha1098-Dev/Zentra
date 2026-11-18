'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '../../../../lib/api';
import { useAuth } from '../../../../context/auth-context';
import {
  ChevronLeft,
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ToggleLeft,
  ToggleRight,
  History,
  Layers,
} from 'lucide-react';
import { WorkflowRuleDto, WorkflowExecutionDto, WorkflowExecutionStatus } from '@zentra/shared-types';

export default function WorkflowDetailPage() {
  const params = useParams();
  const ruleId = params.id as string;
  const router = useRouter();

  const [rule, setRule] = useState<WorkflowRuleDto | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecutionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ruleId) {
      loadRuleAndExecutions();
    }
  }, [ruleId]);

  const loadRuleAndExecutions = async () => {
    try {
      setLoading(true);
      const [rData, execData] = await Promise.all([
        ApiClient.request<WorkflowRuleDto>(`/workflows/${ruleId}`),
        ApiClient.request<WorkflowExecutionDto[]>(`/workflows/${ruleId}/executions`),
      ]);
      setRule(rData);
      setExecutions(execData || []);
    } catch (err: any) {
      console.error('Failed to load workflow details', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/settings/workflows"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-[#0F172A]">{rule?.name || 'Workflow Rule'}</h1>
                {rule && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      rule.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#475569]">{rule?.description || 'Workflow rule configuration & audit trail'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748B]">Loading workflow rule...</div>
        ) : !rule ? (
          <div className="py-20 text-center text-xs text-rose-600">Workflow rule not found</div>
        ) : (
          <>
            {/* Rule Config Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#0F172A]">Configuration Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block">Target Entity</span>
                  <span className="font-semibold text-[#0F172A]">{rule.entityType}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Trigger Event</span>
                  <span className="font-semibold text-[#0F172A]">{rule.triggerEvent}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Match Logic</span>
                  <span className="font-semibold text-[#0F172A]">{rule.conditionMatchType}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Priority</span>
                  <span className="font-semibold text-[#0F172A]">{rule.priority}</span>
                </div>
              </div>

              {/* Conditions */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <span className="text-xs font-semibold text-[#0F172A]">Conditions Criteria</span>
                <div className="space-y-1.5">
                  {rule.conditions?.length ? (
                    rule.conditions.map((c, i) => (
                      <div key={i} className="text-xs font-mono bg-slate-50 p-2 rounded border border-[#E2E8F0]">
                        <span className="text-indigo-600">{c.field}</span> {c.operator}{' '}
                        <span className="text-emerald-700 font-bold">{JSON.stringify(c.value)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-[#64748B] italic">No conditions (triggers on all matching events)</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <span className="text-xs font-semibold text-[#0F172A]">Automated Actions</span>
                <div className="space-y-2">
                  {rule.actions?.map((act, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded border border-[#E2E8F0]">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[10px]">
                          {act.executionOrder}
                        </span>
                        <span className="font-semibold text-[#0F172A]">{act.actionType}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#64748B] truncate max-w-sm">
                        {JSON.stringify(act.actionConfig)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Execution Logs Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-[#1E3A8A]" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Execution Logs</h3>
                </div>
                <span className="text-xs text-[#64748B]">{executions.length} Total Runs</span>
              </div>

              {executions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#64748B]">
                  No executions recorded yet for this workflow rule.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Entity ID</th>
                        <th className="py-3 px-4">Trigger Event</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Details / Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {executions.map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-[#64748B]">
                            {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium">{ex.entityId}</td>
                          <td className="py-3 px-4">{ex.triggerEvent}</td>
                          <td className="py-3 px-4">
                            {ex.status === 'completed' ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            ) : ex.status === 'failed' ? (
                              <span className="inline-flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-semibold">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Failed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{ex.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {ex.errorMessage ? (
                              <span className="text-rose-600 font-medium">{ex.errorMessage}</span>
                            ) : (
                              <span className="text-slate-400">All actions executed successfully</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
