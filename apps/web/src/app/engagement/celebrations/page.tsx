'use client';

import React, { useState } from 'react';
import { Smile, Cake, PartyPopper, RefreshCw, Heart, Send, CheckCircle2 } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function CelebrationsPage() {
  const [celebrations, setCelebrations] = useState([
    {
      id: 'cel-1',
      employee: { firstName: 'Elena', lastName: 'Rostova', department: { name: 'UI/UX Design' } },
      celebrationType: 'BIRTHDAY',
      title: 'Happy Birthday, Elena! 🎂',
      eventDate: '2026-11-19T00:00:00.000Z',
      wishesCount: 12,
      wished: false,
    },
    {
      id: 'cel-2',
      employee: { firstName: 'David', lastName: 'O\'Connor', department: { name: 'Operations' } },
      celebrationType: 'WORK_ANNIVERSARY',
      title: 'Happy 3rd Work Anniversary, David! 🎉',
      yearsCount: 3,
      eventDate: '2026-11-21T00:00:00.000Z',
      wishesCount: 18,
      wished: false,
    },
    {
      id: 'cel-3',
      employee: { firstName: 'Sarah', lastName: 'Chen', department: { name: 'Engineering' } },
      celebrationType: 'PROMOTION',
      title: 'Promoted to Lead Platform Architect! 🚀',
      eventDate: '2026-11-25T00:00:00.000Z',
      wishesCount: 24,
      wished: true,
    },
  ]);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleWish = (id: string) => {
    setCelebrations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, wishesCount: c.wishesCount + 1, wished: true } : c,
      ),
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage('Automated birthday & work anniversary sync complete for 2026!');
      setTimeout(() => setSyncMessage(null), 4000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Celebrations Calendar</h1>
            <p className="text-xs text-slate-500 mt-1">
              Birthdays, work anniversaries, and career promotions across your organization.
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#1E3A8A]' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Yearly Celebrations'}</span>
          </button>
        </div>

        {syncMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {celebrations.map((cel) => {
            const isBirthday = cel.celebrationType === 'BIRTHDAY';
            return (
              <div
                key={cel.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                      isBirthday ? 'bg-amber-500' : 'bg-purple-600'
                    }`}
                  >
                    {isBirthday ? <Cake className="w-6 h-6" /> : <PartyPopper className="w-6 h-6" />}
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">{cel.title}</h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {cel.employee.department.name} • Event Date:{' '}
                      <span className="font-semibold text-slate-700">
                        {new Date(cel.eventDate).toLocaleDateString(undefined, {
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <span className="text-xs font-semibold text-slate-500">
                    {cel.wishesCount} wishes
                  </span>

                  <button
                    onClick={() => handleWish(cel.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm ${
                      cel.wished
                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                        : 'bg-[#1E3A8A] text-white hover:bg-blue-900'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${cel.wished ? 'fill-current' : ''}`} />
                    <span>{cel.wished ? 'Wished ❤️' : 'Send Wishes'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
