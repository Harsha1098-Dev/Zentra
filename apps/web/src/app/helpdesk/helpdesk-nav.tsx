'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LifeBuoy,
  Ticket,
  BookOpen,
  HelpCircle,
  Headphones,
  BarChart3,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';

export function HelpdeskNav() {
  const pathname = usePathname();
  const { roles } = useAuth();

  const isAgentOrAdmin = roles.some((r) =>
    ['SUPER_ADMIN', 'HR_ADMIN', 'HELPDESK_AGENT', 'CATEGORY_ADMIN'].includes(r),
  );
  const isAdmin = roles.some((r) =>
    ['SUPER_ADMIN', 'HR_ADMIN', 'CATEGORY_ADMIN'].includes(r),
  );

  const mainLinks = [
    { label: 'Help Center', href: '/helpdesk', icon: LayoutDashboard },
    { label: 'My Tickets', href: '/helpdesk/my-tickets', icon: Ticket },
    { label: 'Knowledge Base', href: '/helpdesk/knowledge-base', icon: BookOpen },
    { label: 'FAQs', href: '/helpdesk/faqs', icon: HelpCircle },
    ...(isAgentOrAdmin
      ? [{ label: 'Agent Workbench', href: '/helpdesk/agent', icon: Headphones }]
      : []),
    ...(isAgentOrAdmin
      ? [{ label: 'Reports', href: '/helpdesk/reports', icon: BarChart3 }]
      : []),
    ...(isAdmin
      ? [{ label: 'Settings', href: '/helpdesk/settings', icon: Settings }]
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
              <span className="text-sm font-semibold text-slate-900">HR Helpdesk</span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Support
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/helpdesk/my-tickets/new"
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-lg text-white bg-[#1E3A8A] hover:bg-blue-800 transition shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5 mr-1.5" />
              Submit Ticket
            </Link>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/helpdesk'
                ? pathname === '/helpdesk'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[#1E3A8A] bg-blue-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-[#1E3A8A]' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
