'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, AlertCircle } from 'lucide-react';
import { RecruitmentNav } from '../../recruitment-nav';
import { ApiClient } from '../../../../lib/api';

export default function NewOfferPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    candidateId: '',
    jobOpeningId: '',
    departmentId: '',
    designationId: '',
    locationId: '',
    annualCtc: '',
    currency: 'INR',
    joiningDate: nextMonth,
    expiryDate: nextWeek,
    requiresFinanceApproval: false,
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [candRes, jobRes, deptRes, desigRes, locRes] = await Promise.allSettled([
          ApiClient.request('/recruitment/candidates'),
          ApiClient.request('/recruitment/job-openings'),
          ApiClient.request('/organization/departments'),
          ApiClient.request('/organization/designations'),
          ApiClient.request('/organization/locations'),
        ]);

        if (candRes.status === 'fulfilled' && Array.isArray(candRes.value)) setCandidates(candRes.value);
        if (jobRes.status === 'fulfilled' && Array.isArray(jobRes.value)) setJobOpenings(jobRes.value);
        if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)) setDepartments(deptRes.value);
        if (desigRes.status === 'fulfilled' && Array.isArray(desigRes.value)) setDesignations(desigRes.value);
        if (locRes.status === 'fulfilled' && Array.isArray(locRes.value)) setLocations(locRes.value);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    }
    loadMeta();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        annualCtc: Number(formData.annualCtc),
        offerDate: todayStr,
      };

      const res = await ApiClient.request('/recruitment/offers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/recruitment/offers');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate offer');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center space-x-3">
          <Link
            href="/recruitment/offers"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Generate Job Offer</h1>
            <p className="text-xs text-slate-500">
              Draft formal compensation terms, joining dates, and expiry windows.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Candidate & Role</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate *</label>
                <select
                  required
                  value={formData.candidateId}
                  onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Candidate</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Opening *</label>
                <select
                  required
                  value={formData.jobOpeningId}
                  onChange={(e) => setFormData({ ...formData, jobOpeningId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Job Opening</option>
                  {jobOpenings.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.jobCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                <select
                  required
                  value={formData.designationId}
                  onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Designation</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Location *</label>
                <select
                  required
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Compensation & Timeline</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Annual CTC (INR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1800000"
                  value={formData.annualCtc}
                  onChange={(e) => setFormData({ ...formData, annualCtc: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Joining Date *</label>
                <input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offer Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresFinanceApproval}
                  onChange={(e) => setFormData({ ...formData, requiresFinanceApproval: e.target.checked })}
                  className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span>Route to Finance Controller for compensation review</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Link
              href="/recruitment/offers"
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : 'Save Draft Offer'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
