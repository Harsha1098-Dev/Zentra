import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeFormulaEvaluator } from './safe-evaluator';
import { StatutoryCalculatorService } from '../statutory/statutory-calculator.service';
import {
  SalaryComponentType,
  CalculationType,
  PayrollRunStatus,
  TaxRegime,
} from '@zentra/shared-types';

export interface CalculationResult {
  employeeId: string;
  payableDays: number;
  lopDays: number;
  grossEarnings: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  netPay: number;
  employeePf: number;
  employerPf: number;
  eps: number;
  edli: number;
  adminChargesPf: number;
  employeeEsi: number;
  employerEsi: number;
  professionalTax: number;
  lwfEmployee: number;
  lwfEmployer: number;
  tds: number;
  tdsCalculation?: any;
  earningsBreakdown: Array<{ name: string; code: string; amount: number; type: string }>;
  deductionsBreakdown: Array<{ name: string; code: string; amount: number; type: string }>;
  contributionsBreakdown: Array<{ name: string; code: string; amount: number }>;
  snapshotData: any;
}

@Injectable()
export class PayrollCalculatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statutoryCalculator: StatutoryCalculatorService,
  ) {}

  /**
   * Executes the calculation for an entire payroll run.
   */
  async calculateRun(payrollRunId: string, organizationId: string, userId: string): Promise<any> {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, organizationId },
      include: {
        payrollPeriod: true,
      },
    });

    if (!run) {
      throw new NotFoundException(`Payroll run '${payrollRunId}' not found`);
    }

    if ([PayrollRunStatus.APPROVED, PayrollRunStatus.PAID, PayrollRunStatus.LOCKED].includes(run.status as any)) {
      throw new BadRequestException(`Cannot calculate a payroll run that is already ${run.status}`);
    }

    const { periodStartDate, periodEndDate, payrollMonth, payrollYear } = run.payrollPeriod;
    const periodStart = new Date(periodStartDate);
    const periodEnd = new Date(periodEndDate);

    // Total calendar days in the period
    const totalDaysInPeriod =
      Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 1. Fetch eligible employees with tax details and locations
    const employees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        salaryAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            salaryStructure: {
              include: {
                components: {
                  include: { salaryComponent: true },
                  orderBy: { payslipDisplayOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
        bankDetail: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        location: true,
        taxProfiles: {
          where: { organizationId },
          take: 1,
        },
        taxDeclarations: {
          where: { organizationId },
        },
      },
    });

    // 2. Fetch all inputs for this run
    const allInputs = await this.prisma.payrollInput.findMany({
      where: { payrollRunId, organizationId },
    });

    // 3. Fetch Statutory Configuration & Rules
    const statutorySettings = await this.prisma.statutorySetting.findUnique({
      where: { organizationId },
    });
    const pfConfig = await this.prisma.pfConfiguration.findUnique({
      where: { organizationId },
    });
    const esiConfig = await this.prisma.esiConfiguration.findUnique({
      where: { organizationId },
    });
    const ptRules = await this.prisma.professionalTaxRule.findMany({
      where: { organizationId, isActive: true },
      include: { slabs: true },
    });
    const lwfRules = await this.prisma.lwfRule.findMany({
      where: { organizationId, isActive: true },
    });

    const financialYear = statutorySettings?.financialYear || '2025-2026';
    const results: CalculationResult[] = [];

    for (const emp of employees) {
      // Joining/Exit eligibility check
      if (new Date(emp.dateOfJoining) > periodEnd) continue;
      if (emp.dateOfExit && new Date(emp.dateOfExit) < periodStart) continue;

      const assignment = emp.salaryAssignments[0];
      if (!assignment || !assignment.salaryStructure) {
        continue;
      }

      const structure = assignment.salaryStructure;
      const empInputs = allInputs.filter((i) => i.employeeId === emp.id);

      // Determine active days in period (Proration for mid-period joining or exit)
      const empJoin = new Date(emp.dateOfJoining);
      const activeStart = empJoin > periodStart ? empJoin : periodStart;
      const activeEnd = emp.dateOfExit && new Date(emp.dateOfExit) < periodEnd ? new Date(emp.dateOfExit) : periodEnd;

      let activeDays = Math.max(
        0,
        Math.round((activeEnd.getTime() - activeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      );

      // Collect LOP days from inputs
      const lopInputs = empInputs.filter((i) => i.inputType === 'LOP');
      const lopDays = lopInputs.reduce((acc, curr) => acc + (curr.units || 0), 0);

      const payableDays = Math.max(0, activeDays - lopDays);
      const prorationFactor = totalDaysInPeriod > 0 ? payableDays / totalDaysInPeriod : 1;

      // Base context for formula evaluation
      const monthlyCtc = assignment.monthlyCtc || Number((assignment.annualCtc / 12).toFixed(2));
      const context: Record<string, number> = {
        CTC: monthlyCtc,
        ANNUAL_CTC: assignment.annualCtc,
        DAYS_IN_MONTH: totalDaysInPeriod,
        PAYABLE_DAYS: payableDays,
        LOP_DAYS: lopDays,
      };

      const earningsBreakdown: Array<{ name: string; code: string; amount: number; type: string }> = [];
      const deductionsBreakdown: Array<{ name: string; code: string; amount: number; type: string }> = [];
      const contributionsBreakdown: Array<{ name: string; code: string; amount: number }> = [];

      let runningGross = 0;
      let runningDeductions = 0;
      let runningContributions = 0;

      // Component overrides
      const overrides = (assignment.componentOverrides as Record<string, any>) || {};

      // Calculate Structure Components
      for (const structComp of structure.components) {
        const comp = structComp.salaryComponent;
        if (!comp || !comp.isActive) continue;

        let compAmount = 0;
        const compCode = comp.componentCode.toUpperCase();
        const overrideVal = overrides[comp.id] ?? overrides[compCode];

        if (overrideVal !== undefined && Number.isFinite(Number(overrideVal))) {
          compAmount = Number(overrideVal);
        } else if (structComp.calculationType === CalculationType.FIXED_AMOUNT) {
          compAmount = structComp.amount || comp.amount || 0;
        } else if (structComp.calculationType === CalculationType.PERCENTAGE_OF_BASIC) {
          const basic = context['BASIC'] || context['BASIC_SALARY'] || 0;
          compAmount = basic * ((structComp.percentage || comp.percentage || 0) / 100);
        } else if (structComp.calculationType === CalculationType.PERCENTAGE_OF_GROSS) {
          compAmount = runningGross * ((structComp.percentage || comp.percentage || 0) / 100);
        } else if (structComp.calculationType === CalculationType.PERCENTAGE_OF_CTC) {
          compAmount = monthlyCtc * ((structComp.percentage || comp.percentage || 0) / 100);
        } else if (structComp.calculationType === CalculationType.FORMULA_BASED) {
          const formula = structComp.formula || comp.formula;
          if (formula) {
            compAmount = SafeFormulaEvaluator.evaluate(formula, context);
          }
        }

        // Apply proration factor for monthly earnings and deductions
        if (comp.componentType === SalaryComponentType.EARNING) {
          const proratedAmount = Number((compAmount * prorationFactor).toFixed(2));
          context[compCode] = proratedAmount;
          runningGross += proratedAmount;
          earningsBreakdown.push({
            name: comp.name,
            code: compCode,
            amount: proratedAmount,
            type: comp.componentType,
          });
        } else if (comp.componentType === SalaryComponentType.DEDUCTION) {
          const proratedAmount = Number((compAmount * prorationFactor).toFixed(2));
          context[compCode] = proratedAmount;
          runningDeductions += proratedAmount;
          deductionsBreakdown.push({
            name: comp.name,
            code: compCode,
            amount: proratedAmount,
            type: comp.componentType,
          });
        } else if (comp.componentType === SalaryComponentType.EMPLOYER_CONTRIBUTION) {
          const proratedAmount = Number((compAmount * prorationFactor).toFixed(2));
          context[compCode] = proratedAmount;
          runningContributions += proratedAmount;
          contributionsBreakdown.push({
            name: comp.name,
            code: compCode,
            amount: proratedAmount,
          });
        }
      }

      // Add Overtime from Inputs
      const otInputs = empInputs.filter((i) => i.inputType === 'OVERTIME');
      let totalOtAmount = 0;
      for (const ot of otInputs) {
        if (ot.amount > 0) {
          totalOtAmount += ot.amount;
        } else {
          const basic = context['BASIC'] || context['BASIC_SALARY'] || (monthlyCtc * 0.5);
          const hourlyRate = basic / (totalDaysInPeriod * 8);
          const otHours = (ot.units || 0) / 60;
          totalOtAmount += Number((hourlyRate * 1.5 * otHours).toFixed(2));
        }
      }

      if (totalOtAmount > 0) {
        runningGross += totalOtAmount;
        earningsBreakdown.push({
          name: 'Overtime Allowance',
          code: 'OVERTIME',
          amount: Number(totalOtAmount.toFixed(2)),
          type: 'EARNING',
        });
      }

      // Add Bonus & Incentives from Inputs
      const bonusInputs = empInputs.filter((i) => ['BONUS', 'INCENTIVE', 'ARREARS', 'OTHER_EARNING'].includes(i.inputType));
      for (const b of bonusInputs) {
        if (b.amount > 0) {
          runningGross += b.amount;
          earningsBreakdown.push({
            name: b.description || b.inputType,
            code: b.inputType,
            amount: Number(b.amount.toFixed(2)),
            type: 'EARNING',
          });
        }
      }

      // Add Manual Deductions from Inputs
      const manualDeductions = empInputs.filter((i) =>
        ['LOAN_EMI', 'ADVANCE_DEDUCTION', 'OTHER_DEDUCTION'].includes(i.inputType),
      );
      for (const d of manualDeductions) {
        if (d.amount > 0) {
          runningDeductions += d.amount;
          deductionsBreakdown.push({
            name: d.description || d.inputType,
            code: d.inputType,
            amount: Number(d.amount.toFixed(2)),
            type: 'DEDUCTION',
          });
        }
      }

      // --- Statutory Calculations (India) ---
      const taxProfile = emp.taxProfiles?.[0];
      const isPfEligible = taxProfile ? taxProfile.isPfEligible : true;
      const isEsiEligible = taxProfile ? taxProfile.isEsiEligible : true;
      const isPtEligible = taxProfile ? taxProfile.isPtEligible : true;
      const isLwfEligible = taxProfile ? taxProfile.isLwfEligible : true;
      const vpfPercentage = taxProfile?.vpfPercentage || 0;
      const selectedRegime = taxProfile?.selectedRegime || statutorySettings?.defaultTaxRegime || TaxRegime.NEW_REGIME;

      // 1. EPF
      let employeePf = 0;
      let employerPf = 0;
      let eps = 0;
      let edli = 0;
      let adminChargesPf = 0;

      if (statutorySettings?.pfEnabled !== false && isPfEligible) {
        const basicWages = context['BASIC'] || context['BASIC_SALARY'] || (runningGross * 0.5);
        const pfResult = this.statutoryCalculator.calculatePf(
          basicWages,
          pfConfig || {},
          isPfEligible,
          vpfPercentage,
        );
        employeePf = pfResult.employeePf;
        employerPf = pfResult.employerPf;
        eps = pfResult.eps;
        edli = pfResult.edli;
        adminChargesPf = pfResult.adminChargesPf;

        if (employeePf > 0) {
          runningDeductions += employeePf;
          deductionsBreakdown.push({
            name: 'Provident Fund (Employee)',
            code: 'PF_EMPLOYEE',
            amount: employeePf,
            type: 'DEDUCTION',
          });
        }

        if (employerPf > 0 || eps > 0) {
          runningContributions += pfResult.totalEmployerContribution;
          contributionsBreakdown.push({
            name: 'EPF Employer Share',
            code: 'EPF_EMPLOYER',
            amount: employerPf,
          });
          contributionsBreakdown.push({
            name: 'EPS Employer Share',
            code: 'EPS_EMPLOYER',
            amount: eps,
          });
          if (edli > 0) {
            contributionsBreakdown.push({
              name: 'EDLI Share',
              code: 'EDLI',
              amount: edli,
            });
          }
          if (adminChargesPf > 0) {
            contributionsBreakdown.push({
              name: 'PF Admin Charges',
              code: 'PF_ADMIN',
              amount: adminChargesPf,
            });
          }
        }
      }

      // 2. ESI
      let employeeEsi = 0;
      let employerEsi = 0;
      if (statutorySettings?.esiEnabled !== false && isEsiEligible) {
        const esiResult = this.statutoryCalculator.calculateEsi(
          runningGross,
          esiConfig || {},
          isEsiEligible,
          false,
        );
        employeeEsi = esiResult.employeeEsi;
        employerEsi = esiResult.employerEsi;

        if (employeeEsi > 0) {
          runningDeductions += employeeEsi;
          deductionsBreakdown.push({
            name: 'ESI (Employee)',
            code: 'ESI_EMPLOYEE',
            amount: employeeEsi,
            type: 'DEDUCTION',
          });
        }
        if (employerEsi > 0) {
          runningContributions += employerEsi;
          contributionsBreakdown.push({
            name: 'ESI (Employer)',
            code: 'ESI_EMPLOYER',
            amount: employerEsi,
          });
        }
      }

      // 3. Professional Tax
      let professionalTax = 0;
      if (statutorySettings?.ptEnabled !== false && isPtEligible) {
        const empState = emp.location?.state || 'Maharashtra';
        const matchedRule = ptRules.find(
          (r) =>
            r.state.toLowerCase() === empState.toLowerCase() ||
            (emp.location?.state && r.stateCode.toLowerCase() === emp.location.state.toLowerCase()),
        ) || ptRules[0];

        const slabs = matchedRule?.slabs || [];
        professionalTax = this.statutoryCalculator.calculateProfessionalTax(
          runningGross,
          slabs,
          payrollMonth,
          (emp as any).gender || 'ALL',
        );

        if (professionalTax > 0) {
          runningDeductions += professionalTax;
          deductionsBreakdown.push({
            name: 'Professional Tax',
            code: 'PROFESSIONAL_TAX',
            amount: professionalTax,
            type: 'DEDUCTION',
          });
        }
      }

      // 4. LWF
      let lwfEmployee = 0;
      let lwfEmployer = 0;
      if (statutorySettings?.lwfEnabled !== false && isLwfEligible) {
        const empState = emp.location?.state || 'Maharashtra';
        const matchedLwfRule = lwfRules.find(
          (r) =>
            r.state.toLowerCase() === empState.toLowerCase() ||
            (emp.location?.state && r.stateCode.toLowerCase() === emp.location.state.toLowerCase()),
        ) || lwfRules[0];

        if (matchedLwfRule) {
          const lwfResult = this.statutoryCalculator.calculateLwf(
            runningGross,
            matchedLwfRule,
            payrollMonth,
            isLwfEligible,
          );
          lwfEmployee = lwfResult.lwfEmployee;
          lwfEmployer = lwfResult.lwfEmployer;

          if (lwfEmployee > 0) {
            runningDeductions += lwfEmployee;
            deductionsBreakdown.push({
              name: 'LWF (Employee)',
              code: 'LWF_EMPLOYEE',
              amount: lwfEmployee,
              type: 'DEDUCTION',
            });
          }
          if (lwfEmployer > 0) {
            runningContributions += lwfEmployer;
            contributionsBreakdown.push({
              name: 'LWF (Employer)',
              code: 'LWF_EMPLOYER',
              amount: lwfEmployer,
            });
          }
        }
      }

      // 5. TDS
      let tds = 0;
      let tdsCalcResult = null;
      const pastTdsRecords = await this.prisma.employeeTdsCalculation.findMany({
        where: { organizationId, employeeId: emp.id, financialYear },
      });
      const ytdTdsPaid = pastTdsRecords.reduce((acc, c) => acc + c.monthlyTds, 0);

      const annualGross = assignment.annualCtc || runningGross * 12;
      tdsCalcResult = this.statutoryCalculator.calculateTds(
        selectedRegime,
        annualGross,
        emp.taxDeclarations || [],
        payrollMonth,
        ytdTdsPaid,
        professionalTax * 12,
      );
      tds = tdsCalcResult.monthlyTds;

      if (tds > 0) {
        runningDeductions += tds;
        deductionsBreakdown.push({
          name: 'TDS (Income Tax)',
          code: 'TDS',
          amount: tds,
          type: 'DEDUCTION',
        });
      }

      const grossEarnings = Number(runningGross.toFixed(2));
      const totalDeductions = Number(runningDeductions.toFixed(2));
      const totalEmployerContributions = Number(runningContributions.toFixed(2));
      const netPay = Math.max(0, Number((grossEarnings - totalDeductions).toFixed(2)));

      results.push({
        employeeId: emp.id,
        payableDays,
        lopDays,
        grossEarnings,
        totalDeductions,
        totalEmployerContributions,
        netPay,
        employeePf,
        employerPf,
        eps,
        edli,
        adminChargesPf,
        employeeEsi,
        employerEsi,
        professionalTax,
        lwfEmployee,
        lwfEmployer,
        tds,
        tdsCalculation: tdsCalcResult,
        earningsBreakdown,
        deductionsBreakdown,
        contributionsBreakdown,
        snapshotData: {
          employee: {
            id: emp.id,
            employeeCode: emp.employeeCode,
            name: `${emp.firstName} ${emp.lastName}`,
            workEmail: emp.workEmail,
            department: emp.department?.name,
            designation: emp.designation?.name,
            dateOfJoining: emp.dateOfJoining,
          },
          bankDetail: emp.bankDetail
            ? {
                bankName: emp.bankDetail.bankName,
                accountNumberMasked: `XXXX${emp.bankDetail.accountNumber.slice(-4)}`,
                ifscCode: emp.bankDetail.ifscCode,
                panNumber: emp.bankDetail.panNumber,
              }
            : null,
          structure: {
            id: structure.id,
            name: structure.name,
            annualCtc: assignment.annualCtc,
            monthlyCtc,
          },
          period: {
            startDate: periodStartDate,
            endDate: periodEndDate,
            totalDays: totalDaysInPeriod,
            payableDays,
            lopDays,
          },
          breakdowns: {
            earnings: earningsBreakdown,
            deductions: deductionsBreakdown,
            contributions: contributionsBreakdown,
          },
          statutory: {
            employeePf,
            employerPf,
            eps,
            edli,
            adminChargesPf,
            employeeEsi,
            employerEsi,
            professionalTax,
            lwfEmployee,
            lwfEmployer,
            tds,
            regime: selectedRegime,
          },
        },
      });
    }

    // Atomic transaction to persist employee payroll records and update run
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete existing draft payroll employee records for this run
      await tx.payrollEmployeeRecord.deleteMany({
        where: { payrollRunId },
      });

      // 2. Insert new calculated employee records & TDS records
      for (const res of results) {
        await tx.payrollEmployeeRecord.create({
          data: {
            organizationId,
            payrollRunId,
            employeeId: res.employeeId,
            payableDays: res.payableDays,
            lopDays: res.lopDays,
            grossEarnings: res.grossEarnings,
            totalDeductions: res.totalDeductions,
            totalEmployerContributions: res.totalEmployerContributions,
            employeePf: res.employeePf,
            employerPf: res.employerPf,
            eps: res.eps,
            edli: res.edli,
            adminChargesPf: res.adminChargesPf,
            employeeEsi: res.employeeEsi,
            employerEsi: res.employerEsi,
            professionalTax: res.professionalTax,
            lwfEmployee: res.lwfEmployee,
            lwfEmployer: res.lwfEmployer,
            tds: res.tds,
            netPay: res.netPay,
            paymentStatus: 'PENDING',
            payslipStatus: 'DRAFT',
            snapshotData: res.snapshotData,
          },
        });

        if (res.tdsCalculation) {
          const calc = res.tdsCalculation;
          await tx.employeeTdsCalculation.upsert({
            where: {
              organizationId_employeeId_financialYear_month_year: {
                organizationId,
                employeeId: res.employeeId,
                financialYear,
                month: payrollMonth,
                year: payrollYear,
              },
            },
            create: {
              organizationId,
              employeeId: res.employeeId,
              payrollRunId,
              financialYear,
              month: payrollMonth,
              year: payrollYear,
              selectedRegime: calc.selectedRegime,
              annualGrossSalary: calc.annualGrossSalary,
              standardDeduction: calc.standardDeduction,
              professionalTaxAnnual: calc.professionalTaxAnnual,
              chapterVIAExemptions: calc.chapterVIAExemptions,
              section80C: calc.section80C,
              section80D: calc.section80D,
              section80CCD1B: calc.section80CCD1B,
              section24HomeLoan: calc.section24HomeLoan,
              hraExemption: calc.hraExemption,
              otherExemptions: calc.otherExemptions,
              netTaxableIncome: calc.netTaxableIncome,
              calculatedAnnualTax: calc.calculatedAnnualTax,
              section87ARebate: calc.section87ARebate,
              taxAfterRebate: calc.taxAfterRebate,
              educationCess: calc.educationCess,
              totalAnnualTaxLiability: calc.totalAnnualTaxLiability,
              taxPaidYtd: calc.taxPaidYtd,
              remainingTax: calc.remainingTax,
              remainingMonths: calc.remainingMonths,
              monthlyTds: calc.monthlyTds,
            },
            update: {
              payrollRunId,
              selectedRegime: calc.selectedRegime,
              annualGrossSalary: calc.annualGrossSalary,
              standardDeduction: calc.standardDeduction,
              professionalTaxAnnual: calc.professionalTaxAnnual,
              chapterVIAExemptions: calc.chapterVIAExemptions,
              section80C: calc.section80C,
              section80D: calc.section80D,
              section80CCD1B: calc.section80CCD1B,
              section24HomeLoan: calc.section24HomeLoan,
              hraExemption: calc.hraExemption,
              otherExemptions: calc.otherExemptions,
              netTaxableIncome: calc.netTaxableIncome,
              calculatedAnnualTax: calc.calculatedAnnualTax,
              section87ARebate: calc.section87ARebate,
              taxAfterRebate: calc.taxAfterRebate,
              educationCess: calc.educationCess,
              totalAnnualTaxLiability: calc.totalAnnualTaxLiability,
              taxPaidYtd: calc.taxPaidYtd,
              remainingTax: calc.remainingTax,
              remainingMonths: calc.remainingMonths,
              monthlyTds: calc.monthlyTds,
            },
          });
        }
      }

      // 3. Compute totals
      const totalEmployeeCount = results.length;
      const totalGrossEarnings = results.reduce((acc, r) => acc + r.grossEarnings, 0);
      const totalDeductions = results.reduce((acc, r) => acc + r.totalDeductions, 0);
      const totalEmployerContributions = results.reduce(
        (acc, r) => acc + r.totalEmployerContributions,
        0,
      );
      const totalNetPay = results.reduce((acc, r) => acc + r.netPay, 0);
      const totalCtcCost = totalGrossEarnings + totalEmployerContributions;

      // 4. Update Payroll Run
      return tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: PayrollRunStatus.CALCULATED,
          totalEmployeeCount,
          totalGrossEarnings: Number(totalGrossEarnings.toFixed(2)),
          totalDeductions: Number(totalDeductions.toFixed(2)),
          totalEmployerContributions: Number(totalEmployerContributions.toFixed(2)),
          totalNetPay: Number(totalNetPay.toFixed(2)),
          totalCtcCost: Number(totalCtcCost.toFixed(2)),
          calculatedBy: userId,
          calculatedAt: new Date(),
        },
        include: {
          payrollPeriod: true,
          records: {
            include: {
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  firstName: true,
                  lastName: true,
                  department: { select: { name: true } },
                },
              },
            },
          },
        },
      });
    });
  }
}
