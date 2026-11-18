'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Ticket,
  HelpCircle,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

function NewTicketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCat = searchParams.get('category') || '';

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(defaultCat);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }[]>([]);

  const [suggestedFaqs, setSuggestedFaqs] = useState<any[]>([]);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await ApiClient.request('/helpdesk/categories');
        if (Array.isArray(res)) {
          setCategories(res);
          if (defaultCat) {
            setSelectedCategory(defaultCat);
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, [defaultCat]);

  // Suggested FAQs on subject or category change
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!subject || subject.length < 3) {
        setSuggestedFaqs([]);
        return;
      }
      try {
        let url = `/helpdesk/faqs/suggest?query=${encodeURIComponent(subject)}`;
        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }
        const res = await ApiClient.request(url);
        if (Array.isArray(res)) {
          setSuggestedFaqs(res);
        }
      } catch (err) {
        // silent fail on suggestions
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [subject, selectedCategory]);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const subCategories = activeCategoryObj?.subCategories || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt = {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      };
      setAttachments([...attachments, newAtt]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCategory) {
      setErrorMsg('Please select a category');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Please enter a ticket subject');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please describe your issue');
      return;
    }

    try {
      setSubmitting(true);
      const res = await ApiClient.request('/me/tickets', {
        method: 'POST',
        body: JSON.stringify({
          helpdeskCategoryId: selectedCategory,
          helpdeskSubCategoryId: selectedSubCategory || null,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          attachments,
        }),
      });

      if (res && res.id) {
        router.push(`/helpdesk/my-tickets/${res.id}`);
      } else {
        router.push('/helpdesk/my-tickets');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit ticket. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/helpdesk/my-tickets"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to My Tickets
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Submit a Support Ticket</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Our support team is here to help. Fill in the details below.
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
          </div>

          {errorMsg && (
            <div className="mx-6 mt-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubCategory('');
                  }}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sub-Category (Optional)
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  disabled={subCategories.length === 0}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Sub-Category...</option>
                  {subCategories.map((sc: any) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                  { value: 'CRITICAL', label: 'Critical' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`py-2 text-xs font-medium rounded-lg border text-center transition ${
                      priority === p.value
                        ? 'border-[#1E3A8A] bg-blue-50 text-[#1E3A8A] font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cannot connect to Office VPN"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              />
            </div>

            {/* Suggested FAQs deflection drawer */}
            {suggestedFaqs.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#1E3A8A]">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Instant Answers (Did this solve your problem?)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Review these matching FAQs before submitting a ticket:
                </p>
                <div className="space-y-2">
                  {suggestedFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="bg-white rounded-lg border border-slate-200 p-3 text-xs shadow-2xs"
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer font-semibold text-slate-900"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        >
                          <span>{faq.question}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-slate-600 space-y-2">
                            <p>{faq.answer}</p>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => router.push('/helpdesk')}
                                className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Yes, this solved my issue!
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description & Steps to Reproduce <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Please describe what happened, any error messages, and what you've tried..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attachments (Screenshots / Logs)
              </label>
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer transition">
                  <Paperclip className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Attach File
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                <span className="text-[11px] text-slate-400">
                  PNG, JPG, PDF up to 10MB
                </span>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
                    >
                      <Paperclip className="w-3 h-3 mr-1 text-slate-400" />
                      <span className="truncate max-w-[150px]">{att.fileName}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments(attachments.filter((_, i) => i !== idx))
                        }
                        className="ml-2 text-slate-400 hover:text-rose-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/helpdesk/my-tickets"
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-[#1E3A8A] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting ticket...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <NewTicketContent />
    </Suspense>
  );
}
