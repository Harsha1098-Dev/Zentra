import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

// Pipelines
import { PipelinesRepository } from './pipelines/pipelines.repository';
import { PipelinesService } from './pipelines/pipelines.service';
import { PipelinesController } from './pipelines/pipelines.controller';

// Job Openings
import { JobOpeningsRepository } from './job-openings/job-openings.repository';
import { JobOpeningsService } from './job-openings/job-openings.service';
import { JobOpeningsController } from './job-openings/job-openings.controller';

// Candidates
import { CandidatesRepository } from './candidates/candidates.repository';
import { CandidatesService } from './candidates/candidates.service';
import { CandidatesController } from './candidates/candidates.controller';

// Applications
import { ApplicationsRepository } from './applications/applications.repository';
import { ApplicationsService } from './applications/applications.service';
import { ApplicationsController } from './applications/applications.controller';

// Interviews
import { InterviewsRepository } from './interviews/interviews.repository';
import { InterviewsService } from './interviews/interviews.service';
import { InterviewsController } from './interviews/interviews.controller';

// Offers
import { OffersRepository } from './offers/offers.repository';
import { OffersService } from './offers/offers.service';
import { OffersController } from './offers/offers.controller';

// Referrals & Internal Jobs
import { ReferralsRepository } from './referrals/referrals.repository';
import { ReferralsService } from './referrals/referrals.service';
import { ReferralsController } from './referrals/referrals.controller';
import { InternalJobsController } from './referrals/internal-jobs.controller';

// Reports
import { ReportsRepository } from './reports/reports.repository';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';

@Module({
  imports: [PrismaModule, AuditModule, EmailModule],
  controllers: [
    JobOpeningsController,
    PipelinesController,
    CandidatesController,
    ApplicationsController,
    InterviewsController,
    OffersController,
    ReferralsController,
    InternalJobsController,
    ReportsController,
  ],
  providers: [
    PipelinesRepository,
    PipelinesService,
    JobOpeningsRepository,
    JobOpeningsService,
    CandidatesRepository,
    CandidatesService,
    ApplicationsRepository,
    ApplicationsService,
    InterviewsRepository,
    InterviewsService,
    OffersRepository,
    OffersService,
    ReferralsRepository,
    ReferralsService,
    ReportsRepository,
    ReportsService,
  ],
  exports: [
    JobOpeningsService,
    PipelinesService,
    CandidatesService,
    ApplicationsService,
    InterviewsService,
    OffersService,
    ReferralsService,
    ReportsService,
  ],
})
export class RecruitmentModule {}
