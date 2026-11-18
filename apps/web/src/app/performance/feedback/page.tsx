'use client';

import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Send,
  HelpCircle,
  ThumbsUp,
  Sparkles,
  Award,
  Shield,
  Filter,
  User,
  Heart,
  Lightbulb,
  X,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

interface FeedbackItem {
  id: string;
  type: 'PRAISE' | 'CONSTRUCTIVE' | 'COACHING';
  giverName: string;
  giverRole?: string;
  recipientName: string;
  content: string;
  competencies: string[];
  isAnonymous: boolean;
  createdAt: string;
}

export default function ContinuousFeedbackPage() {
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'GIVEN' | 'REQUESTS'>('RECEIVED');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([
    {
      id: 'fb-1',
      type: 'PRAISE',
      giverName: 'Marcus Vance',
      giverRole: 'Engineering Director',
      recipientName: 'Sarah Jenkins',
      content:
        'Fantastic execution on the payroll statutory compliance engine. Your attention to detail with provident fund edge cases prevented multiple production roadblocks.',
      competencies: ['Technical Excellence', 'Ownership', 'Quality'],
      isAnonymous: false,
      createdAt: '2026-03-14T11:20:00Z',
    },
    {
      id: 'fb-2',
      type: 'CONSTRUCTIVE',
      giverName: 'Anonymous Peer',
      recipientName: 'Sarah Jenkins',
      content:
        'During sprint planning, providing architecture RFC links at least 24 hours in advance would help the team review the proposals with deeper context.',
      competencies: ['Communication', 'Collaboration'],
      isAnonymous: true,
      createdAt: '2026-03-12T09:45:00Z',
    },
    {
      id: 'fb-3',
      type: 'COACHING',
      giverName: 'Elena Rostova',
      giverRole: 'Staff Architect',
      recipientName: 'Sarah Jenkins',
      content:
        'I recommend mentoring the junior frontend engineers on state normalization. You have great insights that could uplift the entire squad.',
      competencies: ['Mentorship', 'Leadership'],
      isAnonymous: false,
      createdAt: '2026-03-08T16:00:00Z',
    },
    {
      id: 'fb-4',
      type: 'PRAISE',
      giverName: 'Sarah Jenkins',
      recipientName: 'David Kim',
      content:
        'Thank you David for quickly jumping in to help unblock our Redis caching layer configuration in staging!',
      competencies: ['Teamwork', 'Agility'],
      isAnonymous: false,
      createdAt: '2026-03-10T14:10:00Z',
    },
  ]);

  const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [giveForm, setGiveForm] = useState({
    recipientName: '',
    type: 'PRAISE',
    content: '',
    competencies: 'Ownership, Collaboration',
    isAnonymous: false,
  });

  const [requestForm, setRequestForm] = useState({
    targetColleague: '',
    context: '',
  });

  const handleGiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFeedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      type: giveForm.type as any,
      giverName: giveForm.isAnonymous ? 'Anonymous Peer' : 'Sarah Jenkins',
      giverRole: giveForm.isAnonymous ? undefined : 'Senior Software Engineer',
      recipientName: giveForm.recipientName,
      content: giveForm.content,
      competencies: giveForm.competencies
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      isAnonymous: giveForm.isAnonymous,
      createdAt: new Date().toISOString(),
    };
    setFeedbacks([newFeedback, ...feedbacks]);
    setIsGiveModalOpen(false);
    setGiveForm({
      recipientName: '',
      type: 'PRAISE',
      content: '',
      competencies: 'Ownership, Collaboration',
      isAnonymous: false,
    });
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Feedback request submitted to ${requestForm.targetColleague}. They have been notified.`);
    setIsRequestModalOpen(false);
    setRequestForm({ targetColleague: '', context: '' });
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (activeTab === 'RECEIVED' && fb.recipientName !== 'Sarah Jenkins') return false;
    if (activeTab === 'GIVEN' && fb.giverName !== 'Sarah Jenkins' && !fb.isAnonymous) return false;
    if (typeFilter !== 'ALL' && fb.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Continuous 360° Feedback
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Give recognition, share constructive coaching, and build a culture of real-time growth.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Request Feedback</span>
            </button>
            <button
              onClick={() => setIsGiveModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Give Feedback</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('RECEIVED')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'RECEIVED'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Received Feedback
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                {feedbacks.filter((f) => f.recipientName === 'Sarah Jenkins').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('GIVEN')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'GIVEN'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Given Feedback
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Types</option>
              <option value="PRAISE">Praise & Recognition</option>
              <option value="CONSTRUCTIVE">Constructive</option>
              <option value="COACHING">Coaching</option>
            </select>
          </div>
        </div>

        {/* Feedback Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <MessageSquareHeart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No feedback entries found</p>
              <p className="text-xs text-slate-400 mt-1">
                Continuous recognition drives performance and personal growth.
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        fb.isAnonymous
                          ? 'bg-slate-100 text-slate-600 border border-slate-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {fb.isAnonymous ? (
                        <Shield className="w-4 h-4 text-slate-600" />
                      ) : (
                        fb.giverName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-900">{fb.giverName}</span>
                        {fb.isAnonymous && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                            Verified Anonymous
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {fb.giverRole || 'Colleague'} •{' '}
                        {new Date(fb.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 ${
                      fb.type === 'PRAISE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : fb.type === 'CONSTRUCTIVE'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {fb.type === 'PRAISE' && <Sparkles className="w-3 h-3 mr-1" />}
                    {fb.type === 'CONSTRUCTIVE' && <Lightbulb className="w-3 h-3 mr-1" />}
                    {fb.type === 'COACHING' && <Award className="w-3 h-3 mr-1" />}
                    {fb.type}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                  &ldquo;{fb.content}&rdquo;
                </p>

                {fb.competencies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fb.competencies.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        #{comp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Give Feedback Modal */}
      {isGiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Give Feedback</h2>
              <button
                onClick={() => setIsGiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGiveSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Colleague
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Kim, Alex Rivera..."
                  value={giveForm.recipientName}
                  onChange={(e) => setGiveForm({ ...giveForm, recipientName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Feedback Category
                </label>
                <select
                  value={giveForm.type}
                  onChange={(e) => setGiveForm({ ...giveForm, type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="PRAISE">Praise & Recognition (Celebrate great work)</option>
                  <option value="CONSTRUCTIVE">Constructive (Areas to refine)</option>
                  <option value="COACHING">Coaching (Actionable advice & skills)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share clear, specific, and actionable feedback..."
                  value={giveForm.content}
                  onChange={(e) => setGiveForm({ ...giveForm, content: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Competencies (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Leadership, Collaboration, Delivery..."
                  value={giveForm.competencies}
                  onChange={(e) => setGiveForm({ ...giveForm, competencies: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="anonCheckbox"
                  checked={giveForm.isAnonymous}
                  onChange={(e) => setGiveForm({ ...giveForm, isAnonymous: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="anonCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Submit anonymously (Your identity will be masked for the recipient)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsGiveModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Send Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Feedback Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Request 360° Feedback</h2>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Request Feedback From
                </label>
                <input
                  type="text"
                  required
                  placeholder="Manager, teammate, or stakeholder..."
                  value={requestForm.targetColleague}
                  onChange={(e) => setRequestForm({ ...requestForm, targetColleague: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Context / Specific Areas of Focus
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Would love your feedback on my presentation at the architecture summit..."
                  value={requestForm.context}
                  onChange={(e) => setRequestForm({ ...requestForm, context: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
