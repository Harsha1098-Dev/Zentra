'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  FileCheck2,
  FileText,
  Calculator,
  UploadCloud,
} from 'lucide-react';

export function MyTaxNav() {
  const pathname = usePathname();

  const links = [
    { label: 'Overview', href: '/my-tax', icon: LayoutDashboard },
    { label: 'Tax Profile & Regime', href: '/my-tax/profile', icon: ShieldCheck },
    { label: 'Declarations', href: '/my-tax/declarations', icon: FileText },
    { label: 'Investment Proofs', href: '/my-tax/proofs', icon: UploadCloud },
    { label: 'Monthly TDS Statement', href: '/my-tax/summary', icon: Calculator },
    { label: 'Form 16', href: '/my-tax/form16', icon: FileCheck2 },
  ];

  return (
    <div className="border-b border-gray-200 bg-white mb-6">
      <div className="flex space-x-1 overflow-x-auto py-2">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/my-tax' ? pathname === '/my-tax' : pathname.startsWith(item.href);

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
