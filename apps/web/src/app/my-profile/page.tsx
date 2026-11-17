'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Layers,
  HeartPulse,
  Home,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import {
  EmployeeProfileDto,
  EmployeeTimelineItemDto,
  ReportingStructureDto,
} from '@zentra/shared-types';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, activeOrganization } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EmployeeProfileDto | null>(null);
  const [timeline, setTimeline] = useState<EmployeeTimelineItemDto[]>([]);
  const [reportingStructure, setReportingStructure] = useState<ReportingStructureDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'job' | 'emergency' | 'timeline'>('overview');

  useEffect(() => {
    async function loadMyProfile() {
      try {
        setLoading(true);
        setError(null);
        const data = await ApiClient.request<EmployeeProfileDto | null>('/employees/me');
        setProfile(data);

        if (data && data.employee) {
          const [tlRes, rsRes] = await Promise.allSettled([
            ApiClient.request<EmployeeTimelineItemDto[]>(`/employees/${data.employee.id}/timeline`),
            ApiClient.request<ReportingStructureDto>(`/employees/${data.employee.id}/reporting-structure`),
          ]);
          if (tlRes.status === 'fulfilled') setTimeline(tlRes.value || []);
          if (rsRes.status === 'fulfilled') setReportingStructure(rsRes.value || null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    }

    if (activeOrganization) {
      loadMyProfile();
    }
  }, [activeOrganization]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-[#1E3A8A]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-sm">Loading your profile...</span>
        </div>
      </div>
    );
  }

  // Handle case where user does not have a linked employee record in the tenant
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
        <header className="bg-white border-b border-[#E2E8F0] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm">
                Z
              </div>
              <span className="text-base font-bold text-[#0F172A]">Zentra People</span>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-100 text-[#0F172A] hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-4">
              <UserCheck className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">No Employee Profile Found</h2>
            <p className="text-xs text-[#64748B] leading-relaxed mb-6">
              You are signed in as <strong className="text-[#0F172A]">{user?.email}</strong> in{' '}
              <strong className="text-[#0F172A]">{activeOrganization?.name}</strong>, but an HR employee profile has not been linked to your user account yet.
            </p>
            <div className="space-y-3">
              <Link
                href="/employees"
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                <span>Browse Employee Directory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg text-xs font-semibold transition"
              >
                Go to Workspace Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { employee } = profile;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold flex items-center space-x-1"
            >
              <span>Dashboard</span>
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-xs font-bold text-[#0F172A]">My Profile</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Self-Service Active
            </span>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg text-xs font-semibold bg-white transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Profile Card Banner */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </div>

              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl font-bold text-[#0F172A]">{employee.fullName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-[#1E3A8A] border border-blue-200">
                    {employee.employeeCode}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
                    {employee.status}
                  </span>
                </div>

                <p className="text-sm text-[#475569] mt-1 font-medium">
                  {employee.designationName || 'Team Member'} • {employee.departmentName || 'General Department'}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#64748B]">
                  <span className="inline-flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>{employee.workEmail}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>{employee.phone}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>{employee.locationName || 'Headquarters'}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Joined {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs space-y-1 self-start md:self-auto min-w-[220px]">
              <span className="text-[#64748B] block font-semibold uppercase text-[10px] tracking-wider">
                Direct Manager
              </span>
              {employee.reportingManagerName ? (
                <div>
                  <div className="font-bold text-[#0F172A]">{employee.reportingManagerName}</div>
                </div>
              ) : (
                <span className="text-[#64748B] italic">Top of Organization / No Manager</span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2E8F0] space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'personal'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal & Address</span>
          </button>

          <button
            onClick={() => setActiveTab('job')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'job'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Employment Details</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'emergency'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-[#DC2626]" />
            <span>Emergency Contact</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'timeline'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Timeline Feed</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-3 border-b border-[#E2E8F0]">
                Quick Summary
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Employment Type</span>
                  <span className="font-semibold text-[#0F172A]">{employee.employmentType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Department</span>
                  <span className="font-semibold text-[#0F172A]">{employee.departmentName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Designation</span>
                  <span className="font-semibold text-[#0F172A]">{employee.designationName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Base Location</span>
                  <span className="font-semibold text-[#0F172A]">{employee.locationName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Probation Status</span>
                  <span className="font-semibold text-[#0F172A]">
                    {employee.probationEndDate
                      ? `Ends on ${new Date(employee.probationEndDate).toLocaleDateString()}`
                      : 'Completed / Not Applicable'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-3 border-b border-[#E2E8F0]">
                Reporting Line & Hierarchy
              </h3>
              <div className="space-y-4">
                {reportingStructure?.manager ? (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#1E3A8A] uppercase block">Direct Manager</span>
                      <span className="font-bold text-[#0F172A]">
                        {reportingStructure.manager.firstName} {reportingStructure.manager.lastName}
                      </span>
                      <span className="text-[#64748B] block text-[11px]">{reportingStructure.manager.workEmail}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B]">You report directly to top leadership.</p>
                )}

                <div>
                  <span className="text-[11px] font-bold text-[#0F172A] uppercase block mb-2">
                    Direct Reportees ({reportingStructure?.reportees ? reportingStructure.reportees.length : profile.directReporteesCount})
                  </span>
                  {reportingStructure?.reportees && reportingStructure.reportees.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-[#E2E8F0] rounded-lg">
                      {reportingStructure.reportees.map((rep) => (
                        <div key={rep.id} className="p-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#0F172A]">
                            {rep.firstName} {rep.lastName}
                          </span>
                          <span className="text-[#64748B] font-mono text-[11px]">{rep.employeeCode}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] italic">No direct reportees.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Personal & Address */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-3 border-b border-[#E2E8F0]">
                Personal Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-[#64748B] block">Personal Email</span>
                  <span className="font-semibold text-[#0F172A]">{employee.personalEmail || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Date of Birth</span>
                  <span className="font-semibold text-[#0F172A]">
                    {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Gender</span>
                  <span className="font-semibold text-[#0F172A]">{employee.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Marital Status</span>
                  <span className="font-semibold text-[#0F172A]">{employee.maritalStatus || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Blood Group</span>
                  <span className="font-semibold text-[#0F172A]">{employee.bloodGroup || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Nationality</span>
                  <span className="font-semibold text-[#0F172A]">{employee.nationality || '—'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-3 text-xs">
                <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
                  Current Residence Address
                </h3>
                <p className="text-[#0F172A] leading-relaxed">
                  {employee.currentAddress || 'No current address provided'}
                  <br />
                  {[employee.city, employee.state, employee.country, employee.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-3 text-xs">
                <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
                  Permanent Address
                </h3>
                <p className="text-[#0F172A] leading-relaxed">
                  {employee.permanentAddress || 'No permanent address provided'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Job Details */}
        {activeTab === 'job' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-3 border-b border-[#E2E8F0]">
              Employment Profile & Placement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-[#64748B] block">Employee Code</span>
                <span className="font-mono font-bold text-[#0F172A]">{employee.employeeCode}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Joining Date</span>
                <span className="font-semibold text-[#0F172A]">
                  {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Employment Type</span>
                <span className="font-semibold text-[#0F172A]">{employee.employmentType}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Department</span>
                <span className="font-semibold text-[#0F172A]">{employee.departmentName || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Designation</span>
                <span className="font-semibold text-[#0F172A]">{employee.designationName || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Base Location</span>
                <span className="font-semibold text-[#0F172A]">{employee.locationName || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Seniority Grade</span>
                <span className="font-semibold text-[#0F172A]">{employee.gradeName || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Lifecycle Status</span>
                <span className="font-semibold text-[#0F172A]">{employee.status}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Probation End Date</span>
                <span className="font-semibold text-[#0F172A]">
                  {employee.probationEndDate ? new Date(employee.probationEndDate).toLocaleDateString() : 'Completed / N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Emergency Contact */}
        {activeTab === 'emergency' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider pb-3 border-b border-[#E2E8F0] flex items-center space-x-2">
              <HeartPulse className="w-4 h-4" />
              <span>Primary Emergency Contact</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-[#64748B] block">Contact Person</span>
                <span className="font-bold text-[#0F172A]">{employee.emergencyContactName || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Phone Number</span>
                <span className="font-semibold text-[#0F172A]">{employee.emergencyContactPhone || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Relationship</span>
                <span className="font-semibold text-[#0F172A]">{employee.emergencyContactRel || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Timeline Feed */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-3 border-b border-[#E2E8F0]">
              My Employment Timeline ({timeline.length} Events)
            </h3>
            {timeline.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No timeline events recorded yet.</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E2E8F0]">
                {timeline.map((item) => (
                  <div key={item.id} className="relative flex items-start space-x-4 pl-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#1E3A8A] ring-4 ring-white flex-shrink-0 mt-1" />
                    <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl flex-1 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#0F172A]">{item.title}</span>
                        <span className="text-[#64748B] font-mono text-[11px]">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[#475569]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
