'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../lib/api';
import {
  Building2,
  MapPin,
  GitBranch,
  Briefcase,
  Layers,
  Calendar,
  Sun,
  Network,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  CompanyProfileDto,
  LocationDto,
  DepartmentDto,
  DesignationDto,
  GradeDto,
  WorkweekDto,
  HolidayDto,
} from '@zentra/shared-types';

export default function OrganizationSetupOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyProfileDto | null>(null);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [grades, setGrades] = useState<GradeDto[]>([]);
  const [workweek, setWorkweek] = useState<WorkweekDto | null>(null);
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setLoading(true);
    try {
      const [
        profileRes,
        locationsRes,
        departmentsRes,
        designationsRes,
        gradesRes,
        workweekRes,
        holidaysRes,
      ] = await Promise.allSettled([
        ApiClient.request<CompanyProfileDto>('/organizations/current/profile'),
        ApiClient.request<LocationDto[]>('/locations'),
        ApiClient.request<DepartmentDto[]>('/departments'),
        ApiClient.request<DesignationDto[]>('/designations'),
        ApiClient.request<GradeDto[]>('/grades'),
        ApiClient.request<WorkweekDto>('/workweek'),
        ApiClient.request<HolidayDto[]>('/holidays'),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (locationsRes.status === 'fulfilled') setLocations(locationsRes.value);
      if (departmentsRes.status === 'fulfilled') setDepartments(departmentsRes.value);
      if (designationsRes.status === 'fulfilled') setDesignations(designationsRes.value);
      if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value);
      if (workweekRes.status === 'fulfilled') setWorkweek(workweekRes.value);
      if (holidaysRes.status === 'fulfilled') setHolidays(holidaysRes.value);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 'profile',
      title: 'Company Profile',
      desc: profile?.legalName
        ? `${profile.name} (${profile.legalName})`
        : profile?.name || 'Set legal name, contact & logo',
      done: Boolean(profile?.name && (profile?.legalName || profile?.country)),
      href: '/settings/organization/profile',
      icon: Building2,
      count: profile?.logoUrl ? 'Logo Uploaded' : 'Pending Logo',
    },
    {
      id: 'locations',
      title: 'Locations & HQ',
      desc: locations.length > 0
        ? `${locations.length} location(s) configured`
        : 'Define offices, branches and headquarters',
      done: locations.length > 0 && locations.some((l) => l.isHeadquarters),
      href: '/settings/organization/locations',
      icon: MapPin,
      count: `${locations.length} Locations`,
    },
    {
      id: 'departments',
      title: 'Departments Hierarchy',
      desc: departments.length > 0
        ? `${departments.length} department(s) active`
        : 'Configure department tree and structure',
      done: departments.length > 0,
      href: '/settings/organization/departments',
      icon: GitBranch,
      count: `${departments.length} Departments`,
    },
    {
      id: 'grades',
      title: 'Grades & Bands',
      desc: grades.length > 0
        ? `${grades.length} grade level(s) active`
        : 'Set hierarchy bands (L1, L2, L3...)',
      done: grades.length > 0,
      href: '/settings/organization/grades',
      icon: Layers,
      count: `${grades.length} Grades`,
    },
    {
      id: 'designations',
      title: 'Designations',
      desc: designations.length > 0
        ? `${designations.length} job title(s) active`
        : 'Assign titles, departments & grade levels',
      done: designations.length > 0,
      href: '/settings/organization/designations',
      icon: Briefcase,
      count: `${designations.length} Designations`,
    },
    {
      id: 'workweek',
      title: 'Workweek Schedule',
      desc: workweek
        ? `${workweek.weeklyWorkingDays.length} working days (${workweek.dailyStartTime} - ${workweek.dailyEndTime})`
        : 'Configure working days, hours and breaks',
      done: Boolean(workweek && workweek.weeklyWorkingDays.length > 0),
      href: '/settings/organization/workweek',
      icon: Calendar,
      count: workweek ? `${workweek.weeklyWorkingDays.length} Working Days` : 'Default 5 Days',
    },
    {
      id: 'holidays',
      title: 'Holiday Calendar',
      desc: holidays.length > 0
        ? `${holidays.length} holiday(s) declared for this year`
        : 'Add public and restricted holidays',
      done: holidays.length > 0,
      href: '/settings/organization/holidays',
      icon: Sun,
      count: `${holidays.length} Holidays`,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Organization Setup</h1>
          <p className="text-sm text-[#475569] mt-1">
            Configure your company structure, hierarchy, locations, and schedules before adding employees.
          </p>
        </div>
        <Link
          href="/settings/organization/chart"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#E0E7FF] text-[#1E3A8A] hover:bg-indigo-100 font-semibold text-sm rounded-lg transition-colors border border-indigo-200"
        >
          <Network className="w-4 h-4" />
          <span>View Organization Chart</span>
        </Link>
      </div>

      {/* Readiness Progress Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-[#1E3A8A]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                Setup Readiness: {progressPercent}%
              </h2>
              <p className="text-xs text-[#64748B]">
                {completedCount} of {steps.length} setup areas configured
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              progressPercent === 100
                ? 'bg-emerald-50 text-[#059669] border border-emerald-200'
                : 'bg-amber-50 text-[#D97706] border border-amber-200'
            }`}
          >
            {progressPercent === 100 ? 'Ready for Employees' : 'Configuration in Progress'}
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
          <div
            className="bg-[#1E3A8A] h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Setup Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.href}
              className="group bg-white border border-[#E2E8F0] hover:border-[#1E3A8A] rounded-xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-[#F6F8FB] group-hover:bg-[#E0E7FF] text-[#1E3A8A] rounded-lg transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  {step.done ? (
                    <span className="flex items-center text-xs font-medium text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Configured
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-medium text-[#64748B] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Action Needed
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-[#475569] mt-1 line-clamp-2">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[#64748B] font-medium">{step.count}</span>
                <span className="text-[#1E3A8A] font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                  Configure <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Summary Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#0F172A] mb-4">Structure Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#F6F8FB] p-4 rounded-lg">
            <span className="text-xs text-[#64748B] block font-medium">Locations</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-1 block">{locations.length}</span>
            <span className="text-xs text-[#475569] mt-0.5 block">
              {locations.find((l) => l.isHeadquarters)?.city || 'HQ not marked'}
            </span>
          </div>

          <div className="bg-[#F6F8FB] p-4 rounded-lg">
            <span className="text-xs text-[#64748B] block font-medium">Departments</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-1 block">{departments.length}</span>
            <span className="text-xs text-[#475569] mt-0.5 block">Active divisions</span>
          </div>

          <div className="bg-[#F6F8FB] p-4 rounded-lg">
            <span className="text-xs text-[#64748B] block font-medium">Designations</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-1 block">{designations.length}</span>
            <span className="text-xs text-[#475569] mt-0.5 block">Job profiles</span>
          </div>

          <div className="bg-[#F6F8FB] p-4 rounded-lg">
            <span className="text-xs text-[#64748B] block font-medium">Grades & Levels</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-1 block">{grades.length}</span>
            <span className="text-xs text-[#475569] mt-0.5 block">Bands configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
