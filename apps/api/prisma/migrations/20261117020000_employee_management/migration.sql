-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "employee_code" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "work_email" TEXT NOT NULL,
    "personal_email" TEXT,
    "phone" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "marital_status" TEXT,
    "blood_group" TEXT,
    "nationality" TEXT,
    "current_address" TEXT,
    "permanent_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relationship" TEXT,
    "profile_photo_url" TEXT,
    "date_of_joining" TIMESTAMP(3) NOT NULL,
    "probation_end_date" TIMESTAMP(3),
    "employment_type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "location_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "designation_id" TEXT NOT NULL,
    "grade_id" TEXT,
    "reporting_manager_id" TEXT,
    "work_location_id" TEXT,
    "date_of_exit" TIMESTAMP(3),
    "exit_reason" TEXT,
    "custom_fields" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_histories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "location_id" TEXT,
    "department_id" TEXT,
    "designation_id" TEXT,
    "grade_id" TEXT,
    "reporting_manager_id" TEXT,
    "employment_type" TEXT,
    "employee_status" TEXT,
    "remarks" TEXT,
    "previous_values" JSONB,
    "new_values" JSONB,
    "changed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_code_sequences" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'ZEN-',
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_code_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_import_jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "successful_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB DEFAULT '[]',
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_export_jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "file_name" TEXT NOT NULL,
    "file_content" TEXT NOT NULL,
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_export_jobs_pkey" PRIMARY KEY ("id")
);

-- Indexes and Constraints for employees
CREATE UNIQUE INDEX "employees_organization_id_employee_code_key" ON "employees"("organization_id", "employee_code");
CREATE UNIQUE INDEX "employees_organization_id_work_email_key" ON "employees"("organization_id", "work_email");
CREATE INDEX "employees_organization_id_idx" ON "employees"("organization_id");
CREATE INDEX "employees_employee_code_idx" ON "employees"("employee_code");
CREATE INDEX "employees_work_email_idx" ON "employees"("work_email");
CREATE INDEX "employees_status_idx" ON "employees"("status");
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");
CREATE INDEX "employees_location_id_idx" ON "employees"("location_id");
CREATE INDEX "employees_designation_id_idx" ON "employees"("designation_id");
CREATE INDEX "employees_reporting_manager_id_idx" ON "employees"("reporting_manager_id");

-- Indexes for employment_histories
CREATE INDEX "employment_histories_organization_id_idx" ON "employment_histories"("organization_id");
CREATE INDEX "employment_histories_employee_id_idx" ON "employment_histories"("employee_id");
CREATE INDEX "employment_histories_event_type_idx" ON "employment_histories"("event_type");
CREATE INDEX "employment_histories_effective_from_idx" ON "employment_histories"("effective_from");

-- Indexes for sequences and jobs
CREATE UNIQUE INDEX "employee_code_sequences_organization_id_key" ON "employee_code_sequences"("organization_id");
CREATE INDEX "employee_import_jobs_organization_id_idx" ON "employee_import_jobs"("organization_id");
CREATE INDEX "employee_export_jobs_organization_id_idx" ON "employee_export_jobs"("organization_id");

-- Foreign Keys
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employee_code_sequences" ADD CONSTRAINT "employee_code_sequences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_import_jobs" ADD CONSTRAINT "employee_import_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_export_jobs" ADD CONSTRAINT "employee_export_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
