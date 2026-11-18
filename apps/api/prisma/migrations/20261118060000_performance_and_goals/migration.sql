-- ====================================================================
-- Migration: 20261118060000_performance_and_goals
-- Purpose: Performance & Goals Module for Zentra People
--          Creates tables for Performance Cycles, Goals, KRAs, OKR Objectives,
--          Key Results, Check-ins, Continuous Feedback, 1:1 Meetings,
--          Improvement Plans (PIP), Rating Scales, Appraisal Templates,
--          Appraisal Assignments, Review Responses, Calibration Sessions,
--          and Calibration Decisions.
-- ====================================================================

-- 1. CreateTable performance_cycles
CREATE TABLE "performance_cycles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cycle_type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "review_start_date" TIMESTAMP(3),
    "review_end_date" TIMESTAMP(3),
    "self_review_start_date" TIMESTAMP(3),
    "self_review_end_date" TIMESTAMP(3),
    "manager_review_start_date" TIMESTAMP(3),
    "manager_review_end_date" TIMESTAMP(3),
    "calibration_start_date" TIMESTAMP(3),
    "calibration_end_date" TIMESTAMP(3),
    "publish_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "include_okr" BOOLEAN NOT NULL DEFAULT true,
    "include_goals" BOOLEAN NOT NULL DEFAULT true,
    "include_kra" BOOLEAN NOT NULL DEFAULT true,
    "include_competency" BOOLEAN NOT NULL DEFAULT true,
    "include_360_feedback" BOOLEAN NOT NULL DEFAULT false,
    "include_self_review" BOOLEAN NOT NULL DEFAULT true,
    "include_manager_review" BOOLEAN NOT NULL DEFAULT true,
    "include_calibration" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "performance_cycles_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable goals
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal_type" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "goal_category" TEXT NOT NULL DEFAULT 'BUSINESS',
    "start_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parent_goal_id" TEXT,
    "aligned_goal_id" TEXT,
    "alignment_type" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable kras
CREATE TABLE "kras" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'CORE',
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "kras_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable objectives
CREATE TABLE "objectives" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "period_start_date" TIMESTAMP(3) NOT NULL,
    "period_end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parent_objective_id" TEXT,
    "alignment_type" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "objectives_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable key_results
CREATE TABLE "key_results" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metric_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "start_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '%',
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable check_ins
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "goal_id" TEXT,
    "key_result_id" TEXT,
    "check_in_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_value" DOUBLE PRECISION NOT NULL,
    "progress_percentage" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "blockers" TEXT,
    "support_required" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable continuous_feedback
CREATE TABLE "continuous_feedback" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "given_by" TEXT NOT NULL,
    "feedback_type" TEXT NOT NULL DEFAULT 'PRAISE',
    "feedback_category" TEXT NOT NULL DEFAULT 'QUALITY_OF_WORK',
    "feedback" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "request_reason" TEXT,
    "requested_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "continuous_feedback_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable one_on_one_meetings
CREATE TABLE "one_on_one_meetings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT NOT NULL,
    "discussion_notes" TEXT,
    "action_items" JSONB,
    "next_meeting_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "one_on_one_meetings_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable improvement_plans
CREATE TABLE "improvement_plans" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "improvement_areas" JSONB,
    "success_criteria" TEXT NOT NULL,
    "support_required" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improvement_plans_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable rating_scales
CREATE TABLE "rating_scales" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scale_type" TEXT NOT NULL DEFAULT 'FIVE_POINT',
    "levels" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rating_scales_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable appraisal_templates
CREATE TABLE "appraisal_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "appraisal_type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "include_self_review" BOOLEAN NOT NULL DEFAULT true,
    "include_manager_review" BOOLEAN NOT NULL DEFAULT true,
    "include_multi_rater" BOOLEAN NOT NULL DEFAULT false,
    "include_goal_rating" BOOLEAN NOT NULL DEFAULT true,
    "include_kra_rating" BOOLEAN NOT NULL DEFAULT true,
    "include_competency_rating" BOOLEAN NOT NULL DEFAULT true,
    "include_okr_rating" BOOLEAN NOT NULL DEFAULT true,
    "rating_scale_id" TEXT,
    "sections" JSONB,
    "questions" JSONB,
    "weightages" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "appraisal_templates_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable appraisal_assignments
CREATE TABLE "appraisal_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "performance_cycle_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "appraisal_template_id" TEXT NOT NULL,
    "reporting_manager_id" TEXT,
    "reviewer_id" TEXT,
    "department_head_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "self_review_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "manager_review_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "multi_rater_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "calibration_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "final_rating" DOUBLE PRECISION,
    "final_comments" TEXT,
    "promotion_recommended" BOOLEAN NOT NULL DEFAULT false,
    "increment_recommended" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledgement_comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_assignments_pkey" PRIMARY KEY ("id")
);

