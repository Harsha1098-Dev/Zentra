'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LifecycleNav } from '../../lifecycle-nav';
import { ApiClient } from '../../../../lib/api';
import {
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Layers,
  FileText,
} from 'lucide-react';
import { OnboardingOwnerType } from '@zentra/shared-types';

export default function NewOnboardingFlowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('EMPLOYEE_CREATED');

  const [items, setItems] = useState<any[]>([
    {
      title: 'Submit Identity & Address Proofs',
      description: 'Upload Aadhaar, PAN card, and passport copies.',
      ownerType: OnboardingOwnerType.EMPLOYEE,
      isMandatory: true,
      requiresUpload: true,
      dueDaysFromStart: 3,
    },
    {
      title: 'Company Policy & Code of Conduct Sign-off',
      description: 'Review employee handbook, NDA and sign agreement.',
      ownerType: OnboardingOwnerType.EMPLOYEE,
      isMandatory: true,
      requiresUpload: false,
      dueDaysFromStart: 2,
    },
    {
      title: 'Provision Corporate Laptop & IT Credentials',
      description: 'Assign serial numbered laptop, SSO account and VPN access.',
      ownerType: OnboardingOwnerType.IT,
      isMandatory: true,
      requiresUpload: false,
      dueDaysFromStart: 1,
    },
    {
      title: 'Bank Account & Payroll Setup',
      description: 'Verify IFSC code, cancel cheque and salary structure assignment.',
      ownerType: OnboardingOwnerType.HR,
      isMandatory: true,
      requiresUpload: false,
      dueDaysFromStart: 5,
    },
    {
      title: 'Team Introduction & 30-Day Goal Setting',
      description: 'First 1-on-1 meeting and onboarding buddy assignment.',
      ownerType: OnboardingOwnerType.MANAGER,
      isMandatory: false,
      requiresUpload: false,
      dueDaysFromStart: 7,
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        title: '',
        description: '',
        ownerType: OnboardingOwnerType.EMPLOYEE,
        isMandatory: true,
        requiresUpload: false,
        dueDaysFromStart: 3,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: val };
    setItems(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    if (items.length === 0) {
      setError('At least one onboarding task step is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ApiClient.post('/onboarding-flows', {
        name,
        description,
        triggerEvent,
        applicableDepartments: [],
        applicableLocations: [],
        applicableDesignations: [],
        applicableEmploymentTypes: [],
        isActive: true,
        items: items.map((item, index) => ({
          ...item,
          stepOrder: index + 1,
          dueDaysFromStart: Number(item.dueDaysFromStart) || 1,
        })),
      });

      router.push('/lifecycle/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to save flow template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/lifecycle/onboarding"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Onboarding</span>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Onboarding Template
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Design a sequential task checklist that auto-assigns items to employees, managers, HR, and IT.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Full-time Onboarding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auto-Trigger Event
                </label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EMPLOYEE_CREATED">When Employee Profile is Created</option>
                  <option value="MANUAL_ONLY">Manual Initiation Only</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Default checklist applied to all full-time hires across departments."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Steps / Checklist Items */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Task Checklist Steps ({items.length})</h3>
                  <p className="text-[11px] text-slate-500">Configure owner roles and document submission flags for each step.</p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center space-x-1 text-xs text-blue-700 font-semibold hover:text-blue-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Step #{idx + 1} Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Step name"
                            value={item.title}
                            onChange={(e) => updateItem(idx, 'title', e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Assigned To
                          </label>
                          <select
                            value={item.ownerType}
                            onChange={(e) => updateItem(idx, 'ownerType', e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                          >
                            <option value={OnboardingOwnerType.EMPLOYEE}>Employee Self-Service</option>
                            <option value={OnboardingOwnerType.HR}>HR Team</option>
                            <option value={OnboardingOwnerType.MANAGER}>Reporting Manager</option>
                            <option value={OnboardingOwnerType.IT}>IT Admin</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Instructions / Description
                          </label>
                          <input
                            type="text"
                            placeholder="Detailed guidelines for the assignee..."
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Due Days from Joining
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            value={item.dueDaysFromStart}
                            onChange={(e) => updateItem(idx, 'dueDaysFromStart', e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-6 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isMandatory}
                          onChange={(e) => updateItem(idx, 'isMandatory', e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-medium">Mandatory for Run Completion</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.requiresUpload}
                          onChange={(e) => updateItem(idx, 'requiresUpload', e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-medium">Requires File / Document Upload</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
              <Link
                href="/lifecycle/onboarding"
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Saving Template...' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
