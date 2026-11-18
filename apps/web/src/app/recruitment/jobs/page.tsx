'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  MapPin,
  Building,
  Users,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Globe,
  Lock,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

export default function JobOpeningsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  async function fetchJobs() {
    setIsLoading(true);
    try {
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const data = await ApiClient.request(`/recruitment/job-openings${query}`);
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch job openings', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(search.toLowerCase()) ||
      (job.department?.name && job.department.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Job Openings</h1>
            <p className="text-sm text-slate-500">
              Create, publish, and manage hiring positions across your organization.
            </p>
          </div>

          <Link
            href="/recruitment/jobs/new"
            className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Job Opening</span>
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by job title or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'OPEN', 'DRAFT', 'ON_HOLD', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading job openings...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Job Openings Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by creating your first job opening to publish on internal and external boards.
            </p>
            <Link
              href="/recruitment/jobs/new"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline pt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Job</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                        {job.jobCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1 hover:text-[#1E3A8A]">
                        <Link href={`/recruitment/jobs/${job.id}`}>{job.title}</Link>
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        job.jobStatus === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : job.jobStatus === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {job.jobStatus}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.department?.name || 'Department N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location?.name || 'Remote / Multi'}</span>
                      <span>&bull;</span>
                      <span className="capitalize">{job.workMode?.toLowerCase()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Openings</span>
                    <span className="font-bold text-slate-800">
                      {job.filledOpenings || 0} / {job.numberOfOpenings || 1} filled
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    {job.publishedStatus === 'BOTH' || job.publishedStatus === 'EXTERNAL' ? (
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{job.publishedStatus}</span>
                  </div>

                  <Link
                    href={`/recruitment/jobs/${job.id}`}
                    className="text-xs font-semibold text-[#1E3A8A] hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
