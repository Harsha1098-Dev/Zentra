'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gift,
  PlusCircle,
  CheckCircle,
  Clock,
  Send,
  UserCheck,
  AlertCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { RecruitmentNav } from '../recruitment-nav';
import { ApiClient } from '../../../lib/api';

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  async function fetchOffers() {
    setIsLoading(true);
    try {
      const data = await ApiClient.request('/recruitment/offers');
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load offers', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitApproval(offerId: string) {
    try {
      await ApiClient.request(`/recruitment/offers/${offerId}/submit`, { method: 'POST' });
      fetchOffers();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit offer for approval');
    }
  }

  async function handleApprove(offerId: string) {
    try {
      await ApiClient.request(`/recruitment/offers/${offerId}/approve`, { method: 'POST' });
      fetchOffers();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve offer');
    }
  }

  async function handleSend(offerId: string) {
    try {
      await ApiClient.request(`/recruitment/offers/${offerId}/send`, { method: 'POST' });
      fetchOffers();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to send offer');
    }
  }

  async function handleAccept(offerId: string) {
    try {
      await ApiClient.request(`/recruitment/offers/${offerId}/accept`, { method: 'POST' });
      fetchOffers();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to accept offer');
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Offer Management</h1>
            <p className="text-sm text-slate-500">
              Generate compensation packages, route through multi-tier approvals, dispatch offer letters, and track candidate acceptances.
            </p>
          </div>

          <Link
            href="/recruitment/offers/new"
            className="inline-flex items-center space-x-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Offer</span>
          </Link>
        </div>

        {actionError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Offers List */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Gift className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Offers Generated</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Draft formal offer letters with compensation structures and expiry dates.
            </p>
            <Link
              href="/recruitment/offers/new"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline pt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Offer</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((off) => (
              <div
                key={off.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {off.candidate?.firstName} {off.candidate?.lastName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        off.offerStatus === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : off.offerStatus === 'APPROVED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : off.offerStatus === 'SENT'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : off.offerStatus === 'PENDING_APPROVAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {off.offerStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    ₹{Number(off.annualCtc).toLocaleString()} / year &bull;{' '}
                    <span className="text-slate-600 font-normal">{off.jobOpening?.title}</span>
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Joining Date: <strong className="text-slate-700">{new Date(off.joiningDate).toLocaleDateString()}</strong></span>
                    <span>&bull;</span>
                    <span>Expiry: <strong className="text-slate-700">{new Date(off.expiryDate).toLocaleDateString()}</strong></span>
                    <span>&bull;</span>
                    <span>Department: {off.department?.name || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {off.offerStatus === 'DRAFT' && (
                    <button
                      onClick={() => handleSubmitApproval(off.id)}
                      className="bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      Submit for Approval
                    </button>
                  )}

                  {off.offerStatus === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleApprove(off.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      Approve Offer
                    </button>
                  )}

                  {off.offerStatus === 'APPROVED' && (
                    <button
                      onClick={() => handleSend(off.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Candidate</span>
                    </button>
                  )}

                  {off.offerStatus === 'SENT' && (
                    <button
                      onClick={() => handleAccept(off.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      Mark Accepted
                    </button>
                  )}

                  {off.offerStatus === 'ACCEPTED' && (
                    <Link
                      href={`/recruitment/candidates/${off.candidateId}`}
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors inline-flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Convert to Employee</span>
                    </Link>
                  )}

                  <Link
                    href={`/recruitment/candidates/${off.candidateId}`}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
