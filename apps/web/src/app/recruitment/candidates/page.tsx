'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  PlusCircle,
  FileText,
  Mail,
  Phone,
  Briefcase,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [talentPoolOnly, setTalentPoolOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter, talentPoolOnly]);

  async function fetchCandidates() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (talentPoolOnly) params.set('isTalentPool', 'true');

      const data = await ApiClient.request(`/recruitment/candidates?${params.toString()}`);
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch candidates', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = candidates.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)),
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidates Directory</h1>
            <p className="text-sm text-slate-500">
              Manage applicant profiles, resumes, interview ratings, and employee conversions.
            </p>
          </div>

          <Link
            href="/recruitment/candidates/new"
            className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Candidate</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={talentPoolOnly}
                onChange={(e) => setTalentPoolOnly(e.target.checked)}
                className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
              <span>Talent Pool Only</span>
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="ENGAGED">Engaged</option>
              <option value="OFFERED">Offered</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Candidates Table */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading candidates...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Candidates Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add candidates manually or encourage employees to submit referrals.
            </p>
            <Link
              href="/recruitment/candidates/new"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline pt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add First Candidate</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Talent Pool</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {cand.firstName[0]}
                          {cand.lastName[0]}
                        </div>
                        <div>
                          <Link
                            href={`/recruitment/candidates/${cand.id}`}
                            className="font-bold text-slate-900 hover:text-[#1E3A8A]"
                          >
                            {cand.firstName} {cand.lastName}
                          </Link>
                          {cand.currentCompany && (
                            <p className="text-[11px] text-slate-500">{cand.currentCompany}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cand.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cand.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {cand.sourceType?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          cand.candidateStatus === 'HIRED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cand.candidateStatus === 'OFFERED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : cand.candidateStatus === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cand.candidateStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {cand.isTalentPool ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <Sparkles className="w-3 h-3" />
                          <span>Talent Pool</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">&mdash;</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/recruitment/candidates/${cand.id}`}
                        className="text-xs font-semibold text-[#1E3A8A] hover:underline inline-flex items-center space-x-1"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
