-- ====================================================================
-- Migration: 20261118090000_helpdesk_and_employee_support
-- Purpose: HR Helpdesk & Employee Support Module for Zentra People
--          Creates tables for Categories, SubCategories, Helpdesk Agents,
--          Category Agent mappings, Tickets, Ticket Conversations,
--          Ticket Attachments, Ticket Status Histories, Ticket Assignment Histories,
--          SLA Policies, SLA Escalation Rules, Knowledge Base Categories,
--          Knowledge Base Articles, FAQs, and Ticket Feedbacks.
-- ====================================================================

-- 1. CreateTable helpdesk_categories
CREATE TABLE "helpdesk_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "description" TEXT,
    "parent_category_id" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "default_assignee_type" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "default_assignee_id" TEXT,
    "default_priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sla_policy_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_categories_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable helpdesk_sub_categories
CREATE TABLE "helpdesk_sub_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "helpdesk_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sub_category_code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "default_assignee_type" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "default_assignee_id" TEXT,
    "default_priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sla_policy_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_sub_categories_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable helpdesk_agents
CREATE TABLE "helpdesk_agents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL DEFAULT 'PRIMARY',
    "agent_level" TEXT NOT NULL DEFAULT 'TIER_1',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_agents_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable helpdesk_category_agents
CREATE TABLE "helpdesk_category_agents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "helpdesk_category_id" TEXT NOT NULL,
    "helpdesk_sub_category_id" TEXT,
    "helpdesk_agent_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_category_agents_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable tickets
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "raised_by" TEXT NOT NULL,
    "helpdesk_category_id" TEXT NOT NULL,
    "helpdesk_sub_category_id" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "ticket_source" TEXT NOT NULL DEFAULT 'PORTAL',
    "ticket_status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_agent_id" TEXT,
    "assigned_team_id" TEXT,
    "sla_policy_id" TEXT,
    "sla_response_due_at" TIMESTAMP(3),
    "sla_resolution_due_at" TIMESTAMP(3),
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "closed_at" TIMESTAMP(3),
    "closed_by" TEXT,
    "reopened_at" TIMESTAMP(3),
    "escalation_level" TEXT NOT NULL DEFAULT 'LEVEL_1',
    "escalation_status" TEXT NOT NULL DEFAULT 'NOT_ESCALATED',
    "satisfaction_rating" INTEGER,
    "satisfaction_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable ticket_conversations
CREATE TABLE "ticket_conversations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_type" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "message_type" TEXT NOT NULL DEFAULT 'REPLY',
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_conversations_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable ticket_attachments
CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "ticket_conversation_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable ticket_status_histories
CREATE TABLE "ticket_status_histories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,

    CONSTRAINT "ticket_status_histories_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable ticket_assignment_histories
CREATE TABLE "ticket_assignment_histories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "from_agent_id" TEXT,
    "to_agent_id" TEXT,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,

    CONSTRAINT "ticket_assignment_histories_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable sla_policies
CREATE TABLE "sla_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "applicable_categories" JSONB,
    "applicable_sub_categories" JSONB,
    "applicable_priorities" JSONB,
    "applicable_locations" JSONB,
    "applicable_departments" JSONB,
    "response_time_minutes" INTEGER NOT NULL DEFAULT 60,
    "resolution_time_minutes" INTEGER NOT NULL DEFAULT 1440,
    "business_hours_only" BOOLEAN NOT NULL DEFAULT true,
    "business_hours_start" TEXT NOT NULL DEFAULT '09:00',
    "business_hours_end" TEXT NOT NULL DEFAULT '18:00',
    "working_days" JSONB,
    "holiday_calendar_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable sla_escalation_rules
