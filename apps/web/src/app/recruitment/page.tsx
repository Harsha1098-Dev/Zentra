'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Calendar,
  Gift,
  PlusCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { RecruitmentNav } from './recruitment-nav';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';

export default function RecruitmentOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    openJobs: 0,
    totalJobs: 0,
    totalOpenings: 0,
    filledOpenings: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [jobsRes, candRes, intRes, summaryRes] = await Promise.allSettled([
          ApiClient.request('/recruitment/job-openings'),
          ApiClient.request('/recruitment/candidates'),
          ApiClient.request('/recruitment/interviews'),
          ApiClient.request('/recruitment/reports/summary'),
        ]);

        if (summaryRes.status === 'fulfilled' && summaryRes.value) {
          setStats(summaryRes.value);
        } else if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
          const jobs = jobsRes.value;
          setStats({
            openJobs: jobs.filter((j: any) => j.jobStatus === 'OPEN').length,
            totalJobs: jobs.length,
            totalOpenings: jobs.reduce((s: number, j: any) => s + (j.numberOfOpenings || 1), 0),
            filledOpenings: jobs.reduce((s: number, j: any) => s + (j.filledOpenings || 0), 0),
          });
        }

        if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
          setRecentJobs(jobsRes.value.slice(0, 5));
        }
        if (candRes.status === 'fulfilled' && Array.isArray(candRes.value)) {
          setRecentCandidates(candRes.value.slice(0, 5));
        }
        if (intRes.status === 'fulfilled' && Array.isArray(intRes.value)) {
          setUpcomingInterviews(intRes.value.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load recruitment overview data', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-[#1E3A8A] text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Talent Acquisition & Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Recruitment Workspace
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Manage end-to-end recruitment pipelines, conduct interviews with structured scorecards,
              dispatch offers with approval gates, and seamlessly convert accepted candidates to employees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/recruitment/jobs/new"
              className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Job Opening</span>
            </Link>
            <Link
              href="/recruitment/candidates/new"
              className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Add Candidate</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Job Openings
              </span>
              <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-lg">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#0F172A]">{stats.openJobs}</span>
              <span className="text-xs text-slate-500">of {stats.totalJobs} total roles</span>
            </div>
            <div className="text-[11px] text-blue-700 font-medium flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Hiring across {stats.totalOpenings} positions</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Candidates in Talent Pool
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#0F172A]">{recentCandidates.length}</span>
              <span className="text-xs text-emerald-600 font-medium">active profiles</span>
            </div>
            <div className="text-[11px] text-slate-500">Screening, interviews & talent pool</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Scheduled Interviews
              </span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#0F172A]">
                {upcomingInterviews.length}
              </span>
              <span className="text-xs text-slate-500">upcoming sessions</span>
            </div>
            <div className="text-[11px] text-purple-700 font-medium">Multi-criteria feedback enabled</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Positions Filled
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#0F172A]">{stats.filledOpenings}</span>
              <span className="text-xs text-slate-500">converted to employees</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium">Auto-onboarding triggered</div>
          </div>
        </div>

        {/* Two-Column Grid: Active Jobs & Recent Candidates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Job Openings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-[#1E3A8A]" />
                <h2 className="text-base font-bold text-slate-900">Active Job Openings</h2>
              </div>
              <Link
                href="/recruitment/jobs"
                className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center space-x-1"
              >
                <span>View All Jobs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No job openings created yet.</p>
                <Link
                  href="/recruitment/jobs/new"
                  className="mt-3 inline-block text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Create your first job opening &rarr;
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentJobs.map((job) => (
                  <div key={job.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/recruitment/jobs/${job.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-[#1E3A8A]"
                        >
                          {job.title}
                        </Link>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {job.jobCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span>{job.department?.name || 'General'}</span>
                        <span>&bull;</span>
                        <span>{job.location?.name || 'Remote'}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{job.workMode?.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          job.jobStatus === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {job.jobStatus}
                      </span>
                      <Link
                        href={`/recruitment/jobs/${job.id}`}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Candidates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#1E3A8A]" />
                <h2 className="text-base font-bold text-slate-900">Recent Candidates</h2>
              </div>
              <Link
                href="/recruitment/candidates"
                className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center space-x-1"
              >
                <span>View Candidates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentCandidates.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No candidates added yet.</p>
                <Link
                  href="/recruitment/candidates/new"
                  className="mt-3 inline-block text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Add a candidate profile &rarr;
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCandidates.map((cand) => (
                  <div key={cand.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-xs uppercase">
                        {cand.firstName[0]}
                        {cand.lastName[0]}
                      </div>
                      <div className="space-y-0.5">
                        <Link
                          href={`/recruitment/candidates/${cand.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-[#1E3A8A]"
                        >
                          {cand.firstName} {cand.lastName}
                        </Link>
                        <p className="text-xs text-slate-500">{cand.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {cand.candidateStatus}
                      </span>
                      <Link
                        href={`/recruitment/candidates/${cand.id}`}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Interviews & Fast Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#1E3A8A]" />
              <h2 className="text-base font-bold text-slate-900">Upcoming Interviews & Assessments</h2>
            </div>
            <Link
              href="/recruitment/interviews"
              className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center space-x-1"
            >
              <span>Manage Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingInterviews.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No interviews scheduled at this time.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {upcomingInterviews.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded uppercase">
                      {item.interviewType?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{item.startTime}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {item.candidate?.firstName} {item.candidate?.lastName}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {item.jobApplication?.jobOpening?.title || 'Job Opening'}
                  </p>
                  {item.meetingLink && (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#1E3A8A] hover:underline inline-flex items-center space-x-1 pt-1"
                    >
                      <span>Join Meeting</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
