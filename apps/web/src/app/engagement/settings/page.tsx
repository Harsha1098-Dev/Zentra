'use client';

import React, { useState } from 'react';
import {
  Settings,
  Plus,
  ClipboardList,
  Vote,
  Gift,
  Award,
  Activity,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function EngagementSettingsPage() {
  const [activeTab, setActiveTab] = useState<'surveys' | 'polls' | 'rewards' | 'badges'>('surveys');

  // Surveys State
  const [surveys, setSurveys] = useState([
    { id: 'srv-1', title: 'Q4 2026 eNPS Pulse', type: 'ENPS', status: 'ACTIVE', responses: 48 },
    { id: 'srv-2', title: 'Workplace Wellness & Culture Survey', type: 'ENGAGEMENT', status: 'ACTIVE', responses: 32 },
  ]);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyType, setNewSurveyType] = useState('ENPS');

  // Rewards State
  const [rewards, setRewards] = useState([
    { id: 'rew-1', title: '$50 Amazon E-Gift Card', pointsCost: 200, type: 'GIFT_CARD' },
    { id: 'rew-2', title: '1 Extra Paid Day Off', pointsCost: 300, type: 'EXTRA_LEAVE' },
  ]);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(150);

  const [message, setMessage] = useState<string | null>(null);

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle.trim()) return;

    setSurveys((prev) => [
      ...prev,
      {
        id: `srv-${Date.now()}`,
        title: newSurveyTitle,
        type: newSurveyType,
        status: 'ACTIVE',
        responses: 0,
      },
    ]);
    setNewSurveyTitle('');
    setMessage('Survey created and published successfully!');
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim()) return;

    setRewards((prev) => [
      ...prev,
      {
        id: `rew-${Date.now()}`,
        title: newRewardTitle,
        pointsCost: Number(newRewardCost),
        type: 'VOUCHER',
      },
    ]);
    setNewRewardTitle('');
    setMessage('Reward item added to catalog successfully!');
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Engagement Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure surveys, quick polls, rewards catalog, and recognition badges.
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 space-x-4">
          <button
            onClick={() => setActiveTab('surveys')}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'surveys'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Surveys</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'rewards'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Rewards Catalog</span>
          </button>
        </div>

        {/* Tab 1: Surveys */}
        {activeTab === 'surveys' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateSurvey} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Launch New Survey or eNPS</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Survey Title *</label>
                  <input
                    type="text"
                    value={newSurveyTitle}
                    onChange={(e) => setNewSurveyTitle(e.target.value)}
                    placeholder="e.g. Q1 2027 eNPS Pulse Survey"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Survey Type</label>
                  <select
                    value={newSurveyType}
                    onChange={(e) => setNewSurveyType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ENPS">eNPS Survey</option>
                    <option value="PULSE">Pulse Survey (1-5 Qs)</option>
                    <option value="ENGAGEMENT">Engagement Survey</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Launch Survey</span>
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Configured Surveys</h3>
              <div className="divide-y divide-slate-100">
                {surveys.map((srv) => (
                  <div key={srv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{srv.title}</div>
                      <div className="text-[11px] text-slate-400">
                        Type: {srv.type} • Responses: {srv.responses}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {srv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Rewards */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateReward} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Add Reward to Store</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Reward Title *</label>
                  <input
                    type="text"
                    value={newRewardTitle}
                    onChange={(e) => setNewRewardTitle(e.target.value)}
                    placeholder="e.g. $25 Starbucks Card"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Points Cost *</label>
                  <input
                    type="number"
                    value={newRewardCost}
                    onChange={(e) => setNewRewardCost(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reward</span>
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Current Catalog</h3>
              <div className="divide-y divide-slate-100">
                {rewards.map((rew) => (
                  <div key={rew.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{rew.title}</div>
                      <div className="text-[11px] text-slate-400">Type: {rew.type}</div>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {rew.pointsCost} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
