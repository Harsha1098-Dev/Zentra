-- ====================================================================
-- Migration: 20261118040000_statutory_payroll
-- Purpose: Statutory Payroll & Compliance Module for India
--          Creates tables for Statutory Settings, Statutory Components,
--          PF Configuration, ESI Configuration, Professional Tax Rules & Slabs,
--          LWF Rules, Employee Tax Profiles, Employee Tax Declarations,
--          Employee Investment Proofs, Employee TDS Calculations, Form 16 Records,
--          and adds statutory columns to payroll_employee_records and payslips
--          with PostgreSQL Row Level Security (RLS) policies.
-- ====================================================================

-- 1. AlterTable payroll_employee_records to add statutory columns
ALTER TABLE "payroll_employee_records" 
    ADD COLUMN IF NOT EXISTS "employee_pf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "employer_pf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "eps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "edli" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "admin_charges_pf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "employee_esi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "employer_esi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "professional_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "lwf_employee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "lwf_employer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "tds" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 2. AlterTable payslips to add statutory columns
ALTER TABLE "payslips"
    ADD COLUMN IF NOT EXISTS "employee_pf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "employer_pf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "eps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "edli" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "employee_esi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "employer_esi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "professional_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "lwf_employee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "lwf_employer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "tds" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 3. CreateTable statutory_settings
CREATE TABLE "statutory_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "financial_year" TEXT NOT NULL DEFAULT '2025-2026',
    "default_tax_regime" TEXT NOT NULL DEFAULT 'NEW_REGIME',
    "pan_number" TEXT,
    "tan_number" TEXT,
    "tds_circle" TEXT,
    "pf_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pf_establishment_code" TEXT,
    "esi_enabled" BOOLEAN NOT NULL DEFAULT true,
    "esi_establishment_code" TEXT,
    "pt_enabled" BOOLEAN NOT NULL DEFAULT true,
    "lwf_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_declaration_window_open" BOOLEAN NOT NULL DEFAULT true,
    "declaration_window_start_date" TIMESTAMP(3),
    "declaration_window_end_date" TIMESTAMP(3),
    "is_proof_submission_open" BOOLEAN NOT NULL DEFAULT false,
    "proof_submission_start_date" TIMESTAMP(3),
    "proof_submission_end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statutory_settings_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable statutory_components
CREATE TABLE "statutory_components" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "statutory_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deduction_frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "wage_ceiling" DOUBLE PRECISION,
    "eligibility_wage_limit" DOUBLE PRECISION,
    "calculation_base" TEXT NOT NULL DEFAULT 'BASIC_DA',
    "employee_contribution_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employer_contribution_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "configuration" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statutory_components_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable pf_configurations
CREATE TABLE "pf_configurations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "pf_enabled" BOOLEAN NOT NULL DEFAULT true,
    "epf_rate_employee" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "epf_rate_employer" DOUBLE PRECISION NOT NULL DEFAULT 3.67,
    "eps_rate_employer" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "edli_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "admin_charges_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "wage_ceiling" DOUBLE PRECISION NOT NULL DEFAULT 15000,
    "restrict_employer_share_to_ceiling" BOOLEAN NOT NULL DEFAULT true,
    "allow_vpf" BOOLEAN NOT NULL DEFAULT true,
    "pro_rate_pension_basis" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pf_configurations_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable esi_configurations
CREATE TABLE "esi_configurations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "esi_enabled" BOOLEAN NOT NULL DEFAULT true,
    "employee_contribution_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "employer_contribution_rate" DOUBLE PRECISION NOT NULL DEFAULT 3.25,
    "wage_ceiling" DOUBLE PRECISION NOT NULL DEFAULT 21000,
    "disability_wage_ceiling" DOUBLE PRECISION NOT NULL DEFAULT 25000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esi_configurations_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable professional_tax_rules
CREATE TABLE "professional_tax_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,
    "registration_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deduction_frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_tax_rules_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable professional_tax_slabs
