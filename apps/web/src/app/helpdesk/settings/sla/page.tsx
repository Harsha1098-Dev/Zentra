'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Plus,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

export default function SlaSettingsPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [responseTimeMinutes, setResponseTimeMinutes] = useState(60);
  const [resolutionTimeMinutes, setResolutionTimeMinutes] = useState(1440);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadPolicies() {
    try {
      setLoading(true);
      const res = await ApiClient.request('/helpdesk/sla/policies');
      if (Array.isArray(res)) {
        setPolicies(res);
      }
    } catch (err) {
      console.error('Failed to load SLA policies', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ApiClient.request('/helpdesk/sla/policies', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          responseTimeMinutes: Number(responseTimeMinutes),
          resolutionTimeMinutes: Number(resolutionTimeMinutes),
          businessHoursOnly,
          businessHoursStart: '09:00',
          businessHoursEnd: '18:00',
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        }),
      });
      setShowModal(false);
      setName('');
      setDescription('');
      await loadPolicies();
    } catch (err: any) {
      alert(err.message || 'Failed to create SLA policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      const res = await ApiClient.request('/helpdesk/sla/evaluate-escalations', {
        method: 'POST',
      });
      alert(`SLA Escalation evaluation completed! ${res?.length || 0} ticket(s) evaluated and updated.`);
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate escalations');
    } finally {
      setEvaluating(false);
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
            <h1 className="text-xl font-bold text-slate-900">SLA Policies & Escalations</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure response and resolution thresholds, business hours calculation, and multi-tier breach triggers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={evaluating}
              onClick={handleRunEvaluation}
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {evaluating ? 'Evaluating...' : 'Run Escalation Check'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-3.5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New SLA Policy
            </button>
          </div>
        </div>

        {/* Policies List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Loading policies...
            </div>
          ) : policies.length > 0 ? (
            policies.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">First Response Target</span>
                    <span className="font-bold text-slate-900">
                      {p.responseTimeMinutes >= 60
                        ? `${(p.responseTimeMinutes / 60).toFixed(1)} hours`
                        : `${p.responseTimeMinutes} minutes`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Resolution Target</span>
                    <span className="font-bold text-slate-900">
                      {p.resolutionTimeMinutes >= 60
                        ? `${(p.resolutionTimeMinutes / 60).toFixed(1)} hours`
                        : `${p.resolutionTimeMinutes} minutes`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Business Hours</span>
                    <span className="font-bold text-slate-900">
                      {p.businessHoursOnly ? '9:00 AM - 6:00 PM (Mon-Fri)' : '24x7 Calendar Hours'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Escalation Rules</span>
                    <span className="font-bold text-slate-900">
                      {p.escalationRules?.length || 0} active rule(s)
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              No SLA policies defined yet.
            </div>
          )}
        </div>

        {/* Modal: New Policy */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">Create SLA Policy</h2>
              <form onSubmit={handleCreatePolicy} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Policy Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Workplace SLA"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Response Time (Minutes)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={responseTimeMinutes}
                      onChange={(e) => setResponseTimeMinutes(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Resolution Time (Minutes)
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={resolutionTimeMinutes}
                      onChange={(e) => setResolutionTimeMinutes(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={businessHoursOnly}
                    onChange={(e) => setBusinessHoursOnly(e.target.checked)}
                    className="rounded text-[#1E3A8A]"
                  />
                  <span>Count business hours only (9 AM - 6 PM, Mon-Fri)</span>
                </label>

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
                    {submitting ? 'Creating...' : 'Create Policy'}
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
