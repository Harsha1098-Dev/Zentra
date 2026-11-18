'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Plus,
  ArrowLeft,
  CheckCircle2,
  ListOrdered,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { PerformanceNav } from '../../performance-nav';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  targetRole: string;
  ratingScaleName: string;
  sectionsCount: number;
  sections: string[];
  isActive: boolean;
}

export default function AppraisalTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([
    {
      id: 'tmpl-1',
      name: 'Standard Individual Contributor Template',
      description:
        'Standard annual performance appraisal for all individual contributor roles across engineering, product, and operations.',
      targetRole: 'Individual Contributors (L1 - L4)',
      ratingScaleName: 'Default 5-Point Enterprise Rating Scale',
      sectionsCount: 4,
      sections: [
        'Goal & KRA Achievement Scoring',
        'Company Core Values & Competencies Rubric',
        'Self-Review Reflection & Development Aspirations',
        'Manager Evaluation & Merit Recommendations',
      ],
      isActive: true,
    },
    {
      id: 'tmpl-2',
      name: 'Engineering Staff & Architecture Evaluation',
      description:
        'Specialized evaluation rubric for Staff+ engineers focusing on technical leadership, cross-squad leverage, and system reliability.',
      targetRole: 'Staff / Principal Software Engineers (L5+)',
      ratingScaleName: 'Default 5-Point Enterprise Rating Scale',
      sectionsCount: 5,
      sections: [
        'Strategic Architecture & Technical Roadmap OKRs',
        'Engineering Excellence & Mentorship Impact',
        'Cross-Functional System Design Collaboration',
        'Self-Review & Open Source / Community Contribution',
        'VP & Manager Promotion Calibration',
      ],
      isActive: true,
    },
    {
      id: 'tmpl-3',
      name: 'People Manager & Leadership Template',
      description:
        'Leadership evaluation template emphasizing team retention, coaching effectiveness, psychological safety, and organizational execution.',
      targetRole: 'Engineering Managers, Directors, Executives',
      ratingScaleName: 'Default 5-Point Enterprise Rating Scale',
      sectionsCount: 4,
      sections: [
        'Team Performance & OKR Delivery Results',
        'People Leadership, Retention & Career Development',
        'Strategic Alignment & Execution Velocity',
        '360° Upward Feedback Summary',
      ],
      isActive: true,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    targetRole: '',
    ratingScaleName: 'Default 5-Point Enterprise Rating Scale',
    sectionsText: 'Goal Achievement\nCore Competencies\nSelf Reflection\nManager Review',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const sections = form.sectionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newTmpl: TemplateItem = {
      id: `tmpl-${Date.now()}`,
      name: form.name,
      description: form.description,
      targetRole: form.targetRole,
      ratingScaleName: form.ratingScaleName,
      sectionsCount: sections.length,
      sections,
      isActive: true,
    };

    setTemplates([...templates, newTmpl]);
    setIsModalOpen(false);
    setForm({
      name: '',
      description: '',
      targetRole: '',
      ratingScaleName: 'Default 5-Point Enterprise Rating Scale',
      sectionsText: 'Goal Achievement\nCore Competencies\nSelf Reflection\nManager Review',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/performance/settings"
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Appraisal Templates & Forms
            </h1>
            <p className="text-sm text-slate-500">
              Build custom evaluation rubrics, question sections, and competency assessment templates.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Template</span>
          </button>
        </div>

        {/* Templates list */}
        <div className="space-y-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {tmpl.targetRole}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{tmpl.name}</h2>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {tmpl.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>

              {/* Sections list */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Sections & Question Blocks ({tmpl.sectionsCount})</span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Scale: {tmpl.ratingScaleName}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tmpl.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded border border-slate-200 text-xs text-slate-700 flex items-center space-x-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Create Appraisal Template</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Specialist Performance Review"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Role / Level
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Account Executives & BDRs"
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Specify who this template is intended for..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluation Sections (one per line)
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.sectionsText}
                  onChange={(e) => setForm({ ...form, sectionsText: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
