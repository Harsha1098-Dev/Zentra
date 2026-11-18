'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { HelpdeskNav } from '../../helpdesk-nav';
import { ApiClient } from '../../../../lib/api';

export default function CategoriesSettingsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [description, setDescription] = useState('');
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDesc, setSubDesc] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await ApiClient.request('/helpdesk/categories');
      if (Array.isArray(res)) {
        setCategories(res);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setSubmitting(true);
      await ApiClient.request('/helpdesk/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          categoryCode: categoryCode.trim().toUpperCase(),
          description: description.trim() || null,
        }),
      });
      setName('');
      setCategoryCode('');
      setDescription('');
      setShowCreateModal(false);
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubCategory = async (e: React.FormEvent, categoryId: string) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setSubmitting(true);
      await ApiClient.request(`/helpdesk/categories/${categoryId}/subcategories`, {
        method: 'POST',
        body: JSON.stringify({
          name: subName.trim(),
          subCategoryCode: subCode.trim().toUpperCase(),
          description: subDesc.trim() || null,
        }),
      });
      setSubName('');
      setSubCode('');
      setSubDesc('');
      setShowSubModal(null);
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create subcategory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateCategory = async (cat: any) => {
    if (!confirm(`Are you sure you want to deactivate '${cat.name}'?`)) return;
    try {
      await ApiClient.request(`/helpdesk/categories/${cat.id}`, {
        method: 'DELETE',
      });
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Cannot deactivate category with open tickets');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <HelpdeskNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/helpdesk/settings"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1E3A8A]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Helpdesk Settings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Categories & Sub-Categories</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure support categories for ticket classification and auto-assignment
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Category
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Loading categories...
            </div>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold text-xs">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                          {cat.categoryCode}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cat.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowSubModal(cat.id)}
                      className="inline-flex items-center text-xs text-[#1E3A8A] font-semibold hover:bg-blue-50 px-2.5 py-1 rounded transition"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Sub-Category
                    </button>
                    {cat.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeactivateCategory(cat)}
                        className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded transition font-medium"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories list */}
                {cat.subCategories && cat.subCategories.length > 0 && (
                  <div className="mt-3 pl-12 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                      Sub-Categories ({cat.subCategories.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {cat.subCategories.map((sc: any) => (
                        <div
                          key={sc.id}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 flex items-center space-x-2"
                        >
                          <span className="font-medium">{sc.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({sc.subCategoryCode})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              No categories found. Click 'New Category' above to add one.
            </div>
          )}
        </div>

        {/* Create Category Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">Create Category</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Facilities & Workplace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Code * (uppercase, unique)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FACILITIES"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 uppercase focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe what requests fall under this category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Creating...' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Subcategory Modal */}
        {showSubModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">Add Sub-Category</h2>
              <form onSubmit={(e) => handleCreateSubCategory(e, showSubModal)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sub-Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Desk Relocation"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sub-Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DESK_MOVE"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 uppercase focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubModal(null)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-800 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Adding...' : 'Add Sub-Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
