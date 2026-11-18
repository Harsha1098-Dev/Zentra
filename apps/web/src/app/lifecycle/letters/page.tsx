'use client';

import React, { useEffect, useState } from 'react';
import { LifecycleNav } from '../lifecycle-nav';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  FileText,
  PlusCircle,
  Download,
  Eye,
  CheckCircle2,
  Trash2,
  Filter,
} from 'lucide-react';
import { LifecycleLetterType } from '@zentra/shared-types';

export default function LettersPage() {
  const { activeOrganization } = useAuth();
  const [letters, setLetters] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [letterType, setLetterType] = useState<LifecycleLetterType>(LifecycleLetterType.APPOINTMENT);
  const [isShared, setIsShared] = useState(true);
  const [genLoading, setGenLoading] = useState(false);

  // Preview modal
  const [previewData, setPreviewData] = useState<{ title: string; html: string } | null>(null);

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lData, empData] = await Promise.all([
        ApiClient.get('/letters').catch(() => []),
        ApiClient.get('/employees').catch(() => []),
      ]);
      setLetters(Array.isArray(lData) ? lData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setGenLoading(true);
    try {
      await ApiClient.post('/letters/generate', {
        employeeId,
        letterType,
        isSharedWithEmployee: isShared,
      });

      setShowGenerateModal(false);
      setEmployeeId('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate letter');
    } finally {
      setGenLoading(false);
    }
  };

  const handleDownload = async (id: string, title: string) => {
    try {
      const res = await ApiClient.get(`/letters/${id}/download`);
      if (res.html) {
        // Open printable window
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(res.html);
          win.document.close();
          win.print();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to download letter');
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const res = await ApiClient.get(`/letters/${id}/download`);
      setPreviewData({ title: res.letter.title, html: res.html });
    } catch (err: any) {
      alert(err.message || 'Failed to preview letter');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <LifecycleNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Official Letters & Document Issuance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated document generation with dynamic employee, designation, and salary interpolation for offer, appointment, relieving & experience certificates.
            </p>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Letter</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Loading letters...
          </div>
        ) : letters.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No official letters generated</h3>
            <p className="text-xs text-slate-500 mt-1">Generate offer, appointment, relieving, or experience certificates.</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="mt-4 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Generate First Letter
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Title / Type</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Shared with Employee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {letters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{l.title}</div>
                      <div className="text-[11px] text-blue-600 font-medium">{l.letterType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {l.employee?.firstName} {l.employee?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {l.employee?.employeeCode} • {l.employee?.department?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(l.issuedDate || l.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {l.isSharedWithEmployee ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Visible in Portal
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Internal Only
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(l.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(l.id, l.title)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Print / Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Generate Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Generate Official Letter</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Select employee and letter template. Dynamic placeholders will be resolved automatically.
              </p>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee *
                  </label>
                  <select
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Letter Type *
                  </label>
                  <select
                    value={letterType}
                    onChange={(e: any) => setLetterType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={LifecycleLetterType.APPOINTMENT}>Appointment Letter</option>
                    <option value={LifecycleLetterType.OFFER}>Offer Letter</option>
                    <option value={LifecycleLetterType.CONFIRMATION}>Probation Confirmation Letter</option>
                    <option value={LifecycleLetterType.PROMOTION}>Promotion Letter</option>
                    <option value={LifecycleLetterType.INCREMENT}>Salary Increment Letter</option>
                    <option value={LifecycleLetterType.TRANSFER}>Internal Transfer Letter</option>
                    <option value={LifecycleLetterType.RELIEVING}>Relieving Letter</option>
                    <option value={LifecycleLetterType.EXPERIENCE}>Certificate of Experience</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Make visible in Employee Self-Service portal</span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={genLoading}
                    className="px-4 py-1.5 text-xs bg-[#1E3A8A] text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    {genLoading ? 'Generating...' : 'Generate Letter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewData && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{previewData.title}</h3>
                <button
                  onClick={() => setPreviewData(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <div
                  className="prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: previewData.html }}
                />
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-blue-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
