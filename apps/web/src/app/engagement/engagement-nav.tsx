'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  Vote,
  Award,
  Gift,
  Smile,
  Activity,
  Users,
  BarChart3,
  Settings,
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';

export function EngagementNav() {
  const pathname = usePathname();
  const { roles } = useAuth();

  const isManagerOrAdmin = roles.some((r) =>
    ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(r),
  );
  const isAdmin = roles.some((r) =>
    ['SUPER_ADMIN', 'HR_ADMIN'].includes(r),
  );

  const mainLinks = [
    { label: 'Engagement Hub', href: '/engagement', icon: LayoutDashboard },
    { label: 'Surveys', href: '/engagement/my-surveys', icon: ClipboardList },
    { label: 'Polls', href: '/engagement/my-polls', icon: Vote },
    { label: 'Recognition', href: '/engagement/recognition', icon: Heart },
    { label: 'Rewards Store', href: '/engagement/my-rewards', icon: Gift },
    { label: 'Badges', href: '/engagement/my-badges', icon: Award },
    { label: 'Celebrations', href: '/engagement/celebrations', icon: Smile },
    { label: 'Wellness', href: '/engagement/wellness', icon: Activity },
    ...(isManagerOrAdmin
      ? [{ label: 'Team', href: '/engagement/team', icon: Users }]
      : []),
    ...(isAdmin
      ? [{ label: 'Analytics', href: '/engagement/reports', icon: BarChart3 }]
      : []),
    ...(isAdmin
      ? [{ label: 'Settings', href: '/engagement/settings', icon: Settings }]
      : []),
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-[#1E3A8A]">
                ZENTRA
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                Engagement
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto py-2">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/engagement'
                  ? pathname === '/engagement'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[#1E3A8A] font-semibold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <Link
              href="/engagement/recognition/give"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Give Praise</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
