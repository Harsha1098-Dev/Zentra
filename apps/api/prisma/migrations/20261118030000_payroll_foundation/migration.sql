-- ====================================================================
-- Migration: 20261118030000_payroll_foundation
-- Purpose: Create tables for Salary Components, Salary Structures, Salary Structure Components,
--          Employee Salary Assignments, Employee Bank Details, Payroll Periods, Payroll Runs,
--          Payroll Employee Records, Payroll Inputs, Payroll Exceptions, Payslip Templates,
--          and Payslips with PostgreSQL Row Level Security (RLS)
-- ====================================================================

-- 1. CreateTable salary_components
CREATE TABLE "salary_components" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "component_code" TEXT NOT NULL,
    "component_type" TEXT NOT NULL,
    "calculation_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION DEFAULT 0,
    "percentage" DOUBLE PRECISION DEFAULT 0,
    "formula" TEXT,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "include_in_ctc" BOOLEAN NOT NULL DEFAULT true,
    "include_in_gross" BOOLEAN NOT NULL DEFAULT true,
    "include_in_net_pay" BOOLEAN NOT NULL DEFAULT true,
    "include_in_statutory_wages" BOOLEAN NOT NULL DEFAULT false,
    "payslip_label" TEXT NOT NULL,
    "payslip_display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system_defined" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable salary_structures
