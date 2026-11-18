'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  Share2,
  Inbox,
  History,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { DelegationDto } from '@zentra/shared-types';

export default function DelegationsPage() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<DelegationDto[]>([]);
  const [loading, setLoading] = useState(true);

  // New Delegation Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [delegateToUserId, setDelegateToUserId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [module, setModule] = useState('all');
  const [requestType, setRequestType] = useState('all');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDelegations();
  }, []);

  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.request<DelegationDto[]>('/delegations');
      setDelegations(res || []);
    } catch (err: any) {
      console.error('Failed to load delegations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateToUserId.trim()) {
      alert('Please enter a delegate user ID');
      return;
    }

    try {
      setSaving(true);
      await ApiClient.request('/delegations', {
        method: 'POST',
        body: JSON.stringify({
          delegateToUserId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          module: module === 'all' ? undefined : module,
          requestType: requestType === 'all' ? undefined : requestType,
          reason: reason || undefined,
        }),
      });
      setModalOpen(false);
      setDelegateToUserId('');
      setReason('');
      fetchDelegations();
    } catch (err: any) {
      alert(`Failed to create delegation: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const revokeDelegation = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this delegation?')) return;
    try {
      await ApiClient.request(`/delegations/${id}/revoke`, { method: 'POST' });
      fetchDelegations();
    } catch (err: any) {
      alert(`Revoke failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">Delegation Manager</h1>
              <p className="text-xs text-[#475569]">
                Temporarily delegate your approval authority during out-of-office periods.
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delegation</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        <div className="flex border-b border-[#E2E8F0] space-x-6 text-sm font-medium">
          <Link
            href="/approvals/pending"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <Inbox className="w-4 h-4" />
            <span>Pending Approvals</span>
          </Link>
          <Link
            href="/approvals/history"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>Approval History</span>
          </Link>
          <Link
            href="/approvals/delegations"
            className="pb-3 border-b-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Delegation Manager</span>
          </Link>
        </div>

        {/* Delegations Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#64748B]">Loading delegations...</div>
          ) : delegations.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <UserCheck className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-semibold text-[#0F172A]">No delegations configured</h3>
              <p className="text-xs text-[#64748B]">
                You have not delegated your approvals or received any active delegations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Delegate To</th>
                    <th className="py-3 px-4">Effective Date Range</th>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {delegations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        {d.delegateToName || d.delegateToUserId}
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        {new Date(d.startDate).toLocaleDateString()} — {new Date(d.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-[#0F172A]">
                          {d.module || 'All Modules'} {d.requestType ? `(${d.requestType})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {d.requestType ? `Scope: ${d.requestType}` : 'Full Delegation'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            d.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {d.status === 'active' && (
                          <button
                            onClick={() => revokeDelegation(d.id)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded text-xs font-semibold"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* New Delegation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Create New Delegation</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delegate To (User ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="UUID of delegate colleague"
                  value={delegateToUserId}
                  onChange={(e) => setDelegateToUserId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scope</label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="all">All Modules & Requests</option>
                  <option value="people">Zentra People Only</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual leave, colleague covering"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 border rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8]"
                >
                  {saving ? 'Saving...' : 'Confirm Delegation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
