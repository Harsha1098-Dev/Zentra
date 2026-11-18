'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Users,
  Kanban,
  Calendar,
  Gift,
  Share2,
  Building2,
  BarChart3,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';

export function RecruitmentNav() {
  const pathname = usePathname();
  const { roles } = useAuth();

  const isRecruiterOrAdmin = roles.some((r) =>
    ['SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'].includes(r),
  );
  const isInterviewerOrHM = roles.some((r) =>
    ['HIRING_MANAGER', 'INTERVIEWER', 'MANAGER'].includes(r),
  );

  const mainLinks = [
    { label: 'Overview', href: '/recruitment', icon: LayoutDashboard },
    { label: 'Job Openings', href: '/recruitment/jobs', icon: Briefcase },
    { label: 'Candidates', href: '/recruitment/candidates', icon: Users },
    { label: 'Pipeline Board', href: '/recruitment/applications', icon: Kanban },
    { label: 'Interviews', href: '/recruitment/interviews', icon: Calendar },
    { label: 'Offers', href: '/recruitment/offers', icon: Gift },
    { label: 'Referrals', href: '/recruitment/referrals', icon: Share2 },
    { label: 'Internal Jobs', href: '/recruitment/internal-jobs', icon: Building2 },
    { label: 'Reports', href: '/recruitment/reports', icon: BarChart3 },
    ...(isRecruiterOrAdmin
      ? [{ label: 'Settings', href: '/recruitment/settings', icon: Settings }]
      : []),
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-base shadow-sm">
                Z
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-semibold text-slate-900">Recruitment & ATS</span>
              <span className="bg-blue-50 text-[#1E3A8A] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                Talent
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-100"
            >
              Main Dashboard
            </Link>
          </div>
        </div>

        {/* Scrollable Sub-nav bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/recruitment'
                ? pathname === '/recruitment'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
