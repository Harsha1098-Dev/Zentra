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
