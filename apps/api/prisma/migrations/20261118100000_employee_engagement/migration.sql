-- ====================================================================
-- Migration: 20261118100000_employee_engagement
-- Purpose: Employee Engagement Module for Zentra People
--          Creates tables for Surveys, Survey Questions, Survey Responses,
--          Survey Answers, Polls, Poll Options, Poll Votes,
--          Recognition Programs, Recognitions, Rewards, Reward Redemptions,
--          Badges, Employee Badges, Celebrations, Wellness Activities,
--          and Wellness Participations.
-- ====================================================================

-- 1. CreateTable engagement_surveys
CREATE TABLE "engagement_surveys" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "survey_type" TEXT NOT NULL DEFAULT 'ENGAGEMENT',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "audience_type" TEXT NOT NULL DEFAULT 'ALL',
    "audience_filter" JSONB,
    "recurrence_frequency" TEXT NOT NULL DEFAULT 'NONE',
    "allow_anonymous_comments" BOOLEAN NOT NULL DEFAULT true,
    "total_eligible_count" INTEGER NOT NULL DEFAULT 0,
    "total_responses_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_surveys_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable survey_questions
CREATE TABLE "survey_questions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "section_name" TEXT NOT NULL DEFAULT 'General',
    "question_text" TEXT NOT NULL,
    "description" TEXT,
    "question_type" TEXT NOT NULL,
    "options" JSONB,
    "rating_scale_min" INTEGER NOT NULL DEFAULT 1,
    "rating_scale_max" INTEGER NOT NULL DEFAULT 5,
    "rating_scale_min_label" TEXT DEFAULT 'Strongly Disagree',
    "rating_scale_max_label" TEXT DEFAULT 'Strongly Agree',
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable survey_responses
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable survey_answers
CREATE TABLE "survey_answers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "survey_response_id" TEXT NOT NULL,
    "survey_question_id" TEXT NOT NULL,
    "text_value" TEXT,
    "number_value" DOUBLE PRECISION,
    "selected_options" JSONB,
    "boolean_value" BOOLEAN,
    "date_value" TIMESTAMP(3),
    "file_url" TEXT,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable polls
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "poll_type" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "audience_type" TEXT NOT NULL DEFAULT 'ALL',
    "audience_filter" JSONB,
    "total_votes_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable poll_options
CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "votes_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable poll_votes
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "poll_option_id" TEXT,
    "employee_id" TEXT,
    "rating_value" INTEGER,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable recognition_programs
CREATE TABLE "recognition_programs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "default_points" INTEGER NOT NULL DEFAULT 50,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "allow_peer_to_peer" BOOLEAN NOT NULL DEFAULT true,
    "allow_manager_to_employee" BOOLEAN NOT NULL DEFAULT true,
    "monthly_points_budget" INTEGER NOT NULL DEFAULT 200,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recognition_programs_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable badges
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "icon" TEXT NOT NULL DEFAULT 'Award',
    "color" TEXT NOT NULL DEFAULT '#1E3A8A',
    "points_award" INTEGER NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable recognitions
CREATE TABLE "recognitions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "program_id" TEXT,
    "badge_id" TEXT,
    "category" TEXT NOT NULL,
    "recognition_type" TEXT NOT NULL DEFAULT 'PEER_TO_PEER',
    "message" TEXT NOT NULL,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recognitions_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable employee_badges
CREATE TABLE "employee_badges" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "recognition_id" TEXT,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "employee_badges_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable rewards
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points_cost" INTEGER NOT NULL,
    "reward_type" TEXT NOT NULL DEFAULT 'VOUCHER',
    "quantity_available" INTEGER NOT NULL DEFAULT -1,
    "max_redemptions_per_employee" INTEGER NOT NULL DEFAULT 1,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- 13. CreateTable reward_redemptions
CREATE TABLE "reward_redemptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "reward_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "points_spent" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- 14. CreateTable celebrations
CREATE TABLE "celebrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "celebration_type" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "years_count" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "wishes_count" INTEGER NOT NULL DEFAULT 0,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "celebrations_pkey" PRIMARY KEY ("id")
);

-- 15. CreateTable wellness_activities
CREATE TABLE "wellness_activities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "max_participants" INTEGER NOT NULL DEFAULT 0,
    "points_reward" INTEGER NOT NULL DEFAULT 100,
    "location_or_link" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolled_count" INTEGER NOT NULL DEFAULT 0,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wellness_activities_pkey" PRIMARY KEY ("id")
);

-- 16. CreateTable wellness_participations
CREATE TABLE "wellness_participations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "wellness_activity_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "points_awarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wellness_participations_pkey" PRIMARY KEY ("id")
);

-- Create Unique Constraints
ALTER TABLE "survey_responses" ADD CONSTRAINT "uq_survey_response_emp" UNIQUE ("organization_id", "survey_id", "employee_id");
ALTER TABLE "poll_votes" ADD CONSTRAINT "uq_poll_vote_emp" UNIQUE ("organization_id", "poll_id", "employee_id");
ALTER TABLE "badges" ADD CONSTRAINT "uq_badge_name" UNIQUE ("organization_id", "name");
ALTER TABLE "wellness_participations" ADD CONSTRAINT "uq_wellness_part_emp" UNIQUE ("organization_id", "wellness_activity_id", "employee_id");

