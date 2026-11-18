'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../payroll-nav';
import { useAuth } from '../../../context/auth-context';
import { ApiClient } from '../../../lib/api';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  Play,
} from 'lucide-react';
import {
  SalaryComponentType,
  CalculationType,
  PermissionCode,
} from '@zentra/shared-types';

export default function SalaryComponentsPage() {
  const { permissions, roles, activeOrganization } = useAuth();

  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<string>(SalaryComponentType.EARNING);
  const [formCalculationType, setFormCalculationType] = useState<string>(
    CalculationType.FIXED_AMOUNT,
  );
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formPercentage, setFormPercentage] = useState<number | ''>('');
  const [formFormula, setFormFormula] = useState('');
  const [formIsTaxable, setFormIsTaxable] = useState(true);
  const [formIncludeInCtc, setFormIncludeInCtc] = useState(true);
  const [formIncludeInGross, setFormIncludeInGross] = useState(true);

  // Formula tester state
  const [testBasic, setTestBasic] = useState(50000);
  const [testGross, setTestGross] = useState(75000);
  const [testResult, setTestResult] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const canManage =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_SALARY_COMPONENT_CREATE);

  async function loadComponents() {
    try {
      setLoading(true);
      const data = await ApiClient.get('/payroll/salary-components');
      setComponents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load components', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization) {
      loadComponents();
    }
  }, [activeOrganization]);

  function runFormulaTest() {
    try {
      setTestError(null);
      if (!formFormula.trim()) {
        setTestError('Please enter a formula');
        return;
      }

      // Simple client-side preview evaluation
      let expr = formFormula.trim();
      expr = expr.replace(/BASIC/g, String(testBasic));
      expr = expr.replace(/GROSS/g, String(testGross));
      expr = expr.replace(/CTC/g, String(testGross * 1.2));

      // Sanitize tokens
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
        setTestError('Formula contains unsupported syntax or variables in preview');
        return;
      }

      // Safe arithmetic evaluator
      const res = Function(`'use strict'; return (${expr})`)();
      setTestResult(Number(res.toFixed(2)));
    } catch (e: any) {
      setTestError(e.message || 'Invalid formula');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const payload: any = {
        name: formName.trim(),
        componentCode: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        componentType: formType,
        calculationType: formCalculationType,
        isTaxable: formIsTaxable,
        includeInCtc: formIncludeInCtc,
        includeInGross: formIncludeInGross,
      };

      if (formCalculationType === CalculationType.FIXED_AMOUNT) {
        payload.amount = Number(formAmount) || 0;
      } else if (
        [
          CalculationType.PERCENTAGE_OF_BASIC,
          CalculationType.PERCENTAGE_OF_GROSS,
          CalculationType.PERCENTAGE_OF_CTC,
        ].includes(formCalculationType as any)
      ) {
        payload.percentage = Number(formPercentage) || 0;
      } else if (formCalculationType === CalculationType.FORMULA_BASED) {
        payload.formula = formFormula.trim();
      }

      await ApiClient.post('/payroll/salary-components', payload);
      setShowModal(false);
      resetForm();
      await loadComponents();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create salary component');
    } finally {
      setModalLoading(false);
    }
  }

  function resetForm() {
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormType(SalaryComponentType.EARNING);
    setFormCalculationType(CalculationType.FIXED_AMOUNT);
    setFormAmount('');
    setFormPercentage('');
    setFormFormula('');
    setFormIsTaxable(true);
    setFormIncludeInCtc(true);
    setFormIncludeInGross(true);
    setTestResult(null);
    setTestError(null);
  }

  const filteredComponents = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.componentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === 'ALL' || c.componentType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Salary Components
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure earnings, statutory deductions, employer contributions, and mathematical formulas.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Component</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or code (e.g. BASIC)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            {['ALL', 'EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedType === type
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading salary components...</div>
          ) : filteredComponents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">No components found</h4>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm ? 'Try adjusting your search query' : 'Create standard components like BASIC, HRA, and PF.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-6">Component</th>
                    <th className="py-3 px-6">Code</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Calculation</th>
                    <th className="py-3 px-6">Rule / Value</th>
                    <th className="py-3 px-6">Taxable</th>
                    <th className="py-3 px-6">In CTC</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredComponents.map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        {comp.name}
                        {comp.description && (
                          <div className="text-[11px] text-slate-400 font-normal">{comp.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-700">
                        {comp.componentCode}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            comp.componentType === 'EARNING'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : comp.componentType === 'DEDUCTION'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {comp.componentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {comp.calculationType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-700">
                        {comp.calculationType === 'FIXED_AMOUNT'
                          ? `₹ ${Number(comp.amount || 0).toLocaleString('en-IN')}`
                          : comp.calculationType.startsWith('PERCENTAGE')
                          ? `${comp.percentage}%`
                          : comp.calculationType === 'FORMULA_BASED'
                          ? comp.formula || 'Formula'
                          : 'Attendance Driven'}
                      </td>
                      <td className="py-3.5 px-6">
                        {comp.isTaxable ? (
                          <span className="text-slate-700">Yes</span>
                        ) : (
                          <span className="text-slate-400">Exempt</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        {comp.includeInCtc ? (
                          <span className="text-emerald-700 font-medium">Included</span>
                        ) : (
                          <span className="text-slate-400">Excluded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            comp.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {comp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Salary Component */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                New Salary Component
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Component Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basic Salary"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Component Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BASIC"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Component Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value={SalaryComponentType.EARNING}>EARNING</option>
                    <option value={SalaryComponentType.DEDUCTION}>DEDUCTION</option>
                    <option value={SalaryComponentType.EMPLOYER_CONTRIBUTION}>
                      EMPLOYER_CONTRIBUTION
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calculation Type *
                  </label>
                  <select
                    value={formCalculationType}
                    onChange={(e) => setFormCalculationType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value={CalculationType.FIXED_AMOUNT}>FIXED_AMOUNT</option>
                    <option value={CalculationType.PERCENTAGE_OF_BASIC}>
                      PERCENTAGE_OF_BASIC
                    </option>
                    <option value={CalculationType.PERCENTAGE_OF_GROSS}>
                      PERCENTAGE_OF_GROSS
                    </option>
                    <option value={CalculationType.PERCENTAGE_OF_CTC}>
                      PERCENTAGE_OF_CTC
                    </option>
                    <option value={CalculationType.FORMULA_BASED}>
                      FORMULA_BASED
                    </option>
                    <option value={CalculationType.ATTENDANCE_BASED}>
                      ATTENDANCE_BASED
                    </option>
                  </select>
                </div>
              </div>

              {/* Dynamic Value Input */}
              {formCalculationType === CalculationType.FIXED_AMOUNT && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fixed Monthly Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="25000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              )}

              {[
                CalculationType.PERCENTAGE_OF_BASIC,
                CalculationType.PERCENTAGE_OF_GROSS,
                CalculationType.PERCENTAGE_OF_CTC,
              ].includes(formCalculationType as any) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Percentage (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    placeholder="40"
                    value={formPercentage}
                    onChange={(e) =>
                      setFormPercentage(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              )}

              {formCalculationType === CalculationType.FORMULA_BASED && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Formula Expression *
                      </label>
                      <span className="text-[10px] text-slate-400">e.g. BASIC * 0.4 + 500</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="BASIC * 0.4"
                      value={formFormula}
                      onChange={(e) => setFormFormula(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    />
                  </div>

                  {/* Formula Sandbox Tester */}
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-2">
                      <span>Formula Preview Sandbox</span>
                      <button
                        type="button"
                        onClick={runFormulaTest}
                        className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-[11px]"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run Test</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <span className="text-[10px] text-slate-500">Test BASIC:</span>
                        <input
                          type="number"
                          value={testBasic}
                          onChange={(e) => setTestBasic(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Test GROSS:</span>
                        <input
                          type="number"
                          value={testGross}
                          onChange={(e) => setTestGross(Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                    </div>

                    {testResult !== null && (
                      <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-mono text-xs">
                        Calculated: ₹ {testResult.toLocaleString('en-IN')}
                      </div>
                    )}
                    {testError && (
                      <div className="p-2 rounded bg-rose-50 text-rose-700 text-xs">
                        {testError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formIsTaxable}
                    onChange={(e) => setFormIsTaxable(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">Taxable Component (subject to TDS/IT deductions)</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formIncludeInCtc}
                    onChange={(e) => setFormIncludeInCtc(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">Include in Cost to Company (CTC)</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formIncludeInGross}
                    onChange={(e) => setFormIncludeInGross(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-slate-700">Include in Gross Pay calculation</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {modalLoading ? 'Creating...' : 'Create Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
