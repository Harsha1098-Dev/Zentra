'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Plus,
  UserCheck,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

export default function AgentsSettingsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [agentType, setAgentType] = useState('PRIMARY');
  const [agentLevel, setAgentLevel] = useState('TIER_1');
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [agentsRes, catsRes, membersRes] = await Promise.allSettled([
        ApiClient.request('/helpdesk/agents'),
        ApiClient.request('/helpdesk/categories'),
        ApiClient.request('/memberships'),
      ]);

      if (agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value)) {
        setAgents(agentsRes.value);
      }
      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        setCategories(catsRes.value);
      }
      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value)) {
        setOrgMembers(membersRes.value);
      }
    } catch (err) {
      console.error('Failed to load agents settings data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedUserId) {
      setErrorMsg('Please select a user');
      return;
    }

    try {
      setSubmitting(true);
      await ApiClient.request('/helpdesk/agents', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUserId,
          agentType,
          agentLevel,
          categoryIds: selectedCatIds,
        }),
      });
      setShowModal(false);
      setSelectedUserId('');
      setSelectedCatIds([]);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register agent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (agentId: string) => {
    if (!confirm('Are you sure you want to deactivate this agent?')) return;
    try {
      await ApiClient.request(`/helpdesk/agents/${agentId}`, {
        method: 'DELETE',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate agent');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/helpdesk/settings"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1E3A8A]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Helpdesk Settings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Support Staff & Agent Roster</h1>
            <p className="text-xs text-slate-500 mt-1">
              Assign support agents to categories, manage tier levels, and configure routing
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Agent
          </button>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Tier / Level</th>
                  <th className="py-3 px-4">Role Type</th>
                  <th className="py-3 px-4">Assigned Categories</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading agent roster...
                    </td>
                  </tr>
                ) : agents.length > 0 ? (
                  agents.map((ag) => (
                    <tr key={ag.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ag.user?.firstName} {ag.user?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {ag.user?.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-blue-50 text-[#1E3A8A] font-semibold px-2 py-0.5 rounded text-[10px]">
                          {ag.agentLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {ag.agentType}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {ag.categoryAgents && ag.categoryAgents.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ag.categoryAgents.map((ca: any) => (
                              <span
                                key={ca.id}
                                className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]"
                              >
                                {ca.helpdeskCategory?.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            ag.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {ag.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {ag.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(ag.id)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No support agents registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Agent */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">Add Helpdesk Agent</h2>
              {errorMsg && (
                <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}
              <form onSubmit={handleRegisterAgent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select User Member *
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="">Select User...</option>
                    {orgMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.firstName} {m.user?.lastName} ({m.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tier Level
                    </label>
                    <select
                      value={agentLevel}
                      onChange={(e) => setAgentLevel(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="TIER_1">Tier 1 (Frontline)</option>
                      <option value="TIER_2">Tier 2 (Specialist)</option>
                      <option value="TIER_3">Tier 3 (Expert)</option>
                      <option value="LEAD">Team Lead</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role Type
                    </label>
                    <select
                      value={agentType}
                      onChange={(e) => setAgentType(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="PRIMARY">Primary Agent</option>
                      <option value="BACKUP">Backup Agent</option>
                      <option value="SPECIALIST">Specialist</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Categories
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50/50">
                    {categories.map((c) => {
                      const isChecked = selectedCatIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCatIds([...selectedCatIds, c.id]);
                              } else {
                                setSelectedCatIds(selectedCatIds.filter((id) => id !== c.id));
                              }
                            }}
                            className="rounded text-[#1E3A8A]"
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Registering...' : 'Register Agent'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
