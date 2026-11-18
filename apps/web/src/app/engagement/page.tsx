'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  Vote,
  Award,
  Gift,
  Smile,
  Activity,
  ArrowRight,
  ClipboardList,
  Flame,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { EngagementNav } from './engagement-nav';

export default function EngagementHubPage() {
  const [hubData, setHubData] = useState<any>({
    pointsBalance: 250,
    earnedBadgesCount: 3,
    pendingSurveysCount: 1,
    activePollsCount: 2,
    recentRecognitions: [
      {
        id: 'rec-1',
        sender: { firstName: 'Sarah', lastName: 'Chen', department: { name: 'Engineering' } },
        receiver: { firstName: 'Alex', lastName: 'Kim', department: { name: 'Product' } },
        category: 'COLLABORATION',
        message: 'Incredible cross-functional support during the release sprint!',
        pointsAwarded: 50,
        likesCount: 6,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rec-2',
        sender: { firstName: 'Marcus', lastName: 'Taylor', department: { name: 'Customer Success' } },
        receiver: { firstName: 'Priya', lastName: 'Patel', department: { name: 'Engineering' } },
        category: 'CUSTOMER_FOCUS',
        message: 'Resolved high-priority client defect in under 2 hours. Heroic effort!',
        pointsAwarded: 75,
        likesCount: 11,
        createdAt: new Date().toISOString(),
      },
    ],
    upcomingCelebrations: [
      {
        id: 'cel-1',
        employee: { firstName: 'Elena', lastName: 'Rostova', department: { name: 'Design' } },
        celebrationType: 'BIRTHDAY',
        title: 'Happy Birthday, Elena! 🎂',
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        wishesCount: 8,
      },
      {
        id: 'cel-2',
        employee: { firstName: 'David', lastName: 'O\'Connor', department: { name: 'Operations' } },
        celebrationType: 'WORK_ANNIVERSARY',
        title: 'Happy 3rd Work Anniversary, David! 🎉',
        yearsCount: 3,
        eventDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        wishesCount: 14,
      },
    ],
    joinedWellness: [
      {
        id: 'act-1',
        title: '10,000 Steps Daily Challenge',
        category: 'FITNESS_CHALLENGE',
        pointsReward: 100,
        status: 'ACTIVE',
      },
    ],
  });

  const [pollVoted, setPollVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const samplePoll = {
    id: 'poll-hub-1',
    question: 'How often would you like team social lunches?',
    options: [
      { text: 'Weekly on Friday', percent: 45 },
      { text: 'Bi-weekly', percent: 35 },
      { text: 'Once a month', percent: 20 },
    ],
  };

  const handleVote = (index: number) => {
    setSelectedOption(index);
    setPollVoted(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner with Points & Rank */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Heart className="w-96 h-96 fill-current" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Zentra Engagement Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome to your Employee Hub
              </h1>
              <p className="text-sm text-blue-100 max-w-xl">
                Recognize peer milestones, complete confidential surveys, vote on workplace decisions, and redeem rewards.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <div className="text-center px-4 border-r border-white/20">
                <div className="flex items-center justify-center space-x-1 text-amber-300">
                  <Flame className="w-5 h-5 fill-current" />
                  <span className="text-2xl font-black">{hubData.pointsBalance}</span>
                </div>
                <div className="text-[11px] font-medium text-blue-200">Reward Points</div>
              </div>
              <div className="text-center px-4">
                <div className="flex items-center justify-center space-x-1 text-emerald-300">
                  <Award className="w-5 h-5" />
                  <span className="text-2xl font-black">{hubData.earnedBadgesCount}</span>
                </div>
                <div className="text-[11px] font-medium text-blue-200">Badges Earned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/engagement/my-surveys"
            className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Pending Surveys</div>
              <div className="text-[11px] text-slate-500">{hubData.pendingSurveysCount} Available</div>
            </div>
          </Link>

          <Link
            href="/engagement/my-polls"
            className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Quick Polls</div>
              <div className="text-[11px] text-slate-500">{hubData.activePollsCount} Active</div>
            </div>
          </Link>

          <Link
            href="/engagement/recognition/give"
            className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-pink-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Give Recognition</div>
              <div className="text-[11px] text-slate-500">Praise a colleague</div>
            </div>
          </Link>

          <Link
            href="/engagement/my-rewards"
            className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Rewards Catalog</div>
              <div className="text-[11px] text-slate-500">Redeem points</div>
            </div>
          </Link>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recognition Wall */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-600 fill-current" />
                  <h2 className="text-base font-bold text-slate-900">Live Recognition Wall</h2>
                </div>
                <Link
                  href="/engagement/recognition"
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {hubData.recentRecognitions.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {item.sender.firstName} {item.sender.lastName}
                        </span>
                        <span className="text-xs text-slate-400">recognized</span>
                        <span className="font-bold text-[#1E3A8A] text-xs">
                          {item.receiver.firstName} {item.receiver.lastName}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-[#1E3A8A]">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 italic">"{item.message}"</p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                      <div className="flex items-center space-x-1 text-amber-600 font-semibold">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>+{item.pointsAwarded} points</span>
                      </div>
                      <div className="flex items-center space-x-1 text-pink-600 font-semibold">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{item.likesCount} applause</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Poll Widget */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <h2 className="text-base font-bold text-slate-900">Featured Quick Poll</h2>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Open
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-800 mb-4">
                {samplePoll.question}
              </p>

              <div className="space-y-2.5">
                {samplePoll.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleVote(i)}
                    disabled={pollVoted}
                    className={`w-full p-3 rounded-lg border text-left text-xs font-medium transition-all relative overflow-hidden ${
                      selectedOption === i
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                        : 'border-slate-200 hover:border-purple-300 bg-white text-slate-700'
                    }`}
                  >
                    {pollVoted && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-purple-100/60 transition-all pointer-events-none"
                        style={{ width: `${opt.percent}%` }}
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-between">
                      <span>{opt.text}</span>
                      {pollVoted && (
                        <span className="font-bold text-purple-700">{opt.percent}%</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {pollVoted && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-3 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Your anonymous vote has been recorded!</span>
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Column (1 col) */}
          <div className="space-y-6">
            {/* Upcoming Celebrations */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Smile className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Celebrations</h3>
                </div>
                <Link
                  href="/engagement/celebrations"
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {hubData.upcomingCelebrations.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.eventDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <Link
                      href="/engagement/celebrations"
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 text-amber-800 rounded hover:bg-amber-100 transition-colors"
                    >
                      Wish 🎉
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Wellness Challenge */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Wellness Activities</h3>
                </div>
                <Link
                  href="/engagement/wellness"
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Explore
                </Link>
              </div>

              {hubData.joinedWellness.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{act.title}</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Enrolled
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Earn <span className="font-bold text-emerald-700">+{act.pointsReward} pts</span> on completion.
                  </div>
                  <Link
                    href="/engagement/wellness"
                    className="block text-center w-full py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
                  >
                    View Progress
                  </Link>
                </div>
              ))}
            </div>

            {/* Express eNPS Banner */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-blue-200 p-5 space-y-3">
              <div className="text-xs font-bold text-[#1E3A8A] flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Have 30 seconds?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rate your likelihood to recommend our company in our confidential eNPS pulse check.
              </p>
              <Link
                href="/engagement/my-enps"
                className="inline-flex items-center space-x-1 text-xs font-bold text-[#1E3A8A] hover:underline"
              >
                <span>Take eNPS Survey</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
