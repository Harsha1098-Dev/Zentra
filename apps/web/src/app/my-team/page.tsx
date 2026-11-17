'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserCheck,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/auth-context';
import { EmployeeProfileDto, EmployeeDto } from '@zentra/shared-types';

export default function MyTeamPage() {
  const { user, activeOrganization } = useAuth();

  const [loading, setLoading] = useState(true);
  const [managerProfile, setManagerProfile] = useState<EmployeeProfileDto | null>(null);
  const [reportees, setReportees] = useState<EmployeeDto[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        setError(null);

        // Fetch current user's employee profile
        const myProfile = await ApiClient.request<EmployeeProfileDto | null>('/employees/me');
        setManagerProfile(myProfile);

        if (myProfile && myProfile.employee) {
          // Fetch direct and indirect reportees
          const team = await ApiClient.request<EmployeeDto[]>(
            `/employees/${myProfile.employee.id}/reportees`,
          );
          setReportees(team || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    }

    if (activeOrganization) {
      loadTeam();
    }
  }, [activeOrganization]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-[#1E3A8A]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-sm">Loading team directory...</span>
        </div>
      </div>
    );
  }

  // If user doesn't have an employee profile yet
  if (!managerProfile) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
        <header className="bg-white border-b border-[#E2E8F0] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <span className="text-base font-bold text-[#0F172A]">Zentra People • My Team</span>
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
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Team Portal Inactive</h2>
            <p className="text-xs text-[#64748B] leading-relaxed mb-6">
              You do not have an active employee record linked to your user account in this organization. Team management is available for recognized employees and managers.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] transition shadow-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const manager = managerProfile.employee;

  // Filter reportees based on search & status
  const filteredReportees = reportees.filter((rep) => {
    const matchesSearch =
      search === '' ||
      `${rep.firstName} ${rep.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      rep.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      rep.workEmail.toLowerCase().includes(search.toLowerCase()) ||
      (rep.designationName && rep.designationName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === '' || rep.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold flex items-center space-x-1"
            >
              <span>Dashboard</span>
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-xs font-bold text-[#0F172A]">My Team Portal</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/my-profile"
              className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#1E3A8A] hover:bg-blue-50 rounded-lg text-xs font-semibold bg-white transition"
            >
              My Profile
            </Link>
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
        {/* Manager Header Banner */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-indigo-600 text-white flex items-center justify-center text-lg font-bold">
                {manager.firstName[0]}
                {manager.lastName[0]}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold text-[#0F172A]">
                    {manager.firstName} {manager.lastName}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                    {manager.employeeCode}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {manager.designationName || 'Manager'} • {manager.departmentName || 'Department'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[120px]">
                <span className="text-[10px] uppercase font-bold text-[#1E3A8A] block">
                  Total Reportees
                </span>
                <span className="text-xl font-bold text-[#1E3A8A]">{reportees.length}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center min-w-[120px]">
                <span className="text-[10px] uppercase font-bold text-[#059669] block">
                  Active in Team
                </span>
                <span className="text-xl font-bold text-[#059669]">
                  {reportees.filter((r) => r.status === 'ACTIVE').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-xs text-[#DC2626]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team members by name, email, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white text-[#0F172A]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_PROBATION">On Probation</option>
              <option value="ON_NOTICE_PERIOD">On Notice Period</option>
              <option value="ON_LONG_LEAVE">On Long Leave</option>
            </select>
          </div>
        </div>

        {/* Team Grid */}
        {filteredReportees.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-sm">
            <Users className="w-10 h-10 text-[#64748B] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#0F172A]">
              {reportees.length === 0 ? 'No Team Members Assigned' : 'No Reportees Match Search'}
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              {reportees.length === 0
                ? 'Employees assigned with you as their reporting manager will automatically show up in this leadership portal.'
                : 'Try adjusting your search criteria or resetting filters to find reportees.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReportees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:border-[#1E3A8A]/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#1E3A8A] flex items-center justify-center font-bold text-sm">
                        {emp.firstName[0]}
                        {emp.lastName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A]">
                          {emp.firstName} {emp.lastName}
                        </h4>
                        <span className="font-mono text-[11px] text-[#64748B]">
                          {emp.employeeCode}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-[#059669] border border-emerald-200'
                          : 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-[#475569]">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{emp.designationName || 'Designation not assigned'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{emp.departmentName || 'Department not assigned'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="truncate">{emp.workEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{emp.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{emp.locationName || 'Headquarters'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">
                    Type: <strong>{emp.employmentType}</strong>
                  </span>
                  <Link
                    href={`/employees/${emp.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-[#1E3A8A] hover:underline"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
