'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Flame, Award, Filter, Sparkles } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function RecognitionFeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [recognitions, setRecognitions] = useState([
    {
      id: 'rec-1',
      sender: { firstName: 'Maya', lastName: 'Lin', department: { name: 'Design' } },
      receiver: { firstName: 'Carlos', lastName: 'Mendoza', department: { name: 'Engineering' } },
      category: 'INNOVATION',
      message: 'Built a magnificent interactive dashboard widget that reduced customer report generation time by 75%!',
      pointsAwarded: 100,
      likesCount: 14,
      createdAt: '2026-11-18T10:30:00.000Z',
    },
    {
      id: 'rec-2',
      sender: { firstName: 'Sarah', lastName: 'Chen', department: { name: 'Engineering' } },
      receiver: { firstName: 'Alex', lastName: 'Kim', department: { name: 'Product' } },
      category: 'COLLABORATION',
      message: 'Incredible cross-functional support during the release sprint! Always willing to pair program and debug.',
      pointsAwarded: 50,
      likesCount: 8,
      createdAt: '2026-11-18T09:15:00.000Z',
    },
    {
      id: 'rec-3',
      sender: { firstName: 'Marcus', lastName: 'Taylor', department: { name: 'Customer Success' } },
      receiver: { firstName: 'Priya', lastName: 'Patel', department: { name: 'Engineering' } },
      category: 'CUSTOMER_FOCUS',
      message: 'Resolved high-priority client defect in under 2 hours. Heroic effort for customer satisfaction!',
      pointsAwarded: 75,
      likesCount: 22,
      createdAt: '2026-11-17T16:45:00.000Z',
    },
    {
      id: 'rec-4',
      sender: { firstName: 'David', lastName: 'O\'Connor', department: { name: 'Operations' } },
      receiver: { firstName: 'Elena', lastName: 'Rostova', department: { name: 'Design' } },
      category: 'GOING_ABOVE_AND_BEYOND',
      message: 'Redesigned the entire onboarding collateral on short notice for our new joiner orientation.',
      pointsAwarded: 50,
      likesCount: 9,
      createdAt: '2026-11-17T11:20:00.000Z',
    },
  ]);

  const categories = [
    'ALL',
    'TEAMWORK',
    'LEADERSHIP',
    'INNOVATION',
    'CUSTOMER_FOCUS',
    'OWNERSHIP',
    'QUALITY',
    'COLLABORATION',
    'GOING_ABOVE_AND_BEYOND',
    'VALUES_ALIGNMENT',
  ];

  const handleLike = (id: string) => {
    setRecognitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, likesCount: r.likesCount + 1 } : r)),
    );
  };

  const filtered =
    selectedCategory === 'ALL'
      ? recognitions
      : recognitions.filter((r) => r.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Recognition Wall</h1>
            <p className="text-xs text-slate-500 mt-1">
              Celebrating team victories, values alignment, and peer contributions across Zentra.
            </p>
          </div>
          <Link
            href="/engagement/recognition/give"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Give Recognition</span>
          </Link>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1E3A8A] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Feed List */}
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1E3A8A] font-black flex items-center justify-center text-sm">
                    {item.receiver.firstName[0]}
                    {item.receiver.lastName[0]}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">
                      <span className="font-bold text-slate-900">
                        {item.sender.firstName} {item.sender.lastName}
                      </span>{' '}
                      recognized
                    </div>
                    <div className="text-sm font-extrabold text-[#1E3A8A]">
                      {item.receiver.firstName} {item.receiver.lastName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>+{item.pointsAwarded} pts</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                "{item.message}"
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                <button
                  onClick={() => handleLike(item.id)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors text-xs font-semibold"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{item.likesCount} Applaud</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
