'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  Plus,
  Trash2,
  ThumbsUp,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

export default function FaqsSettingsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
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
      console.error('Failed to load FAQs settings', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ApiClient.request('/helpdesk/faqs', {
        method: 'POST',
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          helpdeskCategoryId: categoryId || null,
        }),
      });
      setShowModal(false);
      setQuestion('');
      setAnswer('');
      setCategoryId('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create FAQ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await ApiClient.request(`/helpdesk/faqs/${faqId}`, {
        method: 'DELETE',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/helpdesk/settings"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1E3A8A]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Helpdesk Settings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">FAQ Question Library</h1>
            <p className="text-xs text-slate-500 mt-1">
              Maintain instant answers displayed during ticket creation to deflect common inquiries
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New FAQ
          </button>
        </div>

        {/* FAQs List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading FAQs...</div>
            ) : faqs.length > 0 ? (
              faqs.map((faq) => (
                <div key={faq.id} className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A]">
                        {faq.helpdeskCategory?.name || 'General'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <ThumbsUp className="w-3 h-3 mr-1 text-slate-400" />
                        {faq.helpfulCount || 0} helpful votes
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{faq.question}</h3>
                    <p className="text-xs text-slate-600 mt-1">{faq.answer}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                No FAQs added yet.
              </div>
            )}
          </div>
        </div>

        {/* Modal: New FAQ */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">Add New FAQ</h2>
              <form onSubmit={handleCreateFaq} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mapped Category (Optional)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="">General (All Categories)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How do I request a software license?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Answer *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Clear and actionable answer to solve the user's inquiry..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Adding...' : 'Add FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
