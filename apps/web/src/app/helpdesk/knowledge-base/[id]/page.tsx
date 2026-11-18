'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

export default function KnowledgeBaseArticleReaderPage() {
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    async function loadArticle() {
      try {
        setLoading(true);
        const res = await ApiClient.request(`/helpdesk/knowledge-base/articles/${id}`);
        setArticle(res);
      } catch (err) {
        console.error('Failed to load article', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadArticle();
    }
  }, [id]);

  const handleVote = async (isHelpful: boolean) => {
    if (voted || !article) return;
    try {
      await ApiClient.request(`/helpdesk/knowledge-base/articles/${article.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ isHelpful }),
      });
      setVoted(isHelpful ? 'yes' : 'no');
      setArticle({
        ...article,
        helpfulCount: isHelpful ? article.helpfulCount + 1 : article.helpfulCount,
        notHelpfulCount: !isHelpful ? article.notHelpfulCount + 1 : article.notHelpfulCount,
      });
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <HelpdeskNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-slate-400">
          Loading article...
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <HelpdeskNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-sm font-bold text-slate-900 mt-2">Article Not Found</h2>
          <Link
            href="/helpdesk/knowledge-base"
            className="inline-block mt-3 text-xs font-semibold text-[#1E3A8A] hover:underline"
          >
            &larr; Back to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/helpdesk/knowledge-base"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1E3A8A]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Knowledge Base
        </Link>

        {/* Article Document */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#1E3A8A] mb-2">
              <span className="bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {article.category?.name || 'General'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-sm text-slate-600 mt-2">
                {article.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Updated {new Date(article.updatedAt).toLocaleDateString()}
              </span>
              <span>&bull;</span>
              <span className="flex items-center">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                {article.viewCount || 0} views
              </span>
              <span>&bull;</span>
              <span className="flex items-center">
                <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                {article.helpfulCount || 0} found this helpful
              </span>
            </div>
          </div>

          {/* Article Body */}
          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {article.content}
          </div>

          {/* Helpfulness Voting Card */}
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 rounded-xl p-6 text-center space-y-3">
            <h4 className="text-xs font-bold text-slate-900">
              Was this article helpful?
            </h4>
            {voted ? (
              <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-4 h-4" />
                <span>Thank you for your feedback!</span>
              </div>
            ) : (
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleVote(true)}
                  className="inline-flex items-center px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition shadow-2xs"
                >
                  <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(false)}
                  className="inline-flex items-center px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:border-rose-500 hover:text-rose-700 hover:bg-rose-50 transition shadow-2xs"
                >
                  <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
