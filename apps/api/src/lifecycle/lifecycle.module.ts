import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

// Onboarding
import { OnboardingRepository } from './onboarding/onboarding.repository';
import { OnboardingService } from './onboarding/onboarding.service';
import { OnboardingController } from './onboarding/onboarding.controller';

// Probation
import { ProbationRepository } from './probation/probation.repository';
import { ProbationService } from './probation/probation.service';
import { ProbationController } from './probation/probation.controller';

// Transfers
import { TransfersRepository } from './transfers/transfers.repository';
import { TransfersService } from './transfers/transfers.service';
import { TransfersController } from './transfers/transfers.controller';

// Promotions
import { PromotionsRepository } from './promotions/promotions.repository';
import { PromotionsService } from './promotions/promotions.service';
import { PromotionsController } from './promotions/promotions.controller';

// Salary Revisions
import { SalaryRevisionsRepository } from './salary-revisions/salary-revisions.repository';
import { SalaryRevisionsService } from './salary-revisions/salary-revisions.service';
import { SalaryRevisionsController } from './salary-revisions/salary-revisions.controller';

// Resignations
import { ResignationsRepository } from './resignations/resignations.repository';
import { ResignationsService } from './resignations/resignations.service';
import { ResignationsController } from './resignations/resignations.controller';

// Exit Clearance
import { ExitClearanceRepository } from './exit-clearance/exit-clearance.repository';
import { ExitClearanceService } from './exit-clearance/exit-clearance.service';
import { ExitClearanceController } from './exit-clearance/exit-clearance.controller';

// Offboarding
import { OffboardingRepository } from './offboarding/offboarding.repository';
import { OffboardingService } from './offboarding/offboarding.service';
import { OffboardingController } from './offboarding/offboarding.controller';

// Assets
import { AssetsRepository } from './assets/assets.repository';
import { AssetsService } from './assets/assets.service';
import { AssetsController } from './assets/assets.controller';

// Letters
import { LettersRepository } from './letters/letters.repository';
import { LettersService } from './letters/letters.service';
import { LettersController } from './letters/letters.controller';

@Module({
  imports: [PrismaModule, AuditModule, EmailModule],
  controllers: [
    OnboardingController,
    ProbationController,
    TransfersController,
    PromotionsController,
    SalaryRevisionsController,
    ResignationsController,
    ExitClearanceController,
    OffboardingController,
    AssetsController,
    LettersController,
  ],
  providers: [
    OnboardingRepository,
    OnboardingService,
    ProbationRepository,
    ProbationService,
    TransfersRepository,
    TransfersService,
    PromotionsRepository,
    PromotionsService,
    SalaryRevisionsRepository,
    SalaryRevisionsService,
    ResignationsRepository,
    ResignationsService,
    ExitClearanceRepository,
    ExitClearanceService,
    OffboardingRepository,
    OffboardingService,
    AssetsRepository,
    AssetsService,
    LettersRepository,
    LettersService,
  ],
  exports: [
    OnboardingService,
    ProbationService,
    TransfersService,
    PromotionsService,
    SalaryRevisionsService,
    ResignationsService,
    ExitClearanceService,
    OffboardingService,
    AssetsService,
    LettersService,
  ],
})
export class LifecycleModule {}
