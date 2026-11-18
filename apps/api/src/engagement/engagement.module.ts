import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

// Surveys
import { SurveysRepository } from './surveys/surveys.repository';
import { SurveysService } from './surveys/surveys.service';
import { SurveysController } from './surveys/surveys.controller';

// Polls
import { PollsRepository } from './polls/polls.repository';
import { PollsService } from './polls/polls.service';
import { PollsController } from './polls/polls.controller';

// Recognition
import { RecognitionRepository } from './recognition/recognition.repository';
import { RecognitionService } from './recognition/recognition.service';
import { RecognitionController } from './recognition/recognition.controller';

// Rewards
import { RewardsRepository } from './rewards/rewards.repository';
import { RewardsService } from './rewards/rewards.service';
import { RewardsController } from './rewards/rewards.controller';

// Badges
import { BadgesRepository } from './badges/badges.repository';
import { BadgesService } from './badges/badges.service';
import { BadgesController } from './badges/badges.controller';

// Celebrations
import { CelebrationsRepository } from './celebrations/celebrations.repository';
import { CelebrationsService } from './celebrations/celebrations.service';
import { CelebrationsController } from './celebrations/celebrations.controller';

// Wellness
import { WellnessRepository } from './wellness/wellness.repository';
import { WellnessService } from './wellness/wellness.service';
import { WellnessController } from './wellness/wellness.controller';

// Reports
import { EngagementReportsRepository } from './reports/reports.repository';
import { EngagementReportsService } from './reports/reports.service';
import { EngagementReportsController } from './reports/reports.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    SurveysController,
    PollsController,
    RecognitionController,
    RewardsController,
    BadgesController,
    CelebrationsController,
    WellnessController,
    EngagementReportsController,
  ],
  providers: [
    SurveysRepository,
    SurveysService,
    PollsRepository,
    PollsService,
    RecognitionRepository,
    RecognitionService,
    RewardsRepository,
    RewardsService,
    BadgesRepository,
    BadgesService,
    CelebrationsRepository,
    CelebrationsService,
    WellnessRepository,
    WellnessService,
    EngagementReportsRepository,
    EngagementReportsService,
  ],
  exports: [
    SurveysService,
    PollsService,
    RecognitionService,
    RewardsService,
    BadgesService,
    CelebrationsService,
    WellnessService,
    EngagementReportsService,
  ],
})
export class EngagementModule {}