CREATE TABLE "professional_tax_slabs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "min_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_salary" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'ALL',
    "specific_month" INTEGER,
    "specific_month_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_tax_slabs_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable lwf_rules
CREATE TABLE "lwf_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "employee_contribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "employer_contribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deduction_frequency" TEXT NOT NULL DEFAULT 'HALF_YEARLY',
    "deduction_months" INTEGER[] DEFAULT ARRAY[6, 12],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lwf_rules_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable employee_tax_profiles
CREATE TABLE "employee_tax_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "financial_year" TEXT NOT NULL,
    "selected_regime" TEXT NOT NULL DEFAULT 'NEW_REGIME',
    "pan_number" TEXT,
    "pan_verification_status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "is_pf_eligible" BOOLEAN NOT NULL DEFAULT true,
    "is_esi_eligible" BOOLEAN NOT NULL DEFAULT true,
    "is_pt_eligible" BOOLEAN NOT NULL DEFAULT true,
    "is_lwf_eligible" BOOLEAN NOT NULL DEFAULT true,
    "uan_number" TEXT,
    "esi_number" TEXT,
    "vpf_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_tax_profiles_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable employee_tax_declarations
CREATE TABLE "employee_tax_declarations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "financial_year" TEXT NOT NULL,
    "declaration_type" TEXT NOT NULL,
    "sub_category" TEXT NOT NULL,
    "declared_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approved_amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "particulars" TEXT,
    "landlord_name" TEXT,
    "landlord_pan" TEXT,
    "landlord_address" TEXT,
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_tax_declarations_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable employee_investment_proofs
CREATE TABLE "employee_investment_proofs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "declaration_id" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_type" TEXT,
    "amount_declared" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount_submitted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verified_amount" DOUBLE PRECISION,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_investment_proofs_pkey" PRIMARY KEY ("id")
);

-- 13. CreateTable employee_tds_calculations
CREATE TABLE "employee_tds_calculations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "payroll_run_id" TEXT,
    "financial_year" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "selected_regime" TEXT NOT NULL,
    "annual_gross_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standard_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professional_tax_annual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "chapter_vi_a_exemptions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_80c" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_80d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_80ccd_1b" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_24_home_loan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hra_exemption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_exemptions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_taxable_income" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculated_annual_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_87a_rebate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_after_rebate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "education_cess" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_annual_tax_liability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_paid_ytd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remaining_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remaining_months" INTEGER NOT NULL DEFAULT 1,
    "monthly_tds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_tds_calculations_pkey" PRIMARY KEY ("id")
);

-- 14. CreateTable form16_records
CREATE TABLE "form16_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "financial_year" TEXT NOT NULL,
    "assessment_year" TEXT NOT NULL,
    "selected_regime" TEXT NOT NULL,
    "gross_salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exemptions_us_10" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standard_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professional_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gross_total_income" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deductions_chapter_vi_a" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_taxable_income" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tax_payable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_87a_rebate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cess" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_tax_payable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tds_deducted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tds_deposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "part_a_url" TEXT,
    "part_b_url" TEXT,
    "published_at" TIMESTAMP(3),
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form16_records_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "statutory_settings_organization_id_key" ON "statutory_settings"("organization_id");
CREATE UNIQUE INDEX "statutory_components_organization_id_code_key" ON "statutory_components"("organization_id", "code");
CREATE UNIQUE INDEX "pf_configurations_organization_id_key" ON "pf_configurations"("organization_id");
CREATE UNIQUE INDEX "esi_configurations_organization_id_key" ON "esi_configurations"("organization_id");
CREATE UNIQUE INDEX "professional_tax_rules_organization_id_state_code_key" ON "professional_tax_rules"("organization_id", "state_code");
CREATE UNIQUE INDEX "lwf_rules_organization_id_state_code_key" ON "lwf_rules"("organization_id", "state_code");
CREATE UNIQUE INDEX "employee_tax_profiles_organization_id_employee_id_financial_year_key" ON "employee_tax_profiles"("organization_id", "employee_id", "financial_year");
CREATE UNIQUE INDEX "employee_tds_calculations_organization_id_employee_id_financial_year_month_year_key" ON "employee_tds_calculations"("organization_id", "employee_id", "financial_year", "month", "year");
CREATE UNIQUE INDEX "form16_records_organization_id_employee_id_financial_year_key" ON "form16_records"("organization_id", "employee_id", "financial_year");

