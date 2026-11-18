'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Calendar,
  FileCheck,
  CheckCircle2,
  Users,
  Settings,
  ShieldAlert,
  BarChart3,
  Home,
  Briefcase,
  Laptop,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { PermissionCode } from '@zentra/shared-types';

export function AttendanceNav() {
  const pathname = usePathname();
  const { permissions, roles } = useAuth();

  const isManagerOrAdmin =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(r)) ||
    permissions.includes(PermissionCode.ATTENDANCE_READ_TEAM) ||
    permissions.includes(PermissionCode.ATTENDANCE_REGULARISE_APPROVE);

  const isHrOrAdmin =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.ATTENDANCE_POLICY_CREATE) ||
    permissions.includes(PermissionCode.ATTENDANCE_LOCK);

  const navItems = [
    { label: 'Overview', href: '/attendance', icon: Home },
    { label: 'My Attendance', href: '/attendance/my-attendance', icon: Clock },
    { label: 'Regularisation', href: '/attendance/regularisation', icon: FileCheck },
    { label: 'Overtime', href: '/attendance/overtime', icon: Flame },
    { label: 'On-Duty', href: '/attendance/on-duty', icon: Briefcase },
    { label: 'Work From Home', href: '/attendance/work-from-home', icon: Laptop },
    { label: 'Shifts', href: '/attendance/shifts', icon: Calendar },
    ...(isManagerOrAdmin
      ? [
          { label: 'Team Attendance', href: '/attendance/team', icon: Users },
          { label: 'Approvals', href: '/attendance/approvals', icon: CheckCircle2 },
        ]
      : []),
    { label: 'Reports', href: '/attendance/reports', icon: BarChart3 },
    ...(isHrOrAdmin ? [{ label: 'Settings', href: '/attendance/settings', icon: Settings }] : []),
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
            <span className="text-sm font-semibold text-slate-800">Attendance & Time Tracking</span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/attendance/regularisation"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Regularise</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#1E3A8A] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1E3A8A]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
