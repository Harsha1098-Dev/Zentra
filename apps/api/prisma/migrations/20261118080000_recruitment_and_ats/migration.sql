-- ====================================================================
-- Migration: 20261118080000_recruitment_and_ats
-- Purpose: Recruitment & Applicant Tracking System (ATS) Module for Zentra People
--          Creates tables for Job Openings, Stages, Hiring Pipelines,
--          Candidates, Job Applications, Application Stage Histories,
--          Interviews, Interview Feedbacks, Offers, Candidate Documents,
--          Recruitment Notes, and Employee Referrals.
-- ====================================================================

-- 1. CreateTable hiring_pipelines
CREATE TABLE "hiring_pipelines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_pipelines_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable hiring_pipeline_stages
CREATE TABLE "hiring_pipeline_stages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "hiring_pipeline_id" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "stage_type" TEXT NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "interviewer_ids" JSONB DEFAULT '[]',
    "assessment_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable job_openings
CREATE TABLE "job_openings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "job_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "designation_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "work_mode" TEXT NOT NULL DEFAULT 'HYBRID',
    "experience_min_years" INTEGER NOT NULL DEFAULT 0,
    "experience_max_years" INTEGER NOT NULL DEFAULT 5,
    "salary_min" DOUBLE PRECISION,
    "salary_max" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "number_of_openings" INTEGER NOT NULL DEFAULT 1,
    "filled_openings" INTEGER NOT NULL DEFAULT 0,
    "hiring_manager_id" TEXT NOT NULL,
    "recruiter_id" TEXT,
    "pipeline_id" TEXT,
    "job_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "published_status" TEXT NOT NULL DEFAULT 'NOT_PUBLISHED',
    "external_job_url" TEXT,
    "application_deadline" TIMESTAMP(3),
    "responsibilities" JSONB DEFAULT '[]',
    "requirements" JSONB DEFAULT '[]',
    "skills" JSONB DEFAULT '[]',
    "benefits" JSONB DEFAULT '[]',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_openings_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable job_opening_stages
CREATE TABLE "job_opening_stages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_opening_id" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "stage_type" TEXT NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "interviewer_ids" JSONB DEFAULT '[]',
    "assessment_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_opening_stages_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable candidates
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "current_location" TEXT,
    "preferred_location" TEXT,
    "current_company" TEXT,
    "current_designation" TEXT,
    "total_experience_years" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relevant_experience_years" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expected_salary" DOUBLE PRECISION,
    "expected_salary_currency" TEXT NOT NULL DEFAULT 'INR',
    "notice_period_days" INTEGER NOT NULL DEFAULT 30,
    "resume_url" TEXT,
    "linkedin_url" TEXT,
    "portfolio_url" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'DIRECT',
    "source_name" TEXT,
    "referral_employee_id" TEXT,
    "candidate_status" TEXT NOT NULL DEFAULT 'NEW',
    "talent_pool_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "custom_fields" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable job_applications
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_opening_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "application_status" TEXT NOT NULL DEFAULT 'APPLIED',
    "current_stage_id" TEXT NOT NULL,
    "current_stage_name" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_type" TEXT NOT NULL DEFAULT 'DIRECT',
    "source_name" TEXT,
    "referral_employee_id" TEXT,
    "resume_url" TEXT,
    "cover_letter_url" TEXT,
    "screening_score" DOUBLE PRECISION,
    "screening_notes" TEXT,
    "rejection_reason" TEXT,
    "offer_id" TEXT,
    "hired_employee_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable application_stage_histories
CREATE TABLE "application_stage_histories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_application_id" TEXT NOT NULL,
    "from_stage_id" TEXT,
    "to_stage_id" TEXT NOT NULL,
    "from_stage_name" TEXT,
    "to_stage_name" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_stage_histories_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable interviews
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_application_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "interview_round" INTEGER NOT NULL DEFAULT 1,
    "interview_type" TEXT NOT NULL DEFAULT 'TECHNICAL_INTERVIEW',
    "interview_mode" TEXT NOT NULL DEFAULT 'VIDEO',
    "interview_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "interviewer_ids" JSONB NOT NULL DEFAULT '[]',
    "meeting_link" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "feedback_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable interview_feedbacks
CREATE TABLE "interview_feedbacks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "interview_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_application_id" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "technical_rating" INTEGER NOT NULL,
    "communication_rating" INTEGER NOT NULL,
    "culture_fit_rating" INTEGER NOT NULL,
    "overall_rating" INTEGER NOT NULL,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "comments" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_feedbacks_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable offers
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_application_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_opening_id" TEXT NOT NULL,
    "offer_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joining_date" TIMESTAMP(3) NOT NULL,
    "designation_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "work_mode" TEXT NOT NULL DEFAULT 'HYBRID',
    "annual_ctc" DOUBLE PRECISION NOT NULL,
    "monthly_ctc" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "salary_structure_id" TEXT,
    "offer_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "offer_letter_url" TEXT,
    "offer_letter_template_id" TEXT,
    "approval_flow_id" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable candidate_documents
