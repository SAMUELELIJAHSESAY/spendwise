// Financial calculators for loans, compound interest, ROI, etc.

export interface LoanCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  paymentSchedule: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
}

export interface CompoundInterestResult {
  finalAmount: number;
  interestEarned: number;
  effectiveRate: number;
}

export interface ROIResult {
  roi: number;
  gain: number;
  annualReturn: number;
}

/**
 * Calculate loan payments (EMI - Equated Monthly Installment)
 */
export function calculateLoanPayment(
  principal: number,
  annualRate: number,
  months: number
): LoanCalculation {
  const monthlyRate = annualRate / 100 / 12;
  
  // EMI formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - principal;

  // Generate payment schedule
  let balance = principal;
  const paymentSchedule = [];

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPay = monthlyPayment - interest;
    balance -= principalPay;

    paymentSchedule.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPay,
      interest: interest,
      balance: Math.max(0, balance),
    });
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    paymentSchedule,
  };
}

/**
 * Calculate compound interest
 * Formula: A = P(1 + r/n)^(nt)
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  compoundsPerYear: number = 12
): CompoundInterestResult {
  const rate = annualRate / 100;
  const finalAmount = principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * years);
  const interestEarned = finalAmount - principal;
  const effectiveRate = Math.pow(1 + rate / compoundsPerYear, compoundsPerYear) - 1;

  return {
    finalAmount: Math.round(finalAmount * 100) / 100,
    interestEarned: Math.round(interestEarned * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100 * 100) / 100,
  };
}

/**
 * Calculate simple interest
 * Formula: I = P * R * T / 100
 */
export function calculateSimpleInterest(
  principal: number,
  annualRate: number,
  years: number
): CompoundInterestResult {
  const interest = (principal * annualRate * years) / 100;
  const finalAmount = principal + interest;

  return {
    finalAmount: Math.round(finalAmount * 100) / 100,
    interestEarned: Math.round(interest * 100) / 100,
    effectiveRate: annualRate,
  };
}

/**
 * Calculate Return on Investment (ROI)
 */
export function calculateROI(
  initialInvestment: number,
  finalValue: number,
  years: number
): ROIResult {
  const gain = finalValue - initialInvestment;
  const roi = (gain / initialInvestment) * 100;
  const annualReturn = roi / years;

  return {
    roi: Math.round(roi * 100) / 100,
    gain: Math.round(gain * 100) / 100,
    annualReturn: Math.round(annualReturn * 100) / 100,
  };
}

/**
 * Calculate savings goal timeline
 */
export function calculateSavingsTimeline(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number
): { months: number; years: number; targetDate: string } {
  if (monthlyContribution <= 0) {
    return { months: Infinity, years: Infinity, targetDate: 'Never' };
  }

  const remaining = targetAmount - currentAmount;
  const months = Math.ceil(remaining / monthlyContribution);
  const years = Math.round((months / 12) * 10) / 10;

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  return {
    months,
    years,
    targetDate: targetDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  };
}

/**
 * Break-even analysis
 */
export function calculateBreakEven(
  fixedCosts: number,
  variableCostPerUnit: number,
  pricePerUnit: number
): { units: number; revenue: number; days: number } {
  if (pricePerUnit <= variableCostPerUnit) {
    return { units: Infinity, revenue: Infinity, days: Infinity };
  }

  const units = Math.ceil(fixedCosts / (pricePerUnit - variableCostPerUnit));
  const revenue = units * pricePerUnit;
  const days = Math.ceil(units / 30); // Assuming 30 units per day

  return {
    units,
    revenue: Math.round(revenue * 100) / 100,
    days,
  };
}

/**
 * Debt payoff calculator using avalanche or snowball method
 */
export function calculateDebtPayoff(
  debts: Array<{ amount: number; rate: number; name: string }>,
  monthlyPayment: number,
  method: 'avalanche' | 'snowball' = 'avalanche'
): {
  totalMonths: number;
  totalInterest: number;
  payoffSchedule: Array<{ month: number; debts: Array<{ name: string; balance: number; paid: number }> }>;
} {
  const sortedDebts = [...debts].sort((a, b) => {
    if (method === 'avalanche') {
      return b.rate - a.rate; // Pay highest rate first
    } else {
      return a.amount - b.amount; // Pay smallest first
    }
  });

  let totalMonths = 0;
  let totalInterest = 0;
  const payoffSchedule = [];
  let debtBalances = sortedDebts.map(d => d.amount);
  let month = 0;

  while (debtBalances.some(b => b > 0) && month < 600) {
    month++;
    let remainingPayment = monthlyPayment;
    let monthlyInterest = 0;

    // Apply interest
    for (let i = 0; i < debtBalances.length; i++) {
      if (debtBalances[i] > 0) {
        const interest = (debtBalances[i] * sortedDebts[i].rate / 100) / 12;
        debtBalances[i] += interest;
        monthlyInterest += interest;
      }
    }

    // Apply payment
    for (let i = 0; i < debtBalances.length; i++) {
      if (debtBalances[i] > 0 && remainingPayment > 0) {
        const payment = Math.min(debtBalances[i], remainingPayment);
        debtBalances[i] -= payment;
        remainingPayment -= payment;
      }
    }

    totalInterest += monthlyInterest;

    if (month % 12 === 0 || debtBalances.some(b => b > 0 && remainingPayment > 0)) {
      payoffSchedule.push({
        month,
        debts: debtBalances.map((balance, i) => ({
          name: sortedDebts[i].name,
          balance: Math.max(0, balance),
          paid: sortedDebts[i].amount - Math.max(0, balance),
        })),
      });
    }
  }

  return {
    totalMonths: month,
    totalInterest: Math.round(totalInterest * 100) / 100,
    payoffSchedule: payoffSchedule.slice(0, 36), // Return last 3 years
  };
}

/**
 * Budget percentage calculator
 */
export function calculateBudgetPercentages(totalIncome: number): Record<string, number> {
  // 50/30/20 rule variations for students
  return {
    'Needs (Housing, Food, Transportation)': 50,
    'Wants (Entertainment, Shopping)': 30,
    'Savings & Debt Repayment': 20,
  };
}

/**
 * Emergency fund calculator
 */
export function calculateEmergencyFund(
  monthlyExpenses: number,
  months: number = 3
): { amount: number; percentage: number } {
  const amount = monthlyExpenses * months;
  return {
    amount: Math.round(amount * 100) / 100,
    percentage: months,
  };
}
