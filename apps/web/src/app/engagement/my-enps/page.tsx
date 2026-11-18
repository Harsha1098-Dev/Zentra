'use client';

import React, { useState } from 'react';
import { ShieldCheck, Send, CheckCircle2, HeartHandshake } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function MyEnpsPage() {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === null) return;
    setSubmitted(true);
  };

  const getCategory = (s: number) => {
    if (s >= 9) return { label: 'Promoter', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (s >= 7) return { label: 'Passive', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Detractor', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <HeartHandshake className="w-6 h-6 text-[#1E3A8A]" />
              <h1 className="text-xl font-bold text-slate-900">Employee Net Promoter Score (eNPS)</h1>
            </div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Strictly Anonymous</span>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Response Recorded!</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thank you for your honesty. Your anonymous feedback directly informs our leadership on how we can make Zentra an even better workplace.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  How likely are you to recommend Zentra as a place to work to a friend or colleague?
                </label>
                <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = score === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setScore(num)}
                        className={`w-11 h-11 rounded-xl text-sm font-black transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#1E3A8A] text-white shadow-md scale-105 ring-2 ring-blue-500'
                            : num >= 9
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            : num >= 7
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                            : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>0 - Not at all likely</span>
                  <span>10 - Extremely likely</span>
                </div>

                {score !== null && (
                  <div className="flex items-center space-x-2 pt-2">
                    <span className="text-xs text-slate-600">Classification:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getCategory(score).color}`}>
                      {getCategory(score).label}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  What is the primary reason for your score? (Optional feedback)
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you love or what we can do better..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={score === null}
                  className="px-6 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Confidential eNPS</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
