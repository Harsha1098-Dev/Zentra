'use client';

import React, { useEffect, useState } from 'react';
import { PayrollNav } from '../../payroll-nav';
import { StatutoryNav } from '../statutory-nav';
import { ApiClient } from '../../../../lib/api';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StatutorySettingsPage() {
  const [formData, setFormData] = useState({
    financialYear: '2025-2026',
    defaultTaxRegime: 'NEW_REGIME',
    panNumber: '',
    tanNumber: '',
    tdsCircle: '',
    pfEnabled: true,
    pfEstablishmentCode: '',
    esiEnabled: true,
    esiEstablishmentCode: '',
    ptEnabled: true,
    lwfEnabled: true,
    isDeclarationWindowOpen: true,
    isProofSubmissionOpen: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await ApiClient.request('/payroll/statutory-settings');
        if (data) {
          setFormData({
            financialYear: data.financialYear || '2025-2026',
            defaultTaxRegime: data.defaultTaxRegime || 'NEW_REGIME',
            panNumber: data.panNumber || '',
            tanNumber: data.tanNumber || '',
            tdsCircle: data.tdsCircle || '',
            pfEnabled: data.pfEnabled ?? true,
            pfEstablishmentCode: data.pfEstablishmentCode || '',
            esiEnabled: data.esiEnabled ?? true,
            esiEstablishmentCode: data.esiEstablishmentCode || '',
            ptEnabled: data.ptEnabled ?? true,
            lwfEnabled: data.lwfEnabled ?? true,
            isDeclarationWindowOpen: data.isDeclarationWindowOpen ?? true,
            isProofSubmissionOpen: data.isProofSubmissionOpen ?? false,
          });
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load statutory settings' });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await ApiClient.request('/payroll/statutory-settings', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setFeedback({ type: 'success', message: 'Statutory settings saved successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statutory Configuration</h1>
              <p className="text-sm text-gray-500">Corporate tax identifiers, default regime, and compliance windows</p>
            </div>
          </div>
        </div>

        <StatutoryNav />

        {feedback && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center space-x-3 ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-8 space-y-8">
          {/* Section: Tax Identifiers */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Corporate Tax Identifiers</h2>
            <p className="text-sm text-gray-500 mb-4">Required for Form 16, Form 24Q TDS filing, and official challans.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  name="financialYear"
                  value={formData.financialYear}
                  onChange={handleChange}
                  placeholder="2025-2026"
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="AAACZ1234D"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 uppercase focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Tax Deduction Account Number (TAN)
                </label>
                <input
                  type="text"
                  name="tanNumber"
                  value={formData.tanNumber}
                  onChange={handleChange}
                  placeholder="BLRZ01234E"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 uppercase focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  TDS Circle / Ward
                </label>
                <input
                  type="text"
                  name="tdsCircle"
                  value={formData.tdsCircle}
                  onChange={handleChange}
                  placeholder="Circle 2(1), Bengaluru"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Default Organization Tax Regime
                </label>
                <select
                  name="defaultTaxRegime"
                  value={formData.defaultTaxRegime}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="NEW_REGIME">New Tax Regime (Section 115BAC) - Default</option>
                  <option value="OLD_REGIME">Old Tax Regime (With Chapter VI-A Deductions)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Statutory Components Activation</h2>
            <p className="text-sm text-gray-500 mb-4">Toggle statutory deductions and enter establishment registration codes.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Employees Provident Fund (EPF)</span>
                  <input
                    type="checkbox"
                    name="pfEnabled"
                    checked={formData.pfEnabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                <input
                  type="text"
                  name="pfEstablishmentCode"
                  value={formData.pfEstablishmentCode}
                  onChange={handleChange}
                  placeholder="EPFO Establishment Code (e.g. MH/BAN/0012345/000)"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Employee State Insurance (ESI)</span>
                  <input
                    type="checkbox"
                    name="esiEnabled"
                    checked={formData.esiEnabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                <input
                  type="text"
                  name="esiEstablishmentCode"
                  value={formData.esiEstablishmentCode}
                  onChange={handleChange}
                  placeholder="ESIC Employer Code (17 digits)"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900 block">Professional Tax (PT)</span>
                  <span className="text-xs text-gray-500">Enable state-specific salary tax deductions</span>
                </div>
                <input
                  type="checkbox"
                  name="ptEnabled"
                  checked={formData.ptEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900 block">Labour Welfare Fund (LWF)</span>
                  <span className="text-xs text-gray-500">Enable state welfare fund deductions</span>
                </div>
                <input
                  type="checkbox"
                  name="lwfEnabled"
                  checked={formData.lwfEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Employee Self-Service Windows</h2>
            <p className="text-sm text-gray-500 mb-4">Control open windows for provisional investment declarations and proof submission.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="isDeclarationWindowOpen"
                  checked={formData.isDeclarationWindowOpen}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">Open Investment Declarations Window</span>
                  <span className="text-xs text-gray-500">Employees can declare planned 80C, 80D, HRA for projected TDS calculation.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="isProofSubmissionOpen"
                  checked={formData.isProofSubmissionOpen}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">Open Investment Proof Submission Window</span>
                  <span className="text-xs text-gray-500">Employees can upload receipts and certificates for HR review and verification.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
