'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import { Scale, Plus, Trash2, Edit2, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfessionalTaxManagerPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // New Rule Modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleData, setNewRuleData] = useState({ state: '', stateCode: '', registrationNumber: '' });

  // New Slab Modal
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [newSlabData, setNewSlabData] = useState({
    minSalary: 0,
    maxSalary: '',
    taxAmount: 200,
    gender: 'ALL',
    specificMonth: '',
    specificMonthAmount: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRules = async () => {
    try {
      const data = await ApiClient.request('/payroll/statutory/professional-tax');
      setRules(data || []);
      if (data && data.length > 0 && !selectedRuleId) {
        setSelectedRuleId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load PT rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request('/payroll/statutory/professional-tax', {
        method: 'POST',
        body: JSON.stringify(newRuleData),
      });
      setShowRuleModal(false);
      setNewRuleData({ state: '', stateCode: '', registrationNumber: '' });
      setFeedback({ type: 'success', message: 'Professional Tax rule created successfully!' });
      await loadRules();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create rule' });
    }
  };

  const handleAddSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleId) return;

    try {
      await ApiClient.request(`/payroll/statutory/professional-tax/${selectedRuleId}/slabs`, {
        method: 'POST',
        body: JSON.stringify({
          minSalary: Number(newSlabData.minSalary),
          maxSalary: newSlabData.maxSalary ? Number(newSlabData.maxSalary) : null,
          taxAmount: Number(newSlabData.taxAmount),
          gender: newSlabData.gender,
          specificMonth: newSlabData.specificMonth ? Number(newSlabData.specificMonth) : null,
          specificMonthAmount: newSlabData.specificMonthAmount ? Number(newSlabData.specificMonthAmount) : null,
        }),
      });
      setShowSlabModal(false);
      setNewSlabData({
        minSalary: 0,
        maxSalary: '',
        taxAmount: 200,
        gender: 'ALL',
        specificMonth: '',
        specificMonthAmount: '',
      });
      setFeedback({ type: 'success', message: 'Tax slab added successfully!' });
      await loadRules();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add slab' });
    }
  };

  const handleDeleteSlab = async (slabId: string) => {
    if (!confirm('Are you sure you want to delete this slab?')) return;
    try {
      await ApiClient.request(`/payroll/statutory/professional-tax/slabs/${slabId}`, {
        method: 'DELETE',
      });
      setFeedback({ type: 'success', message: 'Slab deleted successfully!' });
      await loadRules();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete slab' });
    }
  };

  const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Professional Tax (State Slabs)</h1>
              <p className="text-sm text-gray-500">Configure state-wise monthly wage brackets and tax deductions</p>
            </div>
          </div>
          <button
            onClick={() => setShowRuleModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add State Rule</span>
          </button>
        </div>

        <StatutoryNav />

        {feedback && (
          <div className={`p-4 rounded-xl mb-6 flex items-center space-x-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* State Rules List */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-1">States Configured</h2>
            {rules.map((rule) => (
              <button
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedRuleId === rule.id
                    ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div>
                  <span className="font-semibold block">{rule.state}</span>
                  <span className="text-xs text-gray-500">Code: {rule.stateCode}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {rule.slabs?.length || 0} slabs
                </span>
              </button>
            ))}
          </div>

          {/* Slabs Detail Panel */}
          <div className="lg:col-span-3">
            {selectedRule ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedRule.state} Professional Tax Slabs</h2>
                    <p className="text-xs text-gray-500">
                      State Code: <span className="font-semibold">{selectedRule.stateCode}</span> | Deduction: {selectedRule.deductionFrequency}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSlabModal(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center space-x-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Slab</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Salary Range</th>
                        <th className="py-2.5 px-3">Gender</th>
                        <th className="py-2.5 px-3">Standard Monthly Tax</th>
                        <th className="py-2.5 px-3">Special Month Override</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedRule.slabs?.map((slab: any) => (
                        <tr key={slab.id} className="hover:bg-blue-50/30">
                          <td className="py-3 px-3 font-medium text-gray-900">
                            ₹{slab.minSalary.toLocaleString()} - {slab.maxSalary ? `₹${slab.maxSalary.toLocaleString()}` : 'Above'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                              {slab.gender}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-blue-700 text-sm">
                            ₹{slab.taxAmount} / month
                          </td>
                          <td className="py-3 px-3">
                            {slab.specificMonth ? (
                              <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Month {slab.specificMonth}: ₹{slab.specificMonthAmount}
                              </span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteSlab(slab.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
                No Professional Tax rule selected
              </div>
            )}
          </div>
        </div>

        {/* Add State Rule Modal */}
        {showRuleModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add State Professional Tax Rule</h3>
              <form onSubmit={handleCreateRule} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">State Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tamil Nadu"
                    value={newRuleData.state}
                    onChange={(e) => setNewRuleData({ ...newRuleData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">State Code (2 Letters)</label>
                  <input
                    type="text"
                    required
                    placeholder="TN"
                    maxLength={5}
                    value={newRuleData.stateCode}
                    onChange={(e) => setNewRuleData({ ...newRuleData, stateCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">PT Registration Number</label>
                  <input
                    type="text"
                    placeholder="Optional Registration No"
                    value={newRuleData.registrationNumber}
                    onChange={(e) => setNewRuleData({ ...newRuleData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Create Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Slab Modal */}
        {showSlabModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Salary Slab for {selectedRule?.state}</h3>
              <form onSubmit={handleAddSlab} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Min Salary (₹)</label>
                    <input
                      type="number"
                      required
                      value={newSlabData.minSalary}
                      onChange={(e) => setNewSlabData({ ...newSlabData, minSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Max Salary (₹)</label>
                    <input
                      type="number"
                      placeholder="Blank for above"
                      value={newSlabData.maxSalary}
                      onChange={(e) => setNewSlabData({ ...newSlabData, maxSalary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tax Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={newSlabData.taxAmount}
                      onChange={(e) => setNewSlabData({ ...newSlabData, taxAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Gender</label>
                    <select
                      value={newSlabData.gender}
                      onChange={(e) => setNewSlabData({ ...newSlabData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="ALL">All Genders</option>
                      <option value="MALE">Male Only</option>
                      <option value="FEMALE">Female Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Special Month</label>
                    <input
                      type="number"
                      placeholder="e.g. 2 for Feb"
                      value={newSlabData.specificMonth}
                      onChange={(e) => setNewSlabData({ ...newSlabData, specificMonth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Special Tax Amount</label>
                    <input
                      type="number"
                      placeholder="e.g. 300"
                      value={newSlabData.specificMonthAmount}
                      onChange={(e) => setNewSlabData({ ...newSlabData, specificMonthAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSlabModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Add Slab
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
