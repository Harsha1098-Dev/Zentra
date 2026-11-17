'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '../../../../lib/api';
import {
  Network,
  Building2,
  MapPin,
  GitBranch,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronRight,
  Printer,
  RefreshCw,
  Star,
  Users,
  Globe,
  Sliders,
} from 'lucide-react';
import {
  OrganizationChartDto,
  DepartmentTreeNodeDto,
  DesignationDto,
} from '@zentra/shared-types';

export default function OrganizationChartPage() {
  const [chartData, setChartData] = useState<OrganizationChartDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChart();
  }, []);

  const loadChart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.request<OrganizationChartDto>('/organization-chart');
      setChartData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load organization chart');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center max-w-md mx-auto shadow-sm">
        <Network className="w-12 h-12 text-[#DC2626] mx-auto mb-3 opacity-60" />
        <h2 className="text-base font-bold text-[#0F172A]">Unable to load Organization Chart</h2>
        <p className="text-xs text-[#475569] mt-1">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={loadChart}
          className="mt-4 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { company, locations, departmentsTree, designations, grades } = chartData;
  const hqLocation = locations.find((l) => l.isHeadquarters);

  const backendHost =
    process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
  const logoUrl = company?.logoUrl
    ? company.logoUrl.startsWith('http')
      ? company.logoUrl
      : `${backendHost}${company.logoUrl}`
    : null;

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Organization Chart</h1>
          <p className="text-sm text-[#475569] mt-1">
            Visual structural overview of company divisions, department trees, designations, and location hubs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadChart}
            className="p-2 border border-[#E2E8F0] hover:bg-slate-50 text-[#475569] rounded-lg transition-colors"
            title="Refresh Chart"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-3 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Chart</span>
          </button>
          <Link
            href="/settings/organization"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Setup Overview</span>
          </Link>
        </div>
      </div>

      {/* Top Company Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-xl border border-[#E2E8F0] bg-[#F6F8FB] flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={company.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Building2 className="w-8 h-8 text-[#1E3A8A]" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-[#0F172A]">{company.name}</h2>
                {company.legalName && (
                  <span className="text-xs text-[#64748B] font-normal">
                    ({company.legalName})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#475569]">
                {hqLocation && (
                  <span className="flex items-center space-x-1 text-[#D97706] font-medium">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>HQ: {hqLocation.name} ({hqLocation.city}, {hqLocation.country})</span>
                  </span>
                )}

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-[#1E3A8A] hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}

                {company.industry && (
                  <span className="text-[#64748B]">Industry: {company.industry}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-6 text-center">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Locations
              </span>
              <span className="text-xl font-bold text-[#0F172A]">{locations.length}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Departments
              </span>
              <span className="text-xl font-bold text-[#0F172A]">
                {countTotalDepts(departmentsTree)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Designations
              </span>
              <span className="text-xl font-bold text-[#0F172A]">{designations.length}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Grades
              </span>
              <span className="text-xl font-bold text-[#0F172A]">{grades.length}</span>
            </div>
          </div>
        </div>

        {/* Locations Bar */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#64748B] mr-1">Office Hubs:</span>
          {locations.map((loc) => (
            <span
              key={loc.id}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                loc.isHeadquarters
                  ? 'bg-amber-50 text-[#D97706] border-amber-200'
                  : 'bg-slate-50 text-[#475569] border-slate-200'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>
                {loc.name} ({loc.city})
              </span>
              {loc.isHeadquarters && (
                <span className="text-[10px] font-bold uppercase tracking-wider ml-1 bg-amber-200/50 px-1 rounded">
                  HQ
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Main Hierarchy Tree */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-[#1E3A8A]" />
            <span>Department Hierarchy Tree</span>
          </h2>
          <span className="text-xs text-[#64748B]">
            Click arrows to expand or collapse division sub-units
          </span>
        </div>

        {departmentsTree.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-sm">
            <GitBranch className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-semibold text-[#0F172A]">No departments added yet</h3>
            <p className="text-xs text-[#475569] mt-1 max-w-sm mx-auto">
              Configure your departmental divisions in the Departments setup module to visualize your company tree.
            </p>
            <Link
              href="/settings/organization/departments"
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              <span>Add Department</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {departmentsTree.map((rootDept) => (
              <OrgChartNode
                key={rootDept.id}
                node={rootDept}
                designations={designations}
                level={0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Seniority Hierarchy & Grades Ladder */}
      {grades.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-[#0F172A] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#1E3A8A]" />
              <span>Seniority & Compensation Ladder</span>
            </h2>
            <Link
              href="/settings/organization/grades"
              className="text-xs text-[#1E3A8A] font-semibold hover:underline"
            >
              Manage Grades
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {grades.map((grade) => {
              const matchedTitles = designations.filter((d) => d.gradeId === grade.id);
              return (
                <div
                  key={grade.id}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-center"
                >
                  <span className="text-[11px] font-bold text-[#1E3A8A] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Level {grade.level}
                  </span>
                  <div className="font-semibold text-xs text-[#0F172A] mt-2">{grade.name}</div>
                  <span className="text-[10px] text-[#64748B] block mt-1">
                    {matchedTitles.length} Designation(s)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function countTotalDepts(nodes: DepartmentTreeNodeDto[]): number {
  return nodes.reduce(
    (acc, curr) => acc + 1 + (curr.children ? countTotalDepts(curr.children) : 0),
    0,
  );
}

// Tree Node for Org Chart
function OrgChartNode({
  node,
  designations,
  level = 0,
}: {
  node: DepartmentTreeNodeDto;
  designations: DesignationDto[];
  level: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const deptDesignations = designations.filter((d) => d.departmentId === node.id);

  return (
    <div
      className={`border border-[#E2E8F0] rounded-xl bg-white shadow-sm transition-all overflow-hidden ${
        level === 0 ? 'ring-1 ring-[#1E3A8A]/10' : ''
      }`}
    >
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div className="flex items-center space-x-3">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-slate-100 rounded text-[#64748B] transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="p-2 bg-indigo-50 text-[#1E3A8A] rounded-lg">
            <GitBranch className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-[#0F172A]">{node.name}</span>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded font-semibold text-[#1E3A8A]">
                {node.code}
              </span>
            </div>
            {node.description && (
              <p className="text-xs text-[#64748B] mt-0.5">{node.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs pl-9 md:pl-0">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-50 text-[#475569] border border-slate-200 rounded-lg">
            <Briefcase className="w-3 h-3 text-[#64748B]" />
            <span>{deptDesignations.length} Title(s)</span>
          </span>

          {hasChildren && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-[#1E3A8A] border border-indigo-100 rounded-lg font-medium">
              <span>{node.children.length} Sub-units</span>
            </span>
          )}
        </div>
      </div>

      {/* Associated Designations preview */}
      {deptDesignations.length > 0 && (
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[#64748B]">Designations:</span>
          {deptDesignations.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center text-[11px] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded text-[#0F172A]"
            >
              {d.name}
              {d.gradeLevel !== null && d.gradeLevel !== undefined && (
                <span className="ml-1 text-[10px] text-emerald-600 font-bold">
                  (L{d.gradeLevel})
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Nested Children */}
      {hasChildren && expanded && (
        <div className="bg-slate-50/60 p-4 border-t border-[#E2E8F0] pl-6 md:pl-10 space-y-3">
          {node.children.map((child) => (
            <OrgChartNode
              key={child.id}
              node={child}
              designations={designations}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
