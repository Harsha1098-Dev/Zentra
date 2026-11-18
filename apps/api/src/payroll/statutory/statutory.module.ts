import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

import { StatutoryCalculatorService } from './statutory-calculator.service';

import { StatutorySettingsRepository } from './statutory-settings/statutory-settings.repository';
import { StatutorySettingsService } from './statutory-settings/statutory-settings.service';
import { StatutorySettingsController } from './statutory-settings/statutory-settings.controller';

import { StatutoryComponentsRepository } from './statutory-components/statutory-components.repository';
import { StatutoryComponentsService } from './statutory-components/statutory-components.service';
import { StatutoryComponentsController } from './statutory-components/statutory-components.controller';

import { PfRepository } from './pf/pf.repository';
import { PfService } from './pf/pf.service';
import { PfController } from './pf/pf.controller';

import { EsiRepository } from './esi/esi.repository';
import { EsiService } from './esi/esi.service';
import { EsiController } from './esi/esi.controller';

import { ProfessionalTaxRepository } from './professional-tax/professional-tax.repository';
import { ProfessionalTaxService } from './professional-tax/professional-tax.service';
import { ProfessionalTaxController } from './professional-tax/professional-tax.controller';

import { LwfRepository } from './lwf/lwf.repository';
import { LwfService } from './lwf/lwf.service';
import { LwfController } from './lwf/lwf.controller';

import { TaxProfileRepository } from './tax-profile/tax-profile.repository';
import { TaxProfileService } from './tax-profile/tax-profile.service';
import { TaxProfileController } from './tax-profile/tax-profile.controller';

import { TaxDeclarationsRepository } from './tax-declarations/tax-declarations.repository';
import { TaxDeclarationsService } from './tax-declarations/tax-declarations.service';
import { TaxDeclarationsController } from './tax-declarations/tax-declarations.controller';

import { InvestmentProofsRepository } from './investment-proofs/investment-proofs.repository';
import { InvestmentProofsService } from './investment-proofs/investment-proofs.service';
import { InvestmentProofsController } from './investment-proofs/investment-proofs.controller';

import { TdsService } from './tds/tds.service';
import { TdsController } from './tds/tds.controller';

import { ComplianceReportsService } from './compliance-reports/compliance-reports.service';
import { ComplianceReportsController } from './compliance-reports/compliance-reports.controller';

import { Form16Repository } from './form16/form16.repository';
import { Form16Service } from './form16/form16.service';
import { Form16Controller } from './form16/form16.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    StatutorySettingsController,
    StatutoryComponentsController,
    PfController,
    EsiController,
    ProfessionalTaxController,
    LwfController,
    TaxProfileController,
    TaxDeclarationsController,
    InvestmentProofsController,
    TdsController,
    ComplianceReportsController,
    Form16Controller,
  ],
  providers: [
    StatutoryCalculatorService,
    StatutorySettingsRepository,
    StatutorySettingsService,
    StatutoryComponentsRepository,
    StatutoryComponentsService,
    PfRepository,
    PfService,
    EsiRepository,
    EsiService,
    ProfessionalTaxRepository,
    ProfessionalTaxService,
    LwfRepository,
    LwfService,
    TaxProfileRepository,
    TaxProfileService,
    TaxDeclarationsRepository,
    TaxDeclarationsService,
    InvestmentProofsRepository,
    InvestmentProofsService,
    TdsService,
    ComplianceReportsService,
    Form16Repository,
    Form16Service,
  ],
  exports: [
    StatutoryCalculatorService,
    StatutorySettingsService,
    StatutoryComponentsService,
    PfService,
    EsiService,
    ProfessionalTaxService,
    LwfService,
    TaxProfileService,
    TaxDeclarationsService,
    InvestmentProofsService,
    TdsService,
    ComplianceReportsService,
    Form16Service,
  ],
})
export class StatutoryModule {}
