'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';
import {
  UserPlus,
  ChevronLeft,
  Sparkles,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  Users,
  Calendar,
  Mail,
  Phone,
  Home,
  HeartHandshake,
} from 'lucide-react';
import {
  DepartmentDto,
  LocationDto,
  DesignationDto,
  GradeDto,
  EmployeeBasicDto,
  EmploymentType,
  Gender,
  MaritalStatus,
  BloodGroup,
} from '@zentra/shared-types';

export default function CreateEmployeePage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lookups
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [grades, setGrades] = useState<GradeDto[]>([]);
  const [candidateManagers, setCandidateManagers] = useState<EmployeeBasicDto[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    workEmail: '',
    personalEmail: '',
    phone: '',
    employeeCode: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    probationEndDate: '',
    employmentType: EmploymentType.FULL_TIME,
    dateOfBirth: '',
    gender: '' as Gender | '',
    maritalStatus: '' as MaritalStatus | '',
    bloodGroup: '' as BloodGroup | '',
    nationality: '',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRel: '',
    locationId: '',
    departmentId: '',
    designationId: '',
    gradeId: '',
    reportingManagerId: '',
    sendInvitation: true,
  });

  useEffect(() => {
    loadLookups();
  }, [activeOrganization]);

  const loadLookups = async () => {
    if (!activeOrganization) return;
    setLoadingLookups(true);
    try {
      const [deptRes, locRes, desigRes, gradeRes, empRes] = await Promise.allSettled([
        ApiClient.request<DepartmentDto[]>('/departments?status=ACTIVE'),
        ApiClient.request<LocationDto[]>('/locations?status=ACTIVE'),
        ApiClient.request<DesignationDto[]>('/designations?status=ACTIVE'),
        ApiClient.request<GradeDto[]>('/grades?status=ACTIVE'),
        ApiClient.request<{ data: EmployeeBasicDto[] }>('/employees?limit=100&status=ACTIVE'),
      ]);

      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value);
      if (locRes.status === 'fulfilled') setLocations(locRes.value);
      if (desigRes.status === 'fulfilled') setDesignations(desigRes.value);
      if (gradeRes.status === 'fulfilled') setGrades(gradeRes.value);
      if (empRes.status === 'fulfilled') setCandidateManagers(empRes.value.data || []);

      // Auto-fetch next code
      handleAutoGenerateCode();
    } finally {
      setLoadingLookups(false);
    }
  };

  const handleAutoGenerateCode = async () => {
    try {
      const res = await ApiClient.request<{ code: string }>('/employees/next-code');
      if (res.code) {
        setFormData((prev) => ({ ...prev, employeeCode: res.code }));
      }
    } catch {
      // Fallback if sequence not configured yet
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (shouldInvite: boolean) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        workEmail: formData.workEmail.trim().toLowerCase(),
        personalEmail: formData.personalEmail.trim() || undefined,
        phone: formData.phone.trim(),
        employeeCode: formData.employeeCode.trim().toUpperCase() || undefined,
        dateOfJoining: formData.dateOfJoining,
        probationEndDate: formData.probationEndDate || undefined,
        employmentType: formData.employmentType,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        nationality: formData.nationality.trim() || undefined,
        currentAddress: formData.currentAddress.trim() || undefined,
        permanentAddress: formData.permanentAddress.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        emergencyContactName: formData.emergencyContactName.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
        emergencyContactRel: formData.emergencyContactRel.trim() || undefined,
        locationId: formData.locationId,
        departmentId: formData.departmentId,
        designationId: formData.designationId,
        gradeId: formData.gradeId || undefined,
        reportingManagerId: formData.reportingManagerId || undefined,
        sendInvitation: shouldInvite,
      };

      const created = await ApiClient.request<{ id: string }>('/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push(`/employees/${created.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create employee record');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/employees"
              className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
              title="Back to Directory"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">New Employee</h1>
              <p className="text-xs text-[#475569]">
                Create a central personnel profile and optionally trigger invitation onboarding.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#0F172A] rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              Save without Account
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-xs font-semibold text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save & Send Invitation</span>
            </button>
          </div>
        </div>
      </header>

      {/* Form Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Section 1: Basic & Employment Information */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-[#1E3A8A]" />
              <span>General & Employment Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="e.g. Sarah"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="Optional"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="e.g. Connor"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  name="workEmail"
                  required
                  placeholder="sarah.connor@acme.com"
                  value={formData.workEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+1 (555) 019-2831"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Employee Code *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="text-[11px] text-[#1E3A8A] hover:underline flex items-center space-x-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  name="employeeCode"
                  required
                  placeholder="e.g. ZEN-001"
                  value={formData.employeeCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Date of Joining *
                </label>
                <input
                  type="date"
                  name="dateOfJoining"
                  required
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Probation End Date
                </label>
                <input
                  type="date"
                  name="probationEndDate"
                  value={formData.probationEndDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Employment Type *
                </label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value={EmploymentType.FULL_TIME}>Full Time</option>
                  <option value={EmploymentType.PART_TIME}>Part Time</option>
                  <option value={EmploymentType.CONTRACT}>Contractor</option>
                  <option value={EmploymentType.INTERN}>Intern</option>
                  <option value={EmploymentType.TEMPORARY}>Temporary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Organizational Assignments */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#1E3A8A]" />
              <span>Organizational Placement & Hierarchy</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Location (Work Office) *
                </label>
                <select
                  name="locationId"
                  required
                  value={formData.locationId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
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
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Department *
                </label>
                <select
                  name="departmentId"
                  required
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Job Designation *
                </label>
                <select
                  name="designationId"
                  required
                  value={formData.designationId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Job Title</option>
                  {designations.map((desig) => (
                    <option key={desig.id} value={desig.id}>
                      {desig.name} ({desig.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Seniority Grade / Band (Optional)
                </label>
                <select
                  name="gradeId"
                  value={formData.gradeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">None (Unassigned)</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Level {g.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Reporting Manager (Optional)
                </label>
                <select
                  name="reportingManagerId"
                  value={formData.reportingManagerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">None (Top Executive / Independent)</option>
                  {candidateManagers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.fullName} ({mgr.employeeCode}) — {mgr.designationName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Personal Details & Emergency Contacts */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center space-x-2">
              <HeartHandshake className="w-4 h-4 text-[#1E3A8A]" />
              <span>Personal Details & Emergency Contacts</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Personal Email
                </label>
                <input
                  type="email"
                  name="personalEmail"
                  placeholder="personal@gmail.com"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Gender</option>
                  <option value={Gender.FEMALE}>Female</option>
                  <option value={Gender.MALE}>Male</option>
                  <option value={Gender.NON_BINARY}>Non-Binary</option>
                  <option value={Gender.OTHER}>Other</option>
                  <option value={Gender.PREFER_NOT_TO_SAY}>Prefer Not to Say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Marital Status
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Status</option>
                  <option value={MaritalStatus.SINGLE}>Single</option>
                  <option value={MaritalStatus.MARRIED}>Married</option>
                  <option value={MaritalStatus.DIVORCED}>Divorced</option>
                  <option value={MaritalStatus.WIDOWED}>Widowed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Blood Group</option>
                  <option value={BloodGroup.A_POSITIVE}>A+</option>
                  <option value={BloodGroup.A_NEGATIVE}>A-</option>
                  <option value={BloodGroup.B_POSITIVE}>B+</option>
                  <option value={BloodGroup.B_NEGATIVE}>B-</option>
                  <option value={BloodGroup.O_POSITIVE}>O+</option>
                  <option value={BloodGroup.O_NEGATIVE}>O-</option>
                  <option value={BloodGroup.AB_POSITIVE}>AB+</option>
                  <option value={BloodGroup.AB_NEGATIVE}>AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  placeholder="e.g. American, Canadian, Indian"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Residential Street Address
                </label>
                <input
                  type="text"
                  name="currentAddress"
                  placeholder="Street and apartment number"
                  value={formData.currentAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  State / Region
                </label>
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Emergency Contact */}
              <div className="sm:col-span-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-[#0F172A] mb-3">Emergency Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      placeholder="e.g. John Connor"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Emergency Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContactRel"
                      placeholder="e.g. Spouse, Parent, Sibling"
                      value={formData.emergencyContactRel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
            <Link
              href="/employees"
              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
            >
              Cancel
            </Link>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="px-5 py-2.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#0F172A] rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                Save Record (No Account)
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-xs font-semibold text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Save & Send Invitation</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
