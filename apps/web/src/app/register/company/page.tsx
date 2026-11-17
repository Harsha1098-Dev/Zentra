'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../lib/api';
import { Building2, User, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterCompanyPage() {
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await ApiClient.request('/auth/register-company', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          firstName,
          lastName,
          email,
          password,
        }),
      });

      setSuccessData(res);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-xl shadow-sm">
              Z
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
          </Link>
          <h2 className="mt-4 text-xl font-bold text-[#0F172A]">Register your organization</h2>
          <p className="mt-1 text-sm text-[#475569]">
            Includes a 30-day full access trial for Zentra People HRMS
          </p>
        </div>

        {/* Success Card */}
        {successData ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">Registration Successful!</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Your organization <strong className="text-[#0F172A]">{successData.organization?.name}</strong> has been created.
              We sent a verification email to <strong className="text-[#0F172A]">{email}</strong>.
            </p>

            {successData._debugVerificationToken && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-[#D97706]">
                <span className="font-semibold">Local Dev Verification Token:</span>
                <div className="mt-1 font-mono break-all text-xs text-slate-800 bg-white p-2 rounded border border-amber-100">
                  {successData._debugVerificationToken}
                </div>
                <Link
                  href={`/verify-email?token=${successData._debugVerificationToken}`}
                  className="mt-2 inline-block text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Verify Email Instantly &rarr;
                </Link>
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm transition inline-flex items-center justify-center space-x-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-[#DC2626] text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Acme Technologies Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Alex"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                  Work Email (Global User Identity)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="alex@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                  />
                </div>
                <p className="mt-1 text-xs text-[#64748B]">
                  Normalized and unique across all Zentra organizations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters with numbers & uppercase"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Entitlement Highlight */}
              <div className="p-3 bg-[#E0E7FF] rounded-lg flex items-center space-x-2 text-xs text-[#1E3A8A]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  You will be assigned the <strong>Super Admin</strong> role with an active 30-day trial of <strong>Zentra People</strong>.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A] disabled:opacity-50 transition flex items-center justify-center space-x-2 mt-2"
              >
                {isLoading ? (
                  <span>Registering company...</span>
                ) : (
                  <>
                    <span>Create Company & Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center text-xs text-[#475569]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1E3A8A] font-semibold hover:text-[#1D4ED8]">
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
