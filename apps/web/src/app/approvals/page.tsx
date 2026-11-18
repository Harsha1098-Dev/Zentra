'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApprovalsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/approvals/pending');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center text-xs text-[#64748B]">
      Redirecting to Approvals Inbox...
    </div>
  );
}
