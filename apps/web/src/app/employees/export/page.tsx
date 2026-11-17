'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Building2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { ApiClient } from '../../../lib/api';
import {
  EmploymentType,
  EmployeeStatus,
} from '@zentra/shared-types';

export default function EmployeeExportPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{
    id: string;
    fileName: string;
    totalRows: number;
  } | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [employmentType, setEmploymentType] = useState<string>('');
  const [employeeStatus, setEmployeeStatus] = useState<string>('');

  // Dropdown options
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoading(true);
        const [deptRes, locRes, desigRes] = await Promise.all([
          ApiClient.request<any[]>('/departments').catch(() => []),
          ApiClient.request<any[]>('/locations').catch(() => []),
          ApiClient.request<any[]>('/designations').catch(() => []),
        ]);
        setDepartments(deptRes || []);
        setLocations(locRes || []);
        setDesignations(desigRes || []);
      } catch (err: any) {
        console.error('Failed to load filter options', err);
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setExporting(true);
      setError(null);
      setLastExport(null);

      const filterPayload: any = {};
      if (search.trim()) filterPayload.search = search.trim();
      if (departmentId) filterPayload.departmentId = departmentId;
      if (locationId) filterPayload.locationId = locationId;
      if (designationId) filterPayload.designationId = designationId;
      if (employmentType) filterPayload.employmentType = employmentType;
      if (employeeStatus) filterPayload.status = employeeStatus;

      // Request export generation
      const job = await ApiClient.request<{
        id: string;
        fileName: string;
        totalRows: number;
        status: string;
      }>('/employees/export', {
        method: 'POST',
        body: JSON.stringify(filterPayload),
      });

      setLastExport(job);

      // Trigger automatic file download
      await ApiClient.downloadFile(`/employees/export/${job.id}`, job.fileName);
    } catch (err: any) {
      setError(err.message || 'Failed to generate employee export');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setLocationId('');
    setDesignationId('');
    setEmploymentType('');
    setEmployeeStatus('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/employees"
              className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#0F172A]">Export Employees to CSV</h1>
              <p className="text-xs text-[#64748B]">
                Generate role-scoped employee exports with customized filters
              </p>
            </div>
          </div>

          <Link
            href="/employees"
            className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg text-xs font-semibold bg-white transition"
          >
            Back to Directory
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Security & Masking Notice */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex items-start space-x-3 text-xs text-[#475569]">
          <ShieldCheck className="w-5 h-5 text-[#1E3A8A] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#0F172A]">Permission-Enforced Field Masking:</strong>{' '}
            Exported data is strictly filtered and masked according to your active role and permissions. Sensitive personal attributes (personal email, date of birth, residential addresses, emergency contacts) are included only for authorized HR administrators.
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-xs text-[#DC2626]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {lastExport && (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#059669]" />
              <div>
                <h3 className="text-xs font-bold text-[#059669] uppercase tracking-wider">
                  Export Generated Successfully
                </h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  Exported <strong>{lastExport.totalRows}</strong> records into{' '}
                  <code className="font-mono font-medium">{lastExport.fileName}</code>. Download has started automatically.
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                ApiClient.downloadFile(
                  `/employees/export/${lastExport.id}`,
                  lastExport.fileName,
                )
              }
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#059669] text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Again</span>
            </button>
          </div>
        )}

        {/* Filter Configuration Form */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-[#1E3A8A]" />
              <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                Filter Export Dataset
              </h2>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold"
            >
              Reset Filters
            </button>
          </div>

          <form onSubmit={handleExport} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Keyword Search */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Text Search Query
                </label>
                <input
                  type="text"
                  placeholder="Filter by name, work email, or employee code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Base Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.isHeadquarters ? '(HQ)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Designation / Title
                </label>
                <select
                  value={designationId}
                  onChange={(e) => setDesignationId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  <option value="">All Designations</option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.title} ({des.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  <option value="">All Employment Types</option>
                  <option value={EmploymentType.FULL_TIME}>Full Time</option>
                  <option value={EmploymentType.PART_TIME}>Part Time</option>
                  <option value={EmploymentType.CONTRACT}>Contract</option>
                  <option value={EmploymentType.INTERN}>Intern</option>
                  <option value={EmploymentType.TEMPORARY}>Temporary</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={employeeStatus}
                  onChange={(e) => setEmployeeStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  <option value="">All Statuses (Active & Inactive)</option>
                  <option value={EmployeeStatus.ACTIVE}>Active</option>
                  <option value={EmployeeStatus.ON_PROBATION}>On Probation</option>
                  <option value={EmployeeStatus.ON_NOTICE_PERIOD}>On Notice Period</option>
                  <option value={EmployeeStatus.INVITED}>Invited</option>
                  <option value={EmployeeStatus.ON_LONG_LEAVE}>On Long Leave</option>
                  <option value={EmployeeStatus.SUSPENDED}>Suspended</option>
                  <option value={EmployeeStatus.INACTIVE}>Inactive</option>
                  <option value={EmployeeStatus.RESIGNED}>Resigned</option>
                  <option value={EmployeeStatus.TERMINATED}>Terminated</option>
                  <option value={EmployeeStatus.EXITED}>Exited</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-end space-x-3">
              <Link
                href="/employees"
                className="px-5 py-2.5 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg text-xs font-semibold bg-white transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={exporting}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{exporting ? 'Generating CSV...' : 'Generate & Download CSV'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
