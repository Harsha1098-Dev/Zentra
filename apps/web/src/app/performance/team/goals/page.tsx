'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  AlertCircle,
  User,
} from 'lucide-react';
import { PerformanceNav } from '../../performance-nav';

interface TeamGoal {
  id: string;
  employeeName: string;
  title: string;
  description: string;
  goalCategory: string;
  priority: string;
  status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  weightage: number;
  dueDate: string;
}

export default function TeamGoalsPage() {
  const [selectedMember, setSelectedMember] = useState<string>('ALL');

  const [goals, setGoals] = useState<TeamGoal[]>([
    {
      id: 'tg-1',
      employeeName: 'Sarah Jenkins',
      title: 'Deliver Core Microservices Architecture',
      description: 'Migrate legacy modules to scalable nestjs services',
      goalCategory: 'BUSINESS',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progressPercentage: 70,
      weightage: 40,
      dueDate: '2026-06-30',
    },
    {
      id: 'tg-2',
      employeeName: 'Sarah Jenkins',
      title: 'Achieve 90%+ Test Coverage on Payroll Engine',
      description: 'Write comprehensive Jest tests covering statutory compliance',
      goalCategory: 'OPERATIONAL',
      priority: 'CRITICAL',
      status: 'ACTIVE',
      progressPercentage: 45,
      weightage: 30,
      dueDate: '2026-05-31',
    },
    {
      id: 'tg-3',
      employeeName: 'Alex Rivera',
      title: 'Migrate Frontend Components to Tailwind CSS v4',
      description: 'Streamline design system tokens and reduce bundle size',
      goalCategory: 'TECHNICAL',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      progressPercentage: 60,
      weightage: 50,
      dueDate: '2026-04-30',
    },
    {
      id: 'tg-4',
      employeeName: 'David Kim',
      title: 'Automate Zero-Downtime Neon Database Migration Pipeline',
      description: 'Build CI/CD validation hooks for schema rollouts',
      goalCategory: 'INFRASTRUCTURE',
      priority: 'HIGH',
      status: 'COMPLETED',
      progressPercentage: 100,
      weightage: 50,
      dueDate: '2026-03-15',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: 'Sarah Jenkins',
    title: '',
    description: '',
    goalCategory: 'BUSINESS',
    priority: 'MEDIUM',
    weightage: 25,
    dueDate: '2026-06-30',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: TeamGoal = {
      id: `tg-${Date.now()}`,
      employeeName: formData.employeeName,
      title: formData.title,
      description: formData.description,
      goalCategory: formData.goalCategory,
      priority: formData.priority,
      status: 'ACTIVE',
      progressPercentage: 0,
      weightage: Number(formData.weightage),
      dueDate: formData.dueDate,
    };
    setGoals([newGoal, ...goals]);
    setIsModalOpen(false);
    setFormData({
      employeeName: 'Sarah Jenkins',
      title: '',
      description: '',
      goalCategory: 'BUSINESS',
      priority: 'MEDIUM',
      weightage: 25,
      dueDate: '2026-06-30',
    });
  };

  const filteredGoals = goals.filter((g) => {
    if (selectedMember !== 'ALL' && g.employeeName !== selectedMember) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/performance/team"
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Team Hub</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Team Goals & Alignment
            </h1>
            <p className="text-sm text-slate-500">
              Oversee and cascade performance goals across your team members.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Goal to Reportee</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter by Employee:</span>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Team Members ({goals.length} Goals)</option>
            <option value="Sarah Jenkins">Sarah Jenkins</option>
            <option value="Alex Rivera">Alex Rivera</option>
            <option value="David Kim">David Kim</option>
          </select>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((g) => (
            <div
              key={g.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    {g.employeeName}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{g.title}</h3>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    g.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {g.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{g.description}</p>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Progress</span>
                  <span className="text-blue-900">{g.progressPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${g.progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Weightage: {g.weightage}%</span>
                <span>Due: {g.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Assign Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Assign Goal to Reportee</h2>
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
                  Assign To Employee
                </label>
                <select
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Sarah Jenkins">Sarah Jenkins (Senior Software Engineer)</option>
                  <option value="Alex Rivera">Alex Rivera (Frontend Engineer)</option>
                  <option value="David Kim">David Kim (DevOps / SRE Engineer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Zero-Downtime DB Architecture"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Deliverables
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain clear expectations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weightage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.weightage}
                    onChange={(e) => setFormData({ ...formData, weightage: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
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
                  Assign Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
