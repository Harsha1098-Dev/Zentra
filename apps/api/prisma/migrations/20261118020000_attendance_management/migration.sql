-- ====================================================================
-- Migration: 20261118020000_attendance_management
-- Purpose: Create tables for Attendance Policies, Shifts, Rosters, Shift Assignments,
--          Attendance Records, Regularisations, Overtime Requests, Attendance Requests,
--          and Attendance Locks with PostgreSQL Row Level Security (RLS)
-- ====================================================================

-- 1. CreateTable attendance_policies
CREATE TABLE "attendance_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "mode" TEXT NOT NULL DEFAULT 'STRICT',
    "work_hours_per_day" DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    "min_hours_half_day" DECIMAL(4,2) NOT NULL DEFAULT 4.0,
    "min_hours_full_day" DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    "grace_period_late_check_in" INTEGER NOT NULL DEFAULT 15,
    "grace_period_early_check_out" INTEGER NOT NULL DEFAULT 15,
    "max_grace_occurrences_per_month" INTEGER NOT NULL DEFAULT 3,
    "late_check_in_penalty_type" TEXT NOT NULL DEFAULT 'HALF_DAY',
    "late_check_in_penalty_deduction_days" DECIMAL(4,2) NOT NULL DEFAULT 0.5,
    "allow_overtime" BOOLEAN NOT NULL DEFAULT false,
    "min_overtime_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_overtime_minutes_per_day" INTEGER NOT NULL DEFAULT 240,
    "overtime_requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "allow_regularisation" BOOLEAN NOT NULL DEFAULT true,
    "regularisation_deadline_days" INTEGER NOT NULL DEFAULT 7,
    "max_regularisations_per_month" INTEGER NOT NULL DEFAULT 3,
    "allow_self_check_in" BOOLEAN NOT NULL DEFAULT true,
    "allow_web_punch" BOOLEAN NOT NULL DEFAULT true,
    "allow_mobile_punch" BOOLEAN NOT NULL DEFAULT false,
    "ip_restrictions" JSONB DEFAULT '[]',
    "geofencing_enabled" BOOLEAN NOT NULL DEFAULT false,
    "geofence_radius_meters" INTEGER,
    "auto_checkout_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_checkout_time" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_policies_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable shifts
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "policy_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_overnight" BOOLEAN NOT NULL DEFAULT false,
    "break_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_paid_break" BOOLEAN NOT NULL DEFAULT false,
    "check_in_margin_before_minutes" INTEGER NOT NULL DEFAULT 60,
    "check_out_margin_after_minutes" INTEGER NOT NULL DEFAULT 120,
    "color_code" TEXT NOT NULL DEFAULT '#3B82F6',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable rosters
CREATE TABLE "rosters" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rosters_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable shift_assignments
CREATE TABLE "shift_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "roster_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" TEXT,
    "is_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable attendance_records
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_date" TIMESTAMP(3) NOT NULL,
    "shift_id" TEXT,
    "policy_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABSENT',
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "check_in_source" TEXT,
    "check_out_source" TEXT,
    "check_in_ip" TEXT,
    "check_out_ip" TEXT,
    "check_in_location" TEXT,
    "check_out_location" TEXT,
    "worked_minutes" INTEGER NOT NULL DEFAULT 0,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "payable_minutes" INTEGER NOT NULL DEFAULT 0,
    "overtime_minutes" INTEGER NOT NULL DEFAULT 0,
    "approved_overtime_minutes" INTEGER NOT NULL DEFAULT 0,
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "early_minutes" INTEGER NOT NULL DEFAULT 0,
    "deviation_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "is_early_exit" BOOLEAN NOT NULL DEFAULT false,
    "is_regularised" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable attendance_regularisations
CREATE TABLE "attendance_regularisations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "attendance_record_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "requested_check_in" TIMESTAMP(3),
    "requested_check_out" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approval_flow_id" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_regularisations_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable overtime_requests
CREATE TABLE "overtime_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_record_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "overtime_minutes" INTEGER NOT NULL,
    "overtime_type" TEXT NOT NULL DEFAULT 'DAILY',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_requests_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable attendance_requests
CREATE TABLE "attendance_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_requests_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable attendance_locks
CREATE TABLE "attendance_locks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "locked_by" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlocked_by" TEXT,
    "unlocked_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_locks_pkey" PRIMARY KEY ("id")
);

-- Unique and standard indexes
CREATE UNIQUE INDEX "attendance_policies_organization_id_code_key" ON "attendance_policies"("organization_id", "code");
CREATE INDEX "attendance_policies_organization_id_idx" ON "attendance_policies"("organization_id");
CREATE INDEX "attendance_policies_is_default_idx" ON "attendance_policies"("is_default");

CREATE UNIQUE INDEX "shifts_organization_id_code_key" ON "shifts"("organization_id", "code");
CREATE INDEX "shifts_organization_id_idx" ON "shifts"("organization_id");
CREATE INDEX "shifts_policy_id_idx" ON "shifts"("policy_id");
CREATE INDEX "shifts_status_idx" ON "shifts"("status");

CREATE UNIQUE INDEX "rosters_organization_id_code_key" ON "rosters"("organization_id", "code");
CREATE INDEX "rosters_organization_id_idx" ON "rosters"("organization_id");
CREATE INDEX "rosters_start_date_idx" ON "rosters"("start_date");
CREATE INDEX "rosters_end_date_idx" ON "rosters"("end_date");
CREATE INDEX "rosters_status_idx" ON "rosters"("status");

