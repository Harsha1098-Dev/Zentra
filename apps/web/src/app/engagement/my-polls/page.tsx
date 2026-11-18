'use client';

import React, { useState } from 'react';
import { Vote, CheckCircle2, Lock, Users } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function MyPollsPage() {
  const [polls, setPolls] = useState([
    {
      id: 'poll-1',
      title: 'Company Summer Picnic Location',
      question: 'Where would you prefer to host this year\'s summer picnic?',
      pollType: 'SINGLE_CHOICE',
      status: 'ACTIVE',
      totalVotes: 42,
      hasVoted: false,
      userVotedOptionId: null as string | null,
      options: [
        { id: 'opt-1', text: 'Beach Park & BBQ', votes: 21, percent: 50 },
        { id: 'opt-2', text: 'Botanical Gardens', votes: 13, percent: 31 },
        { id: 'opt-3', text: 'Rooftop Lounge Downtown', votes: 8, percent: 19 },
      ],
    },
    {
      id: 'poll-2',
      title: 'Learning & Development Topic for Q1',
      question: 'Which skill development workshop should we prioritize for next quarter?',
      pollType: 'SINGLE_CHOICE',
      status: 'ACTIVE',
      totalVotes: 35,
      hasVoted: true,
      userVotedOptionId: 'opt-4',
      options: [
        { id: 'opt-4', text: 'AI & Automation Tools Workshop', votes: 20, percent: 57 },
        { id: 'opt-5', text: 'Executive Presentation Skills', votes: 9, percent: 26 },
        { id: 'opt-6', text: 'Product Management Fundamentals', votes: 6, percent: 17 },
      ],
    },
  ]);

  const handleVote = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        const total = poll.totalVotes + 1;
        const updatedOptions = poll.options.map((opt) => {
          const votes = opt.id === optionId ? opt.votes + 1 : opt.votes;
          return {
            ...opt,
            votes,
            percent: Math.round((votes / total) * 100),
          };
        });

        return {
          ...poll,
          totalVotes: total,
          hasVoted: true,
          userVotedOptionId: optionId,
          options: updatedOptions,
        };
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Workplace Quick Polls</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cast your vote on company questions and see collective community decisions.
          </p>
        </div>

        <div className="space-y-6">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-bold text-slate-900">{poll.title}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{poll.totalVotes} votes</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
              </div>

              <h2 className="text-xs font-bold text-slate-800">{poll.question}</h2>

              <div className="space-y-2.5">
                {poll.options.map((opt) => {
                  const isSelected = poll.userVotedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(poll.id, opt.id)}
                      disabled={poll.hasVoted}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all relative overflow-hidden ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold'
                          : 'border-slate-200 hover:border-purple-300 bg-white text-slate-700'
                      }`}
                    >
                      {poll.hasVoted && (
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-purple-100/70 transition-all pointer-events-none"
                          style={{ width: `${opt.percent}%` }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between">
                        <span>{opt.text}</span>
                        {poll.hasVoted && (
                          <span className="font-extrabold text-purple-800">{opt.percent}%</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {poll.hasVoted && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-semibold pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>You voted in this poll. Your choice is confidential.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
