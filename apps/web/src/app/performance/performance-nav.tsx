'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Target,
  Compass,
  Award,
  CheckCircle2,
  MessageSquareHeart,
  Users2,
  Flame,
  FileCheck2,
  Users,
  Settings,
  SlidersHorizontal,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';

export function PerformanceNav() {
  const pathname = usePathname();
  const { roles } = useAuth();

  const isHrOrAdmin = roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r));
  const isManager = roles.includes('MANAGER') || isHrOrAdmin;

  const employeeLinks = [
    { label: 'Overview', href: '/performance', icon: BarChart3 },
    { label: 'My Goals', href: '/performance/my-goals', icon: Target },
    { label: 'My OKRs', href: '/performance/my-okrs', icon: Compass },
    { label: 'My KRAs', href: '/performance/my-kras', icon: Award },
    { label: 'Check-ins', href: '/performance/check-ins', icon: CheckCircle2 },
    { label: 'Feedback', href: '/performance/feedback', icon: MessageSquareHeart },
    { label: '1:1 Meetings', href: '/performance/one-on-one', icon: Users2 },
    { label: 'PIP', href: '/performance/improvement-plans', icon: Flame },
    { label: 'My Reviews', href: '/performance/my-reviews', icon: FileCheck2 },
  ];

  const managerLinks = isManager
    ? [{ label: 'Team', href: '/performance/team', icon: Users }]
    : [];

  const adminLinks = isHrOrAdmin
    ? [
        { label: 'Calibration', href: '/performance/calibration', icon: SlidersHorizontal },
        { label: 'Reports', href: '/performance/reports', icon: PieChart },
        { label: 'Settings', href: '/performance/settings', icon: Settings },
      ]
    : [{ label: 'Reports', href: '/performance/reports', icon: PieChart }];

  const allLinks = [...employeeLinks, ...managerLinks, ...adminLinks];

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
              <span className="text-sm font-semibold text-slate-900">Performance & Goals</span>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                People
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
          {allLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/performance'
                ? pathname === '/performance'
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
