'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../../../lib/api';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Layers,
  AlertCircle,
} from 'lucide-react';

export default function NewChecklistPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState('Employee');
  const [items, setItems] = useState<Array<{ title: string; ownerType: string; ownerId: string; dueOffsetDays: number }>>([
    { title: 'Provision Laptop & IT Accounts', ownerType: 'role', ownerId: 'it_admin', dueOffsetDays: 1 },
    { title: 'Complete Direct Deposit Form', ownerType: 'employee', ownerId: '', dueOffsetDays: 3 },
    { title: 'Schedule 30-Day Check-in', ownerType: 'manager', ownerId: '', dueOffsetDays: 30 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, { title: '', ownerType: 'role', ownerId: '', dueOffsetDays: 1 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Checklist name is required');
      return;
    }

    try {
      setSaving(true);
      await ApiClient.request('/checklists', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || undefined,
          entityType,
          items: items.map((item, idx) => ({
            ...item,
            order: idx + 1,
            dueOffsetDays: Number(item.dueOffsetDays) || 0,
          })),
        }),
      });
      router.push('/settings/checklists');
    } catch (err: any) {
      setError(err.message || 'Failed to create checklist');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/settings/checklists"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">Create Checklist Template</h1>
              <p className="text-xs text-[#475569]">
                Define reusable operational checklists that auto-generate tasks.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#1E3A8A]" />
              <span>Template Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Checklist Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard New Hire Onboarding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Associated Entity</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="Employee">Employee</option>
                  <option value="Department">Department</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A]">Checklist Task Items</h2>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-[#E2E8F0]">
                  <input
                    type="text"
                    required
                    placeholder="Task item title"
                    value={item.title}
                    onChange={(e) => updateItem(idx, 'title', e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded text-xs bg-white"
                  />
                  <select
                    value={item.ownerType}
                    onChange={(e) => updateItem(idx, 'ownerType', e.target.value)}
                    className="w-32 px-2.5 py-1.5 border rounded text-xs bg-white"
                  >
                    <option value="role">Role</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Owner ID or role code"
                    value={item.ownerId}
                    onChange={(e) => updateItem(idx, 'ownerId', e.target.value)}
                    className="w-40 px-3 py-1.5 border rounded text-xs bg-white font-mono"
                  />
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0}
                      value={item.dueOffsetDays}
                      onChange={(e) => updateItem(idx, 'dueOffsetDays', Number(e.target.value))}
                      className="w-16 px-2 py-1.5 border rounded text-xs bg-white text-center"
                    />
                    <span className="text-[11px] text-[#64748B]">days</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center space-x-1.5 text-xs text-[#1E3A8A] font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task Item</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
