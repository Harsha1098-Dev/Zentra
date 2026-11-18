'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Share2,
  PlusCircle,
  Users,
  Briefcase,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New referral modal
  const [showModal, setShowModal] = useState(false);
  const [referralForm, setReferralForm] = useState({
    jobOpeningId: '',
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    resumeUrl: '',
    relationship: 'FORMER_COLLEAGUE',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  async function loadReferralData() {
    setIsLoading(true);
    try {
      const [refRes, jobRes] = await Promise.allSettled([
        ApiClient.request('/recruitment/referrals'),
        ApiClient.request('/recruitment/job-openings'),
      ]);

      if (refRes.status === 'fulfilled' && Array.isArray(refRes.value)) setReferrals(refRes.value);
      if (jobRes.status === 'fulfilled' && Array.isArray(jobRes.value)) {
        setJobOpenings(jobRes.value.filter((j: any) => j.jobStatus === 'OPEN'));
      }
    } catch (err) {
      console.error('Failed to load referrals', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitReferral(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await ApiClient.request('/recruitment/referrals', {
        method: 'POST',
        body: JSON.stringify(referralForm),
      });

      setShowModal(false);
      setReferralForm({
        jobOpeningId: '',
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        resumeUrl: '',
        relationship: 'FORMER_COLLEAGUE',
        notes: '',
      });
      loadReferralData();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit referral. Candidate may already have an active application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Referrals Hub</h1>
            <p className="text-sm text-slate-500">
              Refer talented colleagues, friends, and connections for open roles.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Refer a Candidate</span>
          </button>
        </div>

        {/* Referrals Table */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading referrals...</div>
        ) : referrals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Share2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Referrals Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Know someone who would thrive at Zentra? Refer them directly to an open requisition!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline pt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit First Referral</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Referred By</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900">{ref.candidateName}</span>
                        <p className="text-[11px] text-slate-500">{ref.candidateEmail}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {ref.jobOpening?.title || 'Open Position'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {ref.referringEmployee
                        ? `${ref.referringEmployee.firstName} ${ref.referringEmployee.lastName}`
                        : 'Employee'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 capitalize">
                      {ref.relationship?.replace(/_/g, ' ').toLowerCase()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {ref.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Refer Candidate Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Refer a Colleague</h3>
                <p className="text-xs text-slate-500">
                  Submitting a referral automatically creates a candidate profile and application.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReferral} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Open Role *</label>
                  <select
                    required
                    value={referralForm.jobOpeningId}
                    onChange={(e) => setReferralForm({ ...referralForm, jobOpeningId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="">Select Position</option>
                    {jobOpenings.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} ({job.jobCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Candidate Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={referralForm.candidateName}
                      onChange={(e) => setReferralForm({ ...referralForm, candidateName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Candidate Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={referralForm.candidateEmail}
                      onChange={(e) => setReferralForm({ ...referralForm, candidateEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91..."
                      value={referralForm.candidatePhone}
                      onChange={(e) => setReferralForm({ ...referralForm, candidatePhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relationship *</label>
                    <select
                      value={referralForm.relationship}
                      onChange={(e) => setReferralForm({ ...referralForm, relationship: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      <option value="FORMER_COLLEAGUE">Former Colleague</option>
                      <option value="PERSONAL_FRIEND">Personal Friend</option>
                      <option value="PROFESSIONAL_NETWORK">Professional Network</option>
                      <option value="COLLEGE_ALUMNI">College Alumni</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resume Link</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or LinkedIn"
                    value={referralForm.resumeUrl}
                    onChange={(e) => setReferralForm({ ...referralForm, resumeUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Why are they a great fit?</label>
                  <textarea
                    rows={2}
                    placeholder="Highlight their key skills, past achievements..."
                    value={referralForm.notes}
                    onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Referral'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
