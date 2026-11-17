'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../../lib/api';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  Globe,
  Phone,
  Mail,
} from 'lucide-react';
import { LocationDto, RecordStatus } from '@zentra/shared-types';

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDto | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    timezone: 'UTC',
    phone: '',
    email: '',
    isHeadquarters: false,
  });

  // Confirmation dialog for activate / deactivate
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    location: LocationDto | null;
    action: 'activate' | 'deactivate';
  }>({
    open: false,
    location: null,
    action: 'deactivate',
  });

  useEffect(() => {
    loadLocations();
  }, [statusFilter]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const queryParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const data = await ApiClient.request<LocationDto[]>(`/locations${queryParam}`);
      setLocations(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load locations' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      code: '',
      country: '',
      state: '',
      city: '',
      address: '',
      postalCode: '',
      timezone: 'UTC',
      phone: '',
      email: '',
      isHeadquarters: locations.length === 0, // default true if first location
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: LocationDto) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      code: loc.code,
      country: loc.country,
      state: loc.state || '',
      city: loc.city,
      address: loc.address,
      postalCode: loc.postalCode || '',
      timezone: loc.timezone,
      phone: loc.phone || '',
      email: loc.email || '',
      isHeadquarters: loc.isHeadquarters,
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
        country: formData.country.trim(),
        state: formData.state.trim() || undefined,
        city: formData.city.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim() || undefined,
        timezone: formData.timezone.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        isHeadquarters: formData.isHeadquarters,
      };

      if (editingLocation) {
        await ApiClient.request<LocationDto>(`/locations/${editingLocation.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: `Location "${formData.name}" updated successfully.` });
      } else {
        await ApiClient.request<LocationDto>('/locations', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: `Location "${formData.name}" created successfully.` });
      }

      setIsModalOpen(false);
      await loadLocations();
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmDialog.location) return;

    try {
      const endpoint =
        confirmDialog.action === 'activate'
          ? `/locations/${confirmDialog.location.id}/activate`
          : `/locations/${confirmDialog.location.id}/deactivate`;

      await ApiClient.request(endpoint, { method: 'PATCH' });
      setMessage({
        type: 'success',
        text: `Location "${confirmDialog.location.name}" ${
          confirmDialog.action === 'activate' ? 'activated' : 'deactivated'
        } successfully.`,
      });
      setConfirmDialog({ open: false, location: null, action: 'deactivate' });
      await loadLocations();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update location status' });
      setConfirmDialog({ open: false, location: null, action: 'deactivate' });
    }
  };

  const filteredLocations = locations.filter((loc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.country.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Office Locations</h1>
          <p className="text-sm text-[#475569] mt-1">
            Configure headquarters and regional branch offices for employee assignments and holiday calendars.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
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
            placeholder="Search by location name, code, or city..."
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
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MapPin className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-[#0F172A]">No locations found</h3>
            <p className="text-xs text-[#475569] mt-1 max-w-sm mx-auto">
              Get started by adding your organization's headquarters or branch office.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Location</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#475569] uppercase">
                <tr>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">City & Country</th>
                  <th className="px-6 py-3.5">Timezone</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#0F172A]">{loc.name}</span>
                        {loc.isHeadquarters && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-[#D97706] border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>HQ</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{loc.address}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded font-semibold text-[#1E3A8A]">
                        {loc.code}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[#475569]">
                      <div>
                        {loc.city}
                        {loc.state ? `, ${loc.state}` : ''}
                      </div>
                      <div className="text-xs text-[#64748B]">{loc.country}</div>
                    </td>

                    <td className="px-6 py-4 text-[#475569] font-mono text-xs">
                      {loc.timezone}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          loc.status === RecordStatus.ACTIVE
                            ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                            : 'bg-slate-100 text-[#64748B] border-slate-200'
                        }`}
                      >
                        {loc.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="p-1.5 text-[#475569] hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Location"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            location: loc,
                            action:
                              loc.status === RecordStatus.ACTIVE ? 'deactivate' : 'activate',
                          })
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          loc.status === RecordStatus.ACTIVE
                            ? 'text-[#DC2626] hover:bg-red-50'
                            : 'text-[#059669] hover:bg-emerald-50'
                        }`}
                        title={
                          loc.status === RecordStatus.ACTIVE ? 'Deactivate Location' : 'Activate Location'
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Headquarters, London Office"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Location Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HQ-01, LON-02"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.isHeadquarters}
                      onChange={(e) =>
                        setFormData({ ...formData, isHeadquarters: e.target.checked })
                      }
                      className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A] h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#0F172A]">
                        Designate as Headquarters
                      </span>
                      <p className="text-[11px] text-[#64748B]">
                        Only one location per organization can be the primary headquarters.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 Howard Street, Floor 4"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="San Francisco"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    State / Province / Region
                  </label>
                  <input
                    type="text"
                    placeholder="California"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="United States"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="94105"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Timezone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="America/Los_Angeles"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (415) 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Location Email
                  </label>
                  <input
                    type="email"
                    placeholder="sf-office@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
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
                  {modalSubmitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.open && confirmDialog.location && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">
              Confirm {confirmDialog.action === 'activate' ? 'Activation' : 'Deactivation'}
            </h3>
            <p className="text-xs text-[#475569]">
              Are you sure you want to {confirmDialog.action} location{' '}
              <span className="font-semibold text-[#0F172A]">
                "{confirmDialog.location.name}" ({confirmDialog.location.code})
              </span>
              ?
              {confirmDialog.action === 'deactivate' &&
                ' Deactivated locations will not be selectable for newly assigned employees.'}
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmDialog({ open: false, location: null, action: 'deactivate' })
                }
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
