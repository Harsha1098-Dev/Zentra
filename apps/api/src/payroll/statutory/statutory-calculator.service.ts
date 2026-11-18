import { Injectable } from '@nestjs/common';
import { TaxRegime } from '@zentra/shared-types';

export interface PfConfigParams {
  epfRateEmployee?: number;
  epfRateEmployer?: number;
  epsRateEmployer?: number;
  edliRate?: number;
  adminChargesRate?: number;
  wageCeiling?: number;
  restrictEmployerShareToCeiling?: boolean;
}

export interface EsiConfigParams {
  employeeContributionRate?: number;
  employerContributionRate?: number;
  wageCeiling?: number;
  disabilityWageCeiling?: number;
}

export interface PtSlabItem {
  minSalary: number;
  maxSalary?: number | null;
  taxAmount: number;
  gender?: string;
  specificMonth?: number | null;
  specificMonthAmount?: number | null;
}

export interface LwfRuleItem {
  employeeContribution: number;
  employerContribution: number;
  deductionMonths: number[];
}

export interface TaxDeclarationItem {
  declarationType: string;
  declaredAmount: number;
  approvedAmount?: number | null;
  status: string;
}

export interface TdsCalculationResult {
  selectedRegime: TaxRegime;
  annualGrossSalary: number;
  standardDeduction: number;
  professionalTaxAnnual: number;
  chapterVIAExemptions: number;
  section80C: number;
  section80D: number;
  section80CCD1B: number;
  section24HomeLoan: number;
  hraExemption: number;
  otherExemptions: number;
  netTaxableIncome: number;
  calculatedAnnualTax: number;
  section87ARebate: number;
  taxAfterRebate: number;
  educationCess: number;
  totalAnnualTaxLiability: number;
  taxPaidYtd: number;
  remainingTax: number;
  remainingMonths: number;
  monthlyTds: number;
}

@Injectable()
export class StatutoryCalculatorService {
  /**
   * Calculate EPF, EPS, EDLI and Admin charges.
   */
  calculatePf(
    pfWages: number,
    config: PfConfigParams = {},
    isPfEligible: boolean = true,
    vpfPercentage: number = 0,
  ) {
    if (!isPfEligible || pfWages <= 0) {
      return {
        employeePf: 0,
        employerPf: 0,
        eps: 0,
        edli: 0,
        adminChargesPf: 0,
        totalEmployerContribution: 0,
      };
    }

    const epfRateEmp = config.epfRateEmployee ?? 12.0;
    const epsRate = config.epsRateEmployer ?? 8.33;
    const edliRate = config.edliRate ?? 0.5;
    const adminRate = config.adminChargesRate ?? 0.5;
    const wageCeiling = config.wageCeiling ?? 15000;
    const restrictEmployer = config.restrictEmployerShareToCeiling ?? true;

    // Employee share: 12% of actual PF wages + optional VPF
    const baseEmpShare = Number(((pfWages * epfRateEmp) / 100).toFixed(2));
    const vpfShare = vpfPercentage > 0 ? Number(((pfWages * vpfPercentage) / 100).toFixed(2)) : 0;
    const employeePf = Number((baseEmpShare + vpfShare).toFixed(2));

    // Pension wage ceiling is ₹15,000
    const pensionWageBasis = Math.min(pfWages, wageCeiling);

    // Employer EPS share: 8.33% of pension wage basis (max ₹1,250)
    const eps = Number(((pensionWageBasis * epsRate) / 100).toFixed(2));

    // Employer EPF share: Total Employer EPF (12%) minus EPS
    const employerWageBasis = restrictEmployer ? pensionWageBasis : pfWages;
    const totalEmployerEpf = Number(((employerWageBasis * epfRateEmp) / 100).toFixed(2));
    const employerPf = Math.max(0, Number((totalEmployerEpf - eps).toFixed(2)));

    // EDLI: 0.5% of capped wage
    const edli = Number(((pensionWageBasis * edliRate) / 100).toFixed(2));

    // Admin charges: 0.5% of wages
    const adminChargesPf = Number(((pfWages * adminRate) / 100).toFixed(2));

    const totalEmployerContribution = Number(
      (employerPf + eps + edli + adminChargesPf).toFixed(2),
    );

    return {
      employeePf,
      employerPf,
      eps,
      edli,
      adminChargesPf,
      totalEmployerContribution,
    };
  }

