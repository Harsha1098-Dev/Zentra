-- ====================================================================
-- Migration: 20261118010000_leave_management
-- Purpose: Create tables for Leave Types, Policies, Balances, Histories, Requests, and Comp-Off with PostgreSQL RLS
-- ====================================================================

-- 1. CreateTable leave_types
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'earned_leave',
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT DEFAULT '#1E3A8A',
    "icon" TEXT DEFAULT 'calendar',
    "requires_attachment" BOOLEAN NOT NULL DEFAULT false,
    "attachment_required_days" INTEGER DEFAULT 0,
    "allows_half_day" BOOLEAN NOT NULL DEFAULT true,
    "allows_quarter_day" BOOLEAN NOT NULL DEFAULT false,
    "allows_hourly" BOOLEAN NOT NULL DEFAULT false,
    "allows_negative_balance" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "is_comp_off" BOOLEAN NOT NULL DEFAULT false,
    "is_loss_of_pay" BOOLEAN NOT NULL DEFAULT false,
    "is_restricted_holiday" BOOLEAN NOT NULL DEFAULT false,
    "applicable_probation" BOOLEAN NOT NULL DEFAULT true,
    "applicable_contract" BOOLEAN NOT NULL DEFAULT true,
    "applicable_intern" BOOLEAN NOT NULL DEFAULT true,
    "custom_fields" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable leave_policies
CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "applicable_locations" JSONB NOT NULL DEFAULT '["ALL"]',
    "applicable_departments" JSONB NOT NULL DEFAULT '["ALL"]',
    "applicable_designations" JSONB NOT NULL DEFAULT '["ALL"]',
    "applicable_grades" JSONB NOT NULL DEFAULT '["ALL"]',
    "applicable_employment_types" JSONB NOT NULL DEFAULT '["ALL"]',
    "applicable_employee_statuses" JSONB NOT NULL DEFAULT '["ALL"]',
    "entitlement_type" TEXT NOT NULL DEFAULT 'fixed',
    "annual_entitlement" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "monthly_entitlement" DECIMAL(5,2),
    "accrual_frequency" TEXT NOT NULL DEFAULT 'yearly',
    "accrual_start_date" TEXT,
    "prorate_new_joiners" BOOLEAN NOT NULL DEFAULT true,
    "probation_eligibility" BOOLEAN NOT NULL DEFAULT true,
    "minimum_service_period_days" INTEGER NOT NULL DEFAULT 0,
    "max_days_per_request" DECIMAL(5,2),
    "max_consecutive_days" DECIMAL(5,2),
    "minimum_notice_days" INTEGER NOT NULL DEFAULT 0,
    "allow_past_dates" BOOLEAN NOT NULL DEFAULT true,
    "allow_future_dates" BOOLEAN NOT NULL DEFAULT true,
    "max_future_days" INTEGER,
    "allow_half_day" BOOLEAN NOT NULL DEFAULT true,
    "allow_quarter_day" BOOLEAN NOT NULL DEFAULT false,
    "allow_hourly" BOOLEAN NOT NULL DEFAULT false,
    "allow_negative_balance" BOOLEAN NOT NULL DEFAULT false,
    "allow_carry_forward" BOOLEAN NOT NULL DEFAULT false,
    "carry_forward_limit" DECIMAL(5,2),
    "carry_forward_expiry_days" INTEGER,
    "allow_encashment" BOOLEAN NOT NULL DEFAULT false,
    "encashment_limit" DECIMAL(5,2),
    "min_balance_for_encashment" DECIMAL(5,2),
    "allow_weekend_leave" BOOLEAN NOT NULL DEFAULT false,
    "allow_holiday_leave" BOOLEAN NOT NULL DEFAULT false,
    "allow_overlapping_requests" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "approval_workflow_id" TEXT,
    "requires_attachment" BOOLEAN NOT NULL DEFAULT false,
    "attachment_required_days" INTEGER NOT NULL DEFAULT 0,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable leave_balances
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "leave_policy_id" TEXT,
    "year" INTEGER NOT NULL,
    "opening_balance" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "accrued" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "granted" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "used" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pending" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "carry_forward" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "encashed" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "adjustment" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable leave_balance_histories
CREATE TABLE "leave_balance_histories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "leave_balance_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(5,2) NOT NULL,
    "previous_balance" DECIMAL(5,2) NOT NULL,
    "new_balance" DECIMAL(5,2) NOT NULL,
    "reason" TEXT,
    "reference_id" TEXT,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_balance_histories_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable leave_requests
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "leave_policy_id" TEXT,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "number_of_days" DECIMAL(5,2) NOT NULL,
    "duration_type" TEXT NOT NULL DEFAULT 'full_day',
    "half_day_type" TEXT,
    "quarter_day_type" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "reason" TEXT NOT NULL,
    "attachment_url" TEXT,
    "covering_employee_id" TEXT,
    "contact_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approval_flow_id" TEXT,
    "applied_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "cancelled_by" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "cancel_approval_flow_id" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable comp_off_requests