CREATE TABLE "sla_escalation_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sla_policy_id" TEXT NOT NULL,
    "escalation_type" TEXT NOT NULL DEFAULT 'RESOLUTION_BREACH',
    "escalation_level" TEXT NOT NULL DEFAULT 'LEVEL_1',
    "trigger_before_minutes" INTEGER,
    "trigger_after_minutes" INTEGER,
    "escalate_to_type" TEXT NOT NULL DEFAULT 'AGENT',
    "escalate_to_id" TEXT,
    "notify_agent" BOOLEAN NOT NULL DEFAULT true,
    "notify_manager" BOOLEAN NOT NULL DEFAULT true,
    "reassign_ticket" BOOLEAN NOT NULL DEFAULT false,
    "change_priority" BOOLEAN NOT NULL DEFAULT false,
    "new_priority" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_escalation_rules_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable knowledge_base_categories
CREATE TABLE "knowledge_base_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "description" TEXT,
    "parent_category_id" TEXT,
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'ALL',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_categories_pkey" PRIMARY KEY ("id")
);

-- 13. CreateTable knowledge_base_articles
CREATE TABLE "knowledge_base_articles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "knowledge_base_category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "article_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibility" TEXT NOT NULL DEFAULT 'ALL',
    "author_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

-- 14. CreateTable faqs
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "helpdesk_category_id" TEXT,
    "helpdesk_sub_category_id" TEXT,
    "tags" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'ALL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- 15. CreateTable ticket_feedbacks
CREATE TABLE "ticket_feedbacks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_feedbacks_pkey" PRIMARY KEY ("id")
);

-- ====================================================================
-- Unique constraints and indexes
-- ====================================================================

-- helpdesk_categories
CREATE UNIQUE INDEX "helpdesk_categories_organization_id_category_code_key" ON "helpdesk_categories"("organization_id", "category_code");
CREATE UNIQUE INDEX "helpdesk_categories_organization_id_name_key" ON "helpdesk_categories"("organization_id", "name");
CREATE INDEX "helpdesk_categories_organization_id_idx" ON "helpdesk_categories"("organization_id");

-- helpdesk_sub_categories
CREATE UNIQUE INDEX "uq_helpdesk_subcat_code" ON "helpdesk_sub_categories"("organization_id", "helpdesk_category_id", "sub_category_code");
CREATE UNIQUE INDEX "uq_helpdesk_subcat_name" ON "helpdesk_sub_categories"("organization_id", "helpdesk_category_id", "name");
CREATE INDEX "helpdesk_sub_categories_organization_id_idx" ON "helpdesk_sub_categories"("organization_id");
CREATE INDEX "helpdesk_sub_categories_helpdesk_category_id_idx" ON "helpdesk_sub_categories"("helpdesk_category_id");

-- helpdesk_agents
CREATE UNIQUE INDEX "helpdesk_agents_organization_id_user_id_key" ON "helpdesk_agents"("organization_id", "user_id");
CREATE INDEX "helpdesk_agents_organization_id_idx" ON "helpdesk_agents"("organization_id");
CREATE INDEX "helpdesk_agents_user_id_idx" ON "helpdesk_agents"("user_id");

-- helpdesk_category_agents
CREATE UNIQUE INDEX "uq_helpdesk_category_agent" ON "helpdesk_category_agents"("organization_id", "helpdesk_category_id", "helpdesk_sub_category_id", "helpdesk_agent_id");
CREATE INDEX "helpdesk_category_agents_organization_id_idx" ON "helpdesk_category_agents"("organization_id");
CREATE INDEX "helpdesk_category_agents_helpdesk_category_id_idx" ON "helpdesk_category_agents"("helpdesk_category_id");
CREATE INDEX "helpdesk_category_agents_helpdesk_agent_id_idx" ON "helpdesk_category_agents"("helpdesk_agent_id");

