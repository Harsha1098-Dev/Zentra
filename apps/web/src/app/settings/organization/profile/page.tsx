'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ApiClient } from '../../../../lib/api';
import {
  Building2,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  Mail,
  Phone,
  FileText,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Users,
} from 'lucide-react';
import { CompanyProfileDto } from '@zentra/shared-types';

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    legalName: '',
    website: '',
    industry: '',
    companySize: '',
    registrationNumber: '',
    taxIdNumber: '',
    country: '',
    state: '',
    city: '',
    address: '',
    timezone: 'UTC',
    defaultCurrency: 'USD',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    description: '',
    logoUrl: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.request<CompanyProfileDto>('/organizations/current/profile');
      if (data) {
        setForm({
          name: data.name || '',
          legalName: data.legalName || '',
          website: data.website || '',
          industry: data.industry || '',
          companySize: data.companySize || '',
          registrationNumber: data.registrationNumber || '',
          taxIdNumber: data.taxIdNumber || '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          address: data.address || '',
          timezone: data.timezone || 'UTC',
          defaultCurrency: data.defaultCurrency || 'USD',
          primaryContactName: data.primaryContactName || '',
          primaryContactEmail: data.primaryContactEmail || '',
          primaryContactPhone: data.primaryContactPhone || '',
          description: data.description || '',
          logoUrl: data.logoUrl || '',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load company profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        name: form.name.trim(),
        legalName: form.legalName.trim() || undefined,
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        companySize: form.companySize.trim() || undefined,
        registrationNumber: form.registrationNumber.trim() || undefined,
        taxIdNumber: form.taxIdNumber.trim() || undefined,
        country: form.country.trim() || undefined,
        state: form.state.trim() || undefined,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        timezone: form.timezone.trim() || undefined,
        defaultCurrency: form.defaultCurrency.trim() || undefined,
        primaryContactName: form.primaryContactName.trim() || undefined,
        primaryContactEmail: form.primaryContactEmail.trim() || undefined,
        primaryContactPhone: form.primaryContactPhone.trim() || undefined,
        description: form.description.trim() || undefined,
      };

      const updated = await ApiClient.request<CompanyProfileDto>(
        '/organizations/current/profile',
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
      );

      setMessage({ type: 'success', text: 'Company profile updated successfully!' });
      setForm((prev) => ({
        ...prev,
        name: updated.name,
        legalName: updated.legalName || '',
        website: updated.website || '',
        industry: updated.industry || '',
        companySize: updated.companySize || '',
        registrationNumber: updated.registrationNumber || '',
        taxIdNumber: updated.taxIdNumber || '',
        country: updated.country || '',
        state: updated.state || '',
        city: updated.city || '',
        address: updated.address || '',
        timezone: updated.timezone || 'UTC',
        defaultCurrency: updated.defaultCurrency || 'USD',
        primaryContactName: updated.primaryContactName || '',
        primaryContactEmail: updated.primaryContactEmail || '',
        primaryContactPhone: updated.primaryContactPhone || '',
        description: updated.description || '',
      }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo image size must be under 5MB' });
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Invalid file format. Allowed: PNG, JPG, WebP, SVG',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingLogo(true);
    setMessage(null);

    try {
      const res = await ApiClient.request<{ logoUrl: string }>(
        '/organizations/current/profile/logo',
        {
          method: 'POST',
          body: formData,
        },
      );
      setForm((prev) => ({ ...prev, logoUrl: res.logoUrl }));
      setMessage({ type: 'success', text: 'Company logo uploaded successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload logo' });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoRemove = async () => {
    if (!confirm('Are you sure you want to remove the company logo?')) return;

    setRemovingLogo(true);
    setMessage(null);

    try {
      await ApiClient.request('/organizations/current/profile/logo', {
        method: 'DELETE',
      });
      setForm((prev) => ({ ...prev, logoUrl: '' }));
      setMessage({ type: 'success', text: 'Company logo removed successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove logo' });
    } finally {
      setRemovingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  const backendHost = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
  const displayLogoUrl = form.logoUrl
    ? form.logoUrl.startsWith('http')
      ? form.logoUrl
      : `${backendHost}${form.logoUrl}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Company Profile</h1>
        <p className="text-sm text-[#475569] mt-1">
          Manage your organization details, logo, tax registration, and primary contact information.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-[#059669] border-emerald-200'
              : 'bg-red-50 text-[#DC2626] border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Logo Upload Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Company Logo</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-xl border border-[#E2E8F0] bg-[#F6F8FB] flex items-center justify-center overflow-hidden flex-shrink-0 relative">
            {displayLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayLogoUrl}
                alt="Company Logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Building2 className="w-10 h-10 text-[#64748B]" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
              </button>

              {form.logoUrl && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  disabled={removingLogo}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-red-50 text-[#DC2626] border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{removingLogo ? 'Removing...' : 'Remove'}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Supported formats: PNG, JPG, WebP, SVG. Maximum file size: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Details */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#1E3A8A]" />
            <span>General Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Organization Display Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Legal Registered Name
              </label>
              <input
                type="text"
                name="legalName"
                placeholder="e.g. Acme Technologies Inc."
                value={form.legalName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                <input
                  type="url"
                  name="website"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                placeholder="e.g. Information Technology, Financial Services"
                value={form.industry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Company Size
              </label>
              <select
                name="companySize"
                value={form.companySize}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
              >
                <option value="">Select Company Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Default Currency
              </label>
              <input
                type="text"
                name="defaultCurrency"
                placeholder="USD, EUR, GBP, INR"
                value={form.defaultCurrency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Company Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="A brief summary of your company mission and services..."
                value={form.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>
        </div>

        {/* Legal & Tax Identifiers */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#1E3A8A]" />
            <span>Legal & Tax Registrations</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Registration / Incorporation Number
              </label>
              <input
                type="text"
                name="registrationNumber"
                placeholder="e.g. CIN, CRN, Business Reg ID"
                value={form.registrationNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Tax Identification Number (TIN / GST / EIN)
              </label>
              <input
                type="text"
                name="taxIdNumber"
                placeholder="e.g. EIN-1234567, GSTIN"
                value={form.taxIdNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>
        </div>

        {/* Address & Timezone */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#1E3A8A]" />
            <span>Headquarters Address & Timezone</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Registered Street Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="123 Corporate Way, Suite 400"
                value={form.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                placeholder="San Francisco"
                value={form.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                State / Region
              </label>
              <input
                type="text"
                name="state"
                placeholder="California"
                value={form.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                placeholder="United States"
                value={form.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Organization Timezone
              </label>
              <input
                type="text"
                name="timezone"
                placeholder="America/New_York or UTC"
                value={form.timezone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-[#1E3A8A]" />
            <span>Primary Administrative Contact</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                name="primaryContactName"
                placeholder="Jane Doe"
                value={form.primaryContactName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="primaryContactEmail"
                placeholder="hr@acme.com"
                value={form.primaryContactEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="primaryContactPhone"
                placeholder="+1 (555) 000-1234"
                value={form.primaryContactPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