  /**
   * Calculate ESI (Employee State Insurance)
   */
  calculateEsi(
    grossSalary: number,
    config: EsiConfigParams = {},
    isEsiEligible: boolean = true,
    hasDisability: boolean = false,
  ) {
    const ceiling = hasDisability
      ? (config.disabilityWageCeiling ?? 25000)
      : (config.wageCeiling ?? 21000);

    if (!isEsiEligible || grossSalary <= 0 || grossSalary > ceiling) {
      return {
        isEligible: false,
        employeeEsi: 0,
        employerEsi: 0,
        totalEsi: 0,
      };
    }

    const empRate = config.employeeContributionRate ?? 0.75;
    const emplrRate = config.employerContributionRate ?? 3.25;

    // Rounded to 2 decimals
    const employeeEsi = Number(((grossSalary * empRate) / 100).toFixed(2));
    const employerEsi = Number(((grossSalary * emplrRate) / 100).toFixed(2));
    const totalEsi = Number((employeeEsi + employerEsi).toFixed(2));

    return {
      isEligible: true,
      employeeEsi,
      employerEsi,
      totalEsi,
    };
  }

  /**
   * Calculate Professional Tax based on state-specific salary slabs
   */
  calculateProfessionalTax(
    grossSalary: number,
    slabs: PtSlabItem[],
    month: number,
    gender: string = 'ALL',
  ): number {
    if (grossSalary <= 0 || !slabs || slabs.length === 0) {
      return 0;
    }

    const matchedSlab = slabs.find((slab) => {
      const minOk = grossSalary >= slab.minSalary;
      const maxOk = slab.maxSalary === null || slab.maxSalary === undefined || grossSalary <= slab.maxSalary;
      const genderOk =
        !slab.gender || slab.gender === 'ALL' || slab.gender.toUpperCase() === gender.toUpperCase();
      return minOk && maxOk && genderOk;
    });

    if (!matchedSlab) {
      return 0;
    }

    // Check specific month override (e.g. February ₹300 in Maharashtra)
    if (
      matchedSlab.specificMonth &&
      matchedSlab.specificMonth === month &&
      matchedSlab.specificMonthAmount !== null &&
      matchedSlab.specificMonthAmount !== undefined
    ) {
      return matchedSlab.specificMonthAmount;
    }

    return matchedSlab.taxAmount;
  }

  /**
   * Calculate Labour Welfare Fund (LWF)
   */
  calculateLwf(
    grossSalary: number,
    rule: LwfRuleItem | null,
    month: number,
    isLwfEligible: boolean = true,
  ) {
    if (!isLwfEligible || !rule || grossSalary <= 0) {
      return { lwfEmployee: 0, lwfEmployer: 0 };
    }

    if (rule.deductionMonths && rule.deductionMonths.includes(month)) {
      return {
        lwfEmployee: Number(rule.employeeContribution.toFixed(2)),
        lwfEmployer: Number(rule.employerContribution.toFixed(2)),
      };
    }

    return { lwfEmployee: 0, lwfEmployer: 0 };
  }

