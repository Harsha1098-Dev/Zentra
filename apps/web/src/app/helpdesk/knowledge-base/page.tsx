'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  Folder,
  ChevronRight,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { HelpdeskNav } from '../helpdesk-nav';
import { ApiClient } from '../../../lib/api';

export default function KnowledgeBasePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKB() {
      try {
        setLoading(true);
        const [catsRes, artsRes] = await Promise.allSettled([
          ApiClient.request('/helpdesk/knowledge-base/categories'),
          ApiClient.request('/helpdesk/knowledge-base/articles?status=PUBLISHED&limit=100'),
        ]);

        if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
          setCategories(catsRes.value);
        }
        if (artsRes.status === 'fulfilled' && artsRes.value?.items) {
          setArticles(artsRes.value.items);
        }
      } catch (err) {
        console.error('Failed to load KB', err);
      } finally {
        setLoading(false);
      }
    }
    loadKB();
  }, []);

  const filteredArticles = articles.filter((art) => {
    if (selectedCatId && art.knowledgeBaseCategoryId !== selectedCatId) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchSummary = art.summary?.toLowerCase().includes(q);
      const matchContent = art.content?.toLowerCase().includes(q);
      return matchTitle || matchSummary || matchContent;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Knowledge Base</h1>
            <p className="text-xs text-slate-500 mt-1">
              Find self-help guides, workplace policies, setup instructions, and troubleshooting tips
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search guides & articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCatId('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                    !selectedCatId
                      ? 'bg-blue-50 text-[#1E3A8A] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Articles</span>
                  <span className="text-[11px] text-slate-400">{articles.length}</span>
                </button>

                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCatId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedCatId === c.id
                        ? 'bg-blue-50 text-[#1E3A8A] font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {c._count?.articles || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles Feed */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                Loading knowledge base...
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((art) => (
                  <Link
                    key={art.id}
                    href={`/helpdesk/knowledge-base/${art.slug || art.id}`}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-2">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {art.category?.name || 'General'}
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(art.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1E3A8A] transition line-clamp-1">
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {art.summary || art.content.slice(0, 120)}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {art.viewCount || 0}
                        </span>
                        <span className="flex items-center">
                          <ThumbsUp className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {art.helpfulCount || 0}
                        </span>
                      </div>
                      <span className="text-[#1E3A8A] font-semibold flex items-center group-hover:translate-x-0.5 transition">
                        Read <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800 mt-2">No articles found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search terms or selecting another category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
