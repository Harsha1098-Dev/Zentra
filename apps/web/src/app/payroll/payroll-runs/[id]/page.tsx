'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PayrollNav } from '../../payroll-nav';
import { useAuth } from '../../../../context/auth-context';
import { ApiClient } from '../../../../lib/api';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Send,
  FileText,
  DollarSign,
  Users,
  Download,
  Upload,
  Lock,
  Plus,
  Trash2,
  Search,
  Building2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  PayrollRunStatus,
  PayrollInputType,
  PayrollExceptionSeverity,
  PermissionCode,
} from '@zentra/shared-types';

export default function PayrollRunWorkbenchPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const { permissions, roles, activeOrganization } = useAuth();

  const [run, setRun] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inputs' | 'exceptions' | 'register' | 'payment' | 'payslips'
  >('overview');

  // Tab Data
  const [records, setRecords] = useState<any[]>([]);
  const [inputs, setInputs] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputEmpId, setInputEmpId] = useState('');
  const [inputType, setInputType] = useState<string>(PayrollInputType.BONUS);
  const [inputAmount, setInputAmount] = useState<number | ''>('');
  const [inputRemarks, setInputRemarks] = useState('');

  const [showOverrideModal, setShowOverrideModal] = useState<any | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [paymentNotes, setPaymentNotes] = useState('');

  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  // Register search
  const [registerSearch, setRegisterSearch] = useState('');

  const isPayrollAdmin =
    roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_RUN_CALCULATE);

  const isFinance =
    roles.some((r) => ['SUPER_ADMIN', 'FINANCE', 'PAYROLL_ADMIN'].includes(r)) ||
    permissions.includes(PermissionCode.PAYROLL_PAYMENT_MARK_PAID);

  async function loadRunDetails() {
    try {
      setLoading(true);
      const [runData, inputsData, exceptionsData, recordsData, payslipsData, empsData] =
        await Promise.all([
          ApiClient.get(`/payroll/runs/${runId}`),
          ApiClient.get(`/payroll/runs/${runId}/inputs`).catch(() => []),
          ApiClient.get(`/payroll/runs/${runId}/exceptions`).catch(() => []),
          ApiClient.get(`/payroll/runs/${runId}/records`).catch(() => []),
          ApiClient.get(`/payroll/payslips?payrollRunId=${runId}`).catch(() => []),
          ApiClient.get('/employees').catch(() => []),
        ]);

      setRun(runData);
      setInputs(Array.isArray(inputsData) ? inputsData : []);
      setExceptions(Array.isArray(exceptionsData) ? exceptionsData : []);
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setPayslips(Array.isArray(payslipsData) ? payslipsData : []);
      const empList = Array.isArray(empsData) ? empsData : [];
      setEmployees(empList);

      if (empList.length > 0 && !inputEmpId) {
        setInputEmpId(empList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load run details', err);
      setActionError(err.message || 'Failed to load payroll run');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeOrganization && runId) {
      loadRunDetails();
    }
  }, [activeOrganization, runId]);

  // Actions
  async function triggerImportAttendance() {
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await ApiClient.post(
        `/payroll/runs/${runId}/import-attendance-and-leave`,
        {},
      );
      setActionMessage(res.message || 'Imported attendance and leaves successfully');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to import attendance');
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerCalculate() {
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await ApiClient.post(`/payroll/runs/${runId}/calculate`, {});
      setActionMessage('Payroll calculation completed successfully.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Calculation failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerSubmit() {
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/submit`, {});
      setActionMessage('Payroll run submitted for approval.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Submission failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerApprove() {
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/approve`, {});
      setActionMessage('Payroll run approved.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerReject() {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/reject`, { reason });
      setActionMessage('Payroll run rejected.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaid(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/mark-paid`, {
        paymentReference: paymentRef,
        paymentDate,
        paymentNotes: paymentNotes || undefined,
      });
      setShowPayModal(false);
      setActionMessage('Payroll run marked as PAID.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark as paid');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUploadProof(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/payment-proof`, {
        paymentProofUrl: proofUrl,
      });
      setShowProofModal(false);
      setActionMessage('Disbursement proof uploaded.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Proof upload failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerGeneratePayslips() {
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await ApiClient.post(`/payroll/runs/${runId}/generate-payslips`, {});
      setActionMessage(res.message || 'Payslips generated successfully.');
      await loadRunDetails();
      setActiveTab('payslips');
    } catch (err: any) {
      setActionError(err.message || 'Failed to generate payslips');
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerPublishPayslips() {
    if (!confirm('Are you sure you want to publish payslips to the employee portal?')) return;
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await ApiClient.post(`/payroll/runs/${runId}/publish-payslips`, {});
      setActionMessage(res.message || 'Payslips published to employee portal.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to publish payslips');
    } finally {
      setActionLoading(false);
    }
  }

  async function triggerLock() {
    if (!confirm('Locking this payroll run will prevent any further edits or payments. Proceed?')) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/lock`, {});
      setActionMessage('Payroll run locked.');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to lock run');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddManualInput(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/inputs`, {
        employeeId: inputEmpId,
        inputType,
        amount: Number(inputAmount),
        remarks: inputRemarks || undefined,
      });
      setShowInputModal(false);
      setInputAmount('');
      setInputRemarks('');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add input');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleOverrideException(e: React.FormEvent) {
    e.preventDefault();
    if (!showOverrideModal) return;
    setActionLoading(true);
    try {
      await ApiClient.post(`/payroll/runs/${runId}/exceptions/${showOverrideModal.id}/override`, {
        overrideReason,
      });
      setShowOverrideModal(null);
      setOverrideReason('');
      await loadRunDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to override exception');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !run) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PayrollNav />
        <div className="p-12 text-center text-xs text-slate-400">Loading payroll run...</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PayrollNav />
        <div className="p-12 text-center text-xs text-slate-500">Payroll run not found.</div>
      </div>
    );
  }

  const criticalExceptions = exceptions.filter(
    (e) => e.severity === 'CRITICAL' && !e.isResolved && !e.isOverridden,
  );

  const filteredRecords = records.filter((r) => {
    const q = registerSearch.toLowerCase();
    const name = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
    const code = (r.employee?.employeeCode || '').toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PayrollNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/payroll/payroll-runs"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payroll Runs</span>
        </Link>

        {/* Action Alerts */}
        {actionMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Workbench Header Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {run.runName}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    run.status === 'PAID' || run.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : run.status === 'APPROVED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : run.status === 'UNDER_REVIEW'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : run.status === 'CALCULATED'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Period:{' '}
                <span className="font-semibold text-slate-700">
                  {run.payrollPeriod?.payrollMonth}
                </span>{' '}
                • Type: <span className="font-mono text-slate-700">{run.runType}</span>
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {['DRAFT', 'PENDING_INPUTS'].includes(run.status) && (
                <>
                  <button
                    onClick={triggerImportAttendance}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Import Attendance & Leaves</span>
                  </button>

                  <button
                    onClick={triggerCalculate}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Calculate Payroll</span>
                  </button>
                </>
              )}

              {run.status === 'CALCULATED' && (
                <>
                  <button
                    onClick={triggerCalculate}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recalculate</span>
                  </button>

                  <button
                    onClick={triggerSubmit}
                    disabled={actionLoading || criticalExceptions.length > 0}
                    title={
                      criticalExceptions.length > 0
                        ? `Resolve ${criticalExceptions.length} critical exception(s) first`
                        : undefined
                    }
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Submit for Approval</span>
                  </button>
                </>
              )}

              {run.status === 'UNDER_REVIEW' && (
                <>
                  <button
                    onClick={triggerReject}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={triggerApprove}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Run</span>
                  </button>
                </>
              )}

              {run.status === 'APPROVED' && (
                <button
                  onClick={() => setShowPayModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Mark as Paid</span>
                </button>
              )}

              {run.status === 'PAID' && (
                <>
                  <button
                    onClick={() => setShowProofModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Payment Proof</span>
                  </button>

                  <button
                    onClick={triggerGeneratePayslips}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Generate Payslips</span>
                  </button>
                </>
              )}

              {run.status === 'PAYSLIP_GENERATED' && (
                <button
                  onClick={triggerPublishPayslips}
                  disabled={actionLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish to Employee Portal</span>
                </button>
              )}

              {run.status === 'PUBLISHED' && (
                <button
                  onClick={triggerLock}
                  disabled={actionLoading}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Payroll</span>
                </button>
              )}
            </div>
          </div>

          {/* Stepper */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
              {[
                { label: '1. Draft', statusKey: 'DRAFT' },
                { label: '2. Calculated', statusKey: 'CALCULATED' },
                { label: '3. Under Review', statusKey: 'UNDER_REVIEW' },
                { label: '4. Approved', statusKey: 'APPROVED' },
                { label: '5. Paid', statusKey: 'PAID' },
                { label: '6. Published', statusKey: 'PUBLISHED' },
              ].map((step, idx) => {
                const isCurrent = run.status === step.statusKey;
                return (
                  <div
                    key={step.label}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium ${
                      isCurrent
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex space-x-8 text-xs font-medium">
          {[
            { id: 'overview', label: 'Summary' },
            { id: 'inputs', label: `Inputs & Attendance (${inputs.length})` },
            {
              id: 'exceptions',
              label: `Exceptions (${exceptions.length})`,
              badge: criticalExceptions.length > 0 ? criticalExceptions.length : undefined,
            },
            { id: 'register', label: `Register (${records.length})` },
            { id: 'payment', label: 'Disbursement & Finance' },
            { id: 'payslips', label: `Payslips (${payslips.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'border-b-2 border-slate-900 text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Total Net Pay
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  ₹ {Number(run.totalNetPay || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mt-1">Disbursable to staff bank accounts</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Gross Earnings
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  ₹ {Number(run.totalGrossEarnings || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mt-1">Basic, HRA, and allowances</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Total Deductions
                </span>
                <div className="text-2xl font-bold text-rose-600 mt-2">
                  ₹ {Number(run.totalDeductions || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mt-1">PF, ESI, TDS, PT & LOP</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Staff Processed
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {run.totalEmployeeCount || 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">Eligible active employees</p>
              </div>
            </div>

            {criticalExceptions.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-amber-900">
                    {criticalExceptions.length} Unresolved Critical Exception(s)
                  </div>
                  <p className="text-amber-700 mt-0.5">
                    Payroll cannot be submitted for approval until these critical issues are resolved or overridden with an audit reason.
                  </p>
                  <button
                    onClick={() => setActiveTab('exceptions')}
                    className="mt-2 text-xs font-semibold text-amber-900 underline"
                  >
                    View and Resolve Exceptions →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INPUTS & ADJUSTMENTS */}
        {activeTab === 'inputs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Payroll Inputs</h3>
                <p className="text-xs text-slate-500">
                  Attendance days, leaves, bonuses, overtime, and manual adjustments.
                </p>
              </div>

              {!['APPROVED', 'PAID', 'LOCKED'].includes(run.status) && (
                <button
                  onClick={() => setShowInputModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Adjustment</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {inputs.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No payroll inputs logged yet. Click &quot;Import Attendance &amp; Leaves&quot; above to import automatically.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-6">Employee</th>
                      <th className="py-3 px-6">Input Type</th>
                      <th className="py-3 px-6">Source</th>
                      <th className="py-3 px-6">Days / Hours</th>
                      <th className="py-3 px-6">Amount</th>
                      <th className="py-3 px-6">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inputs.map((inp) => (
                      <tr key={inp.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-6 font-semibold text-slate-900">
                          {inp.employee?.firstName} {inp.employee?.lastName}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {inp.employee?.employeeCode}
                          </div>
                        </td>
                        <td className="py-3 px-6 font-medium text-slate-700">
                          {inp.inputType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-6">
                          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {inp.source}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-slate-600">
                          {inp.numberOfDays ? `${inp.numberOfDays} days` : inp.numberOfHours ? `${inp.numberOfHours} hrs` : '—'}
                        </td>
                        <td className="py-3 px-6 font-semibold text-slate-900">
                          {inp.amount ? `₹ ${Number(inp.amount).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3 px-6 text-slate-500">{inp.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EXCEPTIONS */}
        {activeTab === 'exceptions' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Payroll Exceptions Engine</h3>
            <p className="text-xs text-slate-500">
              Identifies missing bank details, missing salary structures, pending leaves, and LOP deductions.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {exceptions.length === 0 ? (
                <div className="p-12 text-center text-xs text-emerald-600 flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <span>No exceptions detected. Payroll is clean and ready.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {exceptions.map((ex) => (
                    <div key={ex.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ex.severity === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {ex.severity}
                          </span>
                          <span className="font-semibold text-slate-900">{ex.message}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-1">
                          Employee: {ex.employee?.firstName} {ex.employee?.lastName} (
                          {ex.employee?.employeeCode})
                        </div>
                        {ex.isOverridden && (
                          <div className="mt-1 text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                            Overridden: {ex.overrideReason}
                          </div>
                        )}
                      </div>

                      <div>
                        {!ex.isResolved && !ex.isOverridden && (
                          <button
                            onClick={() => setShowOverrideModal(ex)}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                          >
                            Override
                          </button>
                        )}
                        {(ex.isResolved || ex.isOverridden) && (
                          <span className="text-[11px] text-emerald-600 font-medium">Cleared</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REGISTER */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter register by staff name..."
                  value={registerSearch}
                  onChange={(e) => setRegisterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredRecords.length} records
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">LOP</th>
                    <th className="py-3 px-4">Gross Earnings</th>
                    <th className="py-3 px-4">Total Deductions</th>
                    <th className="py-3 px-4 font-bold text-slate-900">Net Pay</th>
                    <th className="py-3 px-4">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.employee?.firstName} {r.employee?.lastName}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {r.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {r.payableDays} / {r.calendarDays}
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-medium">{r.lopDays}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        ₹ {Number(r.grossEarnings).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-medium text-rose-600">
                        ₹ {Number(r.totalDeductions).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹ {Number(r.netPay).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {r.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENT & FINANCE */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Payment & Bank Disbursement</h3>
              <p className="text-xs text-slate-500">
                Finance team verification and NEFT/RTGS payment reference logging.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Payment Status:</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {run.paymentStatus || 'UNPAID'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Date:</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {run.paymentDate ? new Date(run.paymentDate).toLocaleDateString() : 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Reference:</span>
                  <span className="font-mono text-slate-900 text-sm">
                    {run.paymentReference || 'N/A'}
                  </span>
                </div>
              </div>

              {run.paymentProofUrl && (
                <div className="pt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Payment Proof URL: </span>
                  <a
                    href={run.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-mono"
                  >
                    {run.paymentProofUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: PAYSLIPS */}
        {activeTab === 'payslips' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Generated Payslips</h3>
                <p className="text-xs text-slate-500">
                  {payslips.length} immutable employee payslips generated for this cycle.
                </p>
              </div>

              {payslips.length > 0 && run.status === 'PAYSLIP_GENERATED' && (
                <button
                  onClick={triggerPublishPayslips}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Portal</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {payslips.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No payslips generated yet. Once the payroll run is marked PAID, click &quot;Generate Payslips&quot;.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-6">Payslip #</th>
                      <th className="py-3 px-6">Employee</th>
                      <th className="py-3 px-6">Net Pay</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payslips.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-6 font-mono font-semibold text-slate-900">
                          {p.payslipNumber}
                        </td>
                        <td className="py-3 px-6 text-slate-800 font-medium">
                          {p.employee?.firstName} {p.employee?.lastName}
                        </td>
                        <td className="py-3 px-6 font-bold text-slate-900">
                          ₹ {Number(p.netPay).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={async () => {
                              const res = await ApiClient.get(`/payroll/payslips/${p.id}/download`);
                              const blob = new Blob([res.html], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = res.filename;
                              a.click();
                            }}
                            className="inline-flex items-center space-x-1 text-slate-700 hover:text-slate-900 text-xs font-semibold px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>HTML / Print</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add Manual Input */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Add Manual Adjustment</h3>
              <button onClick={() => setShowInputModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddManualInput} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee *
                </label>
                <select
                  required
                  value={inputEmpId}
                  onChange={(e) => setInputEmpId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={inputType}
                  onChange={(e) => setInputType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value={PayrollInputType.BONUS}>BONUS</option>
                  <option value={PayrollInputType.ARREARS}>ARREARS</option>
                  <option value={PayrollInputType.INCENTIVE}>INCENTIVE</option>
                  <option value={PayrollInputType.REIMBURSEMENT}>REIMBURSEMENT</option>
                  <option value={PayrollInputType.OTHER_DEDUCTION}>OTHER_DEDUCTION</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Performance Bonus"
                  value={inputRemarks}
                  onChange={(e) => setInputRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInputModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Override Exception */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Override Exception</h3>
              <button onClick={() => setShowOverrideModal(null)} className="text-slate-400">
                ✕
              </button>
            </div>
            <form onSubmit={handleOverrideException} className="p-6 space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold block text-slate-800">
                  {showOverrideModal.message}
                </span>
                <span className="text-[11px] text-slate-500">
                  Severity: {showOverrideModal.severity}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Override Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verified manually by Finance Director"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Paid */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Mark Run as Paid</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>
            <form onSubmit={handleMarkPaid} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursement Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NEFT / RTGS / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC-NEFT-20261130001"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Finance Notes
                </label>
                <input
                  type="text"
                  placeholder="Processed via corporate salary account"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Proof */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Upload Payment Proof</h3>
              <button onClick={() => setShowProofModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>
            <form onSubmit={handleUploadProof} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document / Bank Advice URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://storage.zentra.app/proofs/pay-nov-2026.pdf"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProofModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Save Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
