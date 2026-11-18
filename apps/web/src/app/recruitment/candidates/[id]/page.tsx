'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Calendar,
  Gift,
  Plus,
  UserCheck,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { RecruitmentNav } from '../../recruitment-nav';
import { ApiClient } from '../../../../lib/api';

export default function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();

  const [candidate, setCandidate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'interviews' | 'offers' | 'notes' | 'documents'>('applications');
  const [isLoading, setIsLoading] = useState(true);

  // Convert to employee modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [convertForm, setConvertForm] = useState({
    employeeCode: '',
    workEmail: '',
    joiningDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    designationId: '',
    locationId: '',
    triggerOnboarding: true,
  });
  const [convertError, setConvertError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<any | null>(null);

  // Add note modal
  const [newNote, setNewNote] = useState({ content: '', noteType: 'GENERAL' });
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  async function fetchCandidate() {
    setIsLoading(true);
    try {
      const data = await ApiClient.request(`/recruitment/candidates/${id}`);
      setCandidate(data);

      if (data.email) {
        setConvertForm((prev) => ({
          ...prev,
          workEmail: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@zentra.com`,
        }));
      }
    } catch (err) {
      console.error('Failed to load candidate', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function openConvertModal() {
    setShowConvertModal(true);
    try {
      const [deptRes, desigRes, locRes] = await Promise.allSettled([
        ApiClient.request('/organization/departments'),
        ApiClient.request('/organization/designations'),
        ApiClient.request('/organization/locations'),
      ]);
      if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)) {
        setDepartments(deptRes.value);
        if (deptRes.value.length > 0) setConvertForm((f) => ({ ...f, departmentId: deptRes.value[0].id }));
      }
      if (desigRes.status === 'fulfilled' && Array.isArray(desigRes.value)) {
        setDesignations(desigRes.value);
        if (desigRes.value.length > 0) setConvertForm((f) => ({ ...f, designationId: desigRes.value[0].id }));
      }
      if (locRes.status === 'fulfilled' && Array.isArray(locRes.value)) {
        setLocations(locRes.value);
        if (locRes.value.length > 0) setConvertForm((f) => ({ ...f, locationId: locRes.value[0].id }));
      }
    } catch (err) {
      console.error('Failed to load convert dropdowns', err);
    }
  }

  async function handleConvertSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConvertError(null);
    setIsConverting(true);

    try {
      const res = await ApiClient.request(`/recruitment/candidates/${id}/convert-to-employee`, {
        method: 'POST',
        body: JSON.stringify(convertForm),
      });

      setConvertSuccess(res);
      fetchCandidate();
    } catch (err: any) {
      setConvertError(err?.message || 'Failed to convert candidate to employee');
    } finally {
      setIsConverting(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.content.trim()) return;
    setIsAddingNote(true);
    try {
      await ApiClient.request(`/recruitment/candidates/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify(newNote),
      });
      setNewNote({ content: '', noteType: 'GENERAL' });
      fetchCandidate();
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsAddingNote(false);
    }
  }

  const hasAcceptedOffer = candidate?.offers?.some((o: any) => o.offerStatus === 'ACCEPTED');
  const isHired = candidate?.candidateStatus === 'HIRED';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <RecruitmentNav />
        <div className="py-20 text-center text-xs text-slate-400">Loading candidate profile...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <RecruitmentNav />
        <div className="max-w-4xl mx-auto py-20 text-center">
          <p className="text-sm text-slate-500">Candidate profile not found.</p>
          <Link href="/recruitment/candidates" className="mt-3 text-xs font-semibold text-[#1E3A8A] hover:underline">
            &larr; Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/recruitment/candidates"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    candidate.candidateStatus === 'HIRED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : candidate.candidateStatus === 'OFFERED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {candidate.candidateStatus}
                </span>
                {candidate.isTalentPool && (
                  <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    Talent Pool
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {candidate.currentDesignation || 'Candidate'} {candidate.currentCompany ? `at ${candidate.currentCompany}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {hasAcceptedOffer && !isHired && (
              <button
                onClick={openConvertModal}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Convert to Employee</span>
              </button>
            )}

            {isHired && (
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Converted to Employee</span>
              </span>
            )}

            {candidate.resumeUrl && (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>View Resume</span>
              </a>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Email</span>
            <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{candidate.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Phone</span>
            <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{candidate.phone}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Experience & Notice</span>
            <p className="text-slate-800 font-semibold">
              {candidate.totalExperienceYears || 0} yrs &bull; {candidate.noticePeriodDays || 0}d notice
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Source</span>
            <p className="text-slate-800 font-semibold">
              {candidate.sourceType?.replace('_', ' ')} {candidate.sourceName ? `(${candidate.sourceName})` : ''}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-1 border-b border-slate-200">
          {[
            { key: 'applications', label: `Applications (${candidate.applications?.length || 0})` },
            { key: 'offers', label: `Offers (${candidate.offers?.length || 0})` },
            { key: 'notes', label: `Notes (${candidate.notes?.length || 0})` },
            { key: 'documents', label: `Documents (${candidate.documents?.length || 0})` },
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

        {/* Tab Content */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Job Applications</h3>
            {(!candidate.applications || candidate.applications.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active applications for this candidate.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {candidate.applications.map((app: any) => (
                  <div key={app.id} className="py-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900">{app.jobOpening?.title}</h4>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                        <span>Current Stage: <strong className="text-slate-700">{app.currentStageName}</strong></span>
                        <span>&bull;</span>
                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                        {app.screeningScore !== null && (
                          <>
                            <span>&bull;</span>
                            <span className="text-[#1E3A8A] font-semibold">Screening: {app.screeningScore}/100</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                        {app.applicationStatus}
                      </span>
                      <Link
                        href={`/recruitment/applications?jobId=${app.jobOpeningId}`}
                        className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                      >
                        Pipeline &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Employment Offers</h3>
            {(!candidate.offers || candidate.offers.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No offers generated yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {candidate.offers.map((off: any) => (
                  <div key={off.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        ₹{Number(off.annualCtc).toLocaleString()} / year
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Joining Date: {new Date(off.joiningDate).toLocaleDateString()} &bull; Expiry: {new Date(off.expiryDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          off.offerStatus === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : off.offerStatus === 'APPROVED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : off.offerStatus === 'SENT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {off.offerStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recruitment Notes & Logs</h3>

            <form onSubmit={handleAddNote} className="space-y-3 pb-4 border-b border-slate-100">
              <textarea
                rows={2}
                placeholder="Log a call, interview debrief, or candidate observation..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newNote.noteType}
                  onChange={(e) => setNewNote({ ...newNote, noteType: e.target.value })}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="GENERAL">General Note</option>
                  <option value="CALL_LOG">Call Log</option>
                  <option value="INTERVIEW_NOTE">Interview Debrief</option>
                  <option value="OFFER_NOTE">Offer Discussion</option>
                </select>

                <button
                  type="submit"
                  disabled={isAddingNote || !newNote.content.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-blue-900 disabled:opacity-50"
                >
                  {isAddingNote ? 'Posting...' : 'Add Note'}
                </button>
              </div>
            </form>

            {(!candidate.notes || candidate.notes.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">No notes recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {candidate.notes.map((note: any) => (
                  <div key={note.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Recruiter'}
                      </span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Convert to Employee Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Convert Candidate to Employee</h3>
                <p className="text-xs text-slate-500">
                  This creates an official employee record, provisions organization membership, sets up employment history, and starts onboarding.
                </p>
              </div>

              {convertError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{convertError}</span>
                </div>
              )}

              {convertSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">Conversion Successful!</h4>
                  <p className="text-xs text-slate-600">
                    Employee Code: <strong className="font-mono">{convertSuccess.employeeCode}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setShowConvertModal(false);
                      setConvertSuccess(null);
                    }}
                    className="mt-3 px-5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConvertSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Employee Code</label>
                      <input
                        type="text"
                        placeholder="Auto-generated if empty"
                        value={convertForm.employeeCode}
                        onChange={(e) => setConvertForm({ ...convertForm, employeeCode: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={convertForm.workEmail}
                        onChange={(e) => setConvertForm({ ...convertForm, workEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Joining Date *</label>
                      <input
                        type="date"
                        required
                        value={convertForm.joiningDate}
                        onChange={(e) => setConvertForm({ ...convertForm, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                      <select
                        required
                        value={convertForm.departmentId}
                        onChange={(e) => setConvertForm({ ...convertForm, departmentId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
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
                        value={convertForm.designationId}
                        onChange={(e) => setConvertForm({ ...convertForm, designationId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {designations.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Office Location *</label>
                      <select
                        required
                        value={convertForm.locationId}
                        onChange={(e) => setConvertForm({ ...convertForm, locationId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={convertForm.triggerOnboarding}
                        onChange={(e) => setConvertForm({ ...convertForm, triggerOnboarding: e.target.checked })}
                        className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                      />
                      <span>Auto-trigger onboarding workflow and assign first day tasks</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowConvertModal(false)}
                      className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isConverting}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                    >
                      {isConverting ? 'Converting...' : 'Confirm Conversion'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
