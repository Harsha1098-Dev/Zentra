'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import { ApiClient } from '../../lib/api';
import {
  Building2,
  Users,
  ShieldCheck,
  FileText,
  Mail,
  UserPlus,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  AlertCircle,
  Sliders,
  DollarSign,
  Target,
} from 'lucide-react';
import { PermissionCode, RoleCode } from '@zentra/shared-types';

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    activeOrganization,
    organizations,
    roles,
    permissions,
    isLoading,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'audit' | 'roles'>('overview');
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  // Invite modal state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastInviteResult, setLastInviteResult] = useState<any | null>(null);

  // Check permissions
  const canInviteUsers = permissions.includes(PermissionCode.USER_INVITE);
  const canReadUsers = permissions.includes(PermissionCode.USER_READ);
  const canReadAudit = permissions.includes(PermissionCode.AUDIT_READ);
  const canReadRoles = permissions.includes(PermissionCode.ROLE_READ);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (activeOrganization) {
      loadData();
    }
  }, [activeOrganization]);

  const loadData = async () => {
    if (!activeOrganization) return;

    if (canReadUsers) {
      try {
        const mems = await ApiClient.request(
          `/organizations/${activeOrganization.id}/members`,
        );
        setMembers(mems);
      } catch (err) {
        console.error('Failed to load members', err);
      }

      try {
        const invites = await ApiClient.request(
          `/organizations/${activeOrganization.id}/invitations`,
        );
        setInvitations(invites);
      } catch (err) {
        console.error('Failed to load invitations', err);
      }
    }

    if (canReadRoles) {
      try {
        const rList = await ApiClient.request('/roles');
        setAvailableRoles(rList);
        if (rList.length > 0 && !inviteRoleId) {
          // Default to Employee role
          const emp = rList.find((r: any) => r.code === 'EMPLOYEE') || rList[0];
          setInviteRoleId(emp.id);
        }
      } catch (err) {
        console.error('Failed to load roles', err);
      }
    }

    if (canReadAudit) {
      try {
        const logs = await ApiClient.request('/audit-logs?limit=30');
        setAuditLogs(logs.items || []);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      }
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;
    setInviteLoading(true);
    setInviteError(null);
    setLastInviteResult(null);

    try {
      const res = await ApiClient.request(
        `/organizations/${activeOrganization.id}/invitations`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail.trim(),
            roleId: inviteRoleId,
            firstName: inviteFirstName.trim() || undefined,
            lastName: inviteLastName.trim() || undefined,
          }),
        },
      );

      setLastInviteResult(res);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      await loadData();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] px-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <Building2 className="w-12 h-12 text-[#1E3A8A] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0F172A]">No Active Organization</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Please select an organization workspace to proceed to the dashboard.
          </p>
          <div className="mt-6">
            <Link
              href="/select-organization"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-sm font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              <span>Select Organization</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryRole = roles[0] || 'EMPLOYEE';

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB]">
      {/* Top Navbar */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-base shadow-sm">
                Z
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">Zentra</span>
            </Link>

            {/* Active Organization Pill & Switcher */}
            <div className="flex items-center space-x-2 pl-4 border-l border-[#E2E8F0]">
              <div className="w-7 h-7 rounded-md bg-[#E0E7FF] text-[#1E3A8A] flex items-center justify-center font-bold text-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#0F172A] leading-none">
                  {activeOrganization.name}
                </span>
                <span className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                  slug: {activeOrganization.slug}
                </span>
              </div>

              {organizations.length > 1 && (
                <Link
                  href="/select-organization"
                  className="ml-2 text-xs text-[#1E3A8A] hover:underline font-medium px-2 py-0.5 rounded bg-slate-100"
                >
                  Switch
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/employees"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employees</span>
            </Link>

            <Link
              href="/my-team"
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>My Team</span>
            </Link>

            <Link
              href="/my-profile"
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>My Profile</span>
            </Link>

            <Link
              href="/approvals/pending"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Approvals</span>
            </Link>

            <Link
              href="/leave"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Leave</span>
            </Link>

            <Link
              href="/attendance"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Attendance</span>
            </Link>

            <Link
              href="/payroll"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0F172A] text-white hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payroll</span>
            </Link>

            <Link
              href="/lifecycle"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-[#1E3A8A] border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <span>Lifecycle</span>
            </Link>

            <Link
              href="/performance"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <Target className="w-3.5 h-3.5 text-indigo-700" />
              <span>Performance</span>
            </Link>

            <Link
              href="/settings/workflows"
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Workflows</span>
            </Link>

            <Link
              href="/settings/organization"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#E0E7FF] text-[#1E3A8A] hover:bg-indigo-100 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Org Setup</span>
            </Link>

            {/* User Profile & Role Badge */}
            <div className="flex items-center space-x-3 text-right">
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-[#0F172A]">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : user.email}
                </div>
                <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E0E7FF] text-[#1E3A8A]">
                    {primaryRole}
                  </span>
                  {user.isEmailVerified ? (
                    <span className="text-[10px] text-[#059669] flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#D97706] flex items-center">
                      <Clock className="w-3 h-3 mr-0.5" /> Unverified
                    </span>
                  )}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 border border-[#E2E8F0] flex items-center justify-center text-xs font-bold text-[#475569]">
                {user.email.substring(0, 2).toUpperCase()}
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-[#64748B] hover:text-[#DC2626] rounded-lg hover:bg-slate-100 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Navigation Tabs based on Role Permissions */}
        <div className="flex border-b border-[#E2E8F0] mb-8 space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'overview'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Workspace Overview</span>
          </button>

          {canReadUsers && (
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
                activeTab === 'members'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team & Invitations</span>
            </button>
          )}

          {canReadRoles && (
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
                activeTab === 'roles'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Roles & Permissions</span>
            </button>
          )}

          {canReadAudit && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
                activeTab === 'audit'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          )}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Identity & Multi-tenant banner */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1E3A8A] border border-blue-200 mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Multi-Tenant Architecture Active</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    Welcome, {user.firstName || user.email}!
                  </h2>
                  <p className="mt-1 text-sm text-[#475569]">
                    You are accessing <strong className="text-[#0F172A]">{activeOrganization.name}</strong> under the role <strong className="text-[#1E3A8A]">{primaryRole}</strong>.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs">
                    <span className="text-[#64748B] block">Global Identity Email</span>
                    <span className="font-semibold text-[#0F172A] font-mono">{user.email}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs">
                    <span className="text-[#64748B] block">Active Tenant ID</span>
                    <span className="font-semibold text-[#0F172A] font-mono">
                      {activeOrganization.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Subscriptions & Entitlements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product 1: Zentra People */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-[#059669] border border-emerald-200">
                      TRIAL ACTIVE (30 Days)
                    </span>
                    <h3 className="text-lg font-bold text-[#0F172A] mt-2">Zentra People</h3>
                    <p className="text-xs text-[#475569] mt-1">
                      Core HRMS, identity governance, employee directories, and organization memberships.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <Link
                    href="/employees"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] rounded text-xs font-semibold"
                  >
                    <Users className="w-3 h-3" />
                    <span>Employees Directory</span>
                  </Link>
                  <Link
                    href="/employees/new"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 rounded text-xs font-semibold"
                  >
                    <span>+ Add Employee</span>
                  </Link>
                  <Link
                    href="/employees/import"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded text-xs font-semibold"
                  >
                    <span>Import CSV</span>
                  </Link>
                  <Link
                    href="/employees/export"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded text-xs font-semibold"
                  >
                    <span>Export</span>
                  </Link>
                  <Link
                    href="/attendance"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded text-xs font-semibold border border-amber-200"
                  >
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>Attendance & Shifts</span>
                  </Link>
                  <Link
                    href="/performance"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 rounded text-xs font-semibold border border-indigo-200"
                  >
                    <Target className="w-3 h-3 text-indigo-700" />
                    <span>Performance & Goals</span>
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                  <span>Entitlement: <strong>Active</strong></span>
                  <Link
                    href="/settings/organization"
                    className="text-[#1E3A8A] font-semibold hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Org Setup</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Product 2: Zentra Payroll */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      LIVE PRODUCT
                    </span>
                    <h3 className="text-lg font-bold text-[#0F172A] mt-2">Zentra Payroll</h3>
                    <p className="text-xs text-[#475569] mt-1">
                      Automated monthly salary calculation, formulas, cutoffs, bank payment processing, and payslips.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/payroll/payroll-runs"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded text-xs font-semibold"
                  >
                    <span>Payroll Runs</span>
                  </Link>
                  <Link
                    href="/payroll/salary-structures"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded text-xs font-semibold"
                  >
                    <span>Structures</span>
                  </Link>
                  <Link
                    href="/my-payslips"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded text-xs font-semibold"
                  >
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>My Payslips</span>
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                  <span>Identity rule: <strong>Shared Global Identity</strong></span>
                  <Link
                    href="/payroll"
                    className="text-[#1E3A8A] font-semibold hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Manage Payroll</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Organization Setup Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white mb-2">
                  REQUIRED SETUP
                </span>
                <h3 className="text-lg font-bold">Company Structure & Organization Setup</h3>
                <p className="text-xs text-blue-100 mt-1 max-w-xl">
                  Configure your company profile, headquarters and office locations, department trees, job designations, seniority grades, workweek timings, and holiday calendars before onboarding employees.
                </p>
              </div>
              <Link
                href="/settings/organization"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-[#1E3A8A] hover:bg-blue-50 font-semibold text-xs rounded-lg transition-colors shadow flex-shrink-0"
              >
                <Sliders className="w-4 h-4" />
                <span>Open Organization Setup</span>
              </Link>
            </div>

            {/* Restricted Module Warning for lower roles */}
            {!canInviteUsers && (
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-start space-x-3 text-xs text-[#475569]">
                <Lock className="w-4 h-4 text-[#64748B] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0F172A]">Role Scoped Access:</strong> You are currently logged in as an <strong className="text-[#1E3A8A]">{primaryRole}</strong>.
                  Administrative modules (team invitations, role configurations, and audit logs) are restricted according to your role permissions.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEAM & INVITATIONS */}
        {activeTab === 'members' && canReadUsers && (
          <div className="space-y-8">
            {/* Invite Form Card */}
            {canInviteUsers && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <UserPlus className="w-5 h-5 text-[#1E3A8A]" />
                  <h3 className="text-base font-bold text-[#0F172A]">Invite Employee by Email</h3>
                </div>
                <p className="text-xs text-[#475569] mb-4">
                  If the user already has a Zentra account in another organization, they will be linked without creating a duplicate user identity.
                </p>

                {inviteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-[#DC2626] rounded-lg">
                    {inviteError}
                  </div>
                )}

                {lastInviteResult && (
                  <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-xs text-[#059669] rounded-lg">
                    <p className="font-semibold">
                      Invitation dispatched to {lastInviteResult.email}!
                    </p>
                    <p className="mt-1 text-slate-700">
                      User type: {lastInviteResult.isNewUser ? 'New user account created' : 'Linked to existing global identity'}
                    </p>
                    {lastInviteResult.token && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 text-slate-800">
                        <span className="font-semibold text-[11px] block">Test / Mock Accept Link:</span>
                        <Link
                          href={`/invite/accept?token=${lastInviteResult.token}`}
                          className="font-mono text-xs text-[#1E3A8A] underline hover:text-[#1D4ED8]"
                        >
                          /invite/accept?token={lastInviteResult.token}
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSendInvite} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="employee@domain.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane"
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Role *
                    </label>
                    <select
                      value={inviteRoleId}
                      onChange={(e) => setInviteRoleId(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                    >
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="w-full py-2 px-4 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-sm focus:outline-none disabled:opacity-50 transition"
                    >
                      {inviteLoading ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Active Members Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A]">Organization Members</h3>
                <span className="text-xs text-[#64748B]">{members.length} members</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#475569]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">User</th>
                      <th className="py-2.5 px-4 font-semibold">Role</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">Joined At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {members.map((m) => (
                      <tr key={m.membershipId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#0F172A]">
                            {m.user?.firstName || m.user?.lastName
                              ? `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim()
                              : 'Pending setup'}
                          </div>
                          <div className="text-[11px] text-[#64748B] font-mono">{m.user?.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {m.roles?.map((r: any) => (
                              <span
                                key={r.id}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E0E7FF] text-[#1E3A8A]"
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              m.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-[#059669]'
                                : 'bg-amber-50 text-[#D97706]'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Invited'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Invitations Table */}
            {invitations.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A]">Pending Invitations</h3>
                  <span className="text-xs text-[#64748B]">{invitations.length} invitations</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#475569]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Invited Email</th>
                        <th className="py-2.5 px-4 font-semibold">Assigned Role</th>
                        <th className="py-2.5 px-4 font-semibold">Invited By</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {invitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-medium text-[#0F172A]">
                            {inv.email}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E0E7FF] text-[#1E3A8A]">
                              {inv.role?.name || 'Employee'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {inv.invitedByUser?.email}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                inv.status === 'ACCEPTED'
                                  ? 'bg-emerald-50 text-[#059669]'
                                  : inv.status === 'EXPIRED'
                                  ? 'bg-red-50 text-[#DC2626]'
                                  : 'bg-amber-50 text-[#D97706]'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROLES & PERMISSIONS */}
        {activeTab === 'roles' && canReadRoles && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#0F172A]">Roles & Permissions Matrix</h3>
              <p className="text-xs text-[#475569] mt-1">
                Roles define what actions members can execute in this organization. Roles and permissions are strictly tenant-scoped.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRoles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 border border-[#E2E8F0] rounded-lg bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#0F172A]">{role.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E0E7FF] text-[#1E3A8A]">
                        {role.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-3">{role.description}</p>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-semibold text-[#475569] block mb-1.5">
                        Granted Permissions:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((perm: string) => (
                          <span
                            key={perm}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E2E8F0] text-[#0F172A]"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && canReadAudit && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Organization Audit Logs</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Sensitive actions are permanently recorded. Passwords and secret tokens are never logged.
                </p>
              </div>
              <span className="text-xs text-[#64748B]">{auditLogs.length} events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#475569]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-4 font-semibold">Action</th>
                    <th className="py-2.5 px-4 font-semibold">Actor</th>
                    <th className="py-2.5 px-4 font-semibold">Entity</th>
                    <th className="py-2.5 px-4 font-semibold">Changes & Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-500">
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 font-mono text-[11px]">
                        <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#0F172A] border border-[#E2E8F0]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#0F172A]">
                          {log.actorEmail || log.actorUserId || 'System'}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {log.entityType}:{log.entityId.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-[#475569] max-w-xs truncate">
                          {log.newValues ? JSON.stringify(log.newValues) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
