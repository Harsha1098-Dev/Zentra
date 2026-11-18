'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Settings,
  Landmark,
  HeartPulse,
  Scale,
  Building,
  Calculator,
  FileCheck2,
  FileSpreadsheet,
  LayoutDashboard,
  CheckSquare,
} from 'lucide-react';

export function StatutoryNav() {
  const pathname = usePathname();

  const links = [
    { label: 'Dashboard', href: '/payroll/statutory/dashboard', icon: LayoutDashboard },
    { label: 'Overview', href: '/payroll/statutory', icon: ShieldCheck },
    { label: 'Settings', href: '/payroll/statutory/settings', icon: Settings },
    { label: 'PF (EPF)', href: '/payroll/statutory/pf', icon: Landmark },
    { label: 'ESI', href: '/payroll/statutory/esi', icon: HeartPulse },
    { label: 'Professional Tax', href: '/payroll/statutory/professional-tax', icon: Scale },
    { label: 'LWF', href: '/payroll/statutory/lwf', icon: Building },
    { label: 'TDS Workbench', href: '/payroll/statutory/tds', icon: Calculator },
    { label: 'Declarations & Proofs', href: '/payroll/statutory/declarations', icon: CheckSquare },
    { label: 'Form 16', href: '/payroll/statutory/form16', icon: FileCheck2 },
    { label: 'Reports', href: '/payroll/statutory/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="border-b border-gray-200 bg-white mb-6">
      <div className="flex space-x-1 overflow-x-auto py-2">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/payroll/statutory'
              ? pathname === '/payroll/statutory'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
