'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { EngagementNav } from '../engagement-nav';

export default function MySurveysPage() {
  const [surveys, setSurveys] = useState([
    {
      id: 'srv-1',
      title: 'Q4 2026 Employee Net Promoter Score (eNPS)',
      description: 'Confidential 2-minute pulse survey to gauge workplace satisfaction and feedback.',
      surveyType: 'ENPS',
      isAnonymous: true,
      hasResponded: false,
      endDate: '2026-12-15T23:59:59.000Z',
      questions: [
        {
          id: 'q-1',
          questionText: 'How likely are you to recommend Zentra as a great place to work to a friend or colleague?',
          questionType: 'ENPS_SCALE',
          ratingScaleMin: 0,
          ratingScaleMax: 10,
          ratingScaleMinLabel: 'Not likely at all',
          ratingScaleMaxLabel: 'Extremely likely',
        },
        {
          id: 'q-2',
          questionText: 'What is the primary reason for your score? What can we do better?',
          questionType: 'NPS_FOLLOW_UP_COMMENT',
        },
      ],
    },
    {
      id: 'srv-2',
      title: 'Workplace Wellness & Culture Survey',
      description: 'Help us improve hybrid work policies, office ergonomics, and wellness initiatives.',
      surveyType: 'ENGAGEMENT',
      isAnonymous: true,
      hasResponded: true,
      endDate: '2026-11-30T23:59:59.000Z',
      questions: [],
    },
  ]);

  const [activeSurvey, setActiveSurvey] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const startSurvey = (survey: any) => {
    setActiveSurvey(survey);
    setAnswers({});
    setSubmitted(false);
  };

  const handleScoreSelect = (questionId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSurvey) return;

    // Mark as responded
    setSurveys((prev) =>
      prev.map((s) => (s.id === activeSurvey.id ? { ...s, hasResponded: true } : s)),
    );
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <EngagementNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Surveys & eNPS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Share your voice confidentially to help shape our workplace culture.
          </p>
        </div>

        {activeSurvey ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Anonymous Response</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{activeSurvey.title}</h2>
              </div>
              <button
                onClick={() => setActiveSurvey(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Surveys
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Thank you for your feedback!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your anonymous response has been recorded and +20 engagement points have been added to your profile.
                </p>
                <button
                  onClick={() => setActiveSurvey(null)}
                  className="mt-4 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors"
                >
                  Return to Surveys
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeSurvey.questions.map((q: any, idx: number) => (
                  <div key={q.id} className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800">
                      {idx + 1}. {q.questionText}
                    </label>

                    {q.questionType === 'ENPS_SCALE' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                            const isSelected = answers[q.id] === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => handleScoreSelect(q.id, score)}
                                className={`w-10 h-10 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#1E3A8A] text-white shadow-md scale-105'
                                    : score >= 9
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    : score >= 7
                                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                    : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                          <span>{q.ratingScaleMinLabel || 'Not at all likely (0)'}</span>
                          <span>{q.ratingScaleMaxLabel || 'Extremely likely (10)'}</span>
                        </div>
                      </div>
                    )}

                    {q.questionType === 'NPS_FOLLOW_UP_COMMENT' && (
                      <textarea
                        rows={3}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Share your thoughts anonymously..."
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveSurvey(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors flex items-center space-x-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Anonymously</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{survey.title}</span>
                    {survey.isAnonymous && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Anonymous</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl">{survey.description}</p>
                </div>

                <div>
                  {survey.hasResponded ? (
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => startSurvey(survey)}
                      className="inline-flex items-center space-x-1 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm"
                    >
                      <span>Take Survey</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
