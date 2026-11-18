-- ====================================================================
-- Migration: 20261118000000_workflow_approval_engine
-- Purpose: Create tables for Workflows, Approvals, Checklists, Tasks, and Delegations with PostgreSQL RLS
-- ====================================================================

-- 1. CreateTable workflow_rules
CREATE TABLE "workflow_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL DEFAULT 'people',
    "entity_type" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "condition_match_type" TEXT NOT NULL DEFAULT 'ALL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workflow_rules_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable workflow_actions
CREATE TABLE "workflow_actions" (
    "id" TEXT NOT NULL,
    "workflow_rule_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_config" JSONB NOT NULL,
    "execution_order" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable workflow_executions
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workflow_rule_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "context" JSONB DEFAULT '{}',
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable approval_flows
CREATE TABLE "approval_flows" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_flows_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable approval_steps
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "approval_flow_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "approver_type" TEXT NOT NULL,
    "approver_id" TEXT,
    "approver_role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "decision" TEXT,
    "comments" TEXT,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "escalated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable checklists
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL DEFAULT 'people',
    "entity_type" TEXT NOT NULL,
    "trigger_event" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable checklist_items
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner_type" TEXT NOT NULL DEFAULT 'role',
    "owner_id" TEXT,
    "owner_role" TEXT,
    "due_offset_days" INTEGER NOT NULL DEFAULT 0,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "execution_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable checklist_runs
CREATE TABLE "checklist_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_runs_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable checklist_run_items
CREATE TABLE "checklist_run_items" (
    "id" TEXT NOT NULL,
    "checklist_run_id" TEXT NOT NULL,
    "checklist_item_id" TEXT,
    "title" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_run_items_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable tasks
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to" TEXT,
    "assigned_by" TEXT,
    "due_date" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source_type" TEXT,
    "source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable delegations
CREATE TABLE "delegations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "delegate_from_user_id" TEXT NOT NULL,
    "delegate_to_user_id" TEXT NOT NULL,
    "module" TEXT,
    "request_type" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- ====================================================================
-- Indexes
-- ====================================================================

CREATE INDEX "workflow_rules_organization_id_idx" ON "workflow_rules"("organization_id");
CREATE INDEX "workflow_rules_module_idx" ON "workflow_rules"("module");
CREATE INDEX "workflow_rules_entity_type_idx" ON "workflow_rules"("entity_type");
CREATE INDEX "workflow_rules_trigger_event_idx" ON "workflow_rules"("trigger_event");
CREATE INDEX "workflow_rules_is_active_idx" ON "workflow_rules"("is_active");

CREATE INDEX "workflow_actions_workflow_rule_id_idx" ON "workflow_actions"("workflow_rule_id");

CREATE INDEX "workflow_executions_organization_id_idx" ON "workflow_executions"("organization_id");
CREATE INDEX "workflow_executions_workflow_rule_id_idx" ON "workflow_executions"("workflow_rule_id");
CREATE INDEX "workflow_executions_entity_type_entity_id_idx" ON "workflow_executions"("entity_type", "entity_id");
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");

CREATE INDEX "approval_flows_organization_id_idx" ON "approval_flows"("organization_id");
CREATE INDEX "approval_flows_request_type_idx" ON "approval_flows"("request_type");
CREATE INDEX "approval_flows_entity_type_entity_id_idx" ON "approval_flows"("entity_type", "entity_id");
CREATE INDEX "approval_flows_requested_by_idx" ON "approval_flows"("requested_by");
CREATE INDEX "approval_flows_status_idx" ON "approval_flows"("status");

CREATE INDEX "approval_steps_approval_flow_id_idx" ON "approval_steps"("approval_flow_id");
CREATE INDEX "approval_steps_approver_id_idx" ON "approval_steps"("approver_id");
CREATE INDEX "approval_steps_status_idx" ON "approval_steps"("status");
CREATE INDEX "approval_steps_due_date_idx" ON "approval_steps"("due_date");

CREATE INDEX "checklists_organization_id_idx" ON "checklists"("organization_id");
CREATE INDEX "checklists_entity_type_idx" ON "checklists"("entity_type");
CREATE INDEX "checklists_is_active_idx" ON "checklists"("is_active");

CREATE INDEX "checklist_items_checklist_id_idx" ON "checklist_items"("checklist_id");

CREATE INDEX "checklist_runs_organization_id_idx" ON "checklist_runs"("organization_id");
CREATE INDEX "checklist_runs_checklist_id_idx" ON "checklist_runs"("checklist_id");
CREATE INDEX "checklist_runs_entity_type_entity_id_idx" ON "checklist_runs"("entity_type", "entity_id");
CREATE INDEX "checklist_runs_status_idx" ON "checklist_runs"("status");

CREATE INDEX "checklist_run_items_checklist_run_id_idx" ON "checklist_run_items"("checklist_run_id");
CREATE INDEX "checklist_run_items_owner_id_idx" ON "checklist_run_items"("owner_id");
CREATE INDEX "checklist_run_items_status_idx" ON "checklist_run_items"("status");

CREATE INDEX "tasks_organization_id_idx" ON "tasks"("organization_id");
CREATE INDEX "tasks_assigned_to_idx" ON "tasks"("assigned_to");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

CREATE INDEX "delegations_organization_id_idx" ON "delegations"("organization_id");
CREATE INDEX "delegations_delegate_from_user_id_idx" ON "delegations"("delegate_from_user_id");
CREATE INDEX "delegations_delegate_to_user_id_idx" ON "delegations"("delegate_to_user_id");
CREATE INDEX "delegations_status_idx" ON "delegations"("status");

-- ====================================================================
-- Foreign Key Constraints
-- ====================================================================

ALTER TABLE "workflow_rules" ADD CONSTRAINT "workflow_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_workflow_rule_id_fkey" FOREIGN KEY ("workflow_rule_id") REFERENCES "workflow_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_rule_id_fkey" FOREIGN KEY ("workflow_rule_id") REFERENCES "workflow_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "approval_flows" ADD CONSTRAINT "approval_flows_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approval_flow_id_fkey" FOREIGN KEY ("approval_flow_id") REFERENCES "approval_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklists" ADD CONSTRAINT "checklists_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklist_run_items" ADD CONSTRAINT "checklist_run_items_checklist_run_id_fkey" FOREIGN KEY ("checklist_run_id") REFERENCES "checklist_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checklist_run_items" ADD CONSTRAINT "checklist_run_items_checklist_item_id_fkey" FOREIGN KEY ("checklist_item_id") REFERENCES "checklist_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delegations" ADD CONSTRAINT "delegations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ====================================================================
-- PostgreSQL Row-Level Security (RLS) Enforcement
-- ====================================================================

-- workflow_rules
ALTER TABLE "workflow_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_rules" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "workflow_rules";
CREATE POLICY "tenant_isolation_policy" ON "workflow_rules"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- workflow_executions
ALTER TABLE "workflow_executions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_executions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "workflow_executions";
CREATE POLICY "tenant_isolation_policy" ON "workflow_executions"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- approval_flows
ALTER TABLE "approval_flows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "approval_flows" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "approval_flows";
CREATE POLICY "tenant_isolation_policy" ON "approval_flows"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- checklists
ALTER TABLE "checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "checklists" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "checklists";
CREATE POLICY "tenant_isolation_policy" ON "checklists"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- checklist_runs
ALTER TABLE "checklist_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "checklist_runs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "checklist_runs";
CREATE POLICY "tenant_isolation_policy" ON "checklist_runs"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- tasks
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "tasks";
CREATE POLICY "tenant_isolation_policy" ON "tasks"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- delegations
ALTER TABLE "delegations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delegations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "delegations";
CREATE POLICY "tenant_isolation_policy" ON "delegations"
  FOR ALL
  USING ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- Grant table privileges to zentra_app limited role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'zentra_app') THEN
    GRANT ALL ON TABLE "workflow_rules", "workflow_actions", "workflow_executions", "approval_flows", "approval_steps", "checklists", "checklist_items", "checklist_runs", "checklist_run_items", "tasks", "delegations" TO zentra_app;
  END IF;
END
$$;
