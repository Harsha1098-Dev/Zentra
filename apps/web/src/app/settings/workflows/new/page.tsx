'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../../../lib/api';
import { useAuth } from '../../../../context/auth-context';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Sliders,
  CheckCircle2,
  AlertCircle,
  GitPullRequest,
  Zap,
} from 'lucide-react';
import {
  ConditionMatchType,
  ConditionOperator,
  WorkflowActionType,
  WorkflowTriggerEvent,
} from '@zentra/shared-types';

export default function NewWorkflowRulePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState('Employee');
  const [triggerEvent, setTriggerEvent] = useState('record_created');
  const [priority, setPriority] = useState(10);
  const [isActive, setIsActive] = useState(true);

  // Conditions
  const [conditionMatchType, setConditionMatchType] = useState<ConditionMatchType>(ConditionMatchType.ALL);
  const [conditions, setConditions] = useState<Array<{ field: string; operator: string; value: string }>>([
    { field: 'employmentStatus', operator: 'equals', value: 'probation' },
  ]);

  // Actions
  const [actions, setActions] = useState<Array<{ actionType: string; actionConfig: Record<string, any> }>>([
    {
      actionType: 'create_task',
      actionConfig: {
        title: 'Complete 30-day probation review for {{firstName}}',
        priority: 'high',
        description: 'Schedule probation check-in with manager',
      },
    },
  ]);

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, idx) => idx !== index));
  };

  const updateCondition = (index: number, key: string, val: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: val };
    setConditions(updated);
  };

  const addAction = () => {
    setActions([
      ...actions,
      {
        actionType: 'send_notification',
        actionConfig: {
          title: 'Notification',
          message: 'Workflow triggered for {{firstName}}',
        },
      },
    ]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, idx) => idx !== index));
  };

  const updateActionType = (index: number, actionType: string) => {
    const updated = [...actions];
    let initialConfig: any = {};
    if (actionType === 'send_email') {
      initialConfig = { to: '{{workEmail}}', subject: 'Notification', body: 'Hello {{firstName}}' };
    } else if (actionType === 'create_task') {
      initialConfig = { title: 'New task', priority: 'medium', description: '' };
    } else if (actionType === 'create_checklist_run') {
      initialConfig = { checklistId: '' };
    } else if (actionType === 'call_webhook') {
      initialConfig = { url: 'https://example.com/webhook', method: 'POST' };
    } else {
      initialConfig = { title: 'Notice', message: '' };
    }
    updated[index] = { actionType, actionConfig: initialConfig };
    setActions(updated);
  };

  const updateActionConfig = (index: number, field: string, val: any) => {
    const updated = [...actions];
    updated[index].actionConfig = { ...updated[index].actionConfig, [field]: val };
    setActions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Workflow rule name is required');
      return;
    }

    try {
      setSaving(true);
      await ApiClient.request('/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || undefined,
          module: 'people',
          entityType,
          triggerEvent,
          conditionMatchType,
          conditions: conditions.filter((c) => c.field.trim() !== ''),
          priority: Number(priority) || 0,
          isActive,
          actions: actions.map((a, idx) => ({
            actionType: a.actionType,
            actionConfig: a.actionConfig,
            executionOrder: idx + 1,
            isActive: true,
          })),
        }),
      });

      router.push('/settings/workflows');
    } catch (err: any) {
      setError(err.message || 'Failed to save workflow rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Top Header */}
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
              <h1 className="text-xl font-bold text-[#0F172A]">Create Workflow Rule</h1>
              <p className="text-xs text-[#475569]">
                Configure triggers, conditional criteria, and automated actions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Workflow'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: General Info */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#1E3A8A]" />
              <span>1. General Information & Trigger</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Employee Onboarding Tasks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">Target Entity Type *</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="Employee">Employee</option>
                  <option value="Department">Department</option>
                  <option value="ProfileChangeRequest">Profile Change Request</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">Trigger Event *</label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="record_created">When Record is Created</option>
                  <option value="record_updated">When Record is Updated</option>
                  <option value="status_changed">When Status Changes</option>
                  <option value="profile_change_request">When Profile Change is Requested</option>
                  <option value="manual_trigger">Manual Trigger</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">Execution Priority</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <span className="text-[10px] text-[#64748B]">Higher numbers execute first</span>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain when and why this workflow runs..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Conditions Builder */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                <GitPullRequest className="w-4 h-4 text-[#1E3A8A]" />
                <span>2. Conditions & Filters</span>
              </h2>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[#64748B]">Match:</span>
                <select
                  value={conditionMatchType}
                  onChange={(e) => setConditionMatchType(e.target.value as ConditionMatchType)}
                  className="px-2.5 py-1 border border-[#CBD5E1] rounded-lg text-xs bg-white font-semibold"
                >
                  <option value={ConditionMatchType.ALL}>ALL Conditions (AND)</option>
                  <option value={ConditionMatchType.ANY}>ANY Condition (OR)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-[#E2E8F0]">
                  <input
                    type="text"
                    placeholder="Field path (e.g. department.code or status)"
                    value={cond.field}
                    onChange={(e) => updateCondition(idx, 'field', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                  />
                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                    className="w-40 px-2.5 py-1.5 border border-[#CBD5E1] rounded text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="starts_with">Starts With</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="in">In (comma list)</option>
                    <option value="is_empty">Is Empty</option>
                    <option value="is_not_empty">Is Not Empty</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Expected value"
                    value={cond.value}
                    onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[#CBD5E1] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => removeCondition(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                    title="Remove condition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addCondition}
                className="inline-flex items-center space-x-1.5 text-xs text-[#1E3A8A] font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Condition</span>
              </button>
            </div>
          </div>

          {/* Section 3: Actions Builder */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#1E3A8A]" />
              <span>3. Automated Actions</span>
            </h2>

            <div className="space-y-4">
              {actions.map((action, idx) => (
                <div key={idx} className="border border-[#CBD5E1] rounded-lg p-3 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <select
                        value={action.actionType}
                        onChange={(e) => updateActionType(idx, e.target.value)}
                        className="px-3 py-1.5 border border-[#CBD5E1] rounded text-xs font-semibold bg-white"
                      >
                        <option value="create_task">Create Task</option>
                        <option value="send_notification">Send Notification</option>
                        <option value="send_email">Send Email</option>
                        <option value="create_checklist_run">Start Checklist Run</option>
                        <option value="create_approval_flow">Create Approval Flow</option>
                        <option value="call_webhook">Call Webhook</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAction(idx)}
                      className="text-rose-600 hover:bg-rose-50 p-1.5 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Config options based on actionType */}
                  {action.actionType === 'create_task' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Task Title</label>
                        <input
                          type="text"
                          value={action.actionConfig.title || ''}
                          onChange={(e) => updateActionConfig(idx, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                        <select
                          value={action.actionConfig.priority || 'medium'}
                          onChange={(e) => updateActionConfig(idx, 'priority', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={action.actionConfig.description || ''}
                          onChange={(e) => updateActionConfig(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {action.actionType === 'send_email' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Recipient (Email or Placeholder)</label>
                        <input
                          type="text"
                          value={action.actionConfig.to || ''}
                          onChange={(e) => updateActionConfig(idx, 'to', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                        <input
                          type="text"
                          value={action.actionConfig.subject || ''}
                          onChange={(e) => updateActionConfig(idx, 'subject', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Email Body</label>
                        <textarea
                          rows={2}
                          value={action.actionConfig.body || ''}
                          onChange={(e) => updateActionConfig(idx, 'body', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {action.actionType === 'send_notification' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Title</label>
                        <input
                          type="text"
                          value={action.actionConfig.title || ''}
                          onChange={(e) => updateActionConfig(idx, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Message</label>
                        <input
                          type="text"
                          value={action.actionConfig.message || ''}
                          onChange={(e) => updateActionConfig(idx, 'message', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {action.actionType === 'call_webhook' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Webhook Endpoint URL</label>
                        <input
                          type="url"
                          value={action.actionConfig.url || ''}
                          onChange={(e) => updateActionConfig(idx, 'url', e.target.value)}
                          className="w-full px-3 py-1.5 border rounded bg-white font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addAction}
                className="inline-flex items-center space-x-1.5 text-xs text-[#1E3A8A] font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Action</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
