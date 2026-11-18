'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  PlusCircle,
  Kanban,
  CheckCircle,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

export default function RecruitmentSettingsPage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New pipeline form
  const [showNewModal, setShowNewModal] = useState(false);
  const [pipelineName, setPipelineName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPipelines();
  }, []);

  async function fetchPipelines() {
    setIsLoading(true);
    try {
      const data = await ApiClient.request('/recruitment/pipelines');
      setPipelines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pipelines', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!pipelineName.trim()) return;
    setIsCreating(true);
    try {
      await ApiClient.request('/recruitment/pipelines', {
        method: 'POST',
        body: JSON.stringify({
          name: pipelineName,
          stages: [
            { stageName: 'Application Received', stageType: 'APPLIED', stageOrder: 0, isMandatory: true },
            { stageName: 'Recruiter Screening', stageType: 'SCREENING', stageOrder: 1, isMandatory: true },
            { stageName: 'Technical Interview', stageType: 'TECHNICAL_INTERVIEW', stageOrder: 2, isMandatory: true },
            { stageName: 'Executive Chat', stageType: 'MANAGER_INTERVIEW', stageOrder: 3, isMandatory: false },
            { stageName: 'Offer Rollout', stageType: 'OFFER', stageOrder: 4, isMandatory: true },
            { stageName: 'Hired', stageType: 'HIRED', stageOrder: 5, isMandatory: true },
          ],
        }),
      });
      setShowNewModal(false);
      setPipelineName('');
      fetchPipelines();
    } catch (err) {
      console.error('Failed to create pipeline', err);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recruitment Configuration</h1>
            <p className="text-sm text-slate-500">
              Configure customizable hiring pipeline workflows, default interview rounds, and approval gates.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Custom Pipeline</span>
          </button>
        </div>

        {/* Pipelines list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading configurations...</div>
          ) : pipelines.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              No pipelines found. Default pipeline will be initialized automatically.
            </div>
          ) : (
            pipelines.map((pipe) => (
              <div
                key={pipe.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-lg">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{pipe.name}</h3>
                      <p className="text-xs text-slate-500">{pipe.description || 'Configured recruitment lifecycle'}</p>
                    </div>
                  </div>

                  {pipe.isDefault && (
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Organization Default
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">Stage Order</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {pipe.stages?.map((stage: any, idx: number) => (
                      <React.Fragment key={stage.id}>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center space-x-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span>{stage.stageName}</span>
                          {stage.isMandatory && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                        {idx < pipe.stages.length - 1 && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Pipeline Modal */}
        {showNewModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Hiring Pipeline</h3>
                <p className="text-xs text-slate-500">Create a tailored workflow for specialized teams.</p>
              </div>

              <form onSubmit={handleCreatePipeline} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pipeline Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leadership & Executive Pipeline"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Pipeline'}
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
