'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import {
  Building2,
  MapPin,
  GitBranch,
  Briefcase,
  Layers,
  Calendar,
  Sun,
  Network,
  ArrowLeft,
  ChevronRight,
  Shield,
  Sliders,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Setup Overview',
    href: '/settings/organization',
    icon: Sliders,
    exact: true,
  },
  {
    name: 'Company Profile',
    href: '/settings/organization/profile',
    icon: Building2,
  },
  {
    name: 'Locations',
    href: '/settings/organization/locations',
    icon: MapPin,
  },
  {
    name: 'Departments',
    href: '/settings/organization/departments',
    icon: GitBranch,
  },
  {
    name: 'Designations',
    href: '/settings/organization/designations',
    icon: Briefcase,
  },
  {
    name: 'Grades & Bands',
    href: '/settings/organization/grades',
    icon: Layers,
  },
  {
    name: 'Workweek Schedule',
    href: '/settings/organization/workweek',
    icon: Calendar,
  },
  {
    name: 'Holiday Calendar',
    href: '/settings/organization/holidays',
    icon: Sun,
  },
  {
    name: 'Organization Chart',
    href: '/settings/organization/chart',
    icon: Network,
  },
];

export default function OrganizationSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeOrganization, roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  if (!user || !activeOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] px-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <Building2 className="w-12 h-12 text-[#1E3A8A] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0F172A]">Active Organization Required</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Please select an organization before configuring organization setup.
          </p>
          <div className="mt-6">
            <Link
              href="/select-organization"
              className="px-4 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              Select Organization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB]">
      {/* Top Header */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-base shadow-sm">
                Z
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
            </Link>

            <ChevronRight className="w-4 h-4 text-[#64748B]" />

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#475569]">
                {activeOrganization.name}
              </span>
              <span className="text-xs font-bold text-[#1E3A8A]">Organization Setup</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#475569] hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with Left Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-sm sticky top-24">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] mb-2 flex items-center justify-between">
              <span>Settings Menu</span>
              <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-[#E0E7FF] text-[#1E3A8A] font-semibold'
                        : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1E3A8A]' : 'text-[#64748B]'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Section Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