CREATE TABLE "candidate_documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_application_id" TEXT,
    "document_type" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_documents_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable recruitment_notes
CREATE TABLE "recruitment_notes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_application_id" TEXT,
    "candidate_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "note_type" TEXT NOT NULL DEFAULT 'GENERAL',
    "note" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitment_notes_pkey" PRIMARY KEY ("id")
);

-- 13. CreateTable employee_referrals
CREATE TABLE "employee_referrals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "referring_employee_id" TEXT NOT NULL,
    "job_opening_id" TEXT NOT NULL,
    "candidate_name" TEXT NOT NULL,
    "candidate_email" TEXT NOT NULL,
    "candidate_phone" TEXT NOT NULL,
    "resume_url" TEXT,
    "relationship" TEXT,
    "notes" TEXT,
    "candidate_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_referrals_pkey" PRIMARY KEY ("id")
);

-- Create Unique Constraints & Indexes

-- hiring_pipelines
CREATE UNIQUE INDEX "hiring_pipelines_organization_id_name_key" ON "hiring_pipelines"("organization_id", "name");
CREATE INDEX "hiring_pipelines_organization_id_idx" ON "hiring_pipelines"("organization_id");

-- hiring_pipeline_stages
CREATE INDEX "hiring_pipeline_stages_organization_id_idx" ON "hiring_pipeline_stages"("organization_id");
CREATE INDEX "hiring_pipeline_stages_hiring_pipeline_id_idx" ON "hiring_pipeline_stages"("hiring_pipeline_id");
CREATE INDEX "hiring_pipeline_stages_stage_order_idx" ON "hiring_pipeline_stages"("stage_order");

-- job_openings
CREATE UNIQUE INDEX "job_openings_organization_id_title_key" ON "job_openings"("organization_id", "title");
CREATE UNIQUE INDEX "job_openings_organization_id_job_code_key" ON "job_openings"("organization_id", "job_code");
CREATE INDEX "job_openings_organization_id_idx" ON "job_openings"("organization_id");
CREATE INDEX "job_openings_department_id_idx" ON "job_openings"("department_id");
CREATE INDEX "job_openings_designation_id_idx" ON "job_openings"("designation_id");
CREATE INDEX "job_openings_location_id_idx" ON "job_openings"("location_id");
CREATE INDEX "job_openings_hiring_manager_id_idx" ON "job_openings"("hiring_manager_id");
CREATE INDEX "job_openings_recruiter_id_idx" ON "job_openings"("recruiter_id");
CREATE INDEX "job_openings_job_status_idx" ON "job_openings"("job_status");
CREATE INDEX "job_openings_published_status_idx" ON "job_openings"("published_status");

-- job_opening_stages
CREATE INDEX "job_opening_stages_organization_id_idx" ON "job_opening_stages"("organization_id");
CREATE INDEX "job_opening_stages_job_opening_id_idx" ON "job_opening_stages"("job_opening_id");
CREATE INDEX "job_opening_stages_stage_order_idx" ON "job_opening_stages"("stage_order");

-- candidates
CREATE UNIQUE INDEX "candidates_organization_id_email_key" ON "candidates"("organization_id", "email");
CREATE INDEX "candidates_organization_id_idx" ON "candidates"("organization_id");
CREATE INDEX "candidates_email_idx" ON "candidates"("email");
CREATE INDEX "candidates_candidate_status_idx" ON "candidates"("candidate_status");
CREATE INDEX "candidates_talent_pool_status_idx" ON "candidates"("talent_pool_status");

-- job_applications
CREATE UNIQUE INDEX "job_applications_organization_id_job_opening_id_candidate_id_key" ON "job_applications"("organization_id", "job_opening_id", "candidate_id");
CREATE UNIQUE INDEX "job_applications_offer_id_key" ON "job_applications"("offer_id");
CREATE INDEX "job_applications_organization_id_idx" ON "job_applications"("organization_id");
CREATE INDEX "job_applications_job_opening_id_idx" ON "job_applications"("job_opening_id");
CREATE INDEX "job_applications_candidate_id_idx" ON "job_applications"("candidate_id");
CREATE INDEX "job_applications_application_status_idx" ON "job_applications"("application_status");
CREATE INDEX "job_applications_current_stage_id_idx" ON "job_applications"("current_stage_id");

-- application_stage_histories
CREATE INDEX "application_stage_histories_organization_id_idx" ON "application_stage_histories"("organization_id");
CREATE INDEX "application_stage_histories_job_application_id_idx" ON "application_stage_histories"("job_application_id");

