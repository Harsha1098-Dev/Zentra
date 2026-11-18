'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Users,
  Clock,
  BookOpen,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { HelpdeskNav } from '../helpdesk-nav';

export default function HelpdeskSettingsHubPage() {
  const sections = [
    {
      title: 'Categories & Sub-Categories',
      desc: 'Define support categories, hierarchy, codes, default assignees, and SLA links',
      href: '/helpdesk/settings/categories',
      icon: FolderTree,
      color: 'bg-blue-50 text-[#1E3A8A]',
    },
    {
      title: 'Agents & Category Routing',
      desc: 'Manage support staff, agent tiers, availability, and routing policies',
      href: '/helpdesk/settings/agents',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'SLA Policies & Escalations',
      desc: 'Configure business hours, response and resolution targets, and escalation triggers',
      href: '/helpdesk/settings/sla',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Knowledge Base Articles',
      desc: 'Author, edit, publish, or archive employee guides and documentation',
      href: '/helpdesk/settings/knowledge-base',
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Frequently Asked Questions',
      desc: 'Maintain FAQ questions and answers mapped to categories for deflection',
      href: '/helpdesk/settings/faqs',
      icon: HelpCircle,
      color: 'bg-rose-50 text-rose-700',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Helpdesk Configuration & Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure support channels, agent rosters, service level agreements, and knowledge content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.href}
                href={sec.href}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition group block"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sec.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-4 group-hover:text-[#1E3A8A] transition">
                  {sec.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {sec.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
