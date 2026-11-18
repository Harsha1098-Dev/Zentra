import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

// Cycles
import { CyclesRepository } from './cycles/cycles.repository';
import { CyclesService } from './cycles/cycles.service';
import { CyclesController } from './cycles/cycles.controller';

// Goals
import { GoalsRepository } from './goals/goals.repository';
import { GoalsService } from './goals/goals.service';
import { GoalsController } from './goals/goals.controller';

// KRAs
import { KrasRepository } from './kras/kras.repository';
import { KrasService } from './kras/kras.service';
import { KrasController } from './kras/kras.controller';

// OKRs
import { OkrsRepository } from './okrs/okrs.repository';
import { OkrsService } from './okrs/okrs.service';
import { ObjectivesController } from './okrs/objectives.controller';
import { KeyResultsController } from './okrs/key-results.controller';

// Check-ins
import { CheckinsRepository } from './checkins/checkins.repository';
import { CheckinsService } from './checkins/checkins.service';
import { CheckinsController } from './checkins/checkins.controller';

// Feedback
import { FeedbackRepository } from './feedback/feedback.repository';
import { FeedbackService } from './feedback/feedback.service';
import { FeedbackController } from './feedback/feedback.controller';

// 1:1 Meetings
import { OneOnOneRepository } from './one-on-one/one-on-one.repository';
import { OneOnOneService } from './one-on-one/one-on-one.service';
import { OneOnOneController } from './one-on-one/one-on-one.controller';

// Improvement Plans
import { ImprovementPlansRepository } from './improvement-plans/improvement-plans.repository';
import { ImprovementPlansService } from './improvement-plans/improvement-plans.service';
import { ImprovementPlansController } from './improvement-plans/improvement-plans.controller';

// Appraisals & Rating Scales
import { AppraisalsRepository } from './appraisals/appraisals.repository';
import { AppraisalsService } from './appraisals/appraisals.service';
import { AppraisalTemplatesController } from './appraisals/appraisal-templates.controller';
import { RatingScalesController } from './appraisals/rating-scales.controller';
import { AppraisalAssignmentsController } from './appraisals/appraisal-assignments.controller';

// Calibration
import { CalibrationRepository } from './calibration/calibration.repository';
import { CalibrationService } from './calibration/calibration.service';
import { CalibrationController } from './calibration/calibration.controller';

// Reports
import { ReportsRepository } from './reports/reports.repository';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    CyclesController,
    GoalsController,
    KrasController,
    ObjectivesController,
    KeyResultsController,
    CheckinsController,
    FeedbackController,
    OneOnOneController,
    ImprovementPlansController,
    AppraisalTemplatesController,
    RatingScalesController,
    AppraisalAssignmentsController,
    CalibrationController,
    ReportsController,
  ],
  providers: [
    CyclesRepository,
    CyclesService,
    GoalsRepository,
    GoalsService,
    KrasRepository,
    KrasService,
    OkrsRepository,
    OkrsService,
    CheckinsRepository,
    CheckinsService,
    FeedbackRepository,
    FeedbackService,
    OneOnOneRepository,
    OneOnOneService,
    ImprovementPlansRepository,
    ImprovementPlansService,
    AppraisalsRepository,
    AppraisalsService,
    CalibrationRepository,
    CalibrationService,
    ReportsRepository,
    ReportsService,
  ],
  exports: [
    CyclesService,
    GoalsService,
    KrasService,
    OkrsService,
    CheckinsService,
    FeedbackService,
    OneOnOneService,
    ImprovementPlansService,
    AppraisalsService,
    CalibrationService,
    ReportsService,
  ],
})
export class PerformanceModule {}
