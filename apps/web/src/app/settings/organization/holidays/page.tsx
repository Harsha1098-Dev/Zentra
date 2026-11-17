'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../../lib/api';
import {
  Sun,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  MapPin,
  Repeat,
} from 'lucide-react';
import {
  HolidayDto,
  LocationDto,
  HolidayType,
} from '@zentra/shared-types';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayDto | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: HolidayType.PUBLIC,
    locationId: '',
    description: '',
    isRecurring: false,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    holiday: HolidayDto | null;
  }>({
    open: false,
    holiday: null,
  });

  useEffect(() => {
    loadHolidays();
  }, [yearFilter, locationFilter]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.append('year', yearFilter.toString());
      if (locationFilter !== 'ALL') params.append('locationId', locationFilter);

      const [holidayData, locationData] = await Promise.all([
        ApiClient.request<HolidayDto[]>(`/holidays?${params.toString()}`),
        ApiClient.request<LocationDto[]>('/locations?status=ACTIVE'),
      ]);

      // Sort chronological
      holidayData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setHolidays(holidayData);
      setLocations(locationData);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load holidays' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: `${yearFilter}-01-01`,
      type: HolidayType.PUBLIC,
      locationId: '',
      description: '',
      isRecurring: false,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (h: HolidayDto) => {
    setEditingHoliday(h);
    const dateStr =
      typeof h.date === 'string' && h.date.includes('T')
        ? h.date.split('T')[0]
        : (h.date as any);

    setFormData({
      name: h.name,
      date: dateStr,
      type: h.type,
      locationId: h.locationId || '',
      description: h.description || '',
      isRecurring: h.isRecurring,
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
        date: formData.date,
        type: formData.type,
        locationId: formData.locationId ? formData.locationId : null,
        description: formData.description.trim() || undefined,
        isRecurring: formData.isRecurring,
      };

      if (editingHoliday) {
        await ApiClient.request<HolidayDto>(`/holidays/${editingHoliday.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage({
          type: 'success',
          text: `Holiday "${formData.name}" updated successfully.`,
        });
      } else {
        await ApiClient.request<HolidayDto>('/holidays', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage({
          type: 'success',
          text: `Holiday "${formData.name}" added successfully.`,
        });
      }

      setIsModalOpen(false);
      await loadHolidays();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save holiday');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.holiday) return;

    try {
      await ApiClient.request(`/holidays/${deleteConfirm.holiday.id}`, {
        method: 'DELETE',
      });
      setMessage({
        type: 'success',
        text: `Holiday "${deleteConfirm.holiday.name}" deleted successfully.`,
      });
      setDeleteConfirm({ open: false, holiday: null });
      await loadHolidays();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete holiday' });
      setDeleteConfirm({ open: false, holiday: null });
    }
  };

  const formatHolidayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        formatted: d.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
      };
    } catch {
      return { formatted: dateStr, weekday: '' };
    }
  };

  const typeStyles = {
    [HolidayType.PUBLIC]: 'bg-emerald-50 text-[#059669] border-emerald-200',
    [HolidayType.OPTIONAL]: 'bg-amber-50 text-[#D97706] border-amber-200',
    [HolidayType.RESTRICTED]: 'bg-blue-50 text-[#2563EB] border-blue-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Holiday Calendar</h1>
          <p className="text-sm text-[#475569] mt-1">
            Publish official paid, optional, and restricted holidays across headquarters and regional office locations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Holiday</span>
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
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-[#64748B]">Calendar Year:</label>
          <div className="flex items-center space-x-1">
            {[2025, 2026, 2027].map((yr) => (
              <button
                key={yr}
                onClick={() => setYearFilter(yr)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  yearFilter === yr
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-[#64748B]">Location:</label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          >
            <option value="ALL">All Locations (Global & Local)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Sun className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-[#0F172A]">
              No holidays declared for {yearFilter}
            </h3>
            <p className="text-xs text-[#475569] mt-1 max-w-sm mx-auto">
              Add New Year's Day, National Holidays, or regional festive days for your teams.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Holiday</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569] uppercase">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Holiday Name</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Location Scope</th>
                  <th className="px-6 py-3.5">Cadence</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {holidays.map((h) => {
                  const { formatted, weekday } = formatHolidayDate(h.date);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0F172A]">{formatted}</div>
                        <div className="text-xs text-[#64748B]">{weekday}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#0F172A]">{h.name}</span>
                        {h.description && (
                          <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                            {h.description}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            typeStyles[h.type] || 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {h.type}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        {h.locationName ? (
                          <span className="inline-flex items-center text-[#1E3A8A] font-medium bg-indigo-50 px-2 py-0.5 rounded">
                            <MapPin className="w-3 h-3 mr-1" />
                            {h.locationName}
                          </span>
                        ) : (
                          <span className="text-[#059669] font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            All Locations (Global)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-[#64748B]">
                        {h.isRecurring ? (
                          <span className="inline-flex items-center space-x-1 text-indigo-700">
                            <Repeat className="w-3 h-3" />
                            <span>Annual Recurring</span>
                          </span>
                        ) : (
                          <span>One-time</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(h)}
                          className="p-1.5 text-[#475569] hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Holiday"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirm({ open: true, holiday: h })}
                          className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
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
                  Holiday Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Year's Day, Independence Day"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Holiday Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as HolidayType })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                  >
                    <option value={HolidayType.PUBLIC}>Public Holiday</option>
                    <option value={HolidayType.OPTIONAL}>Optional Holiday</option>
                    <option value={HolidayType.RESTRICTED}>Restricted Holiday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Location Scope (Optional)
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  <option value="">All Locations (Global Company Holiday)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city}, {loc.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData({ ...formData, isRecurring: e.target.checked })
                    }
                    className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A] h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#0F172A]">
                      Annual Recurring Holiday
                    </span>
                    <p className="text-[11px] text-[#64748B]">
                      Automatically carry this holiday forward into subsequent yearly calendars.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or observance details..."
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
                  {modalSubmitting ? 'Saving...' : editingHoliday ? 'Update Holiday' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && deleteConfirm.holiday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Delete Holiday</h3>
            <p className="text-xs text-[#475569]">
              Are you sure you want to delete holiday{' '}
              <span className="font-semibold text-[#0F172A]">
                "{deleteConfirm.holiday.name}"
              </span>
              ? This action will remove it from all employee calendar schedules.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, holiday: null })}
                className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-red-700 rounded-lg"
              >
                Delete Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
