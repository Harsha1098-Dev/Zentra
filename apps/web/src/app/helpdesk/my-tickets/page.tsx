'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Ticket,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { HelpdeskNav } from '../helpdesk-nav';
import { ApiClient } from '../../../lib/api';

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        let url = '/me/tickets?limit=50';
        if (statusFilter) {
          url += `&status=${statusFilter}`;
        }
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const res = await ApiClient.request(url);
        if (res && res.items) {
          setTickets(res.items);
        } else if (Array.isArray(res)) {
          setTickets(res);
        }
      } catch (err) {
        console.error('Failed to load tickets', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [statusFilter, searchQuery]);

  const statusBadges: Record<string, { bg: string; text: string; label: string }> = {
    OPEN: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Open' },
    IN_PROGRESS: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'In Progress' },
    WAITING_FOR_EMPLOYEE: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Action Required' },
    WAITING_FOR_APPROVAL: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Pending Approval' },
    ESCALATED: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Escalated' },
    ON_HOLD: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', label: 'On Hold' },
    RESOLVED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Resolved' },
    CLOSED: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-600', label: 'Closed' },
    REOPENED: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: 'Reopened' },
    CANCELLED: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-500', label: 'Cancelled' },
  };

  const priorityBadges: Record<string, { bg: string; text: string }> = {
    LOW: { bg: 'bg-slate-100', text: 'text-slate-700' },
    MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700' },
    HIGH: { bg: 'bg-amber-50', text: 'text-amber-700' },
    URGENT: { bg: 'bg-orange-50', text: 'text-orange-700' },
    CRITICAL: { bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Support Tickets</h1>
            <p className="text-xs text-slate-500 mt-1">
              Track, view conversations, and submit feedback for all your requests
            </p>
          </div>
          <Link
            href="/helpdesk/my-tickets/new"
            className="inline-flex items-center px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Raise New Ticket
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { label: 'All', value: '' },
              { label: 'Open', value: 'OPEN' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Action Required', value: 'WAITING_FOR_EMPLOYEE' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Closed', value: 'CLOSED' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  statusFilter === tab.value
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {/* Tickets Table / List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading tickets...</div>
          ) : tickets.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {tickets.map((t) => {
                const badge = statusBadges[t.ticketStatus] || {
                  bg: 'bg-slate-100 border-slate-200',
                  text: 'text-slate-600',
                  label: t.ticketStatus,
                };
                const prio = priorityBadges[t.priority] || {
                  bg: 'bg-slate-100',
                  text: 'text-slate-600',
                };

                return (
                  <Link
                    key={t.id}
                    href={`/helpdesk/my-tickets/${t.id}`}
                    className="p-5 flex items-center justify-between hover:bg-blue-50/40 transition block group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[#1E3A8A]">
                            {t.ticketNumber}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded ${prio.bg} ${prio.text}`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mt-1 group-hover:text-[#1E3A8A] transition">
                          {t.subject}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {t.description}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-2">
                          <span>Category: <strong className="text-slate-600">{t.helpdeskCategory?.name}</strong></span>
                          <span>&bull;</span>
                          <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                          {t.assignedAgent?.user && (
                            <>
                              <span>&bull;</span>
                              <span>Agent: {t.assignedAgent.user.firstName} {t.assignedAgent.user.lastName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-4">
                      {t.satisfactionRating && (
                        <div className="text-right hidden sm:block">
                          <span className="text-xs font-semibold text-amber-500">
                            ★ {t.satisfactionRating}/5
                          </span>
                          <p className="text-[10px] text-slate-400">Rating given</p>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900 mt-3">No tickets found</h3>
              <p className="text-xs text-slate-500 mt-1">
                You haven't submitted any support tickets yet, or none match your filter.
              </p>
              <Link
                href="/helpdesk/my-tickets/new"
                className="inline-flex items-center mt-4 px-3.5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Raise your first ticket
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>}>
      <MyTicketsContent />
    </Suspense>
  );
}
