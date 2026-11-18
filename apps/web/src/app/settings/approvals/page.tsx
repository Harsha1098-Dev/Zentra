'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Layers,
  GitPullRequest,
  Plus,
  Shield,
  AlertTriangle,
  Play,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { ApproverType } from '@zentra/shared-types';

export default function ApprovalSettingsPage() {
  const { user } = useAuth();
  const [checkingEscalations, setCheckingEscalations] = useState(false);
  const [escalatedResult, setEscalatedResult] = useState<number | null>(null);

  const checkOverdueEscalations = async () => {
    try {
      setCheckingEscalations(true);
      const res = await ApiClient.request<{ escalatedCount: number }>('/approvals/escalations/check', {
        method: 'POST',
      });
      setEscalatedResult(res.escalatedCount);
    } catch (err: any) {
      alert(`Error checking escalations: ${err.message}`);
    } finally {
      setCheckingEscalations(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">Approval Chains & Policies</h1>
              <p className="text-xs text-[#475569]">
                Configure multi-level approval hierarchies, parallel sign-offs, and SLA escalation policies.
              </p>
            </div>
          </div>

          <button
            onClick={checkOverdueEscalations}
            disabled={checkingEscalations}
            className="inline-flex items-center space-x-2 px-3 py-2 border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold rounded-lg shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{checkingEscalations ? 'Evaluating...' : 'Check SLA Escalations'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] space-x-6 text-sm font-medium">
          <Link
            href="/settings/workflows"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Workflow Rules</span>
          </Link>
          <Link
            href="/settings/approvals"
            className="pb-3 border-b-2 border-[#1E3A8A] text-[#1E3A8A] font-semibold flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approval Chains</span>
          </Link>
          <Link
            href="/settings/checklists"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <Layers className="w-4 h-4" />
            <span>Checklists</span>
          </Link>
          <Link
            href="/settings/tasks"
            className="pb-3 text-[#64748B] hover:text-[#0F172A] flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>Tasks</span>
          </Link>
        </div>

        {escalatedResult !== null && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>SLA Check Completed: {escalatedResult} pending step(s) marked escalated due to overdue deadlines.</span>
          </div>
        )}

        {/* Standard Approval Chains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Chain Card 1 */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Employee Profile Change Chain</h3>
                <p className="text-xs text-[#64748B]">Triggers when an employee submits personal or contact update</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-3 text-xs bg-slate-50 p-3 rounded-lg border border-[#E2E8F0]">
                <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-[#0F172A] block">Reporting Manager Review</span>
                  <span className="text-[11px] text-[#64748B]">Type: Reporting Manager (auto-resolved from employee record)</span>
                </div>
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>

              <div className="flex items-center space-x-3 text-xs bg-slate-50 p-3 rounded-lg border border-[#E2E8F0]">
                <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-[#0F172A] block">HR Admin Final Verification</span>
                  <span className="text-[11px] text-[#64748B]">Type: Specific Role (hr_admin)</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B] flex items-center justify-between">
              <span>Post-Approval: Automatically updates employee record</span>
              <span className="font-semibold text-[#1E3A8A]">SLA: 48 Hours</span>
            </div>
          </div>

          {/* Chain Card 2 */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Promotion & Title Change Chain</h3>
                <p className="text-xs text-[#64748B]">Triggers when a title or designation change is proposed</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-3 text-xs bg-slate-50 p-3 rounded-lg border border-[#E2E8F0]">
                <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-[#0F172A] block">Department Head Sign-off</span>
                  <span className="text-[11px] text-[#64748B]">Type: Department Head</span>
                </div>
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>

              <div className="flex items-center space-x-3 text-xs bg-slate-50 p-3 rounded-lg border border-[#E2E8F0]">
                <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-[#0F172A] block">Super Admin / HR Executive</span>
                  <span className="text-[11px] text-[#64748B]">Type: Specific Role (super_admin)</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B] flex items-center justify-between">
              <span>Auto-Approval: Excluded</span>
              <span className="font-semibold text-[#1E3A8A]">SLA: 72 Hours</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
