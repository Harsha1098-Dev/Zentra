'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DollarSign,
  Layers,
  FileText,
  Calendar,
  PlayCircle,
  Users,
  Settings,
  CreditCard,
  PlusCircle,
  Home,
  CheckCircle2,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { PermissionCode, RoleCode } from '@zentra/shared-types';

export function PayrollNav() {
  const pathname = usePathname();
  const { permissions, roles } = useAuth();

  const isPayrollAdmin =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN', 'FINANCE'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_RUN_CREATE) ||
    permissions.includes(PermissionCode.PAYROLL_RUN_CALCULATE);

  const isFinance =
    roles.some((r) => ['SUPER_ADMIN', 'FINANCE', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_PAYMENT_MARK_PAID);

  const navItems = [
    { label: 'Overview', href: '/payroll', icon: Home },
    ...(isPayrollAdmin
      ? [
          { label: 'Payroll Runs', href: '/payroll/payroll-runs', icon: PlayCircle },
          { label: 'Periods', href: '/payroll/payroll-periods', icon: Calendar },
          { label: 'Salary Structures', href: '/payroll/salary-structures', icon: Layers },
          { label: 'Components', href: '/payroll/salary-components', icon: Settings },
          { label: 'Employee Salaries', href: '/payroll/employee-salary', icon: Users },
          { label: 'Payslip Templates', href: '/payroll/payslip-templates', icon: FileText },
          { label: 'All Payslips', href: '/payroll/generated-payslips', icon: CheckCircle2 },
          { label: 'Statutory & Compliance', href: '/payroll/statutory', icon: ShieldCheck },
        ]
      : []),
    { label: 'My Payslips', href: '/my-payslips', icon: FileText },
    { label: 'My Salary', href: '/my-salary', icon: DollarSign },
    { label: 'My Tax', href: '/my-tax', icon: Calculator },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-white font-bold text-base shadow-sm">
                Z
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-semibold text-slate-900">Payroll</span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Live
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isPayrollAdmin && (
              <Link
                href="/payroll/payroll-runs"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Process Payroll</span>
              </Link>
            )}
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
            const isActive =
              item.href === '/payroll'
                ? pathname === '/payroll'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-slate-900' : 'text-slate-400'
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
