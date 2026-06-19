// Advanced analytics for spending patterns and financial insights
import { Expense, Income } from './storage';

export interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

export interface FinancialInsight {
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
  action?: string;
}

export interface FinancialHealth {
  score: number; // 0-100
  rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  breakdown: {
    savingsRate: number;
    budgetAdherence: number;
    expenseVariance: number;
    incomeStability: number;
  };
}

export interface CashFlowForecast {
  month: string;
  projectedBalance: number;
  confidence: number;
}

export function getSpendingPatterns(
  expenses: Expense[],
  monthsBack: number = 3
): SpendingPattern[] {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

  // Current period
  const currentExpenses = expenses.filter(e => new Date(e.date) >= cutoffDate);
  const currentByCategory = groupByCategory(currentExpenses);

  // Previous period
  const prevCutoffDate = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() - monthsBack, 1);
  const prevExpenses = expenses.filter(
    e => new Date(e.date) >= prevCutoffDate && new Date(e.date) < cutoffDate
  );
  const prevByCategory = groupByCategory(prevExpenses);

  const total = Object.values(currentByCategory).reduce((sum, amt) => sum + amt, 0);

  return Object.entries(currentByCategory).map(([category, amount]) => {
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    const prevAmount = prevByCategory[category] || 0;
    const trend_percentage = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;

    return {
      category,
      amount,
      percentage: Math.round(percentage),
      trend: trend_percentage > 5 ? 'up' : trend_percentage < -5 ? 'down' : 'stable',
      trend_percentage: Math.round(trend_percentage),
    };
  });
}

export function generateFinancialInsights(
  expenses: Expense[],
  income: Income[],
  budgets: any[],
  savingsGoals: any[]
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const currentExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= currentMonth && d < nextMonth;
  });
  const currentIncome = income.filter(e => {
    const d = new Date(e.date);
    return d >= currentMonth && d < nextMonth;
  });

  const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = currentIncome.reduce((sum, e) => sum + e.amount, 0);

  // Insight 1: Income vs Expenses
  if (totalExpenses > totalIncome) {
    insights.push({
      title: 'Spending Alert',
      description: `You're spending ${Math.round((totalExpenses / totalIncome - 1) * 100)}% more than your income this month!`,
      type: 'warning',
      action: 'Reduce expenses or increase income',
    });
  } else if (totalIncome - totalExpenses > totalIncome * 0.3) {
    insights.push({
      title: 'Great Savings!',
      description: `You're saving ${Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)}% of your income this month!`,
      type: 'success',
    });
  }

  // Insight 2: Budget monitoring
  for (const budget of budgets) {
    const categoryExpenses = currentExpenses
      .filter(e => e.category === budget.category)
      .reduce((sum, e) => sum + e.amount, 0);

    if (categoryExpenses > budget.limit * 1.1) {
      insights.push({
        title: `${budget.category} Over Budget`,
        description: `You've exceeded your ${budget.category} budget by ${Math.round(((categoryExpenses - budget.limit) / budget.limit) * 100)}%`,
        type: 'warning',
      });
    }
  }

  // Insight 3: Savings goals progress
  if (savingsGoals.length > 0) {
    const completedGoals = savingsGoals.filter(g => g.currentAmount >= g.targetAmount);
    if (completedGoals.length > 0) {
      insights.push({
        title: 'Savings Goal Achieved!',
        description: `Congratulations! You've completed ${completedGoals.length} savings goal(s)!`,
        type: 'success',
      });
    }
  }

  // Insight 4: Recurring expenses
  const recurringExpenses = currentExpenses.filter(e => e.recurring).length;
  if (recurringExpenses > 0) {
    const recurringTotal = currentExpenses
      .filter(e => e.recurring)
      .reduce((sum, e) => sum + e.amount, 0);
    insights.push({
      title: 'Recurring Expenses',
      description: `You have ${recurringExpenses} recurring expenses totaling ${recurringTotal.toFixed(2)} this period`,
      type: 'info',
    });
  }

  return insights;
}

