'use client';

import React, { useState } from 'react';
import { Award, Plus, Calendar, Layers, ShieldCheck, X } from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

export default function MyKrasPage() {
  const [kras, setKras] = useState<any[]>([
    {
      id: 'kra-1',
      title: 'Full-Stack Engineering & Microservices Delivery',
      description: 'End-to-end design, implementation, and deployment of resilient NestJS and Next.js applications',
      category: 'CORE',
      weightage: 40,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
    },
    {
      id: 'kra-2',
      title: 'Multi-Tenant Security & Tenant Isolation',
      description: 'Enforce PostgreSQL Row-Level Security, strict auth scoping, and role-based access control',
      category: 'FUNCTIONAL',
      weightage: 30,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
    },
    {
      id: 'kra-3',
      title: 'Technical Mentorship & Code Review Standards',
      description: 'Conduct thorough pull request reviews, guide team colleagues, and maintain clean architecture',
      category: 'BEHAVIORAL',
      weightage: 30,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CORE',
    weightage: 25,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newKra = {
      id: `kra-${Date.now()}`,
      ...formData,
      weightage: Number(formData.weightage),
      status: 'ACTIVE',
    };
    setKras([...kras, newKra]);
    setIsModalOpen(false);
  };

  const totalWeightage = kras.reduce((acc, k) => acc + k.weightage, 0);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Key Result Areas (KRAs)</h1>
            <p className="text-xs text-slate-500 mt-1">
              Your primary areas of responsibility, core competencies, and strategic expectations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Total Allocated:</span>
              <span
                className={`font-bold ${
                  totalWeightage === 100
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {totalWeightage}% / 100%
              </span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add KRA</span>
            </button>
          </div>
        </div>

        {/* KRAs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kras.map((kra) => (
            <div
              key={kra.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {kra.category}
                  </span>
                  <span className="text-xs font-extrabold text-[#1E3A8A] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    Weight: {kra.weightage}%
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{kra.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">{kra.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Period: {kra.startDate} - {kra.endDate}</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {kra.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add KRA Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Add Key Result Area</h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="CORE">Core</option>
                      <option value="FUNCTIONAL">Functional</option>
                      <option value="BEHAVIORAL">Behavioral</option>
                      <option value="STRATEGIC">Strategic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weightage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.weightage}
                      onChange={(e) => setFormData({ ...formData, weightage: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Save KRA
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
