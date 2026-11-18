'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Eye,
  ThumbsUp,
  FileText,
  CheckCircle,
  Archive,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

export default function KnowledgeBaseSettingsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [artsRes, catsRes] = await Promise.allSettled([
        ApiClient.request('/helpdesk/knowledge-base/articles?limit=100'),
        ApiClient.request('/helpdesk/knowledge-base/categories'),
      ]);

      if (artsRes.status === 'fulfilled' && artsRes.value?.items) {
        setArticles(artsRes.value.items);
      }
      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        setCategories(catsRes.value);
        if (catsRes.value.length > 0 && !categoryId) {
          setCategoryId(catsRes.value[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load KB settings', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ApiClient.request('/helpdesk/knowledge-base/articles', {
        method: 'POST',
        body: JSON.stringify({
          knowledgeBaseCategoryId: categoryId,
          title: title.trim(),
          summary: summary.trim() || null,
          content: content.trim(),
          articleStatus: 'PUBLISHED',
        }),
      });
      setShowModal(false);
      setTitle('');
      setSummary('');
      setContent('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create article');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (artId: string) => {
    try {
      await ApiClient.request(`/helpdesk/knowledge-base/articles/${artId}/archive`, {
        method: 'POST',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to archive article');
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
            <h1 className="text-xl font-bold text-slate-900">Knowledge Base Articles</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create, review, publish, and maintain employee reference guides
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Article
          </button>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Helpful</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading articles...
                    </td>
                  </tr>
                ) : articles.length > 0 ? (
                  articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {art.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {art.category?.name || 'General'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            art.articleStatus === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {art.articleStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{art.viewCount || 0}</td>
                      <td className="py-3.5 px-4 text-slate-500">{art.helpfulCount || 0}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          href={`/helpdesk/knowledge-base/${art.slug || art.id}`}
                          className="text-[#1E3A8A] font-semibold hover:underline"
                        >
                          View
                        </Link>
                        {art.articleStatus !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleArchive(art.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            Archive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No articles created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Article */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">New Knowledge Base Article</h2>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How to set up multi-factor authentication"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Summary
                  </label>
                  <input
                    type="text"
                    placeholder="A brief 1-sentence overview..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Content & Guide *
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Full instructions, markdown or plaintext steps..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
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
                    {submitting ? 'Publishing...' : 'Publish Article'}
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
