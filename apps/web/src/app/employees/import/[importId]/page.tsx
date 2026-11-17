'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { ApiClient } from '../../../../lib/api';
import { EmployeeImportJobDto } from '@zentra/shared-types';

interface PageProps {
  params: Promise<{ importId: string }>;
}

export default function ImportStatusPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const importId = resolvedParams.importId;
  const router = useRouter();

  const [job, setJob] = useState<EmployeeImportJobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingErrors, setDownloadingErrors] = useState(false);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.request<EmployeeImportJobDto>(
        `/employees/import/${importId}`,
      );
      setJob(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch import job status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (importId) {
      fetchJob();
    }
  }, [importId]);

  const handleDownloadErrors = async () => {
    try {
      setDownloadingErrors(true);
      await ApiClient.downloadFile(
        `/employees/import/${importId}/errors`,
        `zentra_import_errors_${importId.substring(0, 8)}.csv`,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to download error report');
    } finally {
      setDownloadingErrors(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-[#1E3A8A]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-sm">Loading import summary...</span>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-[#DC2626] mb-4" />
        <h2 className="text-lg font-bold text-[#0F172A] mb-2">Failed to load import job</h2>
        <p className="text-xs text-[#64748B] mb-6">{error || 'Import record not found'}</p>
        <Link
          href="/employees/import"
          className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold"
        >
          Return to Imports
        </Link>
      </div>
    );
  }

  const isSuccess = job.status === 'COMPLETED';
  const isPartial = job.status === 'PARTIAL_SUCCESS';
  const isFailed = job.status === 'FAILED';

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/employees"
              className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-[#0F172A]">Import Job Summary</h1>
                <span className="font-mono text-xs text-[#64748B]">#{job.id.substring(0, 8)}</span>
              </div>
              <p className="text-xs text-[#64748B]">Source: {job.fileName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchJob}
              className="p-2 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-50 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/employees"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Users className="w-4 h-4" />
              <span>Go to Employee Directory</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Status Highlight Banner */}
        <div
          className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isSuccess
              ? 'bg-emerald-50 border-emerald-200'
              : isPartial
              ? 'bg-amber-50 border-amber-200'
              : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6 text-[#059669] flex-shrink-0 mt-0.5" />
            ) : isPartial ? (
              <AlertTriangle className="w-6 h-6 text-[#D97706] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h2
                className={`text-base font-bold ${
                  isSuccess
                    ? 'text-[#059669]'
                    : isPartial
                    ? 'text-[#D97706]'
                    : 'text-[#DC2626]'
                }`}
              >
                {isSuccess
                  ? 'All Employee Records Imported Successfully!'
                  : isPartial
                  ? 'Import Completed with Partial Success'
                  : 'Import Processing Failed'}
              </h2>
              <p className="text-xs text-[#475569] mt-1">
                Completed on {new Date(job.createdAt).toLocaleString()}.{' '}
                {job.successfulRows} employee records created or updated in this organization.
              </p>
            </div>
          </div>

          {job.failedRows > 0 && (
            <button
              onClick={handleDownloadErrors}
              disabled={downloadingErrors}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-[#E2E8F0] text-[#DC2626] hover:bg-red-50 rounded-lg text-xs font-semibold shadow-sm transition flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingErrors ? 'Downloading...' : 'Download Error Report CSV'}</span>
            </button>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
            <span className="text-xs text-[#64748B] block font-medium">Total Rows</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-1 block">{job.totalRows}</span>
          </div>

          <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
            <span className="text-xs text-[#64748B] block font-medium">Processed</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-1 block">{job.processedRows}</span>
          </div>

          <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-sm">
            <span className="text-xs text-[#059669] block font-medium">Succeeded</span>
            <span className="text-2xl font-bold text-[#059669] mt-1 block">{job.successfulRows}</span>
          </div>

          <div className="p-4 bg-white border border-rose-200 rounded-xl shadow-sm">
            <span className="text-xs text-[#DC2626] block font-medium">Failed</span>
            <span className="text-2xl font-bold text-[#DC2626] mt-1 block">{job.failedRows}</span>
          </div>
        </div>

        {/* Failed Rows Detail Table */}
        {job.errors && job.errors.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Failed Rows & Detailed Error Breakdown ({job.errors.length})
              </h3>
              <button
                onClick={handleDownloadErrors}
                className="text-xs text-[#1E3A8A] font-semibold hover:underline inline-flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-slate-50 text-[#64748B] font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Row #</th>
                    <th className="px-4 py-3 text-left">Error Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {job.errors.map((err, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-[#64748B]">#{err.row}</td>
                      <td className="px-4 py-3 text-[#DC2626] font-medium">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/employees/import"
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-[#E2E8F0] text-[#1E3A8A] hover:bg-blue-50 rounded-lg text-xs font-semibold bg-white transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Another File</span>
          </Link>
          <Link
            href="/employees"
            className="px-6 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Return to Directory
          </Link>
        </div>
      </main>
    </div>
  );
}
