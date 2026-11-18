'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  User,
  Star,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Schedule Interview Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    jobApplicationId: '',
    interviewType: 'TECHNICAL_INTERVIEW',
    interviewMode: 'VIDEO_CALL',
    interviewDate: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    timezone: 'Asia/Kolkata',
    meetingLink: '',
    interviewerIds: [] as string[],
    notes: '',
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  // Submit Feedback Modal
  const [feedbackInterview, setFeedbackInterview] = useState<any | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    ratingTechnical: 4,
    ratingCommunication: 4,
    ratingCultureFit: 4,
    overallRating: 4,
    recommendation: 'HIRE',
    strengths: '',
    areasForImprovement: '',
    notes: '',
  });
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    loadInterviewsData();
  }, []);

  async function loadInterviewsData() {
    setIsLoading(true);
    try {
      const [intRes, appRes, empRes] = await Promise.allSettled([
        ApiClient.request('/recruitment/interviews'),
        ApiClient.request('/recruitment/applications'),
        ApiClient.request('/employees'),
      ]);

      if (intRes.status === 'fulfilled' && Array.isArray(intRes.value)) setInterviews(intRes.value);
      if (appRes.status === 'fulfilled' && Array.isArray(appRes.value)) setApplications(appRes.value);
      if (empRes.status === 'fulfilled' && Array.isArray(empRes.value)) setEmployees(empRes.value);
    } catch (err) {
      console.error('Failed to load interviews', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setScheduleError(null);
    setIsScheduling(true);

    try {
      await ApiClient.request('/recruitment/interviews', {
        method: 'POST',
        body: JSON.stringify(scheduleForm),
      });

      setShowScheduleModal(false);
      loadInterviewsData();
    } catch (err: any) {
      setScheduleError(err?.message || 'Failed to schedule interview. Double booking conflict may exist.');
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackInterview) return;
    setFeedbackError(null);
    setIsSubmittingFeedback(true);

    try {
      const payload = {
        ...feedbackForm,
        ratingTechnical: Number(feedbackForm.ratingTechnical),
        ratingCommunication: Number(feedbackForm.ratingCommunication),
        ratingCultureFit: Number(feedbackForm.ratingCultureFit),
        overallRating: Number(feedbackForm.overallRating),
        strengths: feedbackForm.strengths ? feedbackForm.strengths.split(',').map((s) => s.trim()) : [],
        areasForImprovement: feedbackForm.areasForImprovement
          ? feedbackForm.areasForImprovement.split(',').map((s) => s.trim())
          : [],
      };

      await ApiClient.request(`/recruitment/interviews/${feedbackInterview.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setFeedbackInterview(null);
      loadInterviewsData();
    } catch (err: any) {
      setFeedbackError(err?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interview Scheduling & Feedback</h1>
            <p className="text-sm text-slate-500">
              Manage interview calendar, double-booking conflict prevention, and submit multi-criteria scorecards.
            </p>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Interview</span>
          </button>
        </div>

        {/* Interviews List */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading interview schedule...</div>
        ) : interviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Interviews Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Schedule technical interviews, hiring manager chats, or culture fit rounds.
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline pt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Schedule First Interview</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-[#1E3A8A] px-2 py-0.5 rounded">
                      {item.interviewType?.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {item.candidate?.firstName} {item.candidate?.lastName} &bull;{' '}
                    <span className="text-slate-500 font-normal">
                      {item.jobApplication?.jobOpening?.title}
                    </span>
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(item.interviewDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {item.startTime} - {item.endTime} ({item.timezone})
                      </span>
                    </div>
                    {item.meetingLink && (
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1E3A8A] font-semibold hover:underline inline-flex items-center space-x-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Meeting Link</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => setFeedbackInterview(item)}
                    className="bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    Submit Feedback
                  </button>
                  <Link
                    href={`/recruitment/candidates/${item.candidateId}`}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Candidate Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Interview Round</h3>
                <p className="text-xs text-slate-500">Includes conflict detection for selected interviewers.</p>
              </div>

              {scheduleError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Candidate Application *</label>
                  <select
                    required
                    value={scheduleForm.jobApplicationId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, jobApplicationId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="">Select Candidate Application</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.candidate?.firstName} {app.candidate?.lastName} - {app.jobOpening?.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Interview Round</label>
                    <select
                      value={scheduleForm.interviewType}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, interviewType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      <option value="PHONE_SCREENING">Phone Screening</option>
                      <option value="TECHNICAL_INTERVIEW">Technical Interview</option>
                      <option value="MANAGER_INTERVIEW">Manager Interview</option>
                      <option value="HR_INTERVIEW">HR Interview</option>
                      <option value="CULTURE_FIT_INTERVIEW">Culture Fit</option>
                      <option value="FINAL_INTERVIEW">Final Interview</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={scheduleForm.interviewDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, interviewDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interviewer *</label>
                  <select
                    required
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interviewerIds: [e.target.value] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="">Select Interviewer</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.workEmail})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Video Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={scheduleForm.meetingLink}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isScheduling ? 'Scheduling...' : 'Confirm Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submit Feedback Modal */}
        {feedbackInterview && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Interview Feedback: {feedbackInterview.candidate?.firstName} {feedbackInterview.candidate?.lastName}
                </h3>
                <p className="text-xs text-slate-500">Provide scores across criteria and hiring recommendation.</p>
              </div>

              {feedbackError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedbackError}</span>
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Technical Skills (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={feedbackForm.ratingTechnical}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, ratingTechnical: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Communication (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={feedbackForm.ratingCommunication}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, ratingCommunication: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Culture Fit (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={feedbackForm.ratingCultureFit}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, ratingCultureFit: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Overall Rating (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={feedbackForm.overallRating}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, overallRating: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hiring Recommendation *</label>
                  <select
                    value={feedbackForm.recommendation}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, recommendation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="STRONG_HIRE">Strong Hire</option>
                    <option value="HIRE">Hire</option>
                    <option value="MAYBE">Maybe / Borderline</option>
                    <option value="NO_HIRE">No Hire</option>
                    <option value="STRONG_NO_HIRE">Strong No Hire</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Key Strengths (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. System design, Problem solving, Architecture"
                    value={feedbackForm.strengths}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Interview Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Candidate performance summary, specific questions asked..."
                    value={feedbackForm.notes}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackInterview(null)}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingFeedback ? 'Saving...' : 'Submit Scorecard'}
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
