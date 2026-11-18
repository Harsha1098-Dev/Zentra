'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Heart, ClipboardList, Smile, Flame, Award, ArrowRight } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function ManagerTeamEngagementPage() {
  const teamData = {
    teamSize: 6,
    surveyCompletionRate: 83,
    teamEnpsScore: 67,
    recognitionsGiven: 14,
    recognitionsReceived: 18,
    teamMembers: [
      { id: 'emp-1', name: 'Carlos Mendoza', role: 'Staff Software Engineer', points: 420 },
      { id: 'emp-2', name: 'Priya Patel', role: 'Senior QA Automation Engineer', points: 310 },
      { id: 'emp-3', name: 'Elena Rostova', role: 'Senior Product Designer', points: 380 },
      { id: 'emp-4', name: 'David O\'Connor', role: 'DevOps Specialist', points: 260 },
      { id: 'emp-5', name: 'Marcus Taylor', role: 'Solutions Engineer', points: 290 },
      { id: 'emp-6', name: 'Aaliyah Khan', role: 'Frontend Developer', points: 210 },
    ],
    upcomingCelebrations: [
      { name: 'Elena Rostova', type: 'Birthday', date: 'Tomorrow' },
      { name: 'David O\'Connor', type: '3rd Work Anniversary', date: 'Nov 21' },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Manager Team Engagement</h1>
            <p className="text-xs text-slate-500 mt-1">
              Track team participation, eNPS scores, and recognize direct reports.
            </p>
          </div>

          <Link
            href="/engagement/recognition/give"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 shadow-sm transition-colors"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Send Team Praise</span>
          </Link>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Team Direct Reports</span>
            <div className="text-2xl font-black text-slate-900">{teamData.teamSize}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">100% active</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Survey Participation</span>
            <div className="text-2xl font-black text-blue-900">{teamData.surveyCompletionRate}%</div>
            <div className="text-[11px] text-slate-500">5 of 6 completed</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Team eNPS Rating</span>
            <div className="text-2xl font-black text-emerald-600">+{teamData.teamEnpsScore}</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Excellent benchmark</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 font-medium">Recognitions Received</span>
            <div className="text-2xl font-black text-pink-600">{teamData.recognitionsReceived}</div>
            <div className="text-[11px] text-slate-500">This quarter</div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Direct Reports & Engagement Points</h2>

            <div className="divide-y divide-slate-100">
              {teamData.teamMembers.map((member) => (
                <div key={member.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1E3A8A] font-extrabold flex items-center justify-center text-xs">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{member.name}</div>
                      <div className="text-[11px] text-slate-500">{member.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-amber-600 flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>{member.points} pts</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Total balance</div>
                    </div>

                    <Link
                      href="/engagement/recognition/give"
                      className="px-2.5 py-1 bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 rounded text-xs font-bold border border-blue-200 transition-colors"
                    >
                      Praise
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Celebrations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <Smile className="w-4 h-4 text-amber-500" />
              <span>Upcoming Team Milestones</span>
            </h2>

            <div className="space-y-3">
              {teamData.upcomingCelebrations.map((cel, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{cel.name}</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {cel.date}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">{cel.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
