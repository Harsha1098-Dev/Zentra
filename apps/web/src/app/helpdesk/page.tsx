'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Ticket,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Laptop,
  Users,
  CreditCard,
  Building,
} from 'lucide-react';
import { HelpdeskNav } from './helpdesk-nav';
import { ApiClient } from '../../lib/api';

export default function HelpdeskOverviewPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catsRes, artsRes, faqsRes, ticketsRes] = await Promise.allSettled([
          ApiClient.request('/helpdesk/categories'),
          ApiClient.request('/helpdesk/knowledge-base/articles?status=PUBLISHED&limit=6'),
          ApiClient.request('/helpdesk/faqs?limit=5'),
          ApiClient.request('/me/tickets?limit=5'),
        ]);

        if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
          setCategories(catsRes.value);
        }
        if (artsRes.status === 'fulfilled' && artsRes.value?.items) {
          setArticles(artsRes.value.items);
        }
        if (faqsRes.status === 'fulfilled' && Array.isArray(faqsRes.value)) {
          setFaqs(faqsRes.value);
        }
        if (ticketsRes.status === 'fulfilled' && ticketsRes.value?.items) {
          setMyTickets(ticketsRes.value.items);
        }
      } catch (err) {
        console.error('Failed to load helpdesk overview', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openTickets = myTickets.filter(
    (t) => !['CLOSED', 'CANCELLED', 'RESOLVED'].includes(t.ticketStatus),
  );
  const waitingTickets = myTickets.filter(
    (t) => t.ticketStatus === 'WAITING_FOR_EMPLOYEE',
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      {/* Hero Search Section */}
      <div className="bg-[#1E3A8A] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight">
            How can we help you today?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100">
            Search our knowledge base, browse frequently asked questions, or raise a support ticket.
          </p>

          <div className="mt-6 max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles, guides, policies, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 rounded-xl shadow-lg border-0 focus:ring-2 focus:ring-blue-300 text-sm placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Ticket Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Active Tickets
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {openTickets.length}
              </h3>
              <Link
                href="/helpdesk/my-tickets"
                className="text-xs text-[#1E3A8A] font-medium hover:underline inline-flex items-center mt-2"
              >
                View all tickets <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Action Required
              </p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {waitingTickets.length}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Awaiting your response
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E3A8A] to-blue-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Need Help?
              </p>
              <h3 className="text-lg font-bold mt-1">Submit New Ticket</h3>
              <Link
                href="/helpdesk/my-tickets/new"
                className="inline-flex items-center mt-3 px-3 py-1.5 bg-white text-[#1E3A8A] font-semibold text-xs rounded-lg shadow hover:bg-blue-50 transition"
              >
                Get Support <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="w-12 h-12 bg-blue-800/80 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Support Categories</h2>
            <Link
              href="/helpdesk/my-tickets/new"
              className="text-xs font-semibold text-[#1E3A8A] hover:underline"
            >
              Raise ticket in category &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/helpdesk/my-tickets/new?category=${cat.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center group-hover:bg-[#1E3A8A] group-hover:text-white transition">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-3 group-hover:text-[#1E3A8A] transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {cat.description || 'Assistance and requests for this category'}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                    <span>{cat._count?.tickets || 0} tickets</span>
                    <span className="text-[#1E3A8A] font-medium group-hover:translate-x-0.5 transition">
                      Select &rarr;
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-4 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No categories configured yet. HR administrators can create categories in Settings.
              </div>
            )}
          </div>
        </div>

        {/* Two-Column: Popular Knowledge Base Articles & Quick FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Knowledge Base */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="text-base font-bold text-slate-900">Popular Knowledge Base</h3>
              </div>
              <Link
                href="/helpdesk/knowledge-base"
                className="text-xs font-semibold text-[#1E3A8A] hover:underline"
              >
                Browse All &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {articles.length > 0 ? (
                articles.map((art) => (
                  <Link
                    key={art.id}
                    href={`/helpdesk/knowledge-base/${art.slug || art.id}`}
                    className="py-3.5 block hover:bg-slate-50 rounded-lg px-2 -mx-2 transition"
                  >
                    <h4 className="text-xs font-semibold text-slate-800 hover:text-[#1E3A8A]">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {art.summary || 'Click to view full guide and instructions'}
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-1.5">
                      <span>{art.category?.name}</span>
                      <span>&bull;</span>
                      <span>{art.viewCount || 0} views</span>
                      <span>&bull;</span>
                      <span>{art.helpfulCount || 0} found helpful</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No published articles yet. Check back soon!
                </div>
              )}
            </div>
          </div>

          {/* Quick FAQs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
              </div>
              <Link
                href="/helpdesk/faqs"
                className="text-xs font-semibold text-[#1E3A8A] hover:underline"
              >
                View all FAQs &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {faqs.length > 0 ? (
                faqs.map((faq) => (
                  <div key={faq.id} className="py-3.5">
                    <h4 className="text-xs font-semibold text-slate-800">
                      {faq.question}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {faq.answer}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No FAQs listed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