-- Create Indexes
CREATE INDEX "engagement_surveys_organization_id_idx" ON "engagement_surveys"("organization_id");
CREATE INDEX "engagement_surveys_status_idx" ON "engagement_surveys"("status");

CREATE INDEX "survey_questions_organization_id_idx" ON "survey_questions"("organization_id");
CREATE INDEX "survey_questions_survey_id_idx" ON "survey_questions"("survey_id");

CREATE INDEX "survey_responses_organization_id_idx" ON "survey_responses"("organization_id");
CREATE INDEX "survey_responses_survey_id_idx" ON "survey_responses"("survey_id");
CREATE INDEX "survey_responses_employee_id_idx" ON "survey_responses"("employee_id");

CREATE INDEX "survey_answers_organization_id_idx" ON "survey_answers"("organization_id");
CREATE INDEX "survey_answers_survey_response_id_idx" ON "survey_answers"("survey_response_id");
CREATE INDEX "survey_answers_survey_question_id_idx" ON "survey_answers"("survey_question_id");

CREATE INDEX "polls_organization_id_idx" ON "polls"("organization_id");
CREATE INDEX "polls_status_idx" ON "polls"("status");

CREATE INDEX "poll_options_organization_id_idx" ON "poll_options"("organization_id");
CREATE INDEX "poll_options_poll_id_idx" ON "poll_options"("poll_id");

CREATE INDEX "poll_votes_organization_id_idx" ON "poll_votes"("organization_id");
CREATE INDEX "poll_votes_poll_id_idx" ON "poll_votes"("poll_id");
CREATE INDEX "poll_votes_employee_id_idx" ON "poll_votes"("employee_id");

CREATE INDEX "recognition_programs_organization_id_idx" ON "recognition_programs"("organization_id");

CREATE INDEX "badges_organization_id_idx" ON "badges"("organization_id");

CREATE INDEX "recognitions_organization_id_idx" ON "recognitions"("organization_id");
CREATE INDEX "recognitions_sender_id_idx" ON "recognitions"("sender_id");
CREATE INDEX "recognitions_receiver_id_idx" ON "recognitions"("receiver_id");
CREATE INDEX "recognitions_category_idx" ON "recognitions"("category");

CREATE INDEX "employee_badges_organization_id_idx" ON "employee_badges"("organization_id");
CREATE INDEX "employee_badges_employee_id_idx" ON "employee_badges"("employee_id");
CREATE INDEX "employee_badges_badge_id_idx" ON "employee_badges"("badge_id");

CREATE INDEX "rewards_organization_id_idx" ON "rewards"("organization_id");

CREATE INDEX "reward_redemptions_organization_id_idx" ON "reward_redemptions"("organization_id");
CREATE INDEX "reward_redemptions_employee_id_idx" ON "reward_redemptions"("employee_id");
CREATE INDEX "reward_redemptions_reward_id_idx" ON "reward_redemptions"("reward_id");
CREATE INDEX "reward_redemptions_status_idx" ON "reward_redemptions"("status");

CREATE INDEX "celebrations_organization_id_idx" ON "celebrations"("organization_id");
CREATE INDEX "celebrations_employee_id_idx" ON "celebrations"("employee_id");
CREATE INDEX "celebrations_event_date_idx" ON "celebrations"("event_date");

CREATE INDEX "wellness_activities_organization_id_idx" ON "wellness_activities"("organization_id");
CREATE INDEX "wellness_activities_status_idx" ON "wellness_activities"("status");

CREATE INDEX "wellness_participations_organization_id_idx" ON "wellness_participations"("organization_id");
CREATE INDEX "wellness_participations_wellness_activity_id_idx" ON "wellness_participations"("wellness_activity_id");
CREATE INDEX "wellness_participations_employee_id_idx" ON "wellness_participations"("employee_id");

-- Add Foreign Key Constraints
ALTER TABLE "engagement_surveys" ADD CONSTRAINT "engagement_surveys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "engagement_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "engagement_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_survey_response_id_fkey" FOREIGN KEY ("survey_response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_survey_question_id_fkey" FOREIGN KEY ("survey_question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "polls" ADD CONSTRAINT "polls_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_option_id_fkey" FOREIGN KEY ("poll_option_id") REFERENCES "poll_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "recognition_programs" ADD CONSTRAINT "recognition_programs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "badges" ADD CONSTRAINT "badges_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "recognition_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_recognition_id_fkey" FOREIGN KEY ("recognition_id") REFERENCES "recognitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "rewards" ADD CONSTRAINT "rewards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "celebrations" ADD CONSTRAINT "celebrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "celebrations" ADD CONSTRAINT "celebrations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wellness_activities" ADD CONSTRAINT "wellness_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wellness_participations" ADD CONSTRAINT "wellness_participations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wellness_participations" ADD CONSTRAINT "wellness_participations_wellness_activity_id_fkey" FOREIGN KEY ("wellness_activity_id") REFERENCES "wellness_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wellness_participations" ADD CONSTRAINT "wellness_participations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
