'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PayrollNav } from '../../payroll-nav';
import { useAuth } from '../../../../context/auth-context';
import { ApiClient } from '../../../../lib/api';
import {
  Layers,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { SalaryComponentType, CalculationType } from '@zentra/shared-types';

export default function NewSalaryStructurePage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  const [availableComponents, setAvailableComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [annualCtc, setAnnualCtc] = useState<number | ''>(600000);
  const [isDefault, setIsDefault] = useState(false);

  // Mapped components
  const [mappedComponents, setMappedComponents] = useState<
    {
      salaryComponentId: string;
      orderIndex: number;
      overrideFormula?: string;
      overridePercentage?: number;
      overrideAmount?: number;
    }[]
  >([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await ApiClient.get('/payroll/salary-components');
        const comps = Array.isArray(data) ? data : [];
        setAvailableComponents(comps);

        // Auto-select standard components if available (e.g. BASIC, HRA)
        const initial = comps
          .filter((c) => ['BASIC', 'HRA', 'PF'].includes(c.componentCode))
          .map((c, idx) => ({
            salaryComponentId: c.id,
            orderIndex: idx + 1,
          }));
        if (initial.length > 0) {
          setMappedComponents(initial);
        }
      } catch (err) {
        console.error('Failed to load components', err);
      } finally {
        setLoading(false);
      }
    }

    if (activeOrganization) {
      load();
    }
  }, [activeOrganization]);

  function addComponent(comp: any) {
    if (mappedComponents.some((m) => m.salaryComponentId === comp.id)) return;
    setMappedComponents([
      ...mappedComponents,
      {
        salaryComponentId: comp.id,
        orderIndex: mappedComponents.length + 1,
      },
    ]);
  }

  function removeComponent(id: string) {
    setMappedComponents(mappedComponents.filter((m) => m.salaryComponentId !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mappedComponents.length === 0) {
      setError('Please add at least one salary component to this structure.');
      return;
    }

    setSaving(true);
    try {
      await ApiClient.post('/payroll/salary-structures', {
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
        annualCtc: annualCtc ? Number(annualCtc) : undefined,
        isDefault,
        components: mappedComponents.map((c, idx) => ({
          salaryComponentId: c.salaryComponentId,
          orderIndex: idx + 1,
          overrideFormula: c.overrideFormula || undefined,
          overridePercentage: c.overridePercentage ? Number(c.overridePercentage) : undefined,
          overrideAmount: c.overrideAmount ? Number(c.overrideAmount) : undefined,
        })),
      });

      router.push('/payroll/salary-structures');
    } catch (err: any) {
      setError(err.message || 'Failed to create salary structure');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/payroll/salary-structures"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Salary Structures</span>
        </Link>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Salary Structure
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Build a reusable compensation template with predefined component formulas and breakdown rules.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">1. Structure Identity</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Structure Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Corporate Band A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Code Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. STD_CORP"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Baseline Annual CTC (₹)
                </label>
                <input
                  type="number"
                  placeholder="600000"
                  value={annualCtc}
                  onChange={(e) => setAnnualCtc(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-400">Used as reference calculation benchmark</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Applicable to full-time engineering and product teams"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="font-medium">
                  Set as default salary structure for newly hired employees
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Component Mapping */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  2. Mapped Salary Components ({mappedComponents.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Components calculate in order of sequence. Formulas can reference earlier components.
                </p>
              </div>

              {/* Add Component Dropdown */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    const comp = availableComponents.find((c) => c.id === e.target.value);
                    if (comp) addComponent(comp);
                    e.target.value = '';
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-900 text-white font-medium rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <option value="">+ Add Component</option>
                  {availableComponents
                    .filter((c) => !mappedComponents.some((m) => m.salaryComponentId === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.componentCode}) - {c.componentType}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {mappedComponents.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                No components added. Use the &quot;+ Add Component&quot; button above.
              </div>
            ) : (
              <div className="space-y-3">
                {mappedComponents.map((item, idx) => {
                  const comp = availableComponents.find((c) => c.id === item.salaryComponentId);
                  return (
                    <div
                      key={item.salaryComponentId}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/75 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900">
                            {comp?.name || 'Component'}
                          </span>
                          <span className="ml-2 font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                            {comp?.componentCode}
                          </span>
                          <span
                            className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              comp?.componentType === 'EARNING'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {comp?.componentType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-slate-500 text-[11px]">
                          Default:{' '}
                          <span className="font-mono font-medium text-slate-800">
                            {comp?.calculationType === 'FIXED_AMOUNT'
                              ? `₹ ${Number(comp?.amount || 0).toLocaleString('en-IN')}`
                              : comp?.calculationType?.startsWith('PERCENTAGE')
                              ? `${comp?.percentage}%`
                              : comp?.calculationType === 'FORMULA_BASED'
                              ? comp?.formula
                              : 'Attendance'}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={() => removeComponent(item.salaryComponentId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Link
              href="/payroll/salary-structures"
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving Structure...' : 'Save Salary Structure'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
