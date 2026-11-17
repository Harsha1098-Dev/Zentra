'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../../lib/api';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
} from 'lucide-react';
import { GradeDto, RecordStatus } from '@zentra/shared-types';

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeDto | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: 1,
    description: '',
  });

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    grade: GradeDto | null;
    action: 'activate' | 'deactivate';
  }>({
    open: false,
    grade: null,
    action: 'deactivate',
  });

  useEffect(() => {
    loadGrades();
  }, [statusFilter]);

  const loadGrades = async () => {
    setLoading(true);
    try {
      const queryParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const data = await ApiClient.request<GradeDto[]>(`/grades${queryParam}`);
      // Sort ascending by level
      data.sort((a, b) => a.level - b.level);
      setGrades(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load grades' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGrade(null);
    const nextLevel =
      grades.length > 0 ? Math.max(...grades.map((g) => g.level)) + 1 : 1;
    setFormData({
      name: '',
      code: '',
      level: nextLevel,
      description: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (grade: GradeDto) => {
    setEditingGrade(grade);
    setFormData({
      name: grade.name,
      code: grade.code,
      level: grade.level,
      description: grade.description || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    const parsedLevel = parseInt(formData.level as any, 10);
    if (isNaN(parsedLevel) || parsedLevel < 1) {
      setModalError('Grade level must be a positive integer greater than or equal to 1');
      setModalSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        level: parsedLevel,
        description: formData.description.trim() || undefined,
      };

      if (editingGrade) {
        await ApiClient.request<GradeDto>(`/grades/${editingGrade.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage({
          type: 'success',
          text: `Grade "${formData.name}" updated successfully.`,
        });
      } else {
        await ApiClient.request<GradeDto>('/grades', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage({
          type: 'success',
          text: `Grade "${formData.name}" created successfully.`,
        });
      }

      setIsModalOpen(false);
      await loadGrades();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save grade');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmDialog.grade) return;

    try {
      const endpoint =
        confirmDialog.action === 'activate'
          ? `/grades/${confirmDialog.grade.id}/activate`
          : `/grades/${confirmDialog.grade.id}/deactivate`;

      await ApiClient.request(endpoint, { method: 'PATCH' });
      setMessage({
        type: 'success',
        text: `Grade "${confirmDialog.grade.name}" ${
          confirmDialog.action === 'activate' ? 'activated' : 'deactivated'
        } successfully.`,
      });
      setConfirmDialog({ open: false, grade: null, action: 'deactivate' });
      await loadGrades();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update grade status' });
      setConfirmDialog({ open: false, grade: null, action: 'deactivate' });
    }
  };

  const filteredGrades = grades.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Employee Grades & Bands</h1>
          <p className="text-sm text-[#475569] mt-1">
            Establish seniority hierarchy levels (e.g. L1 Entry, L2 Mid, L3 Senior, L4 Director) for compensation and title bands.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Grade</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-[#059669] border-emerald-200'
              : 'bg-red-50 text-[#DC2626] border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-current hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search grades by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#64748B]">Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
          </div>
        ) : filteredGrades.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Layers className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-[#0F172A]">No grades defined</h3>
            <p className="text-xs text-[#475569] mt-1 max-w-sm mx-auto">
              Define compensation bands like Junior (Level 1), Mid (Level 2), Senior (Level 3), or Staff (Level 4).
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Grade</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569] uppercase">
                <tr>
                  <th className="px-6 py-3.5">Level Rank</th>
                  <th className="px-6 py-3.5">Grade Name</th>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-[#1E3A8A] border border-indigo-200 rounded-full font-bold text-xs">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Level {grade.level}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-[#0F172A]">
                      {grade.name}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded font-semibold text-[#1E3A8A]">
                        {grade.code}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-[#64748B] max-w-xs truncate">
                      {grade.description || '—'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          grade.status === RecordStatus.ACTIVE
                            ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                            : 'bg-slate-100 text-[#64748B] border-slate-200'
                        }`}
                      >
                        {grade.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(grade)}
                        className="p-1.5 text-[#475569] hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Grade"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            grade: grade,
                            action:
                              grade.status === RecordStatus.ACTIVE ? 'deactivate' : 'activate',
                          })
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          grade.status === RecordStatus.ACTIVE
                            ? 'text-[#DC2626] hover:bg-red-50'
                            : 'text-[#059669] hover:bg-emerald-50'
                        }`}
                        title={
                          grade.status === RecordStatus.ACTIVE ? 'Deactivate Grade' : 'Activate Grade'
                        }
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingGrade ? 'Edit Grade / Band' : 'Add New Grade / Band'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Grade Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Associate, Director"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Grade Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GR-L3, L3"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Hierarchy Level (Rank) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    1 = Entry level, 2+ = Senior ranks
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Salary band expectations, responsibility scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded-lg transition-colors disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : editingGrade ? 'Update Grade' : 'Create Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && confirmDialog.grade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">
              Confirm {confirmDialog.action === 'activate' ? 'Activation' : 'Deactivation'}
            </h3>
            <p className="text-xs text-[#475569]">
              Are you sure you want to {confirmDialog.action} grade{' '}
              <span className="font-semibold text-[#0F172A]">
                "{confirmDialog.grade.name}" (Level {confirmDialog.grade.level})
              </span>
              ?
              {confirmDialog.action === 'deactivate' &&
                ' Deactivated grades will no longer be available when defining designations.'}
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ open: false, grade: null, action: 'deactivate' })}
                className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg ${
                  confirmDialog.action === 'activate'
                    ? 'bg-[#059669] hover:bg-emerald-700'
                    : 'bg-[#DC2626] hover:bg-red-700'
                }`}
              >
                Yes, {confirmDialog.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