-- Indexes
CREATE INDEX "statutory_settings_organization_id_idx" ON "statutory_settings"("organization_id");

CREATE INDEX "statutory_components_organization_id_idx" ON "statutory_components"("organization_id");
CREATE INDEX "statutory_components_statutory_type_idx" ON "statutory_components"("statutory_type");
CREATE INDEX "statutory_components_is_active_idx" ON "statutory_components"("is_active");

CREATE INDEX "pf_configurations_organization_id_idx" ON "pf_configurations"("organization_id");

CREATE INDEX "esi_configurations_organization_id_idx" ON "esi_configurations"("organization_id");

CREATE INDEX "professional_tax_rules_organization_id_idx" ON "professional_tax_rules"("organization_id");
CREATE INDEX "professional_tax_rules_state_idx" ON "professional_tax_rules"("state");

CREATE INDEX "professional_tax_slabs_organization_id_idx" ON "professional_tax_slabs"("organization_id");
CREATE INDEX "professional_tax_slabs_rule_id_idx" ON "professional_tax_slabs"("rule_id");

CREATE INDEX "lwf_rules_organization_id_idx" ON "lwf_rules"("organization_id");
CREATE INDEX "lwf_rules_state_idx" ON "lwf_rules"("state");

CREATE INDEX "employee_tax_profiles_organization_id_idx" ON "employee_tax_profiles"("organization_id");
CREATE INDEX "employee_tax_profiles_employee_id_idx" ON "employee_tax_profiles"("employee_id");
CREATE INDEX "employee_tax_profiles_financial_year_idx" ON "employee_tax_profiles"("financial_year");
CREATE INDEX "employee_tax_profiles_selected_regime_idx" ON "employee_tax_profiles"("selected_regime");

CREATE INDEX "employee_tax_declarations_organization_id_idx" ON "employee_tax_declarations"("organization_id");
CREATE INDEX "employee_tax_declarations_employee_id_idx" ON "employee_tax_declarations"("employee_id");
CREATE INDEX "employee_tax_declarations_financial_year_idx" ON "employee_tax_declarations"("financial_year");
CREATE INDEX "employee_tax_declarations_declaration_type_idx" ON "employee_tax_declarations"("declaration_type");
CREATE INDEX "employee_tax_declarations_status_idx" ON "employee_tax_declarations"("status");

CREATE INDEX "employee_investment_proofs_organization_id_idx" ON "employee_investment_proofs"("organization_id");
CREATE INDEX "employee_investment_proofs_employee_id_idx" ON "employee_investment_proofs"("employee_id");
CREATE INDEX "employee_investment_proofs_declaration_id_idx" ON "employee_investment_proofs"("declaration_id");
CREATE INDEX "employee_investment_proofs_verification_status_idx" ON "employee_investment_proofs"("verification_status");

CREATE INDEX "employee_tds_calculations_organization_id_idx" ON "employee_tds_calculations"("organization_id");
CREATE INDEX "employee_tds_calculations_employee_id_idx" ON "employee_tds_calculations"("employee_id");
CREATE INDEX "employee_tds_calculations_payroll_run_id_idx" ON "employee_tds_calculations"("payroll_run_id");
CREATE INDEX "employee_tds_calculations_financial_year_idx" ON "employee_tds_calculations"("financial_year");

CREATE INDEX "form16_records_organization_id_idx" ON "form16_records"("organization_id");
CREATE INDEX "form16_records_employee_id_idx" ON "form16_records"("employee_id");
CREATE INDEX "form16_records_financial_year_idx" ON "form16_records"("financial_year");
CREATE INDEX "form16_records_status_idx" ON "form16_records"("status");

