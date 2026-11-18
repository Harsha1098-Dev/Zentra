'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollNav } from '../payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Building2,
  Trash2,
  Eye,
  Percent,
} from 'lucide-react';
import { PermissionCode } from '@zentra/shared-types';

export default function SalaryStructuresPage() {
  const { permissions, roles, activeOrganization } = useAuth();

  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewStructure, setPreviewStructure] = useState<any | null>(null);

  const canManage =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_SALARY_STRUCTURE_CREATE);

  async function loadStructures() {
    try {
      setLoading(true);
      const data = await ApiClient.get('/payroll/salary-structures');
      setStructures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load salary structures', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadStructures();
    }
  }, [activeOrganization]);

  const filtered = structures.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Salary Structures & Templates
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Package component blueprints into standard grade compensation structures and assign to employees.
            </p>
          </div>

          {canManage && (
            <Link
              href="/payroll/salary-structures/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Structure</span>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search structures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Structures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-400">
              Loading structures...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900">No salary structures yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Create salary structures like Executive, Standard Corporate, or Technical Band.
              </p>
            </div>
          ) : (
            filtered.map((struct) => (
              <div
                key={struct.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {struct.code || 'STRUCTURE'}
                    </span>
                    {struct.isDefault && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Default Template</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">{struct.name}</h3>
                  {struct.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {struct.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Mapped Components:</span>
                      <span className="font-semibold text-slate-900">
                        {struct.components?.length || 0}
                      </span>
                    </div>
                    {struct.annualCtc ? (
                      <div className="flex justify-between text-slate-600">
                        <span>Baseline Annual CTC:</span>
                        <span className="font-semibold text-slate-900">
                          ₹ {Number(struct.annualCtc).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewStructure(struct)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Breakdown</span>
                  </button>

                  <Link
                    href={`/payroll/employee-salary?structureId=${struct.id}`}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Assign →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Structure Breakdown Drawer / Modal */}
        {previewStructure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {previewStructure.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Code: {previewStructure.code || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewStructure(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mapped Component Rules
                </div>

                {previewStructure.components?.length === 0 ? (
                  <p className="text-xs text-slate-400">No components attached to this structure.</p>
                ) : (
                  <div className="space-y-2">
                    {previewStructure.components?.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">
                            {c.salaryComponent?.name || c.salaryComponentId}
                          </span>
                          <span className="ml-2 font-mono text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                            {c.salaryComponent?.componentCode}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Type: {c.salaryComponent?.componentType}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-slate-700 font-medium">
                            {c.overrideFormula ||
                              (c.overrideAmount
                                ? `₹ ${Number(c.overrideAmount).toLocaleString('en-IN')}`
                                : c.overridePercentage
                                ? `${c.overridePercentage}%`
                                : c.salaryComponent?.calculationType?.replace(/_/g, ' '))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setPreviewStructure(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