-- tickets
CREATE UNIQUE INDEX "tickets_organization_id_ticket_number_key" ON "tickets"("organization_id", "ticket_number");
CREATE INDEX "tickets_organization_id_idx" ON "tickets"("organization_id");
CREATE INDEX "tickets_employee_id_idx" ON "tickets"("employee_id");
CREATE INDEX "tickets_helpdesk_category_id_idx" ON "tickets"("helpdesk_category_id");
CREATE INDEX "tickets_assigned_agent_id_idx" ON "tickets"("assigned_agent_id");
CREATE INDEX "tickets_ticket_status_idx" ON "tickets"("ticket_status");
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");

-- ticket_conversations
CREATE INDEX "ticket_conversations_organization_id_idx" ON "ticket_conversations"("organization_id");
CREATE INDEX "ticket_conversations_ticket_id_idx" ON "ticket_conversations"("ticket_id");
CREATE INDEX "ticket_conversations_author_id_idx" ON "ticket_conversations"("author_id");

-- ticket_attachments
CREATE INDEX "ticket_attachments_organization_id_idx" ON "ticket_attachments"("organization_id");
CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");

-- ticket_status_histories
CREATE INDEX "ticket_status_histories_organization_id_idx" ON "ticket_status_histories"("organization_id");
CREATE INDEX "ticket_status_histories_ticket_id_idx" ON "ticket_status_histories"("ticket_id");

-- ticket_assignment_histories
CREATE INDEX "ticket_assignment_histories_organization_id_idx" ON "ticket_assignment_histories"("organization_id");
CREATE INDEX "ticket_assignment_histories_ticket_id_idx" ON "ticket_assignment_histories"("ticket_id");

-- sla_policies
CREATE INDEX "sla_policies_organization_id_idx" ON "sla_policies"("organization_id");

-- sla_escalation_rules
CREATE INDEX "sla_escalation_rules_organization_id_idx" ON "sla_escalation_rules"("organization_id");
CREATE INDEX "sla_escalation_rules_sla_policy_id_idx" ON "sla_escalation_rules"("sla_policy_id");

-- knowledge_base_categories
CREATE UNIQUE INDEX "knowledge_base_categories_organization_id_category_code_key" ON "knowledge_base_categories"("organization_id", "category_code");
CREATE INDEX "knowledge_base_categories_organization_id_idx" ON "knowledge_base_categories"("organization_id");

-- knowledge_base_articles
CREATE UNIQUE INDEX "knowledge_base_articles_organization_id_slug_key" ON "knowledge_base_articles"("organization_id", "slug");
CREATE INDEX "knowledge_base_articles_organization_id_idx" ON "knowledge_base_articles"("organization_id");
CREATE INDEX "knowledge_base_articles_knowledge_base_category_id_idx" ON "knowledge_base_articles"("knowledge_base_category_id");
CREATE INDEX "knowledge_base_articles_article_status_idx" ON "knowledge_base_articles"("article_status");

-- faqs
CREATE INDEX "faqs_organization_id_idx" ON "faqs"("organization_id");
CREATE INDEX "faqs_helpdesk_category_id_idx" ON "faqs"("helpdesk_category_id");

-- ticket_feedbacks
CREATE UNIQUE INDEX "ticket_feedbacks_ticket_id_key" ON "ticket_feedbacks"("ticket_id");
CREATE UNIQUE INDEX "ticket_feedbacks_organization_id_ticket_id_key" ON "ticket_feedbacks"("organization_id", "ticket_id");
CREATE INDEX "ticket_feedbacks_organization_id_idx" ON "ticket_feedbacks"("organization_id");
CREATE INDEX "ticket_feedbacks_ticket_id_idx" ON "ticket_feedbacks"("ticket_id");
CREATE INDEX "ticket_feedbacks_employee_id_idx" ON "ticket_feedbacks"("employee_id");

-- ====================================================================
-- Foreign Key Constraints
-- ====================================================================

