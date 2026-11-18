import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { EmployeesModule } from '../employees/employees.module';
import { OrganizationsModule } from '../organizations/organizations.module';

// Salary Components
import { SalaryComponentsRepository } from './salary-components/salary-components.repository';
import { SalaryComponentsService } from './salary-components/salary-components.service';
import { SalaryComponentsController } from './salary-components/salary-components.controller';

// Salary Structures
import { SalaryStructuresRepository } from './salary-structures/salary-structures.repository';
import { SalaryStructuresService } from './salary-structures/salary-structures.service';
import { SalaryStructuresController } from './salary-structures/salary-structures.controller';

// Employee Salary
import { EmployeeSalaryRepository } from './employee-salary/employee-salary.repository';
import { EmployeeSalaryService } from './employee-salary/employee-salary.service';
import { EmployeeSalaryController } from './employee-salary/employee-salary.controller';

// Payroll Periods
import { PayrollPeriodsRepository } from './payroll-periods/payroll-periods.repository';
import { PayrollPeriodsService } from './payroll-periods/payroll-periods.service';
import { PayrollPeriodsController } from './payroll-periods/payroll-periods.controller';

// Payroll Engine
import { PayrollCalculatorService } from './payroll-engine/payroll-calculator.service';

// Payroll Inputs
import { PayrollInputsRepository } from './payroll-inputs/payroll-inputs.repository';
import { PayrollInputsService } from './payroll-inputs/payroll-inputs.service';
import { PayrollInputsController } from './payroll-inputs/payroll-inputs.controller';

// Payroll Exceptions
import { PayrollExceptionsRepository } from './payroll-exceptions/payroll-exceptions.repository';
import { PayrollExceptionsService } from './payroll-exceptions/payroll-exceptions.service';
import { PayrollExceptionsController } from './payroll-exceptions/payroll-exceptions.controller';

// Payroll Runs
import { PayrollRunsRepository } from './payroll-runs/payroll-runs.repository';
import { PayrollRunsService } from './payroll-runs/payroll-runs.service';
import { PayrollRunsController } from './payroll-runs/payroll-runs.controller';

// Payroll Payments
import { PayrollPaymentsRepository } from './payroll-payments/payroll-payments.repository';
import { PayrollPaymentsService } from './payroll-payments/payroll-payments.service';
import { PayrollPaymentsController } from './payroll-payments/payroll-payments.controller';

// Payslip Templates
import { PayslipTemplatesRepository } from './payslip-templates/payslip-templates.repository';
import { PayslipTemplatesService } from './payslip-templates/payslip-templates.service';
import { PayslipTemplatesController } from './payslip-templates/payslip-templates.controller';

// Payslips
import { PayslipsRepository } from './payslips/payslips.repository';
import { PayslipsService } from './payslips/payslips.service';
import { PayslipsController } from './payslips/payslips.controller';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    EmailModule,
    EmployeesModule,
    OrganizationsModule,
  ],
  controllers: [
    SalaryComponentsController,
    SalaryStructuresController,
    EmployeeSalaryController,
    PayrollPeriodsController,
    PayrollInputsController,
    PayrollExceptionsController,
    PayrollRunsController,
    PayrollPaymentsController,
    PayslipTemplatesController,
    PayslipsController,
  ],
  providers: [
    // Repositories
    SalaryComponentsRepository,
    SalaryStructuresRepository,
    EmployeeSalaryRepository,
    PayrollPeriodsRepository,
    PayrollInputsRepository,
    PayrollExceptionsRepository,
    PayrollRunsRepository,
    PayrollPaymentsRepository,
    PayslipTemplatesRepository,
    PayslipsRepository,

    // Services
    SalaryComponentsService,
    SalaryStructuresService,
    EmployeeSalaryService,
    PayrollPeriodsService,
    PayrollCalculatorService,
    PayrollInputsService,
    PayrollExceptionsService,
    PayrollRunsService,
    PayrollPaymentsService,
    PayslipTemplatesService,
    PayslipsService,
  ],
  exports: [
    SalaryComponentsService,
    SalaryStructuresService,
    EmployeeSalaryService,
    PayrollPeriodsService,
    PayrollRunsService,
    PayslipsService,
  ],
})
export class PayrollModule {}