  /**
   * Calculate TDS under New Tax Regime or Old Tax Regime (India Income Tax Act)
   */
  calculateTds(
    selectedRegime: TaxRegime | string,
    annualGross: number,
    declarations: TaxDeclarationItem[] = [],
    month: number, // 1 to 12
    ytdTdsPaid: number = 0,
    annualPt: number = 2400,
  ): TdsCalculationResult {
    const isNewRegime = selectedRegime === TaxRegime.NEW_REGIME || selectedRegime === 'NEW_REGIME';

    let standardDeduction = 0;
    let professionalTaxAnnual = 0;
    let section80C = 0;
    let section80D = 0;
    let section80CCD1B = 0;
    let section24HomeLoan = 0;
    let hraExemption = 0;
    let otherExemptions = 0;

    if (isNewRegime) {
      // New Tax Regime (Section 115BAC, FY 2025-26/2026-27):
      // Standard deduction is ₹75,000
      standardDeduction = Math.min(annualGross, 75000);
      professionalTaxAnnual = 0; // PT deduction not allowable under Section 115BAC
    } else {
      // Old Tax Regime:
      // Standard deduction is ₹50,000
      standardDeduction = Math.min(annualGross, 50000);
      professionalTaxAnnual = annualPt;

      // Extract Chapter VI-A deductions from approved or submitted declarations
      for (const dec of declarations) {
        const amt = dec.approvedAmount !== null && dec.approvedAmount !== undefined ? dec.approvedAmount : dec.declaredAmount;
        if (amt <= 0) continue;

        switch (dec.declarationType) {
          case 'SECTION_80C':
            section80C += amt;
            break;
          case 'SECTION_80D':
            section80D += amt;
            break;
          case 'SECTION_80CCD_1B':
            section80CCD1B += amt;
            break;
          case 'SECTION_24_HOME_LOAN':
            section24HomeLoan += amt;
            break;
          case 'HRA':
            hraExemption += amt;
            break;
          default:
            otherExemptions += amt;
            break;
        }
      }

      // Cap statutory limits under Old Regime
      section80C = Math.min(section80C, 150000); // 80C cap ₹1.5L
      section80D = Math.min(section80D, 100000); // 80D cap (self + senior parents)
      section80CCD1B = Math.min(section80CCD1B, 50000); // NPS additional cap ₹50k
      section24HomeLoan = Math.min(section24HomeLoan, 200000); // Home loan interest cap ₹2L
    }

    const chapterVIAExemptions =
      section80C + section80D + section80CCD1B + section24HomeLoan + hraExemption + otherExemptions;

    const totalDeductions = standardDeduction + professionalTaxAnnual + chapterVIAExemptions;
    const netTaxableIncome = Math.max(0, Math.round(annualGross - totalDeductions));

    let calculatedAnnualTax = 0;
    let section87ARebate = 0;

    if (isNewRegime) {
      // Slabs for New Tax Regime (Section 115BAC):
      // 0 - 3,00,000 : 0%
      // 3,00,001 - 7,00,000 : 5%
      // 7,00,001 - 10,00,000 : 10%
      // 10,00,001 - 12,00,000 : 15%
      // 12,00,001 - 15,00,000 : 20%
      // > 15,00,000 : 30%
      let remaining = netTaxableIncome;

      if (remaining > 1500000) {
        calculatedAnnualTax += (remaining - 1500000) * 0.3;
        remaining = 1500000;
      }
      if (remaining > 1200000) {
        calculatedAnnualTax += (remaining - 1200000) * 0.2;
        remaining = 1200000;
      }
      if (remaining > 1000000) {
        calculatedAnnualTax += (remaining - 1000000) * 0.15;
        remaining = 1000000;
      }
      if (remaining > 700000) {
        calculatedAnnualTax += (remaining - 700000) * 0.1;
        remaining = 700000;
      }
      if (remaining > 300000) {
        calculatedAnnualTax += (remaining - 300000) * 0.05;
        remaining = 300000;
      }

      // Section 87A Rebate for New Regime:
      // If taxable income <= ₹7,00,000, 100% tax rebate (tax liability is ₹0)
      if (netTaxableIncome <= 700000) {
        section87ARebate = calculatedAnnualTax;
      }
    } else {
      // Old Tax Regime Slabs:
      // 0 - 2,50,000 : 0%
      // 2,50,001 - 5,00,000 : 5%
      // 5,00,001 - 10,00,000 : 20%
      // > 10,00,000 : 30%
      let remaining = netTaxableIncome;

      if (remaining > 1000000) {
        calculatedAnnualTax += (remaining - 1000000) * 0.3;
        remaining = 1000000;
      }
      if (remaining > 500000) {
        calculatedAnnualTax += (remaining - 500000) * 0.2;
        remaining = 500000;
      }
      if (remaining > 250000) {
        calculatedAnnualTax += (remaining - 250000) * 0.05;
        remaining = 250000;
      }

      // Section 87A Rebate for Old Regime:
      // If taxable income <= ₹5,00,000, rebate up to ₹12,500
      if (netTaxableIncome <= 500000) {
        section87ARebate = Math.min(calculatedAnnualTax, 12500);
      }
    }

    const taxAfterRebate = Math.max(0, calculatedAnnualTax - section87ARebate);

    // 4% Health & Education Cess
    const educationCess = Number((taxAfterRebate * 0.04).toFixed(2));
    const totalAnnualTaxLiability = Number((taxAfterRebate + educationCess).toFixed(2));

    // Divide remaining liability across remaining months of financial year (Apr=4 to Mar=3)
    const remainingMonths = month >= 4 ? 12 - (month - 4) : 4 - month;
    const remainingTax = Math.max(0, Number((totalAnnualTaxLiability - ytdTdsPaid).toFixed(2)));
    const monthlyTds =
      remainingMonths > 0 ? Number((remainingTax / remainingMonths).toFixed(2)) : remainingTax;

    return {
      selectedRegime: isNewRegime ? TaxRegime.NEW_REGIME : TaxRegime.OLD_REGIME,
      annualGrossSalary: Number(annualGross.toFixed(2)),
      standardDeduction: Number(standardDeduction.toFixed(2)),
      professionalTaxAnnual: Number(professionalTaxAnnual.toFixed(2)),
      chapterVIAExemptions: Number(chapterVIAExemptions.toFixed(2)),
      section80C: Number(section80C.toFixed(2)),
      section80D: Number(section80D.toFixed(2)),
      section80CCD1B: Number(section80CCD1B.toFixed(2)),
      section24HomeLoan: Number(section24HomeLoan.toFixed(2)),
      hraExemption: Number(hraExemption.toFixed(2)),
      otherExemptions: Number(otherExemptions.toFixed(2)),
      netTaxableIncome,
      calculatedAnnualTax: Number(calculatedAnnualTax.toFixed(2)),
      section87ARebate: Number(section87ARebate.toFixed(2)),
      taxAfterRebate: Number(taxAfterRebate.toFixed(2)),
      educationCess,
      totalAnnualTaxLiability,
      taxPaidYtd: Number(ytdTdsPaid.toFixed(2)),
      remainingTax,
      remainingMonths,
      monthlyTds,
    };
  }
}
