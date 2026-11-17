'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../../lib/api';
import {
  GitBranch,
  Plus,
  Search,
  Edit2,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  FolderTree,
  List,
} from 'lucide-react';
import { DepartmentDto, DepartmentTreeNodeDto, RecordStatus } from '@zentra/shared-types';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [treeData, setTreeData] = useState<DepartmentTreeNodeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDto | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parentDepartmentId: '',
    description: '',
  });

  // Status toggle confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    dept: DepartmentDto | null;
    action: 'activate' | 'deactivate';
  }>({
    open: false,
    dept: null,
    action: 'deactivate',
  });

  useEffect(() => {
    loadDepartments();
  }, [statusFilter]);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const queryParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const [list, tree] = await Promise.all([
        ApiClient.request<DepartmentDto[]>(`/departments${queryParam}`),
        ApiClient.request<DepartmentTreeNodeDto[]>('/departments/tree'),
      ]);
      setDepartments(list);
      setTreeData(tree);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load departments' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      parentDepartmentId: '',
      description: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentDto) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      parentDepartmentId: dept.parentDepartmentId || '',
      description: dept.description || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        parentDepartmentId: formData.parentDepartmentId ? formData.parentDepartmentId : null,
        description: formData.description.trim() || undefined,
      };

      if (editingDept) {
        await ApiClient.request<DepartmentDto>(`/departments/${editingDept.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage({
          type: 'success',
          text: `Department "${formData.name}" updated successfully.`,
        });
      } else {
        await ApiClient.request<DepartmentDto>('/departments', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage({
          type: 'success',
          text: `Department "${formData.name}" created successfully.`,
        });
      }

      setIsModalOpen(false);
      await loadDepartments();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save department');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmDialog.dept) return;

    try {
      const endpoint =
        confirmDialog.action === 'activate'
          ? `/departments/${confirmDialog.dept.id}/activate`
          : `/departments/${confirmDialog.dept.id}/deactivate`;

      await ApiClient.request(endpoint, { method: 'PATCH' });
      setMessage({
        type: 'success',
        text: `Department "${confirmDialog.dept.name}" ${
          confirmDialog.action === 'activate' ? 'activated' : 'deactivated'
        } successfully.`,
      });
      setConfirmDialog({ open: false, dept: null, action: 'deactivate' });
      await loadDepartments();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update department status' });
      setConfirmDialog({ open: false, dept: null, action: 'deactivate' });
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
  });

  // Eligible parent departments for select (excluding self to avoid immediate circular loop)
  const eligibleParents = departments.filter(
    (d) => !editingDept || d.id !== editingDept.id,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Departments</h1>
          <p className="text-sm text-[#475569] mt-1">
            Build multi-level organizational divisions, reporting lines, and child departmental units.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[#1E3A8A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-[#1E3A8A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Tree Hierarchy View"
            >
              <FolderTree className="w-4 h-4" />
              <span>Tree</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
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

      {/* Search and Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by department name or code..."
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

      {/* Content: List or Tree */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <GitBranch className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold text-[#0F172A]">No departments found</h3>
              <p className="text-xs text-[#475569] mt-1 max-w-sm mx-auto">
                Create core business divisions like Engineering, Sales, HR, or Finance.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Department</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569] uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Parent Department</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#0F172A]">{dept.name}</span>
                        {dept.description && (
                          <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                            {dept.description}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded font-semibold text-[#1E3A8A]">
                          {dept.code}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-[#475569] text-xs">
                        {dept.parentDepartmentName ? (
                          <span className="inline-flex items-center text-[#1E3A8A] font-medium bg-indigo-50 px-2 py-0.5 rounded">
                            <GitBranch className="w-3 h-3 mr-1" />
                            {dept.parentDepartmentName}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] italic">Top-Level Division</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            dept.status === RecordStatus.ACTIVE
                              ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                              : 'bg-slate-100 text-[#64748B] border-slate-200'
                          }`}
                        >
                          {dept.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(dept)}
                          className="p-1.5 text-[#475569] hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Department"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              dept: dept,
                              action:
                                dept.status === RecordStatus.ACTIVE ? 'deactivate' : 'activate',
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            dept.status === RecordStatus.ACTIVE
                              ? 'text-[#DC2626] hover:bg-red-50'
                              : 'text-[#059669] hover:bg-emerald-50'
                          }`}
                          title={
                            dept.status === RecordStatus.ACTIVE
                              ? 'Deactivate Department'
                              : 'Activate Department'
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
      ) : (
        /* Tree View */
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center space-x-2">
            <FolderTree className="w-5 h-5 text-[#1E3A8A]" />
            <span>Department Hierarchy Tree</span>
          </h2>

          {treeData.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#64748B]">
              No active departmental hierarchy configured yet.
            </div>
          ) : (
            <div className="space-y-3">
              {treeData.map((rootNode) => (
                <TreeNodeItem
                  key={rootNode.id}
                  node={rootNode}
                  onEdit={openEditModal}
                  onStatusToggle={(dept, action) =>
                    setConfirmDialog({ open: true, dept, action })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingDept ? 'Edit Department' : 'Add New Department'}
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
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Product Design, Sales"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG, DES, SLS"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Parent Department (Optional)
                </label>
                <select
                  value={formData.parentDepartmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, parentDepartmentId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  <option value="">None (Top-Level Division)</option>
                  {eligibleParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Leave empty if this is a top-level department with no parent. Circular hierarchies are prevented.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of department function..."
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
                  {modalSubmitting ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && confirmDialog.dept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">
              Confirm {confirmDialog.action === 'activate' ? 'Activation' : 'Deactivation'}
            </h3>
            <p className="text-xs text-[#475569]">
              Are you sure you want to {confirmDialog.action} department{' '}
              <span className="font-semibold text-[#0F172A]">
                "{confirmDialog.dept.name}" ({confirmDialog.dept.code})
              </span>
              ?
              {confirmDialog.action === 'deactivate' &&
                ' Note: A department cannot be deactivated if active child departments or employees are assigned to it.'}
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ open: false, dept: null, action: 'deactivate' })}
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

// Tree Node Component
function TreeNodeItem({
  node,
  onEdit,
  onStatusToggle,
}: {
  node: DepartmentTreeNodeDto;
  onEdit: (d: DepartmentDto) => void;
  onStatusToggle: (d: DepartmentDto, action: 'activate' | 'deactivate') => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="border border-[#E2E8F0] rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-[#64748B] hover:text-[#0F172A] rounded"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <GitBranch className="w-4 h-4 text-[#1E3A8A]" />
          <span className="font-semibold text-sm text-[#0F172A]">{node.name}</span>
          <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-[#1E3A8A]">
            {node.code}
          </span>

          {hasChildren && (
            <span className="text-xs text-[#64748B] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              {node.children.length} sub-units
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${
              node.status === RecordStatus.ACTIVE
                ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                : 'bg-slate-100 text-[#64748B] border-slate-200'
            }`}
          >
            {node.status}
          </span>
          <button
            onClick={() => onEdit(node)}
            className="p-1 text-[#64748B] hover:text-[#1E3A8A] rounded"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              onStatusToggle(
                node,
                node.status === RecordStatus.ACTIVE ? 'deactivate' : 'activate',
              )
            }
            className={`p-1 rounded ${
              node.status === RecordStatus.ACTIVE
                ? 'text-[#DC2626] hover:bg-red-50'
                : 'text-[#059669] hover:bg-emerald-50'
            }`}
            title={node.status === RecordStatus.ACTIVE ? 'Deactivate' : 'Activate'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="ml-8 mt-3 pl-4 border-l-2 border-indigo-100 space-y-2">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              onEdit={onEdit}
              onStatusToggle={onStatusToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
