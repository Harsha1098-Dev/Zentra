'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Ticket,
  Clock,
  Send,
  Lock,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  FileText,
  UserCheck,
} from 'lucide-react';
import { HelpdeskNav } from '../../../helpdesk-nav';
import { ApiClient } from '../../../../../lib/api';
import { useAuth } from '../../../../../context/auth-context';

export default function AgentTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<any | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer states
  const [activeComposerTab, setActiveComposerTab] = useState<'reply' | 'note'>('reply');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status & Assignment actions
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [ticketRes, agentsRes] = await Promise.allSettled([
        ApiClient.request(`/helpdesk/tickets/${ticketId}`),
        ApiClient.request('/helpdesk/agents'),
      ]);

      if (ticketRes.status === 'fulfilled' && ticketRes.value) {
        setTicket(ticketRes.value);
        setSelectedAgentId(ticketRes.value.assignedAgentId || '');
      }
      if (agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value)) {
        setAgents(agentsRes.value);
      }
    } catch (err) {
      console.error('Failed to load agent ticket details', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ticketId) {
      loadData();
    }
  }, [ticketId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSubmitting(true);
      const isInternal = activeComposerTab === 'note';
      await ApiClient.request(`/helpdesk/tickets/${ticketId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({
          message: message.trim(),
          isInternal,
          messageType: isInternal ? 'NOTE' : 'REPLY',
        }),
      });
      setMessage('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setActionLoading(true);
      await ApiClient.request(`/helpdesk/tickets/${ticketId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          comments: statusComment || `Status changed to ${newStatus}`,
        }),
      });
      setStatusComment('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to change ticket status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAgent = async (newAgentId: string) => {
    try {
      setActionLoading(true);
      await ApiClient.request(`/helpdesk/tickets/${ticketId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          agentId: newAgentId || null,
          comments: 'Agent reassigned via workbench',
        }),
      });
      setSelectedAgentId(newAgentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign agent');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <HelpdeskNav />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-xs text-slate-400">
          Loading ticket management workspace...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <HelpdeskNav />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-sm font-bold text-slate-800">Ticket Not Found</h2>
          <Link
            href="/helpdesk/agent"
            className="text-xs text-[#1E3A8A] font-semibold hover:underline mt-2 inline-block"
          >
            &larr; Back to Workbench
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/helpdesk/agent"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1E3A8A]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Agent Workbench
        </Link>

        {/* Top Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                {ticket.ticketStatus}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                {ticket.priority} Priority
              </span>
              {ticket.escalationStatus === 'BREACHED' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1" /> SLA BREACHED
                </span>
              )}
            </div>

            {/* Quick Status Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {ticket.ticketStatus !== 'IN_PROGRESS' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                >
                  Mark In Progress
                </button>
              )}
              {ticket.ticketStatus !== 'WAITING_FOR_EMPLOYEE' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('WAITING_FOR_EMPLOYEE')}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                >
                  Wait for Employee
                </button>
              )}
              {ticket.ticketStatus !== 'RESOLVED' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('RESOLVED')}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition shadow-2xs"
                >
                  Resolve Ticket
                </button>
              )}
              {ticket.ticketStatus === 'RESOLVED' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('CLOSED')}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800 rounded-lg transition"
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
            <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
              {ticket.description}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Employee Requester</span>
              <span className="font-semibold text-slate-900">
                {ticket.employee?.firstName} {ticket.employee?.lastName} ({ticket.employee?.employeeCode})
              </span>
              <span className="text-slate-400 block text-[11px]">{ticket.employee?.workEmail}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Category</span>
              <span className="font-semibold text-slate-900">{ticket.helpdeskCategory?.name}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Assignee</span>
              <select
                value={selectedAgentId}
                onChange={(e) => handleAssignAgent(e.target.value)}
                disabled={actionLoading}
                className="mt-0.5 text-xs border border-slate-200 rounded p-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              >
                <option value="">Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.user?.firstName} {ag.user?.lastName} ({ag.agentLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">SLA Target</span>
              <span className="font-semibold text-slate-900">
                {ticket.slaResolutionDueAt
                  ? new Date(ticket.slaResolutionDueAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Conversation Thread with Internal Notes & Reply Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#1E3A8A]" />
              <h2 className="text-sm font-bold text-slate-900">Conversation & Internal Notes</h2>
            </div>
            <span className="text-xs text-slate-400">
              {ticket.conversations?.length || 0} messages total
            </span>
          </div>

          <div className="p-6 space-y-4">
            {ticket.conversations && ticket.conversations.length > 0 ? (
              ticket.conversations.map((msg: any) => {
                const isInternalNote = msg.isInternal;
                const isEmployee = msg.authorType === 'EMPLOYEE';

                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-4 text-xs ${
                      isInternalNote
                        ? 'bg-amber-50/70 border border-amber-200 text-amber-900'
                        : isEmployee
                        ? 'bg-blue-50/60 border border-blue-100 text-slate-800'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {isInternalNote ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                            <Lock className="w-3 h-3 mr-1" /> INTERNAL NOTE (Hidden from Employee)
                          </span>
                        ) : isEmployee ? (
                          <span className="text-[11px] font-bold text-[#1E3A8A]">
                            Employee: {ticket.employee?.firstName} {ticket.employee?.lastName}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-900">
                            Agent: {msg.author?.firstName} {msg.author?.lastName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No conversation history yet.
              </div>
            )}
          </div>

          {/* Dual Composer: Public Reply vs Internal Note */}
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex space-x-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveComposerTab('reply')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeComposerTab === 'reply'
                    ? 'bg-[#1E3A8A] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Public Reply to Employee
              </button>
              <button
                type="button"
                onClick={() => setActiveComposerTab('note')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition inline-flex items-center ${
                  activeComposerTab === 'note'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 hover:bg-amber-100/60'
                }`}
              >
                <Lock className="w-3 h-3 mr-1" />
                Add Internal Note
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                rows={3}
                placeholder={
                  activeComposerTab === 'reply'
                    ? 'Type a public response that will be sent to the employee...'
                    : 'Type a private note for other support agents (never visible to employee)...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`w-full text-xs border rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 ${
                  activeComposerTab === 'note'
                    ? 'border-amber-300 focus:ring-amber-500'
                    : 'border-slate-200 focus:ring-[#1E3A8A]'
                }`}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm text-white disabled:opacity-40 transition ${
                    activeComposerTab === 'note'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#1E3A8A] hover:bg-blue-800'
                  }`}
                >
                  {submitting
                    ? 'Sending...'
                    : activeComposerTab === 'note'
                    ? 'Post Internal Note'
                    : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