-- Foreign key constraints
ALTER TABLE "statutory_settings" ADD CONSTRAINT "statutory_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "statutory_components" ADD CONSTRAINT "statutory_components_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pf_configurations" ADD CONSTRAINT "pf_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "esi_configurations" ADD CONSTRAINT "esi_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_tax_rules" ADD CONSTRAINT "professional_tax_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_tax_slabs" ADD CONSTRAINT "professional_tax_slabs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "professional_tax_slabs" ADD CONSTRAINT "professional_tax_slabs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "professional_tax_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lwf_rules" ADD CONSTRAINT "lwf_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_tax_profiles" ADD CONSTRAINT "employee_tax_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_tax_profiles" ADD CONSTRAINT "employee_tax_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_tax_declarations" ADD CONSTRAINT "employee_tax_declarations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_tax_declarations" ADD CONSTRAINT "employee_tax_declarations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_investment_proofs" ADD CONSTRAINT "employee_investment_proofs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_investment_proofs" ADD CONSTRAINT "employee_investment_proofs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_investment_proofs" ADD CONSTRAINT "employee_investment_proofs_declaration_id_fkey" FOREIGN KEY ("declaration_id") REFERENCES "employee_tax_declarations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_tds_calculations" ADD CONSTRAINT "employee_tds_calculations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_tds_calculations" ADD CONSTRAINT "employee_tds_calculations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_tds_calculations" ADD CONSTRAINT "employee_tds_calculations_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "form16_records" ADD CONSTRAINT "form16_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "form16_records" ADD CONSTRAINT "form16_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (RLS)
ALTER TABLE "statutory_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "statutory_settings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "statutory_settings";
CREATE POLICY "tenant_isolation_policy" ON "statutory_settings"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "statutory_components" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "statutory_components" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "statutory_components";
CREATE POLICY "tenant_isolation_policy" ON "statutory_components"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "pf_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pf_configurations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "pf_configurations";
CREATE POLICY "tenant_isolation_policy" ON "pf_configurations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "esi_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "esi_configurations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "esi_configurations";
CREATE POLICY "tenant_isolation_policy" ON "esi_configurations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "professional_tax_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "professional_tax_rules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "professional_tax_rules";
CREATE POLICY "tenant_isolation_policy" ON "professional_tax_rules"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "professional_tax_slabs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "professional_tax_slabs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "professional_tax_slabs";
CREATE POLICY "tenant_isolation_policy" ON "professional_tax_slabs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "lwf_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lwf_rules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "lwf_rules";
CREATE POLICY "tenant_isolation_policy" ON "lwf_rules"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_tax_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_tax_profiles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_tax_profiles";
CREATE POLICY "tenant_isolation_policy" ON "employee_tax_profiles"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_tax_declarations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_tax_declarations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_tax_declarations";
CREATE POLICY "tenant_isolation_policy" ON "employee_tax_declarations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_investment_proofs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_investment_proofs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_investment_proofs";
CREATE POLICY "tenant_isolation_policy" ON "employee_investment_proofs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_tds_calculations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_tds_calculations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_tds_calculations";
CREATE POLICY "tenant_isolation_policy" ON "employee_tds_calculations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "form16_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "form16_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "form16_records";
CREATE POLICY "tenant_isolation_policy" ON "form16_records"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- Grant table privileges to zentra_app limited role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'zentra_app') THEN
    GRANT ALL ON TABLE 
      "statutory_settings",
      "statutory_components",
      "pf_configurations",
      "esi_configurations",
      "professional_tax_rules",
      "professional_tax_slabs",
      "lwf_rules",
      "employee_tax_profiles",
      "employee_tax_declarations",
      "employee_investment_proofs",
      "employee_tds_calculations",
      "form16_records"
    TO zentra_app;
  END IF;
END
$$;
