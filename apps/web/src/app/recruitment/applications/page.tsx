'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Kanban,
  Users,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Star,
  ChevronRight,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

function KanbanContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Screening Modal
  const [screeningApp, setScreeningApp] = useState<any | null>(null);
  const [screeningScore, setScreeningScore] = useState(80);
  const [screeningNotes, setScreeningNotes] = useState('');
  const [screeningPassed, setScreeningPassed] = useState(true);
  const [isSubmittingScreen, setIsSubmittingScreen] = useState(false);

  useEffect(() => {
    loadJobOpenings();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetailsAndApps(selectedJobId);
    } else if (jobOpenings.length > 0) {
      setSelectedJobId(jobOpenings[0].id);
    }
  }, [selectedJobId, jobOpenings]);

  async function loadJobOpenings() {
    try {
      const data = await ApiClient.request('/recruitment/job-openings');
      if (Array.isArray(data)) {
        setJobOpenings(data);
        if (!selectedJobId && data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load job openings', err);
    }
  }

  async function loadJobDetailsAndApps(jobId: string) {
    setIsLoading(true);
    try {
      const [jobData, appsData] = await Promise.all([
        ApiClient.request(`/recruitment/job-openings/${jobId}`),
        ApiClient.request(`/recruitment/applications?jobOpeningId=${jobId}`),
      ]);
      setCurrentJob(jobData);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) {
      console.error('Failed to load job details and apps', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMoveStage(appId: string, toStageId: string) {
    try {
      await ApiClient.request(`/recruitment/applications/${appId}/move-stage`, {
        method: 'POST',
        body: JSON.stringify({ toStageId, comments: 'Moved via Kanban workspace' }),
      });
      loadJobDetailsAndApps(selectedJobId);
    } catch (err: any) {
      alert(err?.message || 'Failed to move candidate stage');
    }
  }

  async function handleScreenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!screeningApp) return;
    setIsSubmittingScreen(true);
    try {
      await ApiClient.request(`/recruitment/applications/${screeningApp.id}/screen`, {
        method: 'POST',
        body: JSON.stringify({
          screeningScore: Number(screeningScore),
          screeningNotes,
          passed: screeningPassed,
        }),
      });
      setScreeningApp(null);
      loadJobDetailsAndApps(selectedJobId);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit screening');
    } finally {
      setIsSubmittingScreen(false);
    }
  }

  const stages = currentJob?.stages || [];

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Job Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hiring Pipeline Board</h1>
            <p className="text-xs text-slate-500">
              Interactive Kanban board to track applicant progress through configured stages.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-600">Select Job:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              {jobOpenings.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.jobCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Board Workspace */}
        {isLoading ? (
          <div className="py-24 text-center text-xs text-slate-400">Loading pipeline board...</div>
        ) : stages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No pipeline stages configured for this job opening.
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-thin">
            {stages.map((stage: any, index: number) => {
              const stageApps = applications.filter((a) => a.currentStageId === stage.id);

              return (
                <div
                  key={stage.id}
                  className="w-72 shrink-0 bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[75vh]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                        {stage.stageName}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {stageApps.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                    {stageApps.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-sm transition-shadow space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <Link
                            href={`/recruitment/candidates/${app.candidateId}`}
                            className="text-xs font-bold text-slate-900 hover:text-[#1E3A8A]"
                          >
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </Link>
                          {app.screeningScore !== null && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {app.screeningScore} pts
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">{app.candidate?.email}</p>

                        {/* Card footer & advance controls */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            onClick={() => {
                              setScreeningApp(app);
                              setScreeningScore(app.screeningScore || 80);
                              setScreeningNotes(app.screeningNotes || '');
                            }}
                            className="text-slate-500 hover:text-[#1E3A8A] font-semibold inline-flex items-center space-x-1"
                          >
                            <ClipboardCheck className="w-3 h-3" />
                            <span>Screen</span>
                          </button>

                          {/* Advance dropdown or button */}
                          {index < stages.length - 1 && (
                            <button
                              onClick={() => handleMoveStage(app.id, stages[index + 1].id)}
                              className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center space-x-0.5"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageApps.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-slate-400">
                        No candidates in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Screening Evaluation Modal */}
        {screeningApp && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Screen Candidate: {screeningApp.candidate?.firstName} {screeningApp.candidate?.lastName}
                </h3>
                <p className="text-xs text-slate-500">Record screening assessment score and notes.</p>
              </div>

              <form onSubmit={handleScreenSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Screening Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={screeningScore}
                    onChange={(e) => setScreeningScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Screening Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Candidate communication skills, tech stack alignment, reason for score..."
                    value={screeningNotes}
                    onChange={(e) => setScreeningNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={screeningPassed}
                    onChange={(e) => setScreeningPassed(e.target.checked)}
                    className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                  <span className="font-semibold text-slate-700">Passed screening (mark for progression)</span>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setScreeningApp(null)}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingScreen}
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingScreen ? 'Saving...' : 'Submit Evaluation'}
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

export default function ApplicationsKanbanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
          <div className="text-xs text-slate-400">Loading pipeline board...</div>
        </div>
      }
    >
      <KanbanContent />
    </Suspense>
  );
}
