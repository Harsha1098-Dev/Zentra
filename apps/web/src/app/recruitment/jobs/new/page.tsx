'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { RecruitmentNav } from '../../recruitment-nav';
import { ApiClient } from '../../../../lib/api';

export default function NewJobOpeningPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    jobCode: '',
    departmentId: '',
    designationId: '',
    locationId: '',
    employmentType: 'FULL_TIME',
    workMode: 'HYBRID',
    experienceMinYears: 0,
    experienceMaxYears: 5,
    salaryMin: '',
    salaryMax: '',
    currency: 'INR',
    numberOfOpenings: 1,
    hiringManagerId: '',
    recruiterId: '',
    pipelineId: '',
    description: '',
    responsibilities: [''],
    requirements: [''],
    skills: [''],
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadFormMeta() {
      try {
        const [deptRes, desigRes, locRes, empRes, pipeRes] = await Promise.allSettled([
          ApiClient.request('/organization/departments'),
          ApiClient.request('/organization/designations'),
          ApiClient.request('/organization/locations'),
          ApiClient.request('/employees'),
          ApiClient.request('/recruitment/pipelines'),
        ]);

        if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)) setDepartments(deptRes.value);
        if (desigRes.status === 'fulfilled' && Array.isArray(desigRes.value)) setDesignations(desigRes.value);
        if (locRes.status === 'fulfilled' && Array.isArray(locRes.value)) setLocations(locRes.value);
        if (empRes.status === 'fulfilled' && Array.isArray(empRes.value)) setEmployees(empRes.value);
        if (pipeRes.status === 'fulfilled' && Array.isArray(pipeRes.value)) setPipelines(pipeRes.value);
      } catch (err) {
        console.error('Failed to load setup metadata', err);
      }
    }
    loadFormMeta();
  }, []);

  function handleListChange(field: 'responsibilities' | 'requirements' | 'skills', index: number, value: string) {
    const list = [...formData[field]];
    list[index] = value;
    setFormData({ ...formData, [field]: list });
  }

  function addListItem(field: 'responsibilities' | 'requirements' | 'skills') {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  }

  function removeListItem(field: 'responsibilities' | 'requirements' | 'skills', index: number) {
    const list = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: list.length ? list : [''] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        experienceMinYears: Number(formData.experienceMinYears),
        experienceMaxYears: Number(formData.experienceMaxYears),
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        numberOfOpenings: Number(formData.numberOfOpenings),
        responsibilities: formData.responsibilities.filter((r) => r.trim().length > 0),
        requirements: formData.requirements.filter((r) => r.trim().length > 0),
        skills: formData.skills.filter((r) => r.trim().length > 0),
      };

      const res = await ApiClient.request('/recruitment/job-openings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push(`/recruitment/jobs/${res.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create job opening. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <RecruitmentNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center space-x-3">
          <Link
            href="/recruitment/jobs"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Job Opening</h1>
            <p className="text-xs text-slate-500">Configure role specifications, compensation bounds, and hiring pipeline.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Basic Role Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG-2026-001"
                  value={formData.jobCode}
                  onChange={(e) => setFormData({ ...formData, jobCode: e.target.value.toUpperCase() })}
                  className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation *
                </label>
                <select
                  required
                  value={formData.designationId}
                  onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Designation</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Location *
                </label>
                <select
                  required
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Mode *
                </label>
                <select
                  value={formData.workMode}
                  onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="ON_SITE">On-Site</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hiring Manager *
                </label>
                <select
                  required
                  value={formData.hiringManagerId}
                  onChange={(e) => setFormData({ ...formData, hiringManagerId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Select Manager</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pipeline Workflow
                </label>
                <select
                  value={formData.pipelineId}
                  onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Standard Default Pipeline (10 stages)</option>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Description *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Comprehensive summary of the position..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          {/* Compensation & Experience Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Compensation & Experience
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Exp (Yrs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.experienceMinYears}
                  onChange={(e) => setFormData({ ...formData, experienceMinYears: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Exp (Yrs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.experienceMaxYears}
                  onChange={(e) => setFormData({ ...formData, experienceMaxYears: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Salary (Annual)</label>
                <input
                  type="number"
                  placeholder="e.g. 1200000"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Salary (Annual)</label>
                <input
                  type="number"
                  placeholder="e.g. 2400000"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Link
              href="/recruitment/jobs"
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Job Opening'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