export function calculateFinancialHealth(
  expenses: Expense[],
  income: Income[],
  budgets: any[],
  savingsGoals: any[]
): FinancialHealth {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const currentExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= currentMonth && d < nextMonth;
  });
  const currentIncome = income.filter(e => {
    const d = new Date(e.date);
    return d >= currentMonth && d < nextMonth;
  });

  const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = currentIncome.reduce((sum, e) => sum + e.amount, 0);

  // Savings rate (0-30 points)
  const savingsRate = totalIncome > 0 ? Math.min(30, ((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Budget adherence (0-30 points)
  let budgetAdherence = 30;
  for (const budget of budgets) {
    const categoryExpenses = currentExpenses
      .filter(e => e.category === budget.category)
      .reduce((sum, e) => sum + e.amount, 0);
    const overagePercentage = Math.max(0, (categoryExpenses - budget.limit) / budget.limit);
    budgetAdherence -= Math.min(30, overagePercentage * 10);
  }
  budgetAdherence = Math.max(0, budgetAdherence);

  // Expense variance (0-20 points)
  const last3Months = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= new Date(now.getFullYear(), now.getMonth() - 3, 1);
  });
  const monthlyTotals: number[] = [];
  for (let i = 0; i < 3; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const total = last3Months
      .filter(e => {
        const d = new Date(e.date);
        return d >= month && d < monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);
    monthlyTotals.push(total);
  }
  const avgExpense = monthlyTotals.reduce((a, b) => a + b, 0) / 3;
  const variance = monthlyTotals.reduce((sum, total) => sum + Math.abs(total - avgExpense), 0) / 3;
  const expenseVariance = Math.max(0, 20 - (variance / avgExpense) * 20);

  // Income stability (0-20 points)
  const last3MonthsIncome = income.filter(e => {
    const d = new Date(e.date);
    return d >= new Date(now.getFullYear(), now.getMonth() - 3, 1);
  });
  const incomeTotals: number[] = [];
  for (let i = 0; i < 3; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const total = last3MonthsIncome
      .filter(e => {
        const d = new Date(e.date);
        return d >= month && d < monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);
    incomeTotals.push(total);
  }
  const avgIncome = incomeTotals.reduce((a, b) => a + b, 0) / 3;
  const incomeVariance = incomeTotals.reduce((sum, total) => sum + Math.abs(total - avgIncome), 0) / 3;
  const incomeStability = Math.max(0, 20 - (incomeVariance / avgIncome) * 20);

  const score = Math.round(savingsRate + budgetAdherence + expenseVariance + incomeStability);
  const rating: 'Poor' | 'Fair' | 'Good' | 'Excellent' =
    score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';

  return {
    score,
    rating,
    breakdown: {
      savingsRate: Math.round(savingsRate),
      budgetAdherence: Math.round(budgetAdherence),
      expenseVariance: Math.round(expenseVariance),
      incomeStability: Math.round(incomeStability),
    },
  };
}

export function forecastCashFlow(
  currentBalance: number,
  expenses: Expense[],
  income: Income[],
  months: number = 3
): CashFlowForecast[] {
  const forecasts: CashFlowForecast[] = [];
  const now = new Date();

  // Calculate average monthly cash flow
  const last6Months = [];
  for (let i = 0; i < 6; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthExpenses = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= month && d < monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const monthIncome = income
      .filter(e => {
        const d = new Date(e.date);
        return d >= month && d < monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    last6Months.push(monthIncome - monthExpenses);
  }

  const avgMonthlyFlow = last6Months.reduce((a, b) => a + b, 0) / 6;

  let projectedBalance = currentBalance;
  for (let i = 1; i <= months; i++) {
    projectedBalance += avgMonthlyFlow;
    const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);

    forecasts.push({
      month: forecastDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      projectedBalance: Math.max(0, projectedBalance),
      confidence: Math.max(0.5, 1 - i * 0.1), // Confidence decreases over time
    });
  }

  return forecasts;
}

function groupByCategory(items: any[]): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    },
    {} as Record<string, number>
  );
}