-- helpdesk_categories
ALTER TABLE "helpdesk_categories" ADD CONSTRAINT "helpdesk_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helpdesk_categories" ADD CONSTRAINT "helpdesk_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "helpdesk_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "helpdesk_categories" ADD CONSTRAINT "helpdesk_categories_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- helpdesk_sub_categories
ALTER TABLE "helpdesk_sub_categories" ADD CONSTRAINT "helpdesk_sub_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helpdesk_sub_categories" ADD CONSTRAINT "helpdesk_sub_categories_helpdesk_category_id_fkey" FOREIGN KEY ("helpdesk_category_id") REFERENCES "helpdesk_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helpdesk_sub_categories" ADD CONSTRAINT "helpdesk_sub_categories_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- helpdesk_agents
ALTER TABLE "helpdesk_agents" ADD CONSTRAINT "helpdesk_agents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helpdesk_agents" ADD CONSTRAINT "helpdesk_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- helpdesk_category_agents
ALTER TABLE "helpdesk_category_agents" ADD CONSTRAINT "helpdesk_category_agents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helpdesk_category_agents" ADD CONSTRAINT "helpdesk_category_agents_helpdesk_category_id_fkey" FOREIGN KEY ("helpdesk_category_id") REFERENCES "helpdesk_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helpdesk_category_agents" ADD CONSTRAINT "helpdesk_category_agents_helpdesk_sub_category_id_fkey" FOREIGN KEY ("helpdesk_sub_category_id") REFERENCES "helpdesk_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helpdesk_category_agents" ADD CONSTRAINT "helpdesk_category_agents_helpdesk_agent_id_fkey" FOREIGN KEY ("helpdesk_agent_id") REFERENCES "helpdesk_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- tickets
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_helpdesk_category_id_fkey" FOREIGN KEY ("helpdesk_category_id") REFERENCES "helpdesk_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_helpdesk_sub_category_id_fkey" FOREIGN KEY ("helpdesk_sub_category_id") REFERENCES "helpdesk_sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "helpdesk_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ticket_conversations
ALTER TABLE "ticket_conversations" ADD CONSTRAINT "ticket_conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_conversations" ADD CONSTRAINT "ticket_conversations_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_conversations" ADD CONSTRAINT "ticket_conversations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ticket_attachments
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_conversation_id_fkey" FOREIGN KEY ("ticket_conversation_id") REFERENCES "ticket_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ticket_status_histories
ALTER TABLE "ticket_status_histories" ADD CONSTRAINT "ticket_status_histories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_status_histories" ADD CONSTRAINT "ticket_status_histories_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_status_histories" ADD CONSTRAINT "ticket_status_histories_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ticket_assignment_histories
ALTER TABLE "ticket_assignment_histories" ADD CONSTRAINT "ticket_assignment_histories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_assignment_histories" ADD CONSTRAINT "ticket_assignment_histories_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- sla_policies
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- sla_escalation_rules
ALTER TABLE "sla_escalation_rules" ADD CONSTRAINT "sla_escalation_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sla_escalation_rules" ADD CONSTRAINT "sla_escalation_rules_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "sla_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- knowledge_base_categories
ALTER TABLE "knowledge_base_categories" ADD CONSTRAINT "knowledge_base_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_base_categories" ADD CONSTRAINT "knowledge_base_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "knowledge_base_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- knowledge_base_articles
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_knowledge_base_category_id_fkey" FOREIGN KEY ("knowledge_base_category_id") REFERENCES "knowledge_base_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- faqs
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_helpdesk_category_id_fkey" FOREIGN KEY ("helpdesk_category_id") REFERENCES "helpdesk_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_helpdesk_sub_category_id_fkey" FOREIGN KEY ("helpdesk_sub_category_id") REFERENCES "helpdesk_sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ticket_feedbacks
ALTER TABLE "ticket_feedbacks" ADD CONSTRAINT "ticket_feedbacks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_feedbacks" ADD CONSTRAINT "ticket_feedbacks_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_feedbacks" ADD CONSTRAINT "ticket_feedbacks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
