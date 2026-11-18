'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Ticket,
  ArrowRight,
} from 'lucide-react';
import { HelpdeskNav } from '../helpdesk-nav';
import { ApiClient } from '../../../lib/api';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFaqs() {
      try {
        setLoading(true);
        const [faqsRes, catsRes] = await Promise.allSettled([
          ApiClient.request('/helpdesk/faqs'),
          ApiClient.request('/helpdesk/categories'),
        ]);

        if (faqsRes.status === 'fulfilled' && Array.isArray(faqsRes.value)) {
          setFaqs(faqsRes.value);
        }
        if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
          setCategories(catsRes.value);
        }
      } catch (err) {
        console.error('Failed to load FAQs', err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const filteredFaqs = faqs.filter((faq) => {
    if (selectedCategory && faq.helpdeskCategoryId !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleVote = async (faqId: string) => {
    try {
      await ApiClient.request(`/helpdesk/faqs/${faqId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ isHelpful: true }),
      });
      setFaqs(
        faqs.map((f) =>
          f.id === faqId ? { ...f, helpfulCount: (f.helpfulCount || 0) + 1 } : f,
        ),
      );
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h1>
            <p className="text-xs text-slate-500 mt-1">
              Instant answers to common workplace, IT, payroll, and benefits questions
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              !selectedCategory
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Questions ({faqs.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedCategory === c.id
                  ? 'bg-[#1E3A8A] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Loading FAQs...
            </div>
          ) : filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center space-x-3 pr-4">
                      <HelpCircle className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                      <span className="text-xs font-bold text-slate-900">
                        {faq.question}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>
                          {faq.helpdeskCategory?.name && `Category: ${faq.helpdeskCategory.name}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleVote(faq.id)}
                          className="inline-flex items-center space-x-1 text-slate-500 hover:text-emerald-700 transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Helpful ({faq.helpfulCount || 0})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              No FAQs matched your search.
            </div>
          )}
        </div>

        {/* Still Have Questions Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center space-y-2">
          <h3 className="text-sm font-bold text-slate-900">
            Still can't find what you're looking for?
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Our support teams are ready to help. Submit a ticket and an agent will be assigned to assist you.
          </p>
          <div className="pt-2">
            <Link
              href="/helpdesk/my-tickets/new"
              className="inline-flex items-center px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
            >
              <Ticket className="w-3.5 h-3.5 mr-1.5" />
              Raise Support Ticket &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
