-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255),
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");

-- 2. Organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_organizations_slug" ON "organizations"("slug");

-- 3. Organization Memberships table
CREATE TABLE IF NOT EXISTS "organization_memberships" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "uq_membership_user_organization" UNIQUE ("user_id", "organization_id")
);

CREATE INDEX IF NOT EXISTS "idx_org_memberships_user_id" ON "organization_memberships"("user_id");
CREATE INDEX IF NOT EXISTS "idx_org_memberships_org_id" ON "organization_memberships"("organization_id");

-- 4. Organization Products table
CREATE TABLE IF NOT EXISTS "organization_products" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "product_code" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "trial_ends_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_org_product_code" UNIQUE ("organization_id", "product_code")
);

CREATE INDEX IF NOT EXISTS "idx_org_products_org_id" ON "organization_products"("organization_id");

-- 5. Roles table
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_roles_org_id" ON "roles"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_roles_code" ON "roles"("code");

-- 6. Permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL UNIQUE,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_permissions_code" ON "permissions"("code");

-- 7. Role Permissions table
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_role_permission" UNIQUE ("role_id", "permission_id")
);

CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_perm_id" ON "role_permissions"("permission_id");

-- 8. User Roles table
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "membership_id" UUID NOT NULL REFERENCES "organization_memberships"("id") ON DELETE CASCADE,
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_user_membership_role" UNIQUE ("membership_id", "role_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_roles_org_id" ON "user_roles"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_membership_id" ON "user_roles"("membership_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles"("role_id");

-- 9. Audit Logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID REFERENCES "organizations"("id") ON DELETE SET NULL,
    "actor_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(100),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_org_id" ON "audit_logs"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor_id" ON "audit_logs"("actor_user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- 10. Refresh Tokens table
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "ip_address" VARCHAR(100),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_hash" ON "refresh_tokens"("token_hash");

-- 11. Email Verification Tokens table
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_email_tokens_user_id" ON "email_verification_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_email_tokens_hash" ON "email_verification_tokens"("token_hash");

-- 12. Password Reset Tokens table
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_pw_tokens_user_id" ON "password_reset_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_pw_tokens_hash" ON "password_reset_tokens"("token_hash");

-- 13. Invitations table
CREATE TABLE IF NOT EXISTS "invitations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "email" VARCHAR(255) NOT NULL,
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "invited_by_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_invitations_org_id" ON "invitations"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_invitations_email" ON "invitations"("email");
CREATE INDEX IF NOT EXISTS "idx_invitations_hash" ON "invitations"("token_hash");
CREATE INDEX IF NOT EXISTS "idx_invitations_status" ON "invitations"("status");

-- 14. Company Profiles table
CREATE TABLE IF NOT EXISTS "company_profiles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL UNIQUE REFERENCES "organizations"("id") ON DELETE CASCADE,
    "legal_name" VARCHAR(150),
    "logo_url" TEXT,
    "website" VARCHAR(255),
    "industry" VARCHAR(100),
    "company_size" VARCHAR(50),
    "registration_number" VARCHAR(100),
    "tax_id_number" VARCHAR(100),
    "country" VARCHAR(100),
    "state" VARCHAR(100),
    "city" VARCHAR(100),
    "address" VARCHAR(255),
    "timezone" VARCHAR(50),
    "default_currency" VARCHAR(10),
    "primary_contact_name" VARCHAR(100),
    "primary_contact_email" VARCHAR(255),
    "primary_contact_phone" VARCHAR(30),
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_company_profiles_org_id" ON "company_profiles"("organization_id");

-- 15. Locations table
CREATE TABLE IF NOT EXISTS "locations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(20),
    "timezone" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "is_headquarters" BOOLEAN NOT NULL DEFAULT FALSE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "uq_locations_org_name" UNIQUE ("organization_id", "name"),
    CONSTRAINT "uq_locations_org_code" UNIQUE ("organization_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_locations_org_id" ON "locations"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_locations_status" ON "locations"("status");

-- 16. Departments table
CREATE TABLE IF NOT EXISTS "departments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "parent_department_id" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
    "department_head_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "uq_departments_org_name" UNIQUE ("organization_id", "name"),
    CONSTRAINT "uq_departments_org_code" UNIQUE ("organization_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_departments_org_id" ON "departments"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_departments_parent_id" ON "departments"("parent_department_id");
CREATE INDEX IF NOT EXISTS "idx_departments_status" ON "departments"("status");

-- 17. Grades table
CREATE TABLE IF NOT EXISTS "grades" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "uq_grades_org_name" UNIQUE ("organization_id", "name"),
    CONSTRAINT "uq_grades_org_code" UNIQUE ("organization_id", "code"),
    CONSTRAINT "uq_grades_org_level" UNIQUE ("organization_id", "level")
);

CREATE INDEX IF NOT EXISTS "idx_grades_org_id" ON "grades"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_grades_status" ON "grades"("status");

-- 18. Designations table
CREATE TABLE IF NOT EXISTS "designations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "grade_id" UUID REFERENCES "grades"("id") ON DELETE SET NULL,
    "department_id" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "uq_designations_org_name" UNIQUE ("organization_id", "name"),
    CONSTRAINT "uq_designations_org_code" UNIQUE ("organization_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_designations_org_id" ON "designations"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_designations_grade_id" ON "designations"("grade_id");
CREATE INDEX IF NOT EXISTS "idx_designations_dept_id" ON "designations"("department_id");
CREATE INDEX IF NOT EXISTS "idx_designations_status" ON "designations"("status");

-- 19. Workweek Configs table
CREATE TABLE IF NOT EXISTS "workweek_configs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL UNIQUE REFERENCES "organizations"("id") ON DELETE CASCADE,
    "weekly_working_days" JSONB NOT NULL,
    "weekend_days" JSONB NOT NULL,
    "daily_start_time" VARCHAR(10) NOT NULL DEFAULT '09:00',
    "daily_end_time" VARCHAR(10) NOT NULL DEFAULT '18:00',
    "break_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "effective_from" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_workweek_configs_org_id" ON "workweek_configs"("organization_id");

-- 20. Holidays table
CREATE TABLE IF NOT EXISTS "holidays" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    "location_id" UUID REFERENCES "locations"("id") ON DELETE CASCADE,
    "description" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_holidays_org_id" ON "holidays"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_holidays_date" ON "holidays"("date");
CREATE INDEX IF NOT EXISTS "idx_holidays_location_id" ON "holidays"("location_id");


-- ----------------------------------------------------
-- Employee Management Tables
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS "employees" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "work_email" VARCHAR(255) NOT NULL,
    "personal_email" VARCHAR(255),
    "phone" VARCHAR(50) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(50),
    "marital_status" VARCHAR(50),
    "blood_group" VARCHAR(50),
    "nationality" VARCHAR(100),
    "current_address" TEXT,
    "permanent_address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "emergency_contact_name" VARCHAR(150),
    "emergency_contact_phone" VARCHAR(50),
    "emergency_contact_relationship" VARCHAR(100),
    "profile_photo_url" TEXT,
    "date_of_joining" DATE NOT NULL,
    "probation_end_date" DATE,
    "employment_type" VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "location_id" UUID NOT NULL REFERENCES "locations"("id"),
    "department_id" UUID NOT NULL REFERENCES "departments"("id"),
    "designation_id" UUID NOT NULL REFERENCES "designations"("id"),
    "grade_id" UUID REFERENCES "grades"("id") ON DELETE SET NULL,
    "reporting_manager_id" UUID REFERENCES "employees"("id") ON DELETE SET NULL,
    "work_location_id" UUID,
    "date_of_exit" DATE,
    "exit_reason" TEXT,
    "custom_fields" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "uq_employees_org_code" UNIQUE ("organization_id", "employee_code"),
    CONSTRAINT "uq_employees_org_work_email" UNIQUE ("organization_id", "work_email")
);

CREATE INDEX IF NOT EXISTS "idx_employees_organization_id" ON "employees"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_employees_employee_code" ON "employees"("employee_code");
CREATE INDEX IF NOT EXISTS "idx_employees_work_email" ON "employees"("work_email");
CREATE INDEX IF NOT EXISTS "idx_employees_status" ON "employees"("status");
CREATE INDEX IF NOT EXISTS "idx_employees_department_id" ON "employees"("department_id");
CREATE INDEX IF NOT EXISTS "idx_employees_location_id" ON "employees"("location_id");
CREATE INDEX IF NOT EXISTS "idx_employees_designation_id" ON "employees"("designation_id");
CREATE INDEX IF NOT EXISTS "idx_employees_reporting_manager_id" ON "employees"("reporting_manager_id");

CREATE TABLE IF NOT EXISTS "employment_histories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "employee_id" UUID NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "event_type" VARCHAR(100) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "location_id" UUID REFERENCES "locations"("id") ON DELETE SET NULL,
    "department_id" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
    "designation_id" UUID REFERENCES "designations"("id") ON DELETE SET NULL,
    "grade_id" UUID REFERENCES "grades"("id") ON DELETE SET NULL,
    "reporting_manager_id" UUID,
    "employment_type" VARCHAR(50),
    "employee_status" VARCHAR(50),
    "remarks" TEXT,
    "previous_values" JSONB,
    "new_values" JSONB,
    "changed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_employment_histories_organization_id" ON "employment_histories"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_employment_histories_employee_id" ON "employment_histories"("employee_id");
CREATE INDEX IF NOT EXISTS "idx_employment_histories_event_type" ON "employment_histories"("event_type");
CREATE INDEX IF NOT EXISTS "idx_employment_histories_effective_from" ON "employment_histories"("effective_from");

CREATE TABLE IF NOT EXISTS "employee_code_sequences" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID UNIQUE NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "prefix" VARCHAR(20) NOT NULL DEFAULT 'ZEN-',
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "employee_import_jobs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "file_name" VARCHAR(255) NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "successful_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB DEFAULT '[]',
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_employee_import_jobs_organization_id" ON "employee_import_jobs"("organization_id");

CREATE TABLE IF NOT EXISTS "employee_export_jobs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    "file_name" VARCHAR(255) NOT NULL,
    "file_content" TEXT NOT NULL,
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_employee_export_jobs_organization_id" ON "employee_export_jobs"("organization_id");

-- ====================================================================
-- PostgreSQL Row-Level Security (RLS) & Limited Application Role
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'zentra_app') THEN
    CREATE ROLE zentra_app WITH LOGIN PASSWORD 'zentra_secure_app_pwd_2026' NOINHERIT;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO zentra_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zentra_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO zentra_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zentra_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO zentra_app;

-- Enable and Force RLS on all Tenant-Owned Tables
ALTER TABLE "organization_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_memberships" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "organization_memberships";
CREATE POLICY "tenant_isolation_policy" ON "organization_memberships"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "organization_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_products" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "organization_products";
CREATE POLICY "tenant_isolation_policy" ON "organization_products"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "roles";
CREATE POLICY "tenant_isolation_policy" ON "roles"
  FOR ALL
  USING ("organization_id" IS NULL OR "organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "user_roles";
CREATE POLICY "tenant_isolation_policy" ON "user_roles"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "invitations";
CREATE POLICY "tenant_isolation_policy" ON "invitations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "audit_logs";
CREATE POLICY "tenant_isolation_policy" ON "audit_logs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "company_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_profiles" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "company_profiles";
CREATE POLICY "tenant_isolation_policy" ON "company_profiles"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "locations";
CREATE POLICY "tenant_isolation_policy" ON "locations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "departments";
CREATE POLICY "tenant_isolation_policy" ON "departments"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "designations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "designations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "designations";
CREATE POLICY "tenant_isolation_policy" ON "designations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "grades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "grades" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "grades";
CREATE POLICY "tenant_isolation_policy" ON "grades"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "workweek_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workweek_configs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "workweek_configs";
CREATE POLICY "tenant_isolation_policy" ON "workweek_configs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "holidays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "holidays" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "holidays";
CREATE POLICY "tenant_isolation_policy" ON "holidays"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employees";
CREATE POLICY "tenant_isolation_policy" ON "employees"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employment_histories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employment_histories" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employment_histories";
CREATE POLICY "tenant_isolation_policy" ON "employment_histories"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_code_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_code_sequences" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_code_sequences";
CREATE POLICY "tenant_isolation_policy" ON "employee_code_sequences"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_import_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_import_jobs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_import_jobs";
CREATE POLICY "tenant_isolation_policy" ON "employee_import_jobs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "employee_export_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_export_jobs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "employee_export_jobs";
CREATE POLICY "tenant_isolation_policy" ON "employee_export_jobs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));