CREATE TABLE "salary_structures" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "annual_ctc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_ctc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable salary_structure_components
CREATE TABLE "salary_structure_components" (
    "id" TEXT NOT NULL,
    "salary_structure_id" TEXT NOT NULL,
    "salary_component_id" TEXT NOT NULL,
    "calculation_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "formula" TEXT,
    "payslip_display_order" INTEGER NOT NULL DEFAULT 0,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structure_components_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable employee_salary_assignments
CREATE TABLE "employee_salary_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "salary_structure_id" TEXT NOT NULL,
    "annual_ctc" DOUBLE PRECISION NOT NULL,
    "monthly_ctc" DOUBLE PRECISION NOT NULL,
    "monthly_gross" DOUBLE PRECISION NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "revision_reason" TEXT,
    "component_overrides" JSONB DEFAULT '{}',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_salary_assignments_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable employee_bank_details
CREATE TABLE "employee_bank_details" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "branch_name" TEXT,
    "pan_number" TEXT,
    "uan_number" TEXT,
    "pf_number" TEXT,
    "esi_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_bank_details_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable payroll_periods
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "payroll_year" INTEGER NOT NULL,
    "payroll_month" INTEGER NOT NULL,
    "period_start_date" TIMESTAMP(3) NOT NULL,
    "period_end_date" TIMESTAMP(3) NOT NULL,
    "pay_date" TIMESTAMP(3) NOT NULL,
    "attendance_cutoff_date" TIMESTAMP(3) NOT NULL,
    "leave_cutoff_date" TIMESTAMP(3) NOT NULL,
    "payroll_cutoff_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable payroll_runs
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "payroll_period_id" TEXT NOT NULL,
    "run_name" TEXT NOT NULL,
    "run_type" TEXT NOT NULL DEFAULT 'REGULAR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_employee_count" INTEGER NOT NULL DEFAULT 0,
    "total_gross_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_employer_contributions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_net_pay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ctc_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculated_by" TEXT,
    "calculated_at" TIMESTAMP(3),
    "submitted_by" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "payment_date" TIMESTAMP(3),
    "payment_reference" TEXT,
    "payment_proof_url" TEXT,
    "payment_notes" TEXT,
    "idempotency_key" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable payroll_employee_records
CREATE TABLE "payroll_employee_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "salary_structure_id" TEXT,
    "salary_assignment_id" TEXT,
    "payable_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lop_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_leave_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unpaid_leave_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holiday_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weekend_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "present_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtime_minutes" INTEGER NOT NULL DEFAULT 0,
    "overtime_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonus_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incentive_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arrears_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reimbursement_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustment_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gross_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_employer_contributions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_pay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_date" TIMESTAMP(3),
    "payment_reference" TEXT,
    "payslip_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "payslip_url" TEXT,
    "snapshot_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_employee_records_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable payroll_inputs
CREATE TABLE "payroll_inputs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "input_type" TEXT NOT NULL,
    "component_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "units" DOUBLE PRECISION DEFAULT 0,
    "description" TEXT,
    "reason" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_inputs_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable payroll_exceptions
CREATE TABLE "payroll_exceptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "exception_code" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'CRITICAL',
    "message" TEXT NOT NULL,
    "details" JSONB,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "is_overridden" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,
    "overridden_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_exceptions_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable payslip_templates
CREATE TABLE "payslip_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "page_size" TEXT NOT NULL DEFAULT 'A4',
    "orientation" TEXT NOT NULL DEFAULT 'PORTRAIT',
    "margins" JSONB DEFAULT '{"top": 20, "bottom": 20, "left": 20, "right": 20}',
    "font_family" TEXT NOT NULL DEFAULT 'Inter, sans-serif',
    "font_size" INTEGER NOT NULL DEFAULT 12,
    "primary_color" TEXT NOT NULL DEFAULT '#1E3A8A',
    "secondary_color" TEXT NOT NULL DEFAULT '#64748B',
    "header_settings" JSONB DEFAULT '{}',
    "footer_settings" JSONB DEFAULT '{}',
    "watermark_settings" JSONB DEFAULT '{}',
    "stamp_settings" JSONB DEFAULT '{}',
    "signature_settings" JSONB DEFAULT '{}',
    "show_employer_contributions" BOOLEAN NOT NULL DEFAULT true,
    "show_reimbursements" BOOLEAN NOT NULL DEFAULT true,
    "show_bank_account" BOOLEAN NOT NULL DEFAULT true,
    "bank_account_masking" TEXT NOT NULL DEFAULT 'LAST_4',
    "currency_format" TEXT NOT NULL DEFAULT 'INR',
    "number_format" TEXT NOT NULL DEFAULT 'en-IN',
    "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "layout_json" JSONB DEFAULT '{}',
    "html_template" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payslip_templates_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable payslips
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "payroll_period_id" TEXT NOT NULL,
    "payroll_employee_record_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "template_id" TEXT,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "payslip_number" TEXT NOT NULL,
    "period_name" TEXT NOT NULL,
    "pay_date" TIMESTAMP(3) NOT NULL,
    "gross_earnings" DOUBLE PRECISION NOT NULL,
    "total_deductions" DOUBLE PRECISION NOT NULL,
    "net_pay" DOUBLE PRECISION NOT NULL,
    "net_pay_words" TEXT NOT NULL,
    "earnings_breakdown" JSONB NOT NULL,
    "deductions_breakdown" JSONB NOT NULL,
    "contributions_breakdown" JSONB NOT NULL,
    "ytd_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ytd_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ytd_net_pay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pdf_url" TEXT,
    "pdf_generated_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "published_by" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_downloaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- Indexes and Unique Constraints

-- salary_components
CREATE UNIQUE INDEX "salary_components_organization_id_component_code_key" ON "salary_components"("organization_id", "component_code");
CREATE UNIQUE INDEX "salary_components_organization_id_name_key" ON "salary_components"("organization_id", "name");
CREATE INDEX "salary_components_organization_id_idx" ON "salary_components"("organization_id");
CREATE INDEX "salary_components_component_code_idx" ON "salary_components"("component_code");
CREATE INDEX "salary_components_component_type_idx" ON "salary_components"("component_type");
CREATE INDEX "salary_components_is_active_idx" ON "salary_components"("is_active");

-- salary_structures
CREATE UNIQUE INDEX "salary_structures_organization_id_name_key" ON "salary_structures"("organization_id", "name");
CREATE INDEX "salary_structures_organization_id_idx" ON "salary_structures"("organization_id");
CREATE INDEX "salary_structures_status_idx" ON "salary_structures"("status");

-- salary_structure_components
CREATE UNIQUE INDEX "salary_structure_components_salary_structure_id_salary_com_key" ON "salary_structure_components"("salary_structure_id", "salary_component_id");
CREATE INDEX "salary_structure_components_salary_structure_id_idx" ON "salary_structure_components"("salary_structure_id");
CREATE INDEX "salary_structure_components_salary_component_id_idx" ON "salary_structure_components"("salary_component_id");

-- employee_salary_assignments
CREATE INDEX "employee_salary_assignments_organization_id_idx" ON "employee_salary_assignments"("organization_id");
CREATE INDEX "employee_salary_assignments_employee_id_idx" ON "employee_salary_assignments"("employee_id");
CREATE INDEX "employee_salary_assignments_salary_structure_id_idx" ON "employee_salary_assignments"("salary_structure_id");
CREATE INDEX "employee_salary_assignments_effective_from_idx" ON "employee_salary_assignments"("effective_from");
CREATE INDEX "employee_salary_assignments_status_idx" ON "employee_salary_assignments"("status");

-- employee_bank_details
CREATE UNIQUE INDEX "employee_bank_details_employee_id_key" ON "employee_bank_details"("employee_id");
CREATE INDEX "employee_bank_details_organization_id_idx" ON "employee_bank_details"("organization_id");
CREATE INDEX "employee_bank_details_account_number_idx" ON "employee_bank_details"("account_number");
CREATE INDEX "employee_bank_details_pan_number_idx" ON "employee_bank_details"("pan_number");

-- payroll_periods
CREATE UNIQUE INDEX "payroll_periods_organization_id_payroll_year_payroll_month_key" ON "payroll_periods"("organization_id", "payroll_year", "payroll_month");
CREATE INDEX "payroll_periods_organization_id_idx" ON "payroll_periods"("organization_id");
CREATE INDEX "payroll_periods_payroll_year_payroll_month_idx" ON "payroll_periods"("payroll_year", "payroll_month");
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- payroll_runs
CREATE UNIQUE INDEX "payroll_runs_organization_id_payroll_period_id_run_type_key" ON "payroll_runs"("organization_id", "payroll_period_id", "run_type");
CREATE INDEX "payroll_runs_organization_id_idx" ON "payroll_runs"("organization_id");
CREATE INDEX "payroll_runs_payroll_period_id_idx" ON "payroll_runs"("payroll_period_id");
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");
CREATE INDEX "payroll_runs_run_type_idx" ON "payroll_runs"("run_type");

-- payroll_employee_records
CREATE UNIQUE INDEX "payroll_employee_records_payroll_run_id_employee_id_key" ON "payroll_employee_records"("payroll_run_id", "employee_id");
CREATE INDEX "payroll_employee_records_organization_id_idx" ON "payroll_employee_records"("organization_id");
CREATE INDEX "payroll_employee_records_payroll_run_id_idx" ON "payroll_employee_records"("payroll_run_id");
CREATE INDEX "payroll_employee_records_employee_id_idx" ON "payroll_employee_records"("employee_id");
CREATE INDEX "payroll_employee_records_payment_status_idx" ON "payroll_employee_records"("payment_status");
CREATE INDEX "payroll_employee_records_payslip_status_idx" ON "payroll_employee_records"("payslip_status");

-- payroll_inputs
CREATE INDEX "payroll_inputs_organization_id_idx" ON "payroll_inputs"("organization_id");
CREATE INDEX "payroll_inputs_payroll_run_id_idx" ON "payroll_inputs"("payroll_run_id");
CREATE INDEX "payroll_inputs_employee_id_idx" ON "payroll_inputs"("employee_id");
CREATE INDEX "payroll_inputs_input_type_idx" ON "payroll_inputs"("input_type");

-- payroll_exceptions
CREATE INDEX "payroll_exceptions_organization_id_idx" ON "payroll_exceptions"("organization_id");
CREATE INDEX "payroll_exceptions_payroll_run_id_idx" ON "payroll_exceptions"("payroll_run_id");
CREATE INDEX "payroll_exceptions_employee_id_idx" ON "payroll_exceptions"("employee_id");
CREATE INDEX "payroll_exceptions_exception_code_idx" ON "payroll_exceptions"("exception_code");
CREATE INDEX "payroll_exceptions_is_resolved_idx" ON "payroll_exceptions"("is_resolved");
CREATE INDEX "payroll_exceptions_severity_idx" ON "payroll_exceptions"("severity");

-- payslip_templates
CREATE INDEX "payslip_templates_organization_id_idx" ON "payslip_templates"("organization_id");
CREATE INDEX "payslip_templates_is_default_idx" ON "payslip_templates"("is_default");
CREATE INDEX "payslip_templates_status_idx" ON "payslip_templates"("status");

-- payslips
CREATE UNIQUE INDEX "payslips_payroll_employee_record_id_key" ON "payslips"("payroll_employee_record_id");
CREATE UNIQUE INDEX "payslips_organization_id_payslip_number_key" ON "payslips"("organization_id", "payslip_number");
CREATE INDEX "payslips_organization_id_idx" ON "payslips"("organization_id");
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");
CREATE INDEX "payslips_payroll_run_id_idx" ON "payslips"("payroll_run_id");
CREATE INDEX "payslips_payroll_period_id_idx" ON "payslips"("payroll_period_id");
CREATE INDEX "payslips_status_idx" ON "payslips"("status");

-- Foreign Keys

-- salary_components
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- salary_structures
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- salary_structure_components
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_salary_component_id_fkey" FOREIGN KEY ("salary_component_id") REFERENCES "salary_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- employee_salary_assignments
ALTER TABLE "employee_salary_assignments" ADD CONSTRAINT "employee_salary_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_salary_assignments" ADD CONSTRAINT "employee_salary_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_salary_assignments" ADD CONSTRAINT "employee_salary_assignments_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- employee_bank_details
ALTER TABLE "employee_bank_details" ADD CONSTRAINT "employee_bank_details_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_bank_details" ADD CONSTRAINT "employee_bank_details_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- payroll_periods
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- payroll_runs
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- payroll_employee_records
ALTER TABLE "payroll_employee_records" ADD CONSTRAINT "payroll_employee_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_employee_records" ADD CONSTRAINT "payroll_employee_records_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_employee_records" ADD CONSTRAINT "payroll_employee_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_employee_records" ADD CONSTRAINT "payroll_employee_records_salary_assignment_id_fkey" FOREIGN KEY ("salary_assignment_id") REFERENCES "employee_salary_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- payroll_inputs
ALTER TABLE "payroll_inputs" ADD CONSTRAINT "payroll_inputs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_inputs" ADD CONSTRAINT "payroll_inputs_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_inputs" ADD CONSTRAINT "payroll_inputs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_inputs" ADD CONSTRAINT "payroll_inputs_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "salary_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- payroll_exceptions
ALTER TABLE "payroll_exceptions" ADD CONSTRAINT "payroll_exceptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_exceptions" ADD CONSTRAINT "payroll_exceptions_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_exceptions" ADD CONSTRAINT "payroll_exceptions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- payslip_templates
ALTER TABLE "payslip_templates" ADD CONSTRAINT "payslip_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- payslips
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_employee_record_id_fkey" FOREIGN KEY ("payroll_employee_record_id") REFERENCES "payroll_employee_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "payslip_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ====================================================================
-- PostgreSQL Row Level Security (RLS) Configuration
-- ====================================================================

ALTER TABLE "salary_components" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salary_components" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "salary_components";
CREATE POLICY "tenant_isolation_policy" ON "salary_components"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "salary_structures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salary_structures" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "salary_structures";
CREATE POLICY "tenant_isolation_policy" ON "salary_structures"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_salary_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_salary_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_salary_assignments";
CREATE POLICY "tenant_isolation_policy" ON "employee_salary_assignments"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_bank_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_bank_details" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_bank_details";
CREATE POLICY "tenant_isolation_policy" ON "employee_bank_details"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "payroll_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_periods" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "payroll_periods";
CREATE POLICY "tenant_isolation_policy" ON "payroll_periods"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "payroll_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_runs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "payroll_runs";
CREATE POLICY "tenant_isolation_policy" ON "payroll_runs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "payroll_employee_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_employee_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "payroll_employee_records";
CREATE POLICY "tenant_isolation_policy" ON "payroll_employee_records"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "payroll_inputs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_inputs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "payroll_inputs";
CREATE POLICY "tenant_isolation_policy" ON "payroll_inputs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "payroll_exceptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_exceptions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "payroll_exceptions";
CREATE POLICY "tenant_isolation_policy" ON "payroll_exceptions"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "payslip_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payslip_templates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "payslip_templates";
CREATE POLICY "tenant_isolation_policy" ON "payslip_templates"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "payslips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payslips" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "payslips";
CREATE POLICY "tenant_isolation_policy" ON "payslips"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- Grant table privileges to zentra_app limited role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'zentra_app') THEN
    GRANT ALL ON TABLE 
      "salary_components", 
      "salary_structures", 
      "salary_structure_components", 
      "employee_salary_assignments", 
      "employee_bank_details", 
      "payroll_periods", 
      "payroll_runs", 
      "payroll_employee_records", 
      "payroll_inputs", 
      "payroll_exceptions", 
      "payslip_templates", 
      "payslips" 
    TO zentra_app;
  END IF;
END
$$;
