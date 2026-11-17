'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  Loader2,
  Trash2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ApiClient } from '../../../lib/api';

export default function EmployeeImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);

  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview & validation state
  const [previewResult, setPreviewResult] = useState<{
    preview: any[];
    errors: { rowNumber: number; employeeCode?: string; workEmail?: string; errorMessage: string }[];
  } | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await ApiClient.downloadFile(
        '/employees/import-template',
        'zentra_employees_import_template.csv',
      );
    } catch (err: any) {
      setError(err.message || 'Failed to download import template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file');
      return;
    }
    setError(null);
    setCsvFile(file);
    setPreviewResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      // Automatically run dry run validation preview
      runValidation(text);
    };
    reader.readAsText(file);
  };

  const runValidation = async (content: string) => {
    try {
      setValidating(true);
      setError(null);

      const res = await ApiClient.request<{
        preview: any[];
        errors: { rowNumber: number; employeeCode?: string; workEmail?: string; errorMessage: string }[];
      }>('/employees/import', {
        method: 'POST',
        body: JSON.stringify({
          csvContent: content,
          dryRun: true,
        }),
      });

      setPreviewResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to validate CSV contents');
    } finally {
      setValidating(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setCsvFile(null);
    setCsvContent('');
    setPreviewResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = async () => {
    if (!csvContent) return;

    try {
      setImporting(true);
      setError(null);

      const job = await ApiClient.request<{
        id: string;
        totalRows: number;
        succeededRows: number;
        failedRows: number;
        status: string;
      }>('/employees/import', {
        method: 'POST',
        body: JSON.stringify({
          csvContent,
          fileName: csvFile?.name || 'employees_import.csv',
          dryRun: false,
        }),
      });

      // Redirect to the import job status page
      router.push(`/employees/import/${job.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to execute employee import');
      setImporting(false);
    }
  };

  const validRowCount = previewResult
    ? previewResult.preview.filter((row) => row.isValid).length
    : 0;
  const invalidRowCount = previewResult?.errors ? previewResult.errors.length : 0;

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/employees"
              className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#0F172A]">Bulk Import Employees</h1>
              <p className="text-xs text-[#64748B]">
                Onboard multiple employees at once using structured CSV data
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#E2E8F0] text-[#1E3A8A] hover:bg-blue-50 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingTemplate ? 'Downloading...' : 'Download CSV Template'}</span>
            </button>
            <Link
              href="/employees"
              className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg text-xs font-semibold bg-white transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Helper Instructions Banner */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Import Guidelines & Best Practices
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                • Mandatory headers: <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">employee_code</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">first_name</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">last_name</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">work_email</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">phone</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">date_of_joining</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">employment_type</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">location</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">department</code>, <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">designation</code>.
                <br />
                • Organizations matching: Location, Department, and Designation match by <strong>Code</strong> first, then by <strong>Name</strong>.
                <br />
                • Reporting manager resolves by matching their existing <code className="font-mono text-[#1E3A8A] bg-blue-50 px-1 py-0.5 rounded">work_email</code>.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-xs text-[#DC2626]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {!csvFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors bg-white ${
              dragOver
                ? 'border-[#1E3A8A] bg-blue-50/50'
                : 'border-[#CBD5E1] hover:border-[#1E3A8A]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Click to select a CSV file or drag and drop
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Supports standard comma-delimited (.csv) files up to 10MB
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#E0E7FF] text-[#1E3A8A] rounded-lg text-xs font-semibold hover:bg-blue-100 transition">
                Browse Computer
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">{csvFile.name}</h3>
                  <p className="text-xs text-[#64748B]">
                    {(csvFile.size / 1024).toFixed(1)} KB • {previewResult?.preview?.length || 0} total rows detected
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClear}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#DC2626] hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={importing || validating || !previewResult || previewResult.preview.length === 0}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{importing ? 'Processing Import...' : 'Execute Import'}</span>
                </button>
              </div>
            </div>

            {/* Validation Counters */}
            {validating ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#1E3A8A] space-y-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-semibold">Validating rows and cross-referencing records...</span>
              </div>
            ) : previewResult ? (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#64748B] block">Total Rows</span>
                      <span className="text-xl font-bold text-[#0F172A]">
                        {previewResult.preview.length}
                      </span>
                    </div>
                    <FileSpreadsheet className="w-6 h-6 text-[#64748B]" />
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#059669] block">Ready to Import</span>
                      <span className="text-xl font-bold text-[#059669]">
                        {validRowCount}
                      </span>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                  </div>

                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#DC2626] block">Rows with Issues</span>
                      <span className="text-xl font-bold text-[#DC2626]">
                        {invalidRowCount}
                      </span>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
                  </div>
                </div>

                {/* Issues Table if any */}
                {previewResult.errors && previewResult.errors.length > 0 && (
                  <div className="border border-rose-200 rounded-xl overflow-hidden">
                    <div className="bg-rose-50 px-4 py-3 border-b border-rose-200 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                      <h4 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">
                        Row-Level Validation Errors ({previewResult.errors.length})
                      </h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-rose-100 bg-white">
                      {previewResult.errors.map((err, idx) => (
                        <div key={idx} className="p-3 text-xs flex items-start justify-between">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-[#0F172A]">
                              Row #{err.rowNumber}:
                            </span>{' '}
                            <span className="text-[#DC2626] font-medium">{err.errorMessage}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] font-mono">
                            {err.employeeCode ? `Code: ${err.employeeCode}` : ''}{' '}
                            {err.workEmail ? `| Email: ${err.workEmail}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                    Preview Data (First 15 Rows)
                  </h4>
                  <div className="border border-[#E2E8F0] rounded-xl overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                      <thead className="bg-slate-50 text-[#64748B] font-semibold">
                        <tr>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Row</th>
                          <th className="px-3 py-2 text-left">Code</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Work Email</th>
                          <th className="px-3 py-2 text-left">Department</th>
                          <th className="px-3 py-2 text-left">Designation</th>
                          <th className="px-3 py-2 text-left">Location</th>
                          <th className="px-3 py-2 text-left">Joining Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] bg-white">
                        {previewResult.preview.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50/40'}>
                            <td className="px-3 py-2">
                              {row.isValid ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#059669] border border-emerald-200">
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-[#DC2626] border border-rose-200">
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-[#64748B]">#{row.rowNumber}</td>
                            <td className="px-3 py-2 font-mono font-medium text-[#0F172A]">{row.employeeCode}</td>
                            <td className="px-3 py-2 font-medium text-[#0F172A]">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="px-3 py-2 text-[#475569]">{row.workEmail}</td>
                            <td className="px-3 py-2 text-[#475569]">{row.department}</td>
                            <td className="px-3 py-2 text-[#475569]">{row.designation}</td>
                            <td className="px-3 py-2 text-[#475569]">{row.location}</td>
                            <td className="px-3 py-2 text-[#475569]">{row.dateOfJoining}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
