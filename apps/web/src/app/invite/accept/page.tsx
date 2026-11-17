'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiClient } from '../../../lib/api';
import { CheckCircle2, AlertCircle, Lock, User, ArrowRight } from 'lucide-react';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {};
      if (firstName) payload.firstName = firstName.trim();
      if (lastName) payload.lastName = lastName.trim();
      if (password) payload.password = password;

      const res = await ApiClient.request(`/invitations/${encodeURIComponent(token.trim())}/accept`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsSuccess(true);
      setSuccessInfo(res);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation. Token may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-xl shadow-sm">
              Z
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
          </Link>
          <h2 className="mt-4 text-xl font-bold text-[#0F172A]">Accept Organization Invitation</h2>
          <p className="mt-1 text-sm text-[#475569]">
            Join your company's Zentra workspace
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-[#DC2626] text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Invitation Accepted!</h3>
              <p className="mt-2 text-sm text-[#475569]">
                You have been linked to <strong className="text-[#0F172A]">{successInfo?.organization?.name}</strong>.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm transition inline-flex items-center justify-center space-x-2"
                >
                  <span>Sign In to Zentra</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                  Invitation Token
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste invitation token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                  Set Password (Optional if you already have a Zentra account)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Choose password (min 8 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              {password && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A] disabled:opacity-50 transition flex items-center justify-center space-x-2 mt-2"
              >
                {isLoading ? (
                  <span>Accepting Invitation...</span>
                ) : (
                  <>
                    <span>Accept & Join Organization</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading invitation...</div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