-- 13. CreateTable review_responses
CREATE TABLE "review_responses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "appraisal_assignment_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewer_type" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "review_type" TEXT NOT NULL DEFAULT 'SELF',
    "section" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "comments" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);

-- 14. CreateTable calibration_sessions
CREATE TABLE "calibration_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "performance_cycle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department_id" TEXT,
    "location_id" TEXT,
    "session_date" TIMESTAMP(3) NOT NULL,
    "facilitator_id" TEXT,
    "participants" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calibration_sessions_pkey" PRIMARY KEY ("id")
);

-- 15. CreateTable calibration_decisions
CREATE TABLE "calibration_decisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "calibration_session_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "original_rating" DOUBLE PRECISION NOT NULL,
    "adjusted_rating" DOUBLE PRECISION NOT NULL,
    "adjustment_reason" TEXT NOT NULL,
    "decided_by" TEXT NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calibration_decisions_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "rating_scales_organization_id_name_key" ON "rating_scales"("organization_id", "name");
CREATE UNIQUE INDEX "appraisal_templates_organization_id_name_key" ON "appraisal_templates"("organization_id", "name");
CREATE UNIQUE INDEX "appraisal_assignments_performance_cycle_id_employee_id_key" ON "appraisal_assignments"("performance_cycle_id", "employee_id");
CREATE UNIQUE INDEX "calibration_decisions_calibration_session_id_employee_id_key" ON "calibration_decisions"("calibration_session_id", "employee_id");

-- Indexes
CREATE INDEX "performance_cycles_organization_id_idx" ON "performance_cycles"("organization_id");
CREATE INDEX "performance_cycles_status_idx" ON "performance_cycles"("status");

CREATE INDEX "goals_organization_id_idx" ON "goals"("organization_id");
CREATE INDEX "goals_employee_id_idx" ON "goals"("employee_id");
CREATE INDEX "goals_status_idx" ON "goals"("status");
CREATE INDEX "goals_due_date_idx" ON "goals"("due_date");

CREATE INDEX "kras_organization_id_idx" ON "kras"("organization_id");
CREATE INDEX "kras_employee_id_idx" ON "kras"("employee_id");
CREATE INDEX "kras_status_idx" ON "kras"("status");

CREATE INDEX "objectives_organization_id_idx" ON "objectives"("organization_id");
CREATE INDEX "objectives_owner_type_owner_id_idx" ON "objectives"("owner_type", "owner_id");
CREATE INDEX "objectives_status_idx" ON "objectives"("status");

CREATE INDEX "key_results_organization_id_idx" ON "key_results"("organization_id");
CREATE INDEX "key_results_objective_id_idx" ON "key_results"("objective_id");
CREATE INDEX "key_results_status_idx" ON "key_results"("status");
CREATE INDEX "key_results_due_date_idx" ON "key_results"("due_date");

CREATE INDEX "check_ins_organization_id_idx" ON "check_ins"("organization_id");
CREATE INDEX "check_ins_employee_id_idx" ON "check_ins"("employee_id");
CREATE INDEX "check_ins_goal_id_idx" ON "check_ins"("goal_id");
CREATE INDEX "check_ins_key_result_id_idx" ON "check_ins"("key_result_id");
CREATE INDEX "check_ins_status_idx" ON "check_ins"("status");

CREATE INDEX "continuous_feedback_organization_id_idx" ON "continuous_feedback"("organization_id");
CREATE INDEX "continuous_feedback_employee_id_idx" ON "continuous_feedback"("employee_id");
CREATE INDEX "continuous_feedback_given_by_idx" ON "continuous_feedback"("given_by");
CREATE INDEX "continuous_feedback_status_idx" ON "continuous_feedback"("status");

CREATE INDEX "one_on_one_meetings_organization_id_idx" ON "one_on_one_meetings"("organization_id");
CREATE INDEX "one_on_one_meetings_employee_id_idx" ON "one_on_one_meetings"("employee_id");
CREATE INDEX "one_on_one_meetings_manager_id_idx" ON "one_on_one_meetings"("manager_id");
CREATE INDEX "one_on_one_meetings_status_idx" ON "one_on_one_meetings"("status");

CREATE INDEX "improvement_plans_organization_id_idx" ON "improvement_plans"("organization_id");
CREATE INDEX "improvement_plans_employee_id_idx" ON "improvement_plans"("employee_id");
CREATE INDEX "improvement_plans_manager_id_idx" ON "improvement_plans"("manager_id");
CREATE INDEX "improvement_plans_status_idx" ON "improvement_plans"("status");

CREATE INDEX "rating_scales_organization_id_idx" ON "rating_scales"("organization_id");

