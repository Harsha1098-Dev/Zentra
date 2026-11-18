'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  UserCheck,
  Clock,
  ArrowRightLeft,
  TrendingUp,
  DollarSign,
  LogOut,
  ShieldCheck,
  UserX,
  Package,
  FileText,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { PermissionCode } from '@zentra/shared-types';

export function LifecycleNav() {
  const pathname = usePathname();
  const { permissions, roles } = useAuth();

  const isHrOrAdmin =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.EMPLOYEE_CREATE) ||
    permissions.includes(PermissionCode.USER_MANAGE);

  const navItems = [
    { label: 'Overview', href: '/lifecycle', icon: Home },
    { label: 'Onboarding', href: '/lifecycle/onboarding', icon: UserCheck },
    { label: 'Probation', href: '/lifecycle/probation', icon: Clock },
    { label: 'Transfers', href: '/lifecycle/transfers', icon: ArrowRightLeft },
    { label: 'Promotions', href: '/lifecycle/promotions', icon: TrendingUp },
    { label: 'Salary Revisions', href: '/lifecycle/salary-revisions', icon: DollarSign },
    { label: 'Resignations', href: '/lifecycle/resignations', icon: LogOut },
    { label: 'Exit Clearance', href: '/lifecycle/exit-clearance', icon: ShieldCheck },
    { label: 'Offboarding', href: '/lifecycle/offboarding', icon: UserX },
    { label: 'Assets', href: '/lifecycle/assets', icon: Package },
    { label: 'Letters', href: '/lifecycle/letters', icon: FileText },
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
              <span className="text-sm font-semibold text-slate-900">Employee Lifecycle</span>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                HR Core
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/my-lifecycle"
              className="text-xs text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors font-medium"
            >
              My Self-Service
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/lifecycle'
                ? pathname === '/lifecycle'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-blue-700' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
