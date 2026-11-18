'use client';

import React, { useState } from 'react';
import { Activity, Flame, Users, CheckCircle2, Clock, Calendar, Sparkles } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function WellnessPage() {
  const [activities, setActivities] = useState([
    {
      id: 'act-1',
      title: '10,000 Steps Daily Challenge',
      description: 'Sync your fitness tracker or log your daily steps to stay active during desk work.',
      category: 'FITNESS_CHALLENGE',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      maxParticipants: 50,
      enrolledCount: 38,
      pointsReward: 100,
      isEnrolled: true,
      isCompleted: false,
    },
    {
      id: 'act-2',
      title: 'Mindfulness & Guided Meditation Webinar',
      description: 'Live 45-minute interactive stress reduction and breathing workshop led by certified coach.',
      category: 'MENTAL_WELLNESS',
      startDate: '2026-11-24',
      endDate: '2026-11-24',
      maxParticipants: 30,
      enrolledCount: 29,
      pointsReward: 75,
      isEnrolled: false,
      isCompleted: false,
    },
    {
      id: 'act-3',
      title: 'Virtual Chair Yoga for Posture',
      description: 'Gentle spinal mobility and shoulder opening exercises you can do right from your desk.',
      category: 'YOGA_SESSION',
      startDate: '2026-11-28',
      endDate: '2026-11-28',
      maxParticipants: 40,
      enrolledCount: 18,
      pointsReward: 50,
      isEnrolled: false,
      isCompleted: false,
    },
  ]);

  const [message, setMessage] = useState<string | null>(null);

  const handleJoin = (id: string) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id !== id) return act;
        return {
          ...act,
          isEnrolled: true,
          enrolledCount: act.enrolledCount + 1,
        };
      }),
    );
    setMessage('Enrolled in wellness activity successfully!');
    setTimeout(() => setMessage(null), 4000);
  };

  const handleComplete = (id: string, pts: number) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, isCompleted: true } : act)),
    );
    setMessage(`Congratulations! Activity completed and +${pts} points added to your balance.`);
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Wellness & Challenges</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build healthy daily habits, participate in team fitness challenges, and earn reward points.
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activities.map((act) => {
            const isFull = act.maxParticipants > 0 && act.enrolledCount >= act.maxParticipants;
            const pct = act.maxParticipants > 0 ? Math.round((act.enrolledCount / act.maxParticipants) * 100) : 0;

            return (
              <div
                key={act.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                      {act.category.replace(/_/g, ' ')}
                    </span>
                    <span className="inline-flex items-center space-x-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>+{act.pointsReward} pts</span>
                    </span>
                  </div>

                  <h2 className="text-sm font-extrabold text-slate-900">{act.title}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">{act.description}</p>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Capacity: {act.enrolledCount} / {act.maxParticipants}</span>
                      </span>
                      <span>{pct}% full</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {act.isCompleted ? (
                    <div className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed (+{act.pointsReward} pts)</span>
                    </div>
                  ) : act.isEnrolled ? (
                    <button
                      onClick={() => handleComplete(act.id, act.pointsReward)}
                      className="w-full py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm"
                    >
                      Mark as Completed
                    </button>
                  ) : isFull ? (
                    <button
                      disabled
                      className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
                    >
                      Capacity Full
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(act.id)}
                      className="w-full py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm"
                    >
                      Join Challenge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