CREATE INDEX "appraisal_templates_organization_id_idx" ON "appraisal_templates"("organization_id");

CREATE INDEX "appraisal_assignments_organization_id_idx" ON "appraisal_assignments"("organization_id");
CREATE INDEX "appraisal_assignments_performance_cycle_id_idx" ON "appraisal_assignments"("performance_cycle_id");
CREATE INDEX "appraisal_assignments_employee_id_idx" ON "appraisal_assignments"("employee_id");
CREATE INDEX "appraisal_assignments_reporting_manager_id_idx" ON "appraisal_assignments"("reporting_manager_id");
CREATE INDEX "appraisal_assignments_status_idx" ON "appraisal_assignments"("status");

CREATE INDEX "review_responses_organization_id_idx" ON "review_responses"("organization_id");
CREATE INDEX "review_responses_appraisal_assignment_id_idx" ON "review_responses"("appraisal_assignment_id");

CREATE INDEX "calibration_sessions_organization_id_idx" ON "calibration_sessions"("organization_id");
CREATE INDEX "calibration_sessions_performance_cycle_id_idx" ON "calibration_sessions"("performance_cycle_id");
CREATE INDEX "calibration_sessions_status_idx" ON "calibration_sessions"("status");

CREATE INDEX "calibration_decisions_organization_id_idx" ON "calibration_decisions"("organization_id");
CREATE INDEX "calibration_decisions_calibration_session_id_idx" ON "calibration_decisions"("calibration_session_id");
CREATE INDEX "calibration_decisions_employee_id_idx" ON "calibration_decisions"("employee_id");

-- Foreign key constraints
ALTER TABLE "performance_cycles" ADD CONSTRAINT "performance_cycles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "goals" ADD CONSTRAINT "goals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_parent_goal_id_fkey" FOREIGN KEY ("parent_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_aligned_goal_id_fkey" FOREIGN KEY ("aligned_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "kras" ADD CONSTRAINT "kras_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kras" ADD CONSTRAINT "kras_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "objectives" ADD CONSTRAINT "objectives_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_parent_objective_id_fkey" FOREIGN KEY ("parent_objective_id") REFERENCES "objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "key_results" ADD CONSTRAINT "key_results_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_key_result_id_fkey" FOREIGN KEY ("key_result_id") REFERENCES "key_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "continuous_feedback" ADD CONSTRAINT "continuous_feedback_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "continuous_feedback" ADD CONSTRAINT "continuous_feedback_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "continuous_feedback" ADD CONSTRAINT "continuous_feedback_given_by_fkey" FOREIGN KEY ("given_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "one_on_one_meetings" ADD CONSTRAINT "one_on_one_meetings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "one_on_one_meetings" ADD CONSTRAINT "one_on_one_meetings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "one_on_one_meetings" ADD CONSTRAINT "one_on_one_meetings_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "improvement_plans" ADD CONSTRAINT "improvement_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "improvement_plans" ADD CONSTRAINT "improvement_plans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "improvement_plans" ADD CONSTRAINT "improvement_plans_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rating_scales" ADD CONSTRAINT "rating_scales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appraisal_templates" ADD CONSTRAINT "appraisal_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appraisal_templates" ADD CONSTRAINT "appraisal_templates_rating_scale_id_fkey" FOREIGN KEY ("rating_scale_id") REFERENCES "rating_scales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appraisal_assignments" ADD CONSTRAINT "appraisal_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appraisal_assignments" ADD CONSTRAINT "appraisal_assignments_performance_cycle_id_fkey" FOREIGN KEY ("performance_cycle_id") REFERENCES "performance_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appraisal_assignments" ADD CONSTRAINT "appraisal_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appraisal_assignments" ADD CONSTRAINT "appraisal_assignments_appraisal_template_id_fkey" FOREIGN KEY ("appraisal_template_id") REFERENCES "appraisal_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appraisal_assignments" ADD CONSTRAINT "appraisal_assignments_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appraisal_assignments" ADD CONSTRAINT "appraisal_assignments_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appraisal_assignments" ADD CONSTRAINT "appraisal_assignments_department_head_id_fkey" FOREIGN KEY ("department_head_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_appraisal_assignment_id_fkey" FOREIGN KEY ("appraisal_assignment_id") REFERENCES "appraisal_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_performance_cycle_id_fkey" FOREIGN KEY ("performance_cycle_id") REFERENCES "performance_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "calibration_decisions" ADD CONSTRAINT "calibration_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calibration_decisions" ADD CONSTRAINT "calibration_decisions_calibration_session_id_fkey" FOREIGN KEY ("calibration_session_id") REFERENCES "calibration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calibration_decisions" ADD CONSTRAINT "calibration_decisions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
