'use client';

import React, { useState } from 'react';
import { Gift, Flame, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function MyRewardsPage() {
  const [pointsBalance, setPointsBalance] = useState(350);

  const [rewards, setRewards] = useState([
    {
      id: 'rew-1',
      title: '$50 Amazon E-Gift Card',
      description: 'Digital gift voucher delivered straight to your work email.',
      rewardType: 'GIFT_CARD',
      pointsCost: 200,
      quantityAvailable: 15,
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&q=80',
    },
    {
      id: 'rew-2',
      title: '1 Extra Paid Day Off (Floating Leave)',
      description: 'Take a well-deserved personal wellness day approved by HR.',
      rewardType: 'EXTRA_LEAVE',
      pointsCost: 300,
      quantityAvailable: -1,
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80',
    },
    {
      id: 'rew-3',
      title: 'Zentra Premium Organic Hoodie',
      description: 'Ultra-soft embroidered company hoodie with custom fit.',
      rewardType: 'MERCHANDISE',
      pointsCost: 150,
      quantityAvailable: 25,
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80',
    },
    {
      id: 'rew-4',
      title: '3-Month Spotify Premium Voucher',
      description: 'Ad-free high-fidelity music streaming for your focus time.',
      rewardType: 'VOUCHER',
      pointsCost: 100,
      quantityAvailable: 8,
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    },
  ]);

  const [redemptions, setRedemptions] = useState([
    {
      id: 'red-1',
      title: '3-Month Spotify Premium Voucher',
      pointsSpent: 100,
      status: 'FULFILLED',
      date: '2026-11-10T14:20:00.000Z',
    },
  ]);

  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRedeem = (reward: any) => {
    if (pointsBalance < reward.pointsCost) return;

    setPointsBalance((prev) => prev - reward.pointsCost);
    setRedemptions((prev) => [
      {
        id: `red-${Date.now()}`,
        title: reward.title,
        pointsSpent: reward.pointsCost,
        status: 'PENDING',
        date: new Date().toISOString(),
      },
      ...prev,
    ]);

    setSelectedReward(null);
    setSuccessMessage(`Redemption request for "${reward.title}" submitted successfully!`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Balance Hero */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">Zentra Rewards Store</h1>
            <p className="text-xs text-slate-500">
              Redeem points earned from peer praise, wellness activities, and pulse surveys.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
            <Flame className="w-8 h-8 text-amber-500 fill-current" />
            <div>
              <div className="text-2xl font-black text-amber-900">{pointsBalance}</div>
              <div className="text-[11px] font-bold text-amber-700">Available Points</div>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Catalog Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Available Rewards</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewards.map((reward) => {
              const canAfford = pointsBalance >= reward.pointsCost;
              return (
                <div
                  key={reward.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {reward.rewardType.replace(/_/g, ' ')}
                      </span>
                      <span className="inline-flex items-center space-x-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>{reward.pointsCost} pts</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{reward.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{reward.description}</p>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setSelectedReward(reward)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                        canAfford
                          ? 'bg-[#1E3A8A] text-white hover:bg-blue-900 shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Redeem Reward' : `Need ${reward.pointsCost - pointsBalance} more pts`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Redemptions History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Your Redemption History</h2>

          {redemptions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No past redemptions recorded.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {redemptions.map((red) => (
                <div key={red.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{red.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(red.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-amber-600">-{red.pointsSpent} pts</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        red.status === 'FULFILLED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {red.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Confirmation */}
        {selectedReward && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">Confirm Redemption</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to redeem{' '}
                <span className="font-bold text-slate-900">{selectedReward.title}</span> for{' '}
                <span className="font-bold text-amber-600">{selectedReward.pointsCost} points</span>.
                Your updated balance will be {pointsBalance - selectedReward.pointsCost} points.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setSelectedReward(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRedeem(selectedReward)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-blue-900 shadow-sm"
                >
                  Confirm & Redeem
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