CREATE INDEX "shift_assignments_organization_id_idx" ON "shift_assignments"("organization_id");
CREATE INDEX "shift_assignments_employee_id_idx" ON "shift_assignments"("employee_id");
CREATE INDEX "shift_assignments_shift_id_idx" ON "shift_assignments"("shift_id");
CREATE INDEX "shift_assignments_roster_id_idx" ON "shift_assignments"("roster_id");
CREATE INDEX "shift_assignments_start_date_idx" ON "shift_assignments"("start_date");
CREATE INDEX "shift_assignments_end_date_idx" ON "shift_assignments"("end_date");

CREATE UNIQUE INDEX "attendance_records_organization_id_employee_id_attendance_date_key" ON "attendance_records"("organization_id", "employee_id", "attendance_date");
CREATE INDEX "attendance_records_organization_id_idx" ON "attendance_records"("organization_id");
CREATE INDEX "attendance_records_employee_id_idx" ON "attendance_records"("employee_id");
CREATE INDEX "attendance_records_attendance_date_idx" ON "attendance_records"("attendance_date");
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");
CREATE INDEX "attendance_records_shift_id_idx" ON "attendance_records"("shift_id");
CREATE INDEX "attendance_records_policy_id_idx" ON "attendance_records"("policy_id");

CREATE INDEX "attendance_regularisations_organization_id_idx" ON "attendance_regularisations"("organization_id");
CREATE INDEX "attendance_regularisations_attendance_record_id_idx" ON "attendance_regularisations"("attendance_record_id");
CREATE INDEX "attendance_regularisations_employee_id_idx" ON "attendance_regularisations"("employee_id");
CREATE INDEX "attendance_regularisations_status_idx" ON "attendance_regularisations"("status");
CREATE INDEX "attendance_regularisations_approval_flow_id_idx" ON "attendance_regularisations"("approval_flow_id");

CREATE INDEX "overtime_requests_organization_id_idx" ON "overtime_requests"("organization_id");
CREATE INDEX "overtime_requests_employee_id_idx" ON "overtime_requests"("employee_id");
CREATE INDEX "overtime_requests_attendance_record_id_idx" ON "overtime_requests"("attendance_record_id");
CREATE INDEX "overtime_requests_date_idx" ON "overtime_requests"("date");
CREATE INDEX "overtime_requests_status_idx" ON "overtime_requests"("status");

CREATE INDEX "attendance_requests_organization_id_idx" ON "attendance_requests"("organization_id");
CREATE INDEX "attendance_requests_employee_id_idx" ON "attendance_requests"("employee_id");
CREATE INDEX "attendance_requests_request_type_idx" ON "attendance_requests"("request_type");
CREATE INDEX "attendance_requests_from_date_idx" ON "attendance_requests"("from_date");
CREATE INDEX "attendance_requests_to_date_idx" ON "attendance_requests"("to_date");
CREATE INDEX "attendance_requests_status_idx" ON "attendance_requests"("status");

CREATE INDEX "attendance_locks_organization_id_idx" ON "attendance_locks"("organization_id");
CREATE INDEX "attendance_locks_start_date_idx" ON "attendance_locks"("start_date");
CREATE INDEX "attendance_locks_end_date_idx" ON "attendance_locks"("end_date");
CREATE INDEX "attendance_locks_status_idx" ON "attendance_locks"("status");

-- Foreign key constraints
ALTER TABLE "attendance_policies" ADD CONSTRAINT "attendance_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "attendance_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "rosters" ADD CONSTRAINT "rosters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_roster_id_fkey" FOREIGN KEY ("roster_id") REFERENCES "rosters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "attendance_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance_regularisations" ADD CONSTRAINT "attendance_regularisations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_regularisations" ADD CONSTRAINT "attendance_regularisations_attendance_record_id_fkey" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_regularisations" ADD CONSTRAINT "attendance_regularisations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_attendance_record_id_fkey" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance_requests" ADD CONSTRAINT "attendance_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_requests" ADD CONSTRAINT "attendance_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_locks" ADD CONSTRAINT "attendance_locks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (RLS)
ALTER TABLE "attendance_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_policies" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "attendance_policies";
CREATE POLICY "tenant_isolation_policy" ON "attendance_policies"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "shifts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shifts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "shifts";
CREATE POLICY "tenant_isolation_policy" ON "shifts"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "rosters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rosters" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "rosters";
CREATE POLICY "tenant_isolation_policy" ON "rosters"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "shift_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shift_assignments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "shift_assignments";
CREATE POLICY "tenant_isolation_policy" ON "shift_assignments"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "attendance_records";
CREATE POLICY "tenant_isolation_policy" ON "attendance_records"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "attendance_regularisations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_regularisations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "attendance_regularisations";
CREATE POLICY "tenant_isolation_policy" ON "attendance_regularisations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "overtime_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "overtime_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "overtime_requests";
CREATE POLICY "tenant_isolation_policy" ON "overtime_requests"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "attendance_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_requests" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "attendance_requests";
CREATE POLICY "tenant_isolation_policy" ON "attendance_requests"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "attendance_locks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_locks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "attendance_locks";
CREATE POLICY "tenant_isolation_policy" ON "attendance_locks"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- Grant table privileges to zentra_app limited role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'zentra_app') THEN
    GRANT ALL ON TABLE "attendance_policies", "shifts", "rosters", "shift_assignments", "attendance_records", "attendance_regularisations", "overtime_requests", "attendance_requests", "attendance_locks" TO zentra_app;
  END IF;
END
$$;
