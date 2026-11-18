'use client';

import React, { useEffect, useState } from 'react';
import { LeaveNav } from '../leave-nav';
import { ApiClient } from '../../../lib/api';
import {
  Settings,
  PlusCircle,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Power,
  Edit2,
  X,
  UserCheck,
} from 'lucide-react';
import {
  LeaveTypeDto,
  LeavePolicyDto,
  LeaveCategory,
} from '@zentra/shared-types';

export default function LeaveSettingsPage() {
  const [activeTab, setActiveTab] = useState<'types' | 'policies' | 'adjustment'>('types');
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);
  const [policies, setPolicies] = useState<LeavePolicyDto[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create Leave Type Modal
  const [createTypeModalOpen, setCreateTypeModalOpen] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeCategory, setTypeCategory] = useState<LeaveCategory>(LeaveCategory.EARNED_LEAVE);
  const [typeIsPaid, setTypeIsPaid] = useState(true);
  const [typeAllowsHalfDay, setTypeAllowsHalfDay] = useState(true);
  const [typeAllowsNegative, setTypeAllowsNegative] = useState(false);
  const [typeRequiresApproval, setTypeRequiresApproval] = useState(true);
  const [typeRequiresAttachment, setTypeRequiresAttachment] = useState(false);
  const [typeAttachmentDays, setTypeAttachmentDays] = useState('3');
  const [typeColor, setTypeColor] = useState('#1E3A8A');

  // Create Leave Policy Modal
  const [createPolicyModalOpen, setCreatePolicyModalOpen] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyLeaveTypeId, setPolicyLeaveTypeId] = useState('');
  const [policyAnnualEntitlement, setPolicyAnnualEntitlement] = useState('24');
  const [policyAccrualFrequency, setPolicyAccrualFrequency] = useState('yearly');
  const [policyProbationEligible, setPolicyProbationEligible] = useState(true);
  const [policyAllowCarryForward, setPolicyAllowCarryForward] = useState(false);
  const [policyCarryForwardLimit, setPolicyCarryForwardLimit] = useState('10');
  const [policyAllowEncashment, setPolicyAllowEncashment] = useState(false);
  const [policyEncashmentLimit, setPolicyEncashmentLimit] = useState('15');

  // Manual Balance Adjustment Form
  const [adjEmployeeId, setAdjEmployeeId] = useState('');
  const [adjLeaveTypeId, setAdjLeaveTypeId] = useState('');
  const [adjYear, setAdjYear] = useState(new Date().getFullYear().toString());
  const [adjAmount, setAdjAmount] = useState('1');
  const [adjReason, setAdjReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    loadSettingsData();
  }, [activeTab]);

  async function loadSettingsData() {
    setIsLoading(true);
    setError(null);
    try {
      const [typesRes, policiesRes, empsRes] = await Promise.all([
        ApiClient.request<{ data: LeaveTypeDto[] }>('/leave-types?limit=100'),
        ApiClient.request<{ data: LeavePolicyDto[] }>('/leave-policies?limit=100').catch(() => ({ data: [] })),
        ApiClient.request<{ data: any[] }>('/employees?limit=100').catch(() => ({ data: [] })),
      ]);
      setLeaveTypes(typesRes.data || []);
      setPolicies(policiesRes.data || []);
      setEmployees(empsRes.data || []);

      if (typesRes.data && typesRes.data.length > 0 && !policyLeaveTypeId) {
        setPolicyLeaveTypeId(typesRes.data[0].id);
        setAdjLeaveTypeId(typesRes.data[0].id);
      }
      if (empsRes.data && empsRes.data.length > 0 && !adjEmployeeId) {
        setAdjEmployeeId(empsRes.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateType(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await ApiClient.request('/leave-types', {
        method: 'POST',
        body: JSON.stringify({
          name: typeName,
          code: typeCode.toUpperCase(),
          category: typeCategory,
          isPaid: typeIsPaid,
          allowsHalfDay: typeAllowsHalfDay,
          allowsNegativeBalance: typeAllowsNegative,
          requiresApproval: typeRequiresApproval,
          requiresAttachment: typeRequiresAttachment,
          attachmentRequiredDays: typeRequiresAttachment ? parseInt(typeAttachmentDays, 10) : 0,
          color: typeColor,
        }),
      });

      setSuccess('Leave type created successfully!');
      setCreateTypeModalOpen(false);
      setTypeName('');
      setTypeCode('');
      setTimeout(() => setSuccess(null), 3000);
      loadSettingsData();
    } catch (err: any) {
      setError(err.message || 'Failed to create leave type');
    }
  }

  async function handleToggleType(type: LeaveTypeDto) {
    try {
      const action = type.isActive ? 'deactivate' : 'activate';
      await ApiClient.request(`/leave-types/${type.id}/${action}`, {
        method: 'PATCH',
      });
      loadSettingsData();
    } catch (err: any) {
      setError(err.message || 'Failed to update leave type status');
    }
  }

  async function handleDeleteType(id: string) {
    if (!confirm('Are you sure you want to delete this leave type?')) return;
    try {
      await ApiClient.request(`/leave-types/${id}`, {
        method: 'DELETE',
      });
      setSuccess('Leave type removed successfully.');
      setTimeout(() => setSuccess(null), 3000);
      loadSettingsData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete leave type');
    }
  }

  async function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await ApiClient.request('/leave-policies', {
        method: 'POST',
        body: JSON.stringify({
          name: policyName,
          leaveTypeId: policyLeaveTypeId,
          annualEntitlement: parseFloat(policyAnnualEntitlement),
          accrualFrequency: policyAccrualFrequency,
          probationEligibility: policyProbationEligible,
          allowCarryForward: policyAllowCarryForward,
          carryForwardLimit: policyAllowCarryForward ? parseFloat(policyCarryForwardLimit) : null,
          allowEncashment: policyAllowEncashment,
          encashmentLimit: policyAllowEncashment ? parseFloat(policyEncashmentLimit) : null,
        }),
      });

      setSuccess('Leave policy created successfully!');
      setCreatePolicyModalOpen(false);
      setPolicyName('');
      setTimeout(() => setSuccess(null), 3000);
      loadSettingsData();
    } catch (err: any) {
      setError(err.message || 'Failed to create policy');
    }
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsAdjusting(true);
    try {
      if (!adjEmployeeId) throw new Error('Please select an employee');
      if (!adjLeaveTypeId) throw new Error('Please select a leave type');
      if (!adjReason.trim()) throw new Error('Please provide an adjustment reason');

      await ApiClient.request(`/leave-balances/employees/${adjEmployeeId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: adjLeaveTypeId,
          year: parseInt(adjYear, 10),
          adjustmentAmount: parseFloat(adjAmount),
          reason: adjReason,
        }),
      });

      setSuccess('Leave balance adjusted successfully and recorded in audit ledger.');
      setAdjReason('');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to adjust balance');
    } finally {
      setIsAdjusting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeaveNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Policy & Quota Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure organization leave types, entitlement policies, accrual rules, and perform manual adjustments.
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('types')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'types'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Types
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'policies'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Policies
          </button>
          <button
            onClick={() => setActiveTab('adjustment')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'adjustment'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Manual Balance Adjustment
          </button>
        </div>

        {/* Tab 1: Leave Types */}
        {activeTab === 'types' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Configured Leave Types</h3>
                <p className="text-xs text-slate-500 mt-0.5">Active categories applicable across your organization</p>
              </div>
              <button
                onClick={() => setCreateTypeModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Leave Type</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Paid / Unpaid</th>
                    <th className="px-5 py-3.5">Half Day</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leaveTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color || '#3B82F6' }} />
                        <span>{type.name}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 font-semibold">{type.code}</td>
                      <td className="px-5 py-3.5 capitalize text-slate-600">{type.category.replace('_', ' ')}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            type.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {type.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{type.allowsHalfDay ? 'Allowed' : 'Disabled'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            type.isActive ? 'bg-blue-50 text-[#1E3A8A]' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {type.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleType(type)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          {type.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Leave Policies */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Configured Leave Policies</h3>
                <p className="text-xs text-slate-500 mt-0.5">Rules governing annual entitlement, accrual & rollover</p>
              </div>
              <button
                onClick={() => setCreatePolicyModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Leave Policy</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Policy Name</th>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5 text-right">Annual Entitlement</th>
                    <th className="px-5 py-3.5">Accrual</th>
                    <th className="px-5 py-3.5">Carry Forward</th>
                    <th className="px-5 py-3.5">Encashment</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {policies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{p.leaveTypeName || '—'}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-800">{p.annualEntitlement} days</td>
                      <td className="px-5 py-3.5 capitalize text-slate-600">{p.accrualFrequency}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.allowCarryForward ? `Max ${p.carryForwardLimit || '∞'} days` : 'Disabled'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.allowEncashment ? `Max ${p.encashmentLimit || '∞'} days` : 'Disabled'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Manual Balance Adjustment */}
        {activeTab === 'adjustment' && (
          <div className="max-w-xl bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Perform Manual Balance Adjustment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Grant or deduct leave days for a specific employee. All adjustments are permanently logged in the audit trail.
              </p>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Employee *</label>
                <select
                  value={adjEmployeeId}
                  onChange={(e) => setAdjEmployeeId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Leave Type *</label>
                  <select
                    value={adjLeaveTypeId}
                    onChange={(e) => setAdjLeaveTypeId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    required
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Year *</label>
                  <input
                    type="number"
                    value={adjYear}
                    onChange={(e) => setAdjYear(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Adjustment Amount (Days) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="e.g. 2 for credit, -1.5 for deduction"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                />
                <span className="text-[10px] text-slate-400">Use positive numbers to add days, negative to deduct</span>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Reason / Justification *</label>
                <textarea
                  rows={3}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Compensation for off-site conference, rollover discrepancy correction..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isAdjusting}
                className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isAdjusting ? 'Adjusting Balance...' : 'Apply Balance Adjustment'}
              </button>
            </form>
          </div>
        )}

        {/* Modal: Create Leave Type */}
        {createTypeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Create New Leave Type</h3>
                <button onClick={() => setCreateTypeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateType} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Type Name *</label>
                  <input
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="e.g. Paternity Leave"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Code *</label>
                    <input
                      type="text"
                      value={typeCode}
                      onChange={(e) => setTypeCode(e.target.value)}
                      placeholder="e.g. PL"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Category *</label>
                    <select
                      value={typeCategory}
                      onChange={(e) => setTypeCategory(e.target.value as LeaveCategory)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="earned_leave">Earned Leave</option>
                      <option value="sick_leave">Sick Leave</option>
                      <option value="casual_leave">Casual Leave</option>
                      <option value="maternity_leave">Maternity Leave</option>
                      <option value="paternity_leave">Paternity Leave</option>
                      <option value="compensatory_off">Compensatory Off</option>
                      <option value="loss_of_pay">Loss of Pay</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeIsPaid}
                      onChange={(e) => setTypeIsPaid(e.target.checked)}
                      className="text-[#1E3A8A] rounded"
                    />
                    <span className="text-slate-700">Paid Leave (No salary deduction)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeAllowsHalfDay}
                      onChange={(e) => setTypeAllowsHalfDay(e.target.checked)}
                      className="text-[#1E3A8A] rounded"
                    />
                    <span className="text-slate-700">Allow Half-Day Applications</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeAllowsNegative}
                      onChange={(e) => setTypeAllowsNegative(e.target.checked)}
                      className="text-[#1E3A8A] rounded"
                    />
                    <span className="text-slate-700">Allow Negative Balance (Overdraft)</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateTypeModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg font-semibold">
                    Create Leave Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Leave Policy */}
        {createPolicyModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Create New Leave Policy</h3>
                <button onClick={() => setCreatePolicyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePolicy} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Policy Name *</label>
                  <input
                    type="text"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="e.g. Standard Full-Time Policy"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Applicable Leave Type *</label>
                  <select
                    value={policyLeaveTypeId}
                    onChange={(e) => setPolicyLeaveTypeId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    required
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Annual Quota (Days) *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={policyAnnualEntitlement}
                      onChange={(e) => setPolicyAnnualEntitlement(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Accrual Frequency *</label>
                    <select
                      value={policyAccrualFrequency}
                      onChange={(e) => setPolicyAccrualFrequency(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="yearly">Yearly (Upfront)</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyProbationEligible}
                      onChange={(e) => setPolicyProbationEligible(e.target.checked)}
                      className="text-[#1E3A8A] rounded"
                    />
                    <span className="text-slate-700">Eligible During Probation</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyAllowCarryForward}
                      onChange={(e) => setPolicyAllowCarryForward(e.target.checked)}
                      className="text-[#1E3A8A] rounded"
                    />
                    <span className="text-slate-700">Allow Year-End Carry Forward</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyAllowEncashment}
                      onChange={(e) => setPolicyAllowEncashment(e.target.checked)}
                      className="text-[#1E3A8A] rounded"
                    />
                    <span className="text-slate-700">Allow Encashment of Unused Leaves</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreatePolicyModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg font-semibold">
                    Create Policy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