-- interviews
CREATE INDEX "interviews_organization_id_idx" ON "interviews"("organization_id");
CREATE INDEX "interviews_job_application_id_idx" ON "interviews"("job_application_id");
CREATE INDEX "interviews_candidate_id_idx" ON "interviews"("candidate_id");
CREATE INDEX "interviews_interview_date_idx" ON "interviews"("interview_date");
CREATE INDEX "interviews_status_idx" ON "interviews"("status");

-- interview_feedbacks
CREATE UNIQUE INDEX "interview_feedbacks_interview_id_interviewer_id_key" ON "interview_feedbacks"("interview_id", "interviewer_id");
CREATE INDEX "interview_feedbacks_organization_id_idx" ON "interview_feedbacks"("organization_id");
CREATE INDEX "interview_feedbacks_interview_id_idx" ON "interview_feedbacks"("interview_id");
CREATE INDEX "interview_feedbacks_interviewer_id_idx" ON "interview_feedbacks"("interviewer_id");
CREATE INDEX "interview_feedbacks_candidate_id_idx" ON "interview_feedbacks"("candidate_id");

-- offers
CREATE UNIQUE INDEX "offers_job_application_id_key" ON "offers"("job_application_id");
CREATE INDEX "offers_organization_id_idx" ON "offers"("organization_id");
CREATE INDEX "offers_job_application_id_idx" ON "offers"("job_application_id");
CREATE INDEX "offers_candidate_id_idx" ON "offers"("candidate_id");
CREATE INDEX "offers_job_opening_id_idx" ON "offers"("job_opening_id");
CREATE INDEX "offers_offer_status_idx" ON "offers"("offer_status");

-- candidate_documents
CREATE INDEX "candidate_documents_organization_id_idx" ON "candidate_documents"("organization_id");
CREATE INDEX "candidate_documents_candidate_id_idx" ON "candidate_documents"("candidate_id");

-- recruitment_notes
CREATE INDEX "recruitment_notes_organization_id_idx" ON "recruitment_notes"("organization_id");
CREATE INDEX "recruitment_notes_candidate_id_idx" ON "recruitment_notes"("candidate_id");
CREATE INDEX "recruitment_notes_job_application_id_idx" ON "recruitment_notes"("job_application_id");

-- employee_referrals
CREATE INDEX "employee_referrals_organization_id_idx" ON "employee_referrals"("organization_id");
CREATE INDEX "employee_referrals_referring_employee_id_idx" ON "employee_referrals"("referring_employee_id");
CREATE INDEX "employee_referrals_job_opening_id_idx" ON "employee_referrals"("job_opening_id");
CREATE INDEX "employee_referrals_candidate_email_idx" ON "employee_referrals"("candidate_email");

-- Foreign Key Constraints

-- hiring_pipelines
ALTER TABLE "hiring_pipelines" ADD CONSTRAINT "hiring_pipelines_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- hiring_pipeline_stages
ALTER TABLE "hiring_pipeline_stages" ADD CONSTRAINT "hiring_pipeline_stages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hiring_pipeline_stages" ADD CONSTRAINT "hiring_pipeline_stages_hiring_pipeline_id_fkey" FOREIGN KEY ("hiring_pipeline_id") REFERENCES "hiring_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- job_openings
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_hiring_manager_id_fkey" FOREIGN KEY ("hiring_manager_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "hiring_pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- job_opening_stages
ALTER TABLE "job_opening_stages" ADD CONSTRAINT "job_opening_stages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_opening_stages" ADD CONSTRAINT "job_opening_stages_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- candidates
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_referral_employee_id_fkey" FOREIGN KEY ("referral_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- job_applications
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_referral_employee_id_fkey" FOREIGN KEY ("referral_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_hired_employee_id_fkey" FOREIGN KEY ("hired_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- application_stage_histories
ALTER TABLE "application_stage_histories" ADD CONSTRAINT "application_stage_histories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_stage_histories" ADD CONSTRAINT "application_stage_histories_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- interviews
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- interview_feedbacks
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- offers
ALTER TABLE "offers" ADD CONSTRAINT "offers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- candidate_documents
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- recruitment_notes
ALTER TABLE "recruitment_notes" ADD CONSTRAINT "recruitment_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recruitment_notes" ADD CONSTRAINT "recruitment_notes_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recruitment_notes" ADD CONSTRAINT "recruitment_notes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recruitment_notes" ADD CONSTRAINT "recruitment_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- employee_referrals
ALTER TABLE "employee_referrals" ADD CONSTRAINT "employee_referrals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_referrals" ADD CONSTRAINT "employee_referrals_referring_employee_id_fkey" FOREIGN KEY ("referring_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_referrals" ADD CONSTRAINT "employee_referrals_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "job_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_referrals" ADD CONSTRAINT "employee_referrals_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
