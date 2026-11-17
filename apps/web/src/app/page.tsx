'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/auth-context';
import { ShieldCheck, Building2, Users2, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { user, activeOrganization } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB]">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Z
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register/company"
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                  Register Company
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E0E7FF] text-[#1E3A8A] text-xs font-semibold uppercase tracking-wider mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>Unified Multi-Tenant Identity Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight max-w-3xl leading-tight">
          One global identity. <br />
          <span className="text-[#1E3A8A]">Complete workforce control.</span>
        </h1>

        <p className="mt-6 text-lg text-[#475569] max-w-2xl leading-relaxed">
          Zentra provides an enterprise-grade multi-tenant foundation for modern HR and Payroll.
          One user identity per person, strict tenant data isolation, granular RBAC, and seamless organization switching.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register/company"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#1E3A8A] text-white font-medium hover:bg-[#1D4ED8] transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <span>Start 30-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            Sign In to Existing Organization
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center mb-4">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">One Global Identity</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Users maintain a single login identity. Belongs to multiple organizations without duplicate accounts or credential fragmentation.
            </p>
            <div className="mt-4 flex items-center text-xs text-[#059669] font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Globally unique, normalized emails</span>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">Strict Tenant Isolation</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Every tenant-owned table is partitioned by organization_id derived server-side from active sessions, protecting against data leaks.
            </p>
            <div className="mt-4 flex items-center text-xs text-[#059669] font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Zero client-side org tampering</span>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">Product Entitlements</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Subscription and entitlement controls govern access to Zentra People and Zentra Payroll at the organization level.
            </p>
            <div className="mt-4 flex items-center text-xs text-[#059669] font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Zentra People trial enabled on signup</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-[#64748B]">
          &copy; {new Date().getFullYear()} Zentra Platform. Multi-tenant Enterprise HRMS & Payroll.
        </div>
      </footer>
    </div>
  );
}
