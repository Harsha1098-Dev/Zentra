'use client';

import React from 'react';
import { Award, Shield, Star, Zap, Users, Sparkles, Heart } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function MyBadgesPage() {
  const earnedBadges = [
    {
      id: 'bdg-1',
      name: 'Team MVP',
      description: 'Awarded for demonstrating extraordinary teamwork and unblocking teammates.',
      category: 'TEAMWORK',
      icon: Users,
      color: '#1E3A8A',
      awardedAt: '2026-11-05',
      pointsAward: 50,
      reason: 'Helped resolve cross-service regression prior to release',
    },
    {
      id: 'bdg-2',
      name: 'Innovation Pioneer',
      description: 'Awarded for conceptualizing and implementing creative process improvements.',
      category: 'INNOVATION',
      icon: Zap,
      color: '#7C3AED',
      awardedAt: '2026-10-18',
      pointsAward: 100,
      reason: 'Designed customer self-service reporting widget',
    },
    {
      id: 'bdg-3',
      name: 'Culture Champion',
      description: 'Actively promotes psychological safety, inclusion, and positive peer encouragement.',
      category: 'VALUES',
      icon: Heart,
      color: '#DB2777',
      awardedAt: '2026-09-24',
      pointsAward: 75,
      reason: 'Organized monthly department wellness lunch and cheer sessions',
    },
  ];

  const availableBadges = [
    {
      id: 'bdg-4',
      name: 'Quality Crusader',
      description: 'Awarded for zero-defect releases and highest unit test coverage excellence.',
      category: 'QUALITY',
      icon: Shield,
      pointsAward: 50,
    },
    {
      id: 'bdg-5',
      name: 'Customer Delight',
      description: 'Awarded for earning a 5/5 CSAT rating from external enterprise clients.',
      category: 'CUSTOMER_FOCUS',
      icon: Star,
      pointsAward: 75,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Your Badge Showcase</h1>
          <p className="text-xs text-slate-500 mt-1">
            Recognition honors and digital credentials unlocked throughout your journey at Zentra.
          </p>
        </div>

        {/* Earned Badges */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-[#1E3A8A]" />
            <span>Earned Badges ({earnedBadges.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {earnedBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: badge.color }}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">{badge.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{badge.description}</p>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-700">Reason: "{badge.reason}"</div>
                    <div>Unlocked on {new Date(badge.awardedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Badges */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Badges to Unlock</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center space-x-4 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{badge.name}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{badge.description}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      +{badge.pointsAward} pts on award
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
