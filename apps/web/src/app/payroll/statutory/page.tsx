'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../payroll-nav';
import { StatutoryNav } from './statutory-nav';
import { ApiClient } from '../../../lib/api';
import {
  ShieldCheck,
  Landmark,
  HeartPulse,
  Scale,
  Building,
  Calculator,
  FileCheck2,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function StatutoryOverviewPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await ApiClient.request('/payroll/statutory-settings');
        setSettings(data);
      } catch (err) {
        console.error('Failed to load statutory settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const modules = [
    {
      title: 'Statutory Settings',
      description: 'Configure corporate PAN, TAN, TDS circles, and declaration open windows.',
      href: '/payroll/statutory/settings',
      icon: Settings,
      status: settings?.panNumber ? 'Configured' : 'Needs Setup',
      statusColor: settings?.panNumber ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Employees Provident Fund (EPF)',
      description: 'Manage 12% EE/ER shares, EPS 8.33% wage ceiling, EDLI 0.5%, and export monthly ECR files.',
      href: '/payroll/statutory/pf',
      icon: Landmark,
      status: settings?.pfEnabled ? 'Active' : 'Disabled',
      statusColor: settings?.pfEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600',
    },
    {
      title: 'Employee State Insurance (ESI)',
      description: 'Gross wage eligibility ceiling (₹21k / ₹25k), 0.75% EE and 3.25% ER remittance registers.',
      href: '/payroll/statutory/esi',
      icon: HeartPulse,
      status: settings?.esiEnabled ? 'Active' : 'Disabled',
      statusColor: settings?.esiEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600',
    },
    {
      title: 'Professional Tax (PT)',
      description: 'State-specific salary slabs and February adjustments (e.g. Maharashtra, Karnataka).',
      href: '/payroll/statutory/professional-tax',
      icon: Scale,
      status: settings?.ptEnabled ? 'Active' : 'Disabled',
      statusColor: settings?.ptEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600',
    },
    {
      title: 'Labour Welfare Fund (LWF)',
      description: 'State welfare board contribution rules and periodic deduction schedules.',
      href: '/payroll/statutory/lwf',
      icon: Building,
      status: settings?.lwfEnabled ? 'Active' : 'Disabled',
      statusColor: settings?.lwfEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600',
    },
    {
      title: 'TDS & Tax Workbench',
      description: 'Section 115BAC New vs Old tax regime comparison, 87A rebate, and projected monthly TDS.',
      href: '/payroll/statutory/tds',
      icon: Calculator,
      status: 'Active',
      statusColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Form 16 Annual Certificates',
      description: 'Prepare, compile, review, and publish Part A and Part B Form 16 certificates for staff.',
      href: '/payroll/statutory/form16',
      icon: FileCheck2,
      status: 'Ready',
      statusColor: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Compliance Reports Center',
      description: 'One-click export of PF ECR, ESI Monthly Register, State PT, and TDS Form 24Q returns.',
      href: '/payroll/statutory/reports',
      icon: FileSpreadsheet,
      status: 'Ready',
      statusColor: 'bg-blue-50 text-blue-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statutory Payroll & Compliance (India)</h1>
              <p className="text-sm text-gray-500">
                Manage EPF, ESI, Professional Tax, Labour Welfare Fund, and TDS tax regimes
              </p>
            </div>
          </div>
        </div>

        <StatutoryNav />

        {/* Quick Highlights Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white mb-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Active Financial Year</span>
              <p className="text-2xl font-bold mt-1">{settings?.financialYear || '2025-2026'}</p>
              <p className="text-xs text-blue-100 mt-1">AY 2026-2027</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Default Tax Regime</span>
              <p className="text-2xl font-bold mt-1">
                {settings?.defaultTaxRegime === 'NEW_REGIME' ? 'New Regime (115BAC)' : 'Old Regime'}
              </p>
              <p className="text-xs text-blue-100 mt-1">Std. Deduction: ₹75,000</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Corporate TAN</span>
              <p className="text-2xl font-bold mt-1">{settings?.tanNumber || 'Not Configured'}</p>
              <p className="text-xs text-blue-100 mt-1">PAN: {settings?.panNumber || 'Pending'}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Declaration Window</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/30">
                  {settings?.isDeclarationWindowOpen ? 'Open for Submissions' : 'Closed'}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">Employee Self-Service</p>
            </div>
          </div>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group bg-white rounded-xl border border-gray-200 p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${m.statusColor}`}>
                      {m.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                  <span>Manage Module</span>
                  <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
