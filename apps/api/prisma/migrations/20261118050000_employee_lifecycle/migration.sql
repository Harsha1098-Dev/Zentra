-- ====================================================================
-- Migration: 20261118050000_employee_lifecycle
-- Purpose: Employee Lifecycle Module for Zentra People
--          Creates tables for Onboarding Flows & Items, Onboarding Runs & Tasks,
--          Probation Reviews, Employee Transitions (Transfers & Promotions),
--          Salary Revisions, Resignation Requests, Exit Clearances,
--          Exit Interviews, Offboarding Requests, Asset Management,
--          and Lifecycle Letters with PostgreSQL Row Level Security (RLS) policies.
-- ====================================================================

-- 1. CreateTable onboarding_flows
CREATE TABLE "onboarding_flows" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "applicable_locations" JSONB DEFAULT '[]',
    "applicable_departments" JSONB DEFAULT '[]',
    "applicable_designations" JSONB DEFAULT '[]',
    "applicable_employment_types" JSONB DEFAULT '[]',
    "trigger_event" TEXT NOT NULL DEFAULT 'EMPLOYEE_CREATED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "onboarding_flows_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable onboarding_flow_items
CREATE TABLE "onboarding_flow_items" (
    "id" TEXT NOT NULL,
    "onboarding_flow_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner_type" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "owner_id" TEXT,
    "owner_role" TEXT,
    "due_offset_days" INTEGER NOT NULL DEFAULT 0,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "requires_attachment" BOOLEAN NOT NULL DEFAULT false,
    "requires_acknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "execution_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_flow_items_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable onboarding_runs
CREATE TABLE "onboarding_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "onboarding_flow_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_completion_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_runs_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable onboarding_run_items
CREATE TABLE "onboarding_run_items" (
    "id" TEXT NOT NULL,
    "onboarding_run_id" TEXT NOT NULL,
    "onboarding_flow_item_id" TEXT,
    "title" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "attachment_url" TEXT,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_run_items_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable probation_reviews
CREATE TABLE "probation_reviews" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "probation_start_date" TIMESTAMP(3) NOT NULL,
    "probation_end_date" TIMESTAMP(3) NOT NULL,
    "review_date" TIMESTAMP(3),
    "manager_id" TEXT,
    "manager_rating" INTEGER,
    "manager_comments" TEXT,
    "employee_comments" TEXT,
    "recommendation" TEXT NOT NULL DEFAULT 'CONFIRM',
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "approval_flow_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "probation_reviews_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable employee_transitions
CREATE TABLE "employee_transitions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "transition_type" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "current_department_id" TEXT,
    "new_department_id" TEXT,
    "current_designation_id" TEXT,
    "new_designation_id" TEXT,
    "current_location_id" TEXT,
    "new_location_id" TEXT,
    "current_grade_id" TEXT,
    "new_grade_id" TEXT,
    "current_reporting_manager_id" TEXT,
    "new_reporting_manager_id" TEXT,
    "current_employment_type" TEXT,
    "new_employment_type" TEXT,
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approval_flow_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_transitions_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable salary_revisions
CREATE TABLE "salary_revisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "current_salary_structure_id" TEXT,
    "new_salary_structure_id" TEXT,
    "current_annual_ctc" DOUBLE PRECISION NOT NULL,
    "new_annual_ctc" DOUBLE PRECISION NOT NULL,
    "revision_type" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approval_flow_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_revisions_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable resignation_requests
CREATE TABLE "resignation_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "resignation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_working_date" TIMESTAMP(3) NOT NULL,
    "notice_period_days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "comments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approval_flow_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resignation_requests_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable exit_clearances
CREATE TABLE "exit_clearances" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "resignation_request_id" TEXT,
    "clearance_type" TEXT NOT NULL,
    "assigned_to" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "comments" TEXT,
    "attachment_url" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exit_clearances_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable exit_interviews
CREATE TABLE "exit_interviews" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "resignation_request_id" TEXT,
    "interview_date" TIMESTAMP(3),
    "interviewer_id" TEXT,
    "exit_reason" TEXT,
    "employee_feedback" JSONB DEFAULT '{}',
    "manager_feedback" JSONB DEFAULT '{}',
    "hr_feedback" JSONB DEFAULT '{}',
    "rehire_recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exit_interviews_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable offboarding_requests
CREATE TABLE "offboarding_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "resignation_request_id" TEXT,
    "exit_type" TEXT NOT NULL DEFAULT 'RESIGNATION',
    "last_working_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CLEARANCE',
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offboarding_requests_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable assets
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "asset_serial_number" TEXT NOT NULL,
    "assigned_employee_id" TEXT,
    "assigned_date" TIMESTAMP(3),
    "return_date" TIMESTAMP(3),
    "asset_condition" TEXT,
    "return_status" TEXT NOT NULL DEFAULT 'UNASSIGNED',
    "assigned_by" TEXT,
    "returned_to" TEXT,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- 13. CreateTable lifecycle_letters
CREATE TABLE "lifecycle_letters" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "letter_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pdf_url" TEXT,
    "issued_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_shared_with_employee" BOOLEAN NOT NULL DEFAULT true,
    "generated_by" TEXT NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifecycle_letters_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "exit_interviews_resignation_request_id_key" ON "exit_interviews"("resignation_request_id");
CREATE UNIQUE INDEX "offboarding_requests_resignation_request_id_key" ON "offboarding_requests"("resignation_request_id");

-- Indexes
CREATE INDEX "onboarding_flows_organization_id_idx" ON "onboarding_flows"("organization_id");
CREATE INDEX "onboarding_flows_is_active_idx" ON "onboarding_flows"("is_active");

CREATE INDEX "onboarding_flow_items_onboarding_flow_id_idx" ON "onboarding_flow_items"("onboarding_flow_id");

CREATE INDEX "onboarding_runs_organization_id_idx" ON "onboarding_runs"("organization_id");
CREATE INDEX "onboarding_runs_employee_id_idx" ON "onboarding_runs"("employee_id");
CREATE INDEX "onboarding_runs_status_idx" ON "onboarding_runs"("status");

CREATE INDEX "onboarding_run_items_onboarding_run_id_idx" ON "onboarding_run_items"("onboarding_run_id");
CREATE INDEX "onboarding_run_items_owner_type_owner_id_idx" ON "onboarding_run_items"("owner_type", "owner_id");
CREATE INDEX "onboarding_run_items_status_idx" ON "onboarding_run_items"("status");

CREATE INDEX "probation_reviews_organization_id_idx" ON "probation_reviews"("organization_id");
CREATE INDEX "probation_reviews_employee_id_idx" ON "probation_reviews"("employee_id");
CREATE INDEX "probation_reviews_status_idx" ON "probation_reviews"("status");

CREATE INDEX "employee_transitions_organization_id_idx" ON "employee_transitions"("organization_id");
CREATE INDEX "employee_transitions_employee_id_idx" ON "employee_transitions"("employee_id");
CREATE INDEX "employee_transitions_transition_type_idx" ON "employee_transitions"("transition_type");
CREATE INDEX "employee_transitions_status_idx" ON "employee_transitions"("status");
CREATE INDEX "employee_transitions_effective_from_idx" ON "employee_transitions"("effective_from");

CREATE INDEX "salary_revisions_organization_id_idx" ON "salary_revisions"("organization_id");
CREATE INDEX "salary_revisions_employee_id_idx" ON "salary_revisions"("employee_id");
CREATE INDEX "salary_revisions_status_idx" ON "salary_revisions"("status");
CREATE INDEX "salary_revisions_effective_from_idx" ON "salary_revisions"("effective_from");

CREATE INDEX "resignation_requests_organization_id_idx" ON "resignation_requests"("organization_id");
CREATE INDEX "resignation_requests_employee_id_idx" ON "resignation_requests"("employee_id");
CREATE INDEX "resignation_requests_status_idx" ON "resignation_requests"("status");

CREATE INDEX "exit_clearances_organization_id_idx" ON "exit_clearances"("organization_id");
CREATE INDEX "exit_clearances_employee_id_idx" ON "exit_clearances"("employee_id");
CREATE INDEX "exit_clearances_resignation_request_id_idx" ON "exit_clearances"("resignation_request_id");
CREATE INDEX "exit_clearances_status_idx" ON "exit_clearances"("status");

CREATE INDEX "exit_interviews_organization_id_idx" ON "exit_interviews"("organization_id");
CREATE INDEX "exit_interviews_employee_id_idx" ON "exit_interviews"("employee_id");

CREATE INDEX "offboarding_requests_organization_id_idx" ON "offboarding_requests"("organization_id");
CREATE INDEX "offboarding_requests_employee_id_idx" ON "offboarding_requests"("employee_id");
CREATE INDEX "offboarding_requests_status_idx" ON "offboarding_requests"("status");

CREATE INDEX "assets_organization_id_idx" ON "assets"("organization_id");
CREATE INDEX "assets_assigned_employee_id_idx" ON "assets"("assigned_employee_id");
CREATE INDEX "assets_asset_serial_number_idx" ON "assets"("asset_serial_number");
CREATE INDEX "assets_return_status_idx" ON "assets"("return_status");

CREATE INDEX "lifecycle_letters_organization_id_idx" ON "lifecycle_letters"("organization_id");
CREATE INDEX "lifecycle_letters_employee_id_idx" ON "lifecycle_letters"("employee_id");
CREATE INDEX "lifecycle_letters_letter_type_idx" ON "lifecycle_letters"("letter_type");

-- Foreign key constraints
ALTER TABLE "onboarding_flows" ADD CONSTRAINT "onboarding_flows_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "onboarding_flow_items" ADD CONSTRAINT "onboarding_flow_items_onboarding_flow_id_fkey" FOREIGN KEY ("onboarding_flow_id") REFERENCES "onboarding_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "onboarding_runs" ADD CONSTRAINT "onboarding_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_runs" ADD CONSTRAINT "onboarding_runs_onboarding_flow_id_fkey" FOREIGN KEY ("onboarding_flow_id") REFERENCES "onboarding_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_runs" ADD CONSTRAINT "onboarding_runs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "onboarding_run_items" ADD CONSTRAINT "onboarding_run_items_onboarding_run_id_fkey" FOREIGN KEY ("onboarding_run_id") REFERENCES "onboarding_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_run_items" ADD CONSTRAINT "onboarding_run_items_onboarding_flow_item_id_fkey" FOREIGN KEY ("onboarding_flow_item_id") REFERENCES "onboarding_flow_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "probation_reviews" ADD CONSTRAINT "probation_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "probation_reviews" ADD CONSTRAINT "probation_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "probation_reviews" ADD CONSTRAINT "probation_reviews_approval_flow_id_fkey" FOREIGN KEY ("approval_flow_id") REFERENCES "approval_flows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employee_transitions" ADD CONSTRAINT "employee_transitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_transitions" ADD CONSTRAINT "employee_transitions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_transitions" ADD CONSTRAINT "employee_transitions_approval_flow_id_fkey" FOREIGN KEY ("approval_flow_id") REFERENCES "approval_flows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_approval_flow_id_fkey" FOREIGN KEY ("approval_flow_id") REFERENCES "approval_flows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "resignation_requests" ADD CONSTRAINT "resignation_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resignation_requests" ADD CONSTRAINT "resignation_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resignation_requests" ADD CONSTRAINT "resignation_requests_approval_flow_id_fkey" FOREIGN KEY ("approval_flow_id") REFERENCES "approval_flows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "exit_clearances" ADD CONSTRAINT "exit_clearances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exit_clearances" ADD CONSTRAINT "exit_clearances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exit_clearances" ADD CONSTRAINT "exit_clearances_resignation_request_id_fkey" FOREIGN KEY ("resignation_request_id") REFERENCES "resignation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exit_interviews" ADD CONSTRAINT "exit_interviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exit_interviews" ADD CONSTRAINT "exit_interviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exit_interviews" ADD CONSTRAINT "exit_interviews_resignation_request_id_fkey" FOREIGN KEY ("resignation_request_id") REFERENCES "resignation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "offboarding_requests" ADD CONSTRAINT "offboarding_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offboarding_requests" ADD CONSTRAINT "offboarding_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offboarding_requests" ADD CONSTRAINT "offboarding_requests_resignation_request_id_fkey" FOREIGN KEY ("resignation_request_id") REFERENCES "resignation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lifecycle_letters" ADD CONSTRAINT "lifecycle_letters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lifecycle_letters" ADD CONSTRAINT "lifecycle_letters_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (RLS) Policies
ALTER TABLE "onboarding_flows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_flows" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "onboarding_flows";
CREATE POLICY "tenant_isolation_policy" ON "onboarding_flows"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "onboarding_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_runs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "onboarding_runs";
CREATE POLICY "tenant_isolation_policy" ON "onboarding_runs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "probation_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "probation_reviews" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "probation_reviews";
CREATE POLICY "tenant_isolation_policy" ON "probation_reviews"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_transitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_transitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_transitions";
CREATE POLICY "tenant_isolation_policy" ON "employee_transitions"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "salary_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salary_revisions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "salary_revisions";
CREATE POLICY "tenant_isolation_policy" ON "salary_revisions"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "resignation_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resignation_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "resignation_requests";
CREATE POLICY "tenant_isolation_policy" ON "resignation_requests"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "exit_clearances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exit_clearances" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "exit_clearances";
CREATE POLICY "tenant_isolation_policy" ON "exit_clearances"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "exit_interviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exit_interviews" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "exit_interviews";
CREATE POLICY "tenant_isolation_policy" ON "exit_interviews"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "offboarding_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "offboarding_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "offboarding_requests";
CREATE POLICY "tenant_isolation_policy" ON "offboarding_requests"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assets" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "assets";
CREATE POLICY "tenant_isolation_policy" ON "assets"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "lifecycle_letters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lifecycle_letters" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "lifecycle_letters";
CREATE POLICY "tenant_isolation_policy" ON "lifecycle_letters"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- Grant table privileges to zentra_app limited role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'zentra_app') THEN
    GRANT ALL ON TABLE 
      "onboarding_flows",
      "onboarding_flow_items",
      "onboarding_runs",
      "onboarding_run_items",
      "probation_reviews",
      "employee_transitions",
      "salary_revisions",
      "resignation_requests",
      "exit_clearances",
      "exit_interviews",
      "offboarding_requests",
      "assets",
      "lifecycle_letters"
    TO zentra_app;
  END IF;
END
$$;
