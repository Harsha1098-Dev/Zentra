'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Calendar,
  FileCheck,
  Star,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { PerformanceNav } from '../performance-nav';

export default function PerformanceSettingsHubPage() {
  const settingsCards = [
    {
      title: 'Performance Review Cycles',
      description:
        'Configure annual, semi-annual, or quarterly appraisal cycles, set review periods, start assignments, and close cycles.',
      href: '/performance/settings/cycles',
      icon: Calendar,
      badge: 'Cycles Management',
    },
    {
      title: 'Appraisal Templates',
      description:
        'Design custom appraisal question forms, self-review rubrics, manager feedback sections, and competency models.',
      href: '/performance/settings/templates',
      icon: FileCheck,
      badge: 'Evaluation Rubrics',
    },
    {
      title: 'Rating Scales',
      description:
        'Manage standard 5-point rating scales, descriptors, expectations, and bell curve target distribution models.',
      href: '/performance/settings/rating-scales',
      icon: Star,
      badge: 'Scoring Standards',
    },
    {
      title: 'Calibration Sessions',
      description:
        'Facilitate committee calibration meetings to normalize rating variance across departments before publishing.',
      href: '/performance/calibration',
      icon: SlidersHorizontal,
      badge: 'Committee Moderation',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PerformanceNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Performance & Appraisal Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System administration for appraisal cycles, evaluation templates, rating systems, and calibration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white border border-slate-200 rounded-xl p-6 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E3A8A]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-700 group-hover:text-blue-900">
                  <span>Manage {card.title}</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
