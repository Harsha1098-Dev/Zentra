'use client';

import React, { useState } from 'react';
import {
  Target,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Link as LinkIcon,
  Trash2,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

export default function MyGoalsPage() {
  const [goals, setGoals] = useState<any[]>([
    {
      id: 'g-1',
      title: 'Deliver Core Microservices Architecture',
      description: 'Migrate legacy modules to scalable nestjs services',
      goalType: 'INDIVIDUAL',
      goalCategory: 'BUSINESS',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progressPercentage: 70,
      weightage: 40,
      startDate: '2026-01-01',
      dueDate: '2026-06-30',
      alignmentType: 'DEPARTMENT',
      alignedGoal: { title: 'Q1 Technology Modernization' },
    },
    {
      id: 'g-2',
      title: 'Achieve 90%+ Test Coverage on Payroll Engine',
      description: 'Write comprehensive Jest tests covering statutory compliance',
      goalType: 'INDIVIDUAL',
      goalCategory: 'OPERATIONAL',
      priority: 'CRITICAL',
      status: 'ACTIVE',
      progressPercentage: 45,
      weightage: 30,
      startDate: '2026-02-01',
      dueDate: '2026-05-31',
      alignmentType: 'MANAGER',
      alignedGoal: { title: 'Zero Defect Production Releases' },
    },
    {
      id: 'g-3',
      title: 'Complete AWS Solutions Architect Certification',
      description: 'Upskill in distributed cloud architectures and security',
      goalType: 'INDIVIDUAL',
      goalCategory: 'DEVELOPMENTAL',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      progressPercentage: 100,
      weightage: 30,
      startDate: '2026-01-15',
      dueDate: '2026-03-31',
      alignmentType: null,
      alignedGoal: null,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalCategory: 'BUSINESS',
    priority: 'MEDIUM',
    weightage: 25,
    startDate: '2026-01-01',
    dueDate: '2026-06-30',
    alignmentType: 'MANAGER',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal = {
      id: `g-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      goalType: 'INDIVIDUAL',
      goalCategory: formData.goalCategory,
      priority: formData.priority,
      status: 'ACTIVE',
      progressPercentage: 0,
      weightage: Number(formData.weightage),
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      alignmentType: formData.alignmentType,
      alignedGoal: { title: 'Engineering Operational Excellence' },
    };
    setGoals([newGoal, ...goals]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      goalCategory: 'BUSINESS',
      priority: 'MEDIUM',
      weightage: 25,
      startDate: '2026-01-01',
      dueDate: '2026-06-30',
      alignmentType: 'MANAGER',
    });
  };

  const handleUpdateProgress = (id: string, newProgress: number) => {
    setGoals(
      goals.map((g) =>
        g.id === id
          ? {
              ...g,
              progressPercentage: newProgress,
              status: newProgress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
            }
          : g,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">My Goals</h1>
            <p className="text-xs text-slate-500 mt-1">
              Set clear objectives, align with manager or department goals, and log progress milestones.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>

        {/* Goals List */}
        <div className="grid grid-cols-1 gap-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {goal.goalCategory}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        goal.priority === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : goal.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {goal.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        goal.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{goal.title}</h3>
                  <p className="text-xs text-slate-500">{goal.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Alignment Info */}
              {goal.alignedGoal && (
                <div className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-slate-600">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-700">Aligned with {goal.alignmentType}:</span>
                  <span className="truncate">{goal.alignedGoal.title}</span>
                </div>
              )}

              {/* Progress Slider and Dates */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 max-w-md space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">Progress</span>
                    <span className="font-bold text-[#1E3A8A]">{goal.progressPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progressPercentage}
                    onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                  />
                </div>

                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400">Weightage: </span>
                    <span className="font-semibold text-slate-700">{goal.weightage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Due: </span>
                    <span className="font-semibold text-slate-700">{goal.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Goal Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Create New Goal</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Implement resilient data ingestion pipeline"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                    placeholder="Provide details and expected milestones..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.goalCategory}
                      onChange={(e) => setFormData({ ...formData, goalCategory: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="BUSINESS">Business</option>
                      <option value="OPERATIONAL">Operational</option>
                      <option value="DEVELOPMENTAL">Developmental</option>
                      <option value="INNOVATION">Innovation</option>
                      <option value="LEADERSHIP">Leadership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Goal Alignment
                  </label>
                  <select
                    value={formData.alignmentType}
                    onChange={(e) => setFormData({ ...formData, alignmentType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="MANAGER">Align with Manager Goal</option>
                    <option value="DEPARTMENT">Align with Department Goal</option>
                    <option value="ORGANIZATION">Align with Organization Strategic Objective</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
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
                    Save Goal
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
