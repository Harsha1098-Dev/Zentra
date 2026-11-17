'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  EmployeeBasicDto,
  EmployeeDto,
  DepartmentDto,
  LocationDto,
  DesignationDto,
  EmployeeStatus,
  EmploymentType,
  RoleCode,
  PermissionCode,
} from '@zentra/shared-types';

export default function EmployeeDirectoryPage() {
  const router = useRouter();
  const { user, activeOrganization, roles, permissions } = useAuth();

  const [employees, setEmployees] = useState<(EmployeeBasicDto | EmployeeDto)[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter option datasets
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);

  // Filter State
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [desigFilter, setDesigFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'dateOfJoining' | 'employeeCode' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Role permissions
  const isHrOrAdmin =
    roles.includes(RoleCode.SUPER_ADMIN) ||
    roles.includes(RoleCode.HR_ADMIN) ||
    permissions.includes(PermissionCode.EMPLOYEE_CREATE);

  useEffect(() => {
    loadFilterOptions();
  }, [activeOrganization]);

  useEffect(() => {
    loadEmployees();
  }, [
    activeOrganization,
    currentPage,
    search,
    deptFilter,
    locFilter,
    desigFilter,
    typeFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const loadFilterOptions = async () => {
    if (!activeOrganization) return;
    try {
      const [deptList, locList, desigList] = await Promise.allSettled([
        ApiClient.request<DepartmentDto[]>('/departments?status=ACTIVE'),
        ApiClient.request<LocationDto[]>('/locations?status=ACTIVE'),
        ApiClient.request<DesignationDto[]>('/designations?status=ACTIVE'),
      ]);

      if (deptList.status === 'fulfilled') setDepartments(deptList.value);
      if (locList.status === 'fulfilled') setLocations(locList.value);
      if (desigList.status === 'fulfilled') setDesignations(desigList.value);
    } catch {
      // Ignored for non-admin viewers
    }
  };

  const loadEmployees = async () => {
    if (!activeOrganization) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '15');
      if (search.trim()) params.append('search', search.trim());
      if (deptFilter) params.append('departmentId', deptFilter);
      if (locFilter) params.append('locationId', locFilter);
      if (desigFilter) params.append('designationId', desigFilter);
      if (typeFilter) params.append('employmentType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await ApiClient.request<{
        data: (EmployeeBasicDto | EmployeeDto)[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/employees?${params.toString()}`);

      setEmployees(res.data || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(employees.map((emp) => emp.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDeptFilter('');
    setLocFilter('');
    setDesigFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.ACTIVE:
        return 'bg-emerald-50 text-[#059669] border-emerald-200';
      case EmployeeStatus.ON_PROBATION:
        return 'bg-blue-50 text-[#2563EB] border-blue-200';
      case EmployeeStatus.INVITED:
        return 'bg-amber-50 text-[#D97706] border-amber-200';
      case EmployeeStatus.ON_NOTICE_PERIOD:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case EmployeeStatus.RESIGNED:
      case EmployeeStatus.EXITED:
      case EmployeeStatus.TERMINATED:
        return 'bg-red-50 text-[#DC2626] border-red-200';
      default:
        return 'bg-slate-50 text-[#64748B] border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-[#0F172A]">Employee Directory</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-[#1E3A8A] border border-indigo-200">
                  {totalCount} Total
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Central personnel records, profiles, organizational assignments, and reporting lines.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {isHrOrAdmin && (
              <>
                <Link
                  href="/employees/import"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] rounded-lg transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Import CSV</span>
                </Link>

                <Link
                  href="/employees/export"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Export</span>
                </Link>

                <Link
                  href="/employees/new"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Employee</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name, employee code, work email, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={locFilter}
              onChange={(e) => {
                setLocFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.city})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All Statuses</option>
              <option value={EmployeeStatus.ACTIVE}>Active</option>
              <option value={EmployeeStatus.ON_PROBATION}>On Probation</option>
              <option value={EmployeeStatus.INVITED}>Invited</option>
              <option value={EmployeeStatus.ON_NOTICE_PERIOD}>On Notice Period</option>
              <option value={EmployeeStatus.RESIGNED}>Resigned</option>
              <option value={EmployeeStatus.EXITED}>Exited</option>
              <option value={EmployeeStatus.TERMINATED}>Terminated</option>
              <option value={EmployeeStatus.INACTIVE}>Inactive</option>
            </select>

            {/* Reset Filters */}
            {(search || deptFilter || locFilter || desigFilter || typeFilter || statusFilter) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Directory Table Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Users className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-[#0F172A]">No employees found</h3>
              <p className="text-xs text-[#475569] mt-1 max-w-sm mx-auto">
                {search || deptFilter || locFilter || statusFilter
                  ? 'No employee records match the selected filters.'
                  : 'Start by creating your first employee profile or importing your team roster.'}
              </p>
              {isHrOrAdmin && (
                <div className="mt-4 flex items-center justify-center space-x-3">
                  <Link
                    href="/employees/new"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add First Employee</span>
                  </Link>
                  <Link
                    href="/employees/import"
                    className="inline-flex items-center space-x-2 px-4 py-2 border border-[#E2E8F0] bg-white text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import via CSV</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-semibold text-[#475569] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length > 0 && selectedIds.length === employees.length
                        }
                        onChange={handleSelectAll}
                        className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A] h-4 w-4"
                      />
                    </th>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Department & Title</th>
                    <th className="px-6 py-3.5">Location & Manager</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Employment Type</th>
                    <th className="px-6 py-3.5">Date of Joining</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {employees.map((emp) => {
                    const isSelected = selectedIds.includes(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(emp.id)}
                            className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A] h-4 w-4"
                          />
                        </td>

                        {/* Name, Code, Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-[#E0E7FF] text-[#1E3A8A] border border-indigo-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {emp.firstName.charAt(0)}
                              {emp.lastName.charAt(0)}
                            </div>
                            <div>
                              <Link
                                href={`/employees/${emp.id}`}
                                className="font-bold text-[#0F172A] hover:text-[#1E3A8A] text-sm hover:underline"
                              >
                                {emp.fullName}
                              </Link>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="font-mono text-[11px] font-semibold text-[#1E3A8A] bg-slate-100 px-1.5 py-0.2 rounded">
                                  {emp.employeeCode}
                                </span>
                                <span className="text-[#64748B] text-[11px] truncate max-w-[180px]">
                                  {emp.workEmail}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Dept & Designation */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#0F172A]">
                            {emp.designationName}
                          </div>
                          <div className="text-[#64748B] flex items-center space-x-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-[#64748B]" />
                            <span>{emp.departmentName}</span>
                          </div>
                        </td>

                        {/* Location & Reporting Manager */}
                        <td className="px-6 py-4">
                          <div className="text-[#0F172A] flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-[#64748B]" />
                            <span>{emp.locationName}</span>
                          </div>
                          <div className="text-[#64748B] text-[11px] mt-0.5">
                            {emp.reportingManagerName ? (
                              <span>Mgr: {emp.reportingManagerName}</span>
                            ) : (
                              <span className="text-slate-400 italic">No Manager</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                              emp.status,
                            )}`}
                          >
                            {emp.status}
                          </span>
                        </td>

                        {/* Employment Type */}
                        <td className="px-6 py-4 text-[#475569] font-medium">
                          {emp.employmentType.replace('_', ' ')}
                        </td>

                        {/* Joining Date */}
                        <td className="px-6 py-4 text-[#64748B] font-mono text-[11px]">
                          {emp.dateOfJoining}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors"
                          >
                            Profile
                          </Link>
                          {isHrOrAdmin && (
                            <Link
                              href={`/employees/${emp.id}/edit`}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-[#475569] hover:bg-slate-100 border border-[#E2E8F0] rounded-lg transition-colors"
                            >
                              Edit
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-3 flex items-center justify-between text-xs text-[#475569]">
              <div>
                Showing page <span className="font-semibold">{currentPage}</span> of{' '}
                <span className="font-semibold">{totalPages}</span> ({totalCount} total)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-[#E2E8F0] rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-[#E2E8F0] rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
