'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiClient } from '../../lib/api';
import { CheckCircle2, AlertCircle, Mail, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [token, setToken] = useState(tokenFromUrl || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleVerify = async (verificationToken: string) => {
    if (!verificationToken) return;
    setStatus('loading');
    setMessage('');

    try {
      const res = await ApiClient.request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: verificationToken.trim() }),
      });
      setStatus('success');
      setMessage(res.message || 'Email verified successfully!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Verification failed or token has expired.');
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    try {
      await ApiClient.request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      setResendStatus('If your email is registered, a new verification link has been sent.');
    } catch (err: any) {
      setResendStatus('Failed to resend verification. Please try again.');
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
          <h2 className="mt-4 text-xl font-bold text-[#0F172A]">Email Verification</h2>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-8 text-center">
          {status === 'loading' && (
            <div className="py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E3A8A] mx-auto"></div>
              <p className="mt-4 text-sm text-[#475569]">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Email Verified!</h3>
              <p className="mt-2 text-sm text-[#475569]">{message}</p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm transition inline-flex items-center justify-center space-x-2"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Verification Failed</h3>
              <p className="mt-2 text-sm text-[#DC2626]">{message}</p>
            </div>
          )}

          {status !== 'success' && (
            <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-left">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
                Verify manually with token
              </h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Paste verification token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <button
                  type="button"
                  onClick={() => handleVerify(token)}
                  className="px-3 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  Verify
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
                  Need a new verification link?
                </h4>
                <form onSubmit={handleResend} className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-100 text-[#0F172A] border border-[#E2E8F0] text-xs font-medium rounded-lg hover:bg-slate-200"
                  >
                    Resend
                  </button>
                </form>
                {resendStatus && (
                  <p className="mt-2 text-xs text-[#059669]">{resendStatus}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
