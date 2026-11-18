'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Send, Sparkles, AlertCircle, CheckCircle2, ArrowLeft, Flame } from 'lucide-react';
import { EngagementNav } from '../../engagement-nav';

export default function GiveRecognitionPage() {
  const router = useRouter();

  const [colleagueId, setColleagueId] = useState('');
  const [category, setCategory] = useState('TEAMWORK');
  const [points, setPoints] = useState(50);
  const [badge, setBadge] = useState('bdg-1');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleColleagues = [
    { id: 'emp-101', name: 'Alex Kim', dept: 'Product Management' },
    { id: 'emp-102', name: 'Carlos Mendoza', dept: 'Engineering' },
    { id: 'emp-103', name: 'Elena Rostova', dept: 'UI/UX Design' },
    { id: 'emp-104', name: 'Priya Patel', dept: 'QA & Engineering' },
    { id: 'emp-105', name: 'David O\'Connor', dept: 'Operations & People' },
  ];

  const categories = [
    { value: 'TEAMWORK', label: 'Teamwork & Support' },
    { value: 'LEADERSHIP', label: 'Inspirational Leadership' },
    { value: 'INNOVATION', label: 'Creative Innovation' },
    { value: 'CUSTOMER_FOCUS', label: 'Customer Obsession' },
    { value: 'OWNERSHIP', label: 'Extreme Ownership' },
    { value: 'QUALITY', label: 'Quality & Craftsmanship' },
    { value: 'COLLABORATION', label: 'Cross-functional Collaboration' },
    { value: 'GOING_ABOVE_AND_BEYOND', label: 'Going Above & Beyond' },
    { value: 'VALUES_ALIGNMENT', label: 'Core Values Champion' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colleagueId) {
      setError('Please select a colleague to recognize');
      return;
    }
    if (!message.trim()) {
      setError('Please write a message of appreciation');
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/engagement/recognition"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recognition Wall</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-600 fill-current" />
              <h1 className="text-xl font-bold text-slate-900">Send Recognition & Praise</h1>
            </div>
            <p className="text-xs text-slate-500">
              Celebrate your colleague’s exceptional contributions and award recognition points.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Recognition Published!</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your praise has been posted to the Recognition Wall and +{points} points have been credited to your colleague.
              </p>
              <div className="pt-2 flex justify-center space-x-3">
                <Link
                  href="/engagement/recognition"
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors"
                >
                  View on Recognition Wall
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Colleague Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Who would you like to recognize? *
                </label>
                <select
                  value={colleagueId}
                  onChange={(e) => setColleagueId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a team member...</option>
                  {sampleColleagues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Value Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Points Allocation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Points Award</label>
                  <span className="text-xs font-extrabold text-amber-600 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>+{points} pts</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPoints(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                        points === val
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      +{val} pts
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Recognition Message *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share specifically how their work or attitude made a difference..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Recognition</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
