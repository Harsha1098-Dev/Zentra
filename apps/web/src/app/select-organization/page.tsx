'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { Building2, Shield, ArrowRight, LogOut, PlusCircle } from 'lucide-react';

export default function SelectOrganizationPage() {
  const router = useRouter();
  const { user, organizations, selectOrganization, logout, isLoading } = useAuth();
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (orgId: string) => {
    setSelectingId(orgId);
    setError(null);
    try {
      await selectOrganization(orgId);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to select organization');
      setSelectingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F6F8FB] px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Z
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Select Organization</h2>
          <p className="mt-1 text-sm text-[#475569]">
            Signed in as <strong className="text-[#0F172A]">{user?.email}</strong>. Choose an organization workspace to enter.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 space-y-3">
          {organizations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
              <p className="text-sm text-[#475569]">You do not belong to any active organizations yet.</p>
              <Link
                href="/register/company"
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create an Organization</span>
              </Link>
            </div>
          ) : (
            organizations.map((org) => {
              const isSelected = selectingId === org.id;

              return (
                <div
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  className={`p-4 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#1E3A8A] bg-blue-50/40 ring-1 ring-[#1E3A8A]'
                      : 'border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">{org.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-[#475569]">
                          <Shield className="w-3 h-3 mr-1 text-[#64748B]" />
                          {org.role.name}
                        </span>
                        {org.products.map((p) => (
                          <span
                            key={p.code}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#059669] border border-emerald-200"
                          >
                            {p.code === 'ZENTRA_PEOPLE' ? 'Zentra People' : p.code} ({p.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-[#64748B]">
                    {isSelected ? (
                      <span className="text-xs text-[#1E3A8A] font-semibold">Switching...</span>
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-[#475569]">
          <Link
            href="/register/company"
            className="inline-flex items-center space-x-1.5 text-[#1E3A8A] font-medium hover:text-[#1D4ED8]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register another company</span>
          </Link>

          <button
            onClick={logout}
            className="inline-flex items-center space-x-1.5 text-[#64748B] hover:text-[#DC2626] font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
