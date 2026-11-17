'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../lib/api';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsLoading(true);

    try {
      const res = await ApiClient.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStatus(res.message);
      if (res._debugResetToken) {
        setDebugToken(res._debugResetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit reset request.');
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
          <h2 className="mt-4 text-xl font-bold text-[#0F172A]">Reset your password</h2>
          <p className="mt-1 text-sm text-[#475569]">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-[#DC2626] text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {status ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">Check your inbox</h3>
              <p className="mt-2 text-sm text-[#475569]">{status}</p>

              {debugToken && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-[#D97706]">
                  <span className="font-semibold">Local Dev Reset Token:</span>
                  <div className="mt-1 font-mono break-all text-xs text-slate-800 bg-white p-2 rounded border border-amber-100">
                    {debugToken}
                  </div>
                  <Link
                    href={`/reset-password?token=${debugToken}`}
                    className="mt-2 inline-block text-xs font-semibold text-[#1E3A8A] hover:underline"
                  >
                    Set New Password Instantly &rarr;
                  </Link>
                </div>
              )}

              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1.5 text-sm font-medium text-[#1E3A8A] hover:text-[#1D4ED8]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                  Account Email
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
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A] disabled:opacity-50 transition"
              >
                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
              </button>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1 text-xs font-medium text-[#475569] hover:text-[#0F172A]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