CREATE TABLE "comp_off_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "worked_date" TIMESTAMP(3) NOT NULL,
    "worked_hours" DECIMAL(4,2),
    "reason" TEXT NOT NULL,
    "attachment_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approval_flow_id" TEXT,
    "credited_days" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "expiry_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comp_off_requests_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "leave_types_organization_id_code_key" ON "leave_types"("organization_id", "code");
CREATE UNIQUE INDEX "leave_types_organization_id_name_key" ON "leave_types"("organization_id", "name");
CREATE UNIQUE INDEX "leave_policies_organization_id_name_key" ON "leave_policies"("organization_id", "name");
CREATE UNIQUE INDEX "leave_balances_organization_id_employee_id_leave_type_id_year_key" ON "leave_balances"("organization_id", "employee_id", "leave_type_id", "year");
CREATE UNIQUE INDEX "leave_requests_idempotency_key_key" ON "leave_requests"("idempotency_key");
CREATE UNIQUE INDEX "comp_off_requests_organization_id_employee_id_worked_date_key" ON "comp_off_requests"("organization_id", "employee_id", "worked_date");

-- Indexes
CREATE INDEX "leave_types_organization_id_idx" ON "leave_types"("organization_id");
CREATE INDEX "leave_types_category_idx" ON "leave_types"("category");
CREATE INDEX "leave_types_is_active_idx" ON "leave_types"("is_active");

CREATE INDEX "leave_policies_organization_id_idx" ON "leave_policies"("organization_id");
CREATE INDEX "leave_policies_leave_type_id_idx" ON "leave_policies"("leave_type_id");
CREATE INDEX "leave_policies_status_idx" ON "leave_policies"("status");

CREATE INDEX "leave_balances_organization_id_idx" ON "leave_balances"("organization_id");
CREATE INDEX "leave_balances_employee_id_idx" ON "leave_balances"("employee_id");
CREATE INDEX "leave_balances_leave_type_id_idx" ON "leave_balances"("leave_type_id");
CREATE INDEX "leave_balances_year_idx" ON "leave_balances"("year");

CREATE INDEX "leave_balance_histories_organization_id_idx" ON "leave_balance_histories"("organization_id");
CREATE INDEX "leave_balance_histories_employee_id_idx" ON "leave_balance_histories"("employee_id");
CREATE INDEX "leave_balance_histories_leave_balance_id_idx" ON "leave_balance_histories"("leave_balance_id");
CREATE INDEX "leave_balance_histories_leave_type_id_idx" ON "leave_balance_histories"("leave_type_id");

CREATE INDEX "leave_requests_organization_id_idx" ON "leave_requests"("organization_id");
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");
CREATE INDEX "leave_requests_leave_type_id_idx" ON "leave_requests"("leave_type_id");
CREATE INDEX "leave_requests_leave_policy_id_idx" ON "leave_requests"("leave_policy_id");
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");
CREATE INDEX "leave_requests_from_date_idx" ON "leave_requests"("from_date");
CREATE INDEX "leave_requests_to_date_idx" ON "leave_requests"("to_date");
CREATE INDEX "leave_requests_approval_flow_id_idx" ON "leave_requests"("approval_flow_id");

CREATE INDEX "comp_off_requests_organization_id_idx" ON "comp_off_requests"("organization_id");
CREATE INDEX "comp_off_requests_employee_id_idx" ON "comp_off_requests"("employee_id");
CREATE INDEX "comp_off_requests_status_idx" ON "comp_off_requests"("status");
CREATE INDEX "comp_off_requests_worked_date_idx" ON "comp_off_requests"("worked_date");
CREATE INDEX "comp_off_requests_approval_flow_id_idx" ON "comp_off_requests"("approval_flow_id");

-- Foreign key constraints
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_policy_id_fkey" FOREIGN KEY ("leave_policy_id") REFERENCES "leave_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leave_balance_histories" ADD CONSTRAINT "leave_balance_histories_leave_balance_id_fkey" FOREIGN KEY ("leave_balance_id") REFERENCES "leave_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_covering_employee_id_fkey" FOREIGN KEY ("covering_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_policy_id_fkey" FOREIGN KEY ("leave_policy_id") REFERENCES "leave_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comp_off_requests" ADD CONSTRAINT "comp_off_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comp_off_requests" ADD CONSTRAINT "comp_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (RLS)
ALTER TABLE "leave_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_types" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "leave_types";
CREATE POLICY "tenant_isolation_policy" ON "leave_types"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "leave_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "leave_policies";
CREATE POLICY "tenant_isolation_policy" ON "leave_policies"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "leave_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_balances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "leave_balances";
CREATE POLICY "tenant_isolation_policy" ON "leave_balances"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "leave_balance_histories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_balance_histories" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "leave_balance_histories";
CREATE POLICY "tenant_isolation_policy" ON "leave_balance_histories"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "leave_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "leave_requests";
CREATE POLICY "tenant_isolation_policy" ON "leave_requests"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "comp_off_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comp_off_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "comp_off_requests";
CREATE POLICY "tenant_isolation_policy" ON "comp_off_requests"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- Grant table privileges to zentra_app limited role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'zentra_app') THEN
    GRANT ALL ON TABLE "leave_types", "leave_policies", "leave_balances", "leave_balance_histories", "leave_requests", "comp_off_requests" TO zentra_app;
  END IF;
END
$$;
