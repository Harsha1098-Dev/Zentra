'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  UserX,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { HelpdeskNav } from '../helpdesk-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';

export default function AgentWorkbenchPage() {
  const { user } = useAuth();
  const [workbenchSummary, setWorkbenchSummary] = useState<any>({
    assignedToMeCount: 0,
    unassignedCount: 0,
    urgentTicketsCount: 0,
    slaBreachWarningCount: 0,
    resolvedTodayCount: 0,
  });

  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned' | 'urgent' | 'sla_warning'>('assigned');
  const [tickets, setTickets] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load workbench stats and agents
  useEffect(() => {
    async function loadMeta() {
      try {
        const [sumRes, agentsRes] = await Promise.allSettled([
          ApiClient.request('/helpdesk/reports/workbench'),
          ApiClient.request('/helpdesk/agents'),
        ]);

        if (sumRes.status === 'fulfilled' && sumRes.value) {
          setWorkbenchSummary(sumRes.value);
        }
        if (agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value)) {
          setAgents(agentsRes.value);
        }
      } catch (err) {
        console.error('Failed to load workbench metadata', err);
      }
    }
    loadMeta();
  }, []);

  // Load tickets for selected tab
  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        let url = '/helpdesk/tickets?limit=50';

        if (activeTab === 'unassigned') {
          url += '&unassigned=true';
        } else if (activeTab === 'urgent') {
          url += '&priority=URGENT';
        }

        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const res = await ApiClient.request(url);
        if (res && res.items) {
          let list = res.items;
          if (activeTab === 'assigned' && user?.id) {
            // Find current agent
            const myAgent = agents.find((a) => a.userId === user.id);
            if (myAgent) {
              list = list.filter((t: any) => t.assignedAgentId === myAgent.id);
            }
          } else if (activeTab === 'sla_warning') {
            list = list.filter((t: any) => t.escalationStatus === 'BREACHED' || t.escalationStatus === 'ESCALATED');
          }
          setTickets(list);
        }
      } catch (err) {
        console.error('Failed to load tickets', err);
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [activeTab, searchQuery, agents, user]);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Agent Workbench</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage ticket queues, respond to employee requests, and maintain SLA compliance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              ● Online & Ready
            </span>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div
            onClick={() => setActiveTab('assigned')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              activeTab === 'assigned'
                ? 'border-[#1E3A8A] bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Assigned To Me</span>
              <UserCheck className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              {workbenchSummary.assignedToMeCount}
            </h3>
          </div>

          <div
            onClick={() => setActiveTab('unassigned')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              activeTab === 'unassigned'
                ? 'border-[#1E3A8A] bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Unassigned Pool</span>
              <UserX className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              {workbenchSummary.unassignedCount}
            </h3>
          </div>

          <div
            onClick={() => setActiveTab('urgent')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              activeTab === 'urgent'
                ? 'border-[#1E3A8A] bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Urgent Priority</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-orange-600 mt-2">
              {workbenchSummary.urgentTicketsCount}
            </h3>
          </div>

          <div
            onClick={() => setActiveTab('sla_warning')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              activeTab === 'sla_warning'
                ? 'border-[#1E3A8A] bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">SLA Breaches</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-rose-600 mt-2">
              {workbenchSummary.slaBreachWarningCount}
            </h3>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Resolved Today</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-700 mt-2">
              {workbenchSummary.resolvedTodayCount}
            </h3>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700">Queue:</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
              {activeTab === 'assigned'
                ? 'My Assigned Tickets'
                : activeTab === 'unassigned'
                ? 'Unassigned Routing Pool'
                : activeTab === 'urgent'
                ? 'Urgent / Critical Queue'
                : 'SLA Escalations & Breaches'}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticket #, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {/* Tickets Workbench Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Due</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading queue...
                    </td>
                  </tr>
                ) : tickets.length > 0 ? (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                        {t.ticketNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[220px] truncate">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {t.helpdeskCategory?.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            t.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : t.priority === 'URGENT'
                              ? 'bg-orange-100 text-orange-800'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {t.ticketStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {t.slaResolutionDueAt ? (
                          <span
                            className={
                              new Date() > new Date(t.slaResolutionDueAt)
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-600'
                            }
                          >
                            {new Date(t.slaResolutionDueAt).toLocaleDateString()}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/helpdesk/agent/tickets/${t.id}`}
                          className="inline-flex items-center px-3 py-1 bg-[#1E3A8A] text-white font-semibold rounded text-[11px] hover:bg-blue-800 transition"
                        >
                          Manage &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No tickets in this queue. Great job!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
