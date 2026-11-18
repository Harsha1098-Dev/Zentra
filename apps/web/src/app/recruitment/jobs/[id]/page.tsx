'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Users,
  Globe,
  Lock,
  CheckCircle,
  XCircle,
  PlusCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { RecruitmentNav } from '../../recruitment-nav';
import { ApiClient } from '../../../../lib/api';

export default function JobOpeningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'applicants'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchJob();
  }, [id]);

  async function fetchJob() {
    setIsLoading(true);
    try {
      const data = await ApiClient.request(`/recruitment/job-openings/${id}`);
      setJob(data);
    } catch (err: any) {
      console.error('Failed to load job opening', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublish(target: 'BOTH' | 'INTERNAL' | 'EXTERNAL') {
    setActionError(null);
    try {
      await ApiClient.request(`/recruitment/job-openings/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ publishedStatus: target }),
      });
      fetchJob();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to publish job opening');
    }
  }

  async function handleClose() {
    setActionError(null);
    try {
      await ApiClient.request(`/recruitment/job-openings/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ forceClose: true, reason: 'Positions filled or role closed' }),
      });
      fetchJob();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to close job opening');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <RecruitmentNav />
        <div className="py-20 text-center text-xs text-slate-400">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <RecruitmentNav />
        <div className="max-w-4xl mx-auto py-20 text-center">
          <p className="text-sm text-slate-500">Job opening not found.</p>
          <Link href="/recruitment/jobs" className="mt-3 text-xs font-semibold text-[#1E3A8A] hover:underline">
            &larr; Back to job openings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/recruitment/jobs"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                  {job.jobCode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    job.jobStatus === 'OPEN'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : job.jobStatus === 'DRAFT'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {job.jobStatus}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{job.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {job.jobStatus === 'DRAFT' && (
              <button
                onClick={() => handlePublish('BOTH')}
                className="bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                Publish Job
              </button>
            )}

            {job.jobStatus === 'OPEN' && (
              <button
                onClick={handleClose}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
              >
                Close Job
              </button>
            )}

            <Link
              href={`/recruitment/applications?jobId=${job.id}`}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors inline-flex items-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View Kanban Board</span>
            </Link>
          </div>
        </div>

        {actionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-slate-200">
          {[
            { key: 'overview', label: 'Job Overview & Requirements' },
            { key: 'stages', label: `Hiring Pipeline (${job.stages?.length || 0} Stages)` },
            { key: 'applicants', label: `Applicants (${job.applications?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Role Description
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {job.description || 'No description provided.'}
                </p>
              </div>

              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                    Key Responsibilities
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                    {job.responsibilities.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                    Requirements & Qualifications
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                    {job.requirements.map((req: string, idx: number) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar Metadata Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Job Specifications
                </h3>

                <div className="space-y-3 text-xs divide-y divide-slate-100">
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-800">{job.department?.name || 'N/A'}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Designation</span>
                    <span className="font-semibold text-slate-800">{job.designation?.name || 'N/A'}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Location</span>
                    <span className="font-semibold text-slate-800">
                      {job.location?.name || 'N/A'} ({job.location?.city})
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Work Mode</span>
                    <span className="font-semibold text-slate-800 capitalize">{job.workMode?.toLowerCase()}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Openings</span>
                    <span className="font-semibold text-slate-800">
                      {job.filledOpenings} / {job.numberOfOpenings} filled
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Experience Range</span>
                    <span className="font-semibold text-slate-800">
                      {job.experienceMinYears} - {job.experienceMaxYears} years
                    </span>
                  </div>
                  {job.salaryMin && (
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-500">Salary Range</span>
                      <span className="font-semibold text-slate-800">
                        ₹{job.salaryMin?.toLocaleString()} - ₹{job.salaryMax?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Hiring Manager</span>
                    <span className="font-semibold text-slate-800">
                      {job.hiringManager
                        ? `${job.hiringManager.firstName} ${job.hiringManager.lastName}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stages' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Configured Pipeline Stages</h3>
            <div className="divide-y divide-slate-100">
              {job.stages?.map((stage: any, idx: number) => (
                <div key={stage.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{stage.stageName}</h4>
                      <span className="text-[10px] text-slate-500 uppercase">{stage.stageType}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {stage.isMandatory && (
                      <span className="text-[10px] font-semibold bg-blue-50 text-[#1E3A8A] px-2 py-0.5 rounded border border-blue-200">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'applicants' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Candidate Applications</h3>
              <Link
                href={`/recruitment/applications?jobId=${job.id}`}
                className="text-xs font-semibold text-[#1E3A8A] hover:underline"
              >
                Open Kanban Pipeline &rarr;
              </Link>
            </div>

            {(!job.applications || job.applications.length === 0) ? (
              <p className="text-xs text-slate-500 py-8 text-center">No applications received yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {job.applications.map((app: any) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{app.candidate?.email}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                        {app.currentStageName || app.applicationStatus}
                      </span>
                      <Link
                        href={`/recruitment/candidates/${app.candidateId}`}
                        className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
