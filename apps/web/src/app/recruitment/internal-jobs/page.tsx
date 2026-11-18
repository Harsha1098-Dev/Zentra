'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Briefcase,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

export default function InternalJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchInternalJobs();
  }, []);

  async function fetchInternalJobs() {
    setIsLoading(true);
    try {
      const data = await ApiClient.request('/recruitment/internal-jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load internal jobs', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApply(jobId: string) {
    setApplyingId(jobId);
    setMessage(null);
    try {
      await ApiClient.request(`/recruitment/internal-jobs/${jobId}/apply`, {
        method: 'POST',
      });
      setAppliedJobs((prev) => ({ ...prev, [jobId]: true }));
      setMessage({ text: 'Application submitted successfully! Hiring team will review.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err?.message || 'Failed to submit internal application', type: 'error' });
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Internal Careers Board</h1>
          <p className="text-sm text-slate-500">
            Explore open opportunities across teams and departments. Apply internally with one click.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading internal openings...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Open Internal Roles</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no requisitions published for internal mobility. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        {job.jobCode}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{job.title}</h3>
                    </div>
                    <span className="text-[11px] font-semibold bg-blue-50 text-[#1E3A8A] px-2.5 py-0.5 rounded-full border border-blue-200">
                      Internal Transfer
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.department?.name || 'Department'}</span>
                      <span>&bull;</span>
                      <span>{job.designation?.name || 'Role'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location?.name || 'Office'}</span>
                      <span>&bull;</span>
                      <span className="capitalize">{job.workMode?.toLowerCase()}</span>
                      <span>&bull;</span>
                      <span>{job.experienceMinYears}-{job.experienceMaxYears} yrs exp</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 pt-1">{job.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/recruitment/jobs/${job.id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    View Details
                  </Link>

                  {appliedJobs[job.id] ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applied</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applyingId === job.id}
                      className="bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{applyingId === job.id ? 'Applying...' : 'Apply Internally'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
