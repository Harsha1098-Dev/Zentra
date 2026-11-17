'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  ChevronLeft,
  Edit2,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  GitBranch,
  Shield,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Power,
  RotateCcw,
} from 'lucide-react';
import {
  EmployeeDto,
  EmployeeProfileDto,
  EmploymentHistoryDto,
  EmployeeTimelineItemDto,
  ReportingStructureDto,
  EmployeeStatus,
  EmploymentType,
  DepartmentDto,
  DesignationDto,
  LocationDto,
  RoleCode,
  PermissionCode,
} from '@zentra/shared-types';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, roles, permissions } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<EmployeeProfileDto | null>(null);
  const [historyRecords, setHistoryRecords] = useState<EmploymentHistoryDto[]>([]);
  const [timelineItems, setTimelineItems] = useState<EmployeeTimelineItemDto[]>([]);
  const [reportingStructure, setReportingStructure] = useState<ReportingStructureDto | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'personal' | 'employment' | 'reporting' | 'history' | 'timeline' | 'custom'
  >('overview');

  // Lookups for action modals
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [candidateManagers, setCandidateManagers] = useState<any[]>([]);

  // Action Modals State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: EmployeeStatus.ACTIVE,
    effectiveDate: new Date().toISOString().split('T')[0],
    remarks: '',
    exitReason: '',
  });

  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [managerForm, setManagerForm] = useState({
    reportingManagerId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({
    departmentId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [desigModalOpen, setDesigModalOpen] = useState(false);
  const [desigForm, setDesigForm] = useState({
    designationId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [locModalOpen, setLocModalOpen] = useState(false);
  const [locForm, setLocForm] = useState({
    locationId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const isHrOrAdmin =
    roles.includes(RoleCode.SUPER_ADMIN) ||
    roles.includes(RoleCode.HR_ADMIN) ||
    permissions.includes(PermissionCode.EMPLOYEE_UPDATE);

  useEffect(() => {
    if (id) {
      loadAllEmployeeData();
      loadLookups();
    }
  }, [id]);

  const loadAllEmployeeData = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes, timelineRes, reportRes] = await Promise.allSettled([
        ApiClient.request<EmployeeProfileDto>(`/employees/${id}/profile`),
        ApiClient.request<EmploymentHistoryDto[]>(`/employees/${id}/employment-history`),
        ApiClient.request<EmployeeTimelineItemDto[]>(`/employees/${id}/timeline`),
        ApiClient.request<ReportingStructureDto>(`/employees/${id}/reporting-structure`),
      ]);

      if (profileRes.status === 'fulfilled') setProfileData(profileRes.value);
      if (historyRes.status === 'fulfilled') setHistoryRecords(historyRes.value);
      if (timelineRes.status === 'fulfilled') setTimelineItems(timelineRes.value);
      if (reportRes.status === 'fulfilled') setReportingStructure(reportRes.value);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load employee profile' });
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [deptRes, locRes, desigRes, empRes] = await Promise.allSettled([
        ApiClient.request<DepartmentDto[]>('/departments?status=ACTIVE'),
        ApiClient.request<LocationDto[]>('/locations?status=ACTIVE'),
        ApiClient.request<DesignationDto[]>('/designations?status=ACTIVE'),
        ApiClient.request<{ data: any[] }>('/employees?limit=100&status=ACTIVE'),
      ]);

      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value);
      if (locRes.status === 'fulfilled') setLocations(locRes.value);
      if (desigRes.status === 'fulfilled') setDesignations(desigRes.value);
      if (empRes.status === 'fulfilled') {
        // Exclude current employee from manager list
        setCandidateManagers(empRes.value.data.filter((e) => e.id !== id));
      }
    } catch {
      // Ignored
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request(`/employees/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusForm),
      });
      setMessage({ type: 'success', text: 'Employee status updated successfully.' });
      setStatusModalOpen(false);
      await loadAllEmployeeData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change status' });
    }
  };

  const handleManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request(`/employees/${id}/reporting-manager`, {
        method: 'PATCH',
        body: JSON.stringify(managerForm),
      });
      setMessage({ type: 'success', text: 'Reporting manager reassigned successfully.' });
      setManagerModalOpen(false);
      await loadAllEmployeeData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reassign manager' });
    }
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request(`/employees/${id}/department`, {
        method: 'PATCH',
        body: JSON.stringify(deptForm),
      });
      setMessage({ type: 'success', text: 'Department transferred successfully.' });
      setDeptModalOpen(false);
      await loadAllEmployeeData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to transfer department' });
    }
  };

  const handleDesigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request(`/employees/${id}/designation`, {
        method: 'PATCH',
        body: JSON.stringify(desigForm),
      });
      setMessage({ type: 'success', text: 'Designation updated successfully.' });
      setDesigModalOpen(false);
      await loadAllEmployeeData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change designation' });
    }
  };

  const handleLocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request(`/employees/${id}/location`, {
        method: 'PATCH',
        body: JSON.stringify(locForm),
      });
      setMessage({ type: 'success', text: 'Work location transferred successfully.' });
      setLocModalOpen(false);
      await loadAllEmployeeData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to transfer location' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] p-8 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-[#DC2626] mb-3 opacity-60" />
        <h2 className="text-lg font-bold text-[#0F172A]">Employee record not found</h2>
        <Link
          href="/employees"
          className="mt-4 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const { employee, directReporteesCount, departmentHead, reportingHierarchy } = profileData;

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
      {/* Top Breadcrumb Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/employees"
              className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
              title="Back to Directory"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2 text-xs text-[#64748B]">
              <Link href="/employees" className="hover:underline">
                Employees
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#0F172A]">{employee.fullName}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isHrOrAdmin && (
              <>
                <Link
                  href={`/employees/${id}/edit`}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] rounded-lg transition-colors shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setStatusForm({
                      status: employee.status,
                      effectiveDate: new Date().toISOString().split('T')[0],
                      remarks: '',
                      exitReason: employee.exitReason || '',
                    });
                    setStatusModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Change Status</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-xs border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                : 'bg-red-50 text-[#DC2626] border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-current hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-20 h-20 rounded-2xl bg-[#E0E7FF] text-[#1E3A8A] border-2 border-indigo-200 flex items-center justify-center font-bold text-xl flex-shrink-0">
                {employee.firstName.charAt(0)}
                {employee.lastName.charAt(0)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-[#0F172A]">{employee.fullName}</h1>
                  <span className="font-mono text-xs font-semibold text-[#1E3A8A] bg-slate-100 px-2 py-0.5 rounded">
                    {employee.employeeCode}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                      employee.status,
                    )}`}
                  >
                    {employee.status}
                  </span>
                  <span className="text-xs font-medium text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                    {employee.employmentType.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#475569]">
                  <span className="font-semibold text-[#0F172A]">
                    {employee.designationName}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{employee.departmentName}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{employee.locationName}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#64748B]">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{employee.workEmail}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{employee.phone}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics / Summary */}
            <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-center">
              <div>
                <span className="text-[11px] font-semibold text-[#64748B] block uppercase tracking-wider">
                  Joined
                </span>
                <span className="text-sm font-bold text-[#0F172A] mt-0.5 block">
                  {employee.dateOfJoining}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748B] block uppercase tracking-wider">
                  Direct Team
                </span>
                <span className="text-sm font-bold text-[#0F172A] mt-0.5 block">
                  {directReporteesCount} Reportee(s)
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748B] block uppercase tracking-wider">
                  Grade Level
                </span>
                <span className="text-sm font-bold text-[#0F172A] mt-0.5 block">
                  {employee.gradeLevel ? `L${employee.gradeLevel}` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HR Quick Actions Strip (Transfer / Reassign) */}
        {isHrOrAdmin && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-[#475569] flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>HR Administrative Actions:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setManagerForm({
                    reportingManagerId: employee.reportingManagerId || '',
                    effectiveDate: new Date().toISOString().split('T')[0],
                    remarks: '',
                  });
                  setManagerModalOpen(true);
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] rounded-lg font-medium transition-colors"
              >
                Reassign Manager
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeptForm({
                    departmentId: employee.departmentId,
                    effectiveDate: new Date().toISOString().split('T')[0],
                    remarks: '',
                  });
                  setDeptModalOpen(true);
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] rounded-lg font-medium transition-colors"
              >
                Transfer Department
              </button>

              <button
                type="button"
                onClick={() => {
                  setDesigForm({
                    designationId: employee.designationId,
                    effectiveDate: new Date().toISOString().split('T')[0],
                    remarks: '',
                  });
                  setDesigModalOpen(true);
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] rounded-lg font-medium transition-colors"
              >
                Change Designation
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocForm({
                    locationId: employee.locationId,
                    effectiveDate: new Date().toISOString().split('T')[0],
                    remarks: '',
                  });
                  setLocModalOpen(true);
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] rounded-lg font-medium transition-colors"
              >
                Transfer Location
              </button>
            </div>
          </div>
        )}

        {/* Tabbed Navigation */}
        <div className="flex border-b border-[#E2E8F0] space-x-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: UserCheck },
            { id: 'personal', label: 'Personal Details', icon: Users },
            { id: 'employment', label: 'Employment Details', icon: Briefcase },
            { id: 'reporting', label: 'Reporting Structure', icon: GitBranch },
            { id: 'history', label: 'Employment History', icon: History },
            { id: 'timeline', label: 'Timeline Feed', icon: Clock },
            { id: 'custom', label: 'Custom Fields', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Primary Work Info */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-2">
                  Position & Work Placement
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#64748B] block">Job Title</span>
                    <span className="font-semibold text-[#0F172A] mt-0.5 block">
                      {employee.designationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Department</span>
                    <span className="font-semibold text-[#0F172A] mt-0.5 block">
                      {employee.departmentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Office Location</span>
                    <span className="font-semibold text-[#0F172A] mt-0.5 block">
                      {employee.locationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Grade & Level</span>
                    <span className="font-semibold text-[#0F172A] mt-0.5 block">
                      {employee.gradeName || 'Unassigned'}
                      {employee.gradeLevel ? ` (L${employee.gradeLevel})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Milestone Feed Preview */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Recent Milestones
                  </h3>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className="text-[11px] text-[#1E3A8A] font-semibold hover:underline"
                  >
                    View All Timeline
                  </button>
                </div>

                <div className="space-y-3">
                  {timelineItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 text-xs">
                      <div className="p-1.5 bg-indigo-50 text-[#1E3A8A] rounded-lg mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F172A]">{item.title}</span>
                          <span className="text-[#64748B] font-mono text-[11px]">{item.date}</span>
                        </div>
                        <p className="text-[#475569] mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Reporting Manager Card */}
            <div className="space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-2">
                  Primary Reporting Manager
                </h3>

                {reportingStructure?.manager ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#1E3A8A]">
                        {reportingStructure.manager.firstName.charAt(0)}
                        {reportingStructure.manager.lastName.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/employees/${reportingStructure.manager.id}`}
                          className="font-bold text-xs text-[#0F172A] hover:text-[#1E3A8A] hover:underline"
                        >
                          {reportingStructure.manager.fullName}
                        </Link>
                        <span className="text-[11px] text-[#64748B] block">
                          {reportingStructure.manager.designationName}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#475569] space-y-1 pt-2 border-t border-slate-50">
                      <div>Email: {reportingStructure.manager.workEmail}</div>
                      <div>Phone: {reportingStructure.manager.phone}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#64748B] py-2">
                    No primary manager assigned. This employee reports directly to top executive leadership.
                  </div>
                )}
              </div>

              {/* Department Head Card */}
              {departmentHead && (
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-2">
                    Department Leadership
                  </h3>
                  <div className="text-xs text-[#0F172A] font-semibold">
                    {departmentHead.name}
                  </div>
                  <div className="text-[11px] text-[#64748B]">Department Head</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PERSONAL DETAILS */}
        {activeTab === 'personal' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2">
                Personal & Contact Identification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 text-xs">
                <div>
                  <span className="text-[#64748B] block">Personal Email</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.personalEmail || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Date of Birth</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.dateOfBirth || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Gender</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.gender || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Marital Status</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.maritalStatus || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Blood Group</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.bloodGroup ? employee.bloodGroup.replace('_', ' ') : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Nationality</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.nationality || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2">
                Address Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 text-xs">
                <div>
                  <span className="text-[#64748B] block">Current Address</span>
                  <p className="font-semibold text-[#0F172A] mt-0.5">
                    {employee.currentAddress || '—'}
                  </p>
                  <p className="text-[#64748B] mt-0.5">
                    {[employee.city, employee.state, employee.country, employee.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748B] block">Permanent Address</span>
                  <p className="font-semibold text-[#0F172A] mt-0.5">
                    {employee.permanentAddress || 'Same as current address'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 text-xs">
                <div>
                  <span className="text-[#64748B] block">Contact Person</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.emergencyContactName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Emergency Phone</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.emergencyContactPhone || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Relationship</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.emergencyContactRel || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMPLOYMENT DETAILS */}
        {activeTab === 'employment' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2">
                Official Employment Terms
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 text-xs">
                <div>
                  <span className="text-[#64748B] block">Official Joining Date</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.dateOfJoining}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Probation End Date</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.probationEndDate || 'No probation set'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Employment Agreement</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.employmentType.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Lifecycle Status</span>
                  <span className="font-semibold text-[#0F172A] mt-0.5 block">
                    {employee.status}
                  </span>
                </div>
                {employee.dateOfExit && (
                  <div>
                    <span className="text-[#DC2626] block font-semibold">Exit Date</span>
                    <span className="font-semibold text-[#DC2626] mt-0.5 block">
                      {employee.dateOfExit}
                    </span>
                  </div>
                )}
                {employee.exitReason && (
                  <div className="sm:col-span-2">
                    <span className="text-[#DC2626] block font-semibold">Exit Reason</span>
                    <span className="text-[#0F172A] mt-0.5 block">
                      {employee.exitReason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REPORTING STRUCTURE */}
        {activeTab === 'reporting' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2">
                Reporting Line Upwards
              </h3>
              {reportingHierarchy.length === 0 ? (
                <div className="text-xs text-[#64748B] py-3">
                  This employee does not report to anyone (top of hierarchy).
                </div>
              ) : (
                <div className="flex flex-col space-y-2 mt-4">
                  {reportingHierarchy.map((mgr, idx) => (
                    <div
                      key={mgr.id}
                      className="flex items-center space-x-3 text-xs p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg"
                    >
                      <span className="text-xs font-bold text-[#1E3A8A] w-6">
                        L{reportingHierarchy.length - idx}
                      </span>
                      <div className="flex-1">
                        <Link
                          href={`/employees/${mgr.id}`}
                          className="font-bold text-[#0F172A] hover:underline"
                        >
                          {mgr.name}
                        </Link>
                        <span className="text-[#64748B] ml-2">
                          ({mgr.employeeCode}) — {mgr.designation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2">
                Direct Reportees ({directReporteesCount})
              </h3>
              {reportingStructure?.reportees.length === 0 ? (
                <div className="text-xs text-[#64748B] py-3">
                  This employee does not currently have direct reportees.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {reportingStructure?.reportees.map((rep) => (
                    <Link
                      key={rep.id}
                      href={`/employees/${rep.id}`}
                      className="p-3 border border-[#E2E8F0] rounded-lg hover:border-[#1E3A8A] transition-all bg-white shadow-sm flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#1E3A8A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {rep.firstName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#0F172A] truncate">
                          {rep.fullName}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          {rep.designationName}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: EMPLOYMENT HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">
                Historical Employment Events
              </h3>
              <span className="text-xs text-[#64748B]">
                Immutable audit trail of job, status & organizational changes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-semibold text-[#475569]">
                  <tr>
                    <th className="px-6 py-3.5">Effective Date</th>
                    <th className="px-6 py-3.5">Event Type</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Designation</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {historyRecords.map((hist) => (
                    <tr key={hist.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-mono text-[11px] font-semibold text-[#0F172A]">
                        {hist.effectiveFrom}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-[#1E3A8A]">
                          {hist.eventType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[#475569]">
                        {hist.departmentName || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-[#475569]">
                        {hist.designationName || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-[#475569]">
                        {hist.locationName || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-[#475569]">
                        {hist.employeeStatus || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-[#64748B] max-w-xs truncate">
                        {hist.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3 mb-6">
              Unified Career Milestones
            </h3>

            <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6">
              {timelineItems.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#1E3A8A] border-2 border-white" />
                  <div className="text-xs font-mono text-[#64748B] mb-0.5">{item.date}</div>
                  <h4 className="text-sm font-bold text-[#0F172A]">{item.title}</h4>
                  <p className="text-xs text-[#475569] mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: CUSTOM FIELDS */}
        {activeTab === 'custom' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3 mb-4">
              Custom Organization Fields
            </h3>
            {Object.keys(employee.customFields || {}).length === 0 ? (
              <div className="text-xs text-[#64748B] py-3">
                No custom attribute fields defined for this employee record.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {Object.entries(employee.customFields || {}).map(([key, val]) => (
                  <div key={key} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[#64748B] block font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-[#0F172A] mt-1 block font-mono">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: CHANGE STATUS */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#0F172A]">Change Employee Status</h3>
              <button onClick={() => setStatusModalOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">New Status *</label>
                <select
                  required
                  value={statusForm.status}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, status: e.target.value as EmployeeStatus })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
                >
                  <option value={EmployeeStatus.ACTIVE}>Active</option>
                  <option value={EmployeeStatus.ON_PROBATION}>On Probation</option>
                  <option value={EmployeeStatus.ON_NOTICE_PERIOD}>On Notice Period</option>
                  <option value={EmployeeStatus.RESIGNED}>Resigned</option>
                  <option value={EmployeeStatus.EXITED}>Exited</option>
                  <option value={EmployeeStatus.TERMINATED}>Terminated</option>
                  <option value={EmployeeStatus.SUSPENDED}>Suspended</option>
                  <option value={EmployeeStatus.INACTIVE}>Inactive</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={statusForm.effectiveDate}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              {[
                EmployeeStatus.RESIGNED,
                EmployeeStatus.EXITED,
                EmployeeStatus.TERMINATED,
              ].includes(statusForm.status) && (
                <div>
                  <label className="block font-semibold text-[#DC2626] mb-1">Exit Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Relocation, Contract Completed, Resigned"
                    value={statusForm.exitReason}
                    onChange={(e) =>
                      setStatusForm({ ...statusForm, exitReason: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Reason for status update..."
                  value={statusForm.remarks}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#475569] hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded-lg"
                >
                  Confirm Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REASSIGN MANAGER */}
      {managerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#0F172A]">Reassign Reporting Manager</h3>
              <button onClick={() => setManagerModalOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleManagerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  New Reporting Manager
                </label>
                <select
                  value={managerForm.reportingManagerId}
                  onChange={(e) =>
                    setManagerForm({ ...managerForm, reportingManagerId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
                >
                  <option value="">None (Top Executive)</option>
                  {candidateManagers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.fullName} ({mgr.employeeCode}) — {mgr.designationName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Circular reporting relationships are automatically prevented.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={managerForm.effectiveDate}
                  onChange={(e) =>
                    setManagerForm({ ...managerForm, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={managerForm.remarks}
                  onChange={(e) =>
                    setManagerForm({ ...managerForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setManagerModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#475569] hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded-lg"
                >
                  Reassign Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER DEPARTMENT */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#0F172A]">Transfer Department</h3>
              <button onClick={() => setDeptModalOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">New Department *</label>
                <select
                  required
                  value={deptForm.departmentId}
                  onChange={(e) =>
                    setDeptForm({ ...deptForm, departmentId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={deptForm.effectiveDate}
                  onChange={(e) =>
                    setDeptForm({ ...deptForm, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={deptForm.remarks}
                  onChange={(e) =>
                    setDeptForm({ ...deptForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#475569] hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded-lg"
                >
                  Transfer Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE DESIGNATION */}
      {desigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#0F172A]">Change Job Designation</h3>
              <button onClick={() => setDesigModalOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleDesigSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  New Job Designation *
                </label>
                <select
                  required
                  value={desigForm.designationId}
                  onChange={(e) =>
                    setDesigForm({ ...desigForm, designationId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
                >
                  <option value="">Select Designation</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={desigForm.effectiveDate}
                  onChange={(e) =>
                    setDesigForm({ ...desigForm, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={desigForm.remarks}
                  onChange={(e) =>
                    setDesigForm({ ...desigForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDesigModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#475569] hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded-lg"
                >
                  Update Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER LOCATION */}
      {locModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#0F172A]">Transfer Office Location</h3>
              <button onClick={() => setLocModalOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleLocSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  New Office Location *
                </label>
                <select
                  required
                  value={locForm.locationId}
                  onChange={(e) =>
                    setLocForm({ ...locForm, locationId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city}, {loc.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={locForm.effectiveDate}
                  onChange={(e) =>
                    setLocForm({ ...locForm, effectiveDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={locForm.remarks}
                  onChange={(e) =>
                    setLocForm({ ...locForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setLocModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#475569] hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded-lg"
                >
                  Transfer Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
