'use client';

import React, { useEffect, useState } from 'react';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  PieChart,
  History,
  AlertCircle,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import { LeaveBalanceDto, LeaveBalanceHistoryDto } from '@zentra/shared-types';

export default function MyLeaveBalancesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [balances, setBalances] = useState<LeaveBalanceDto[]>([]);
  const [history, setHistory] = useState<LeaveBalanceHistoryDto[]>([]);
  const [activeTab, setActiveTab] = useState<'balances' | 'history'>('balances');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [balRes, histRes] = await Promise.all([
        ApiClient.request<LeaveBalanceDto[]>(`/leave-balances/me?year=${selectedYear}`),
        ApiClient.request<LeaveBalanceHistoryDto[]>('/leave-balances/me/history?limit=50').catch(() => []),
      ]);
      setBalances(balRes || []);
      setHistory(histRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load balances');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Balances & History</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review your annual quotas, accruals, granted days, used leaves, and complete transaction ledger.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('balances')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'balances'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Balance Overview ({selectedYear})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'history'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transaction Ledger & Audit Trail</span>
          </button>
        </div>

        {/* Tab 1: Balances Table */}
        {activeTab === 'balances' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading balances...</div>
            ) : balances.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No leave balance records found for year {selectedYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Leave Type</th>
                      <th className="px-5 py-3.5 text-right">Opening</th>
                      <th className="px-5 py-3.5 text-right">Accrued</th>
                      <th className="px-5 py-3.5 text-right">Granted</th>
                      <th className="px-5 py-3.5 text-right">Carry Forward</th>
                      <th className="px-5 py-3.5 text-right">Adjustment</th>
                      <th className="px-5 py-3.5 text-right text-purple-700">Used</th>
                      <th className="px-5 py-3.5 text-right text-amber-700">Pending</th>
                      <th className="px-5 py-3.5 text-right bg-blue-50/50 text-[#1E3A8A] font-bold">Available</th>
                      <th className="px-5 py-3.5 text-right">Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {balances.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: b.leaveTypeColor || '#3B82F6' }}
                          />
                          <span>{b.leaveTypeName}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">({b.leaveTypeCode})</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-600">{b.openingBalance}</td>
                        <td className="px-5 py-3.5 text-right text-slate-600">{b.accrued}</td>
                        <td className="px-5 py-3.5 text-right text-slate-600">{b.granted}</td>
                        <td className="px-5 py-3.5 text-right text-slate-600">{b.carryForward}</td>
                        <td className="px-5 py-3.5 text-right text-slate-600">
                          {b.adjustment > 0 ? `+${b.adjustment}` : b.adjustment}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-purple-700">{b.used}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-amber-700">{b.pending}</td>
                        <td className="px-5 py-3.5 text-right font-black text-sm text-[#1E3A8A] bg-blue-50/50">
                          {b.availableBalance}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-500">{b.closingBalance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transaction Ledger */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No transaction history records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Leave Type</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5 text-right">Amount</th>
                      <th className="px-5 py-3.5 text-right">Balance Change</th>
                      <th className="px-5 py-3.5">Reason / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {history.map((item) => {
                      const isPositive = item.amount > 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{item.leaveTypeName}</td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {item.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-0.5 ${
                                isPositive ? 'text-emerald-600' : 'text-slate-800'
                              }`}
                            >
                              <span>{isPositive ? `+${item.amount}` : item.amount}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap text-slate-600">
                            {item.previousBalance} → <span className="font-bold text-slate-900">{item.newBalance}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 max-w-sm truncate" title={item.reason || ''}>
                            {item.reason || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
