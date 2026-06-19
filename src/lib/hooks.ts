import { useEffect, useState, useCallback } from 'react';
import { storage, Account } from './storage';

export function useFinancialHealth() {
  const [score, setScore] = useState(0);
  const [factors, setFactors] = useState<{ label: string; score: number; weight: number }[]>([]);

  useEffect(() => {
    const calculateScore = async () => {
      const income = await storage.getAllIncome();
      const expenses = await storage.getAllExpenses();
      const savings = await storage.getAllSavingsGoals();
      const budgets = await storage.getAllBudgets();
      const debts = await storage.getAllDebts();

      let totalScore = 0;
      const factorList: { label: string; score: number; weight: number }[] = [];

      // Savings Rate (0-100)
      const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
      const savingsScore = Math.min(100, savingsRate * 2);
      factorList.push({ label: 'Savings Rate', score: Math.round(savingsScore), weight: 30 });
      totalScore += (savingsScore / 100) * 30;

      // Emergency Fund (10% expenses = 100)
      const monthlyExpenses = totalExpenses / 12 || 0;
      const totalSaved = savings.reduce((sum, s) => sum + s.currentAmount, 0);
      const emergencyMonths = monthlyExpenses > 0 ? totalSaved / monthlyExpenses : 0;
      const emergencyScore = Math.min(100, (emergencyMonths / 3) * 100);
      factorList.push({ label: 'Emergency Fund', score: Math.round(emergencyScore), weight: 25 });
      totalScore += (emergencyScore / 100) * 25;

      // Budget Adherence
      const currentMonth = getMonthYearString(new Date());
      const monthBudgets = budgets.filter((b) => b.month === currentMonth);
      const budgetAdherence = monthBudgets.length > 0 ? monthBudgets.reduce((score, b) => {
        const monthExpForCategory = expenses
          .filter((e) => e.category === b.category && getMonthYearString(new Date(e.date)) === currentMonth)
          .reduce((s, e) => s + e.amount, 0);
        const ratio = monthExpForCategory / b.amount;
        return score + (ratio <= 1 ? 100 : Math.max(0, 100 - (ratio - 1) * 50));
      }, 0) / monthBudgets.length : 50;
      factorList.push({ label: 'Budget Adherence', score: Math.round(budgetAdherence), weight: 20 });
      totalScore += (budgetAdherence / 100) * 20;

      // Debt Ratio
      const totalDebt = debts.filter((d) => d.type === 'owes').reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
      const debtRatio = totalIncome > 0 ? totalDebt / totalIncome : 0;
      const debtScore = totalDebt === 0 ? 100 : Math.max(0, 100 - debtRatio * 100);
      factorList.push({ label: 'Debt Management', score: Math.round(debtScore), weight: 15 });
      totalScore += (debtScore / 100) * 15;

      // Goals Progress
      const avgGoalProgress = savings.length > 0
        ? savings.reduce((sum, g) => sum + Math.min(100, (g.currentAmount / g.targetAmount) * 100), 0) / savings.length
        : 75;
      factorList.push({ label: 'Goals Progress', score: Math.round(avgGoalProgress), weight: 10 });
      totalScore += (avgGoalProgress / 100) * 10;

      setFactors(factorList);
      setScore(Math.round(totalScore));
    };

    calculateScore();
  }, []);

  return { score, factors };
}

export function useSpendingPredictions() {
  const [predictions, setPredictions] = useState<{ category: string; predicted: number; trend: number }[]>([]);

  useEffect(() => {
    const predict = async () => {
      const expenses = await storage.getAllExpenses();
      const categories = new Map<string, number[]>();

      // Group by category and month
      expenses.forEach((exp) => {
        const key = exp.category;
        if (!categories.has(key)) {
          categories.set(key, new Array(12).fill(0));
        }
        const monthIndex = getMonthsAgo(new Date(exp.date));
        if (monthIndex < 12) {
          const arr = categories.get(key)!;
          arr[11 - monthIndex] += exp.amount;
        }
      });

      const results: { category: string; predicted: number; trend: number }[] = [];
      categories.forEach((monthData, category) => {
        // Simple moving average for prediction
        const recentSum = monthData.slice(-3).reduce((a, b) => a + b, 0);
        const olderSum = monthData.slice(-6, -3).reduce((a, b) => a + b, 0);
        const predicted = recentSum / 3;
        const trend = olderSum > 0 ? ((recentSum - olderSum) / olderSum) * 100 : 0;
        results.push({ category, predicted: Math.round(predicted * 100) / 100, trend: Math.round(trend) });
      });

      setPredictions(results.sort((a, b) => b.predicted - a.predicted));
    };

    predict();
  }, []);

  return predictions;
}

export function useStreaks() {
  const [streaks, setStreaks] = useState<{ login: number; saving: number; budget: number }>({
    login: 0,
    saving: 0,
    budget: 0,
  });

  useEffect(() => {
    const loadStreaks = async () => {
      const loginStreak = await storage.getStreak('login');
      const savingStreak = await storage.getStreak('saving');
      const budgetStreak = await storage.getStreak('budget');

      setStreaks({
        login: loginStreak?.currentStreak || 0,
        saving: savingStreak?.currentStreak || 0,
        budget: budgetStreak?.currentStreak || 0,
      });
    };

    loadStreaks();
  }, []);

  return streaks;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; message: string; read: boolean; createdAt: Date }>>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      const all = await storage.getAllNotifications();
      setNotifications(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    loadNotifications();
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await storage.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAll = useCallback(async () => {
    await storage.clearAllNotifications();
    setNotifications([]);
  }, []);

  return { notifications, unreadCount: notifications.filter((n) => !n.read).length, markAsRead, clearAll };
}

function getMonthYearString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthsAgo(date: Date): number {
  const now = new Date();
  const months = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
  return Math.max(0, months);
}

export function useSpendingAlerts() {
  const [alerts, setAlerts] = useState<{ category: string; percentage: number; budget: number; spent: number }[]>([]);

  useEffect(() => {
    const loadAlerts = async () => {
      const currentMonth = getMonthYearString(new Date());
      const budgets = await storage.getBudgetsByMonth(currentMonth);
      const expenses = await storage.getAllExpenses();

      const alertData = budgets.map((budget) => {
        const spent = expenses
          .filter((e) => e.category === budget.category && getMonthYearString(new Date(e.date)) === currentMonth)
          .reduce((sum, e) => sum + e.amount, 0);
        const percentage = Math.round((spent / budget.amount) * 100);
        return { category: budget.category, percentage, budget: budget.amount, spent };
      }).filter((a) => a.percentage >= 80);

      setAlerts(alertData);
    };

    loadAlerts();
  }, []);

  return alerts;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    storage.getAllAccounts().then(setAccounts);
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const defaultAccount = accounts.find((a) => a.isDefault);

  return { accounts, totalBalance, defaultAccount, refresh: () => storage.getAllAccounts().then(setAccounts) };
}

export const ACHIEVEMENTS = [
  { id: 'first_transaction', name: 'First Step', description: 'Add your first transaction', icon: '🎯' },
  { id: 'budget_master', name: 'Budget Master', description: 'Stay under budget for 3 months', icon: '📊' },
  { id: 'savings_starter', name: 'Savings Starter', description: 'Create your first savings goal', icon: '💰' },
  { id: 'savings_pro', name: 'Savings Pro', description: 'Complete a savings goal', icon: '🏆' },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day login streak', icon: '🔥' },
  { id: 'streak_30', name: 'Month Master', description: '30 day login streak', icon: '💪' },
  { id: 'debt_free', name: 'Debt Free', description: 'Pay off all debts', icon: '🆓' },
  { id: 'track_100', name: 'Super Tracker', description: 'Track 100 transactions', icon: '📝' },
  { id: 'early_bird', name: 'Early Bird', description: 'Add transaction before 7 AM', icon: '🌅' },
  { id: 'budget_5_categories', name: 'Category King', description: 'Set budgets for 5 categories', icon: '👑' },
  { id: 'savings_1000', name: 'Thousandaire', description: 'Save $1,000 total', icon: '💵' },
  { id: 'negative_balance', name: 'Comeback Kid', description: 'Recover from negative balance', icon: '💪' },
] as const;

export const FINANCIAL_TIPS = [
  { title: '50/30/20 Rule', content: 'Allocate 50% of your income to needs, 30% to wants, and 20% to savings.' },
  { title: 'Emergency Fund', content: 'Aim to save 3-6 months of expenses for emergencies.' },
  { title: 'Track Everything', content: 'Record every expense, no matter how small. Small leaks sink great ships.' },
  { title: 'Review Weekly', content: 'Review your spending weekly to stay on track with your goals.' },
  { title: 'Automate Savings', content: 'Set up automatic transfers to your savings account on payday.' },
  { title: 'Use the 24-Hour Rule', content: 'Wait 24 hours before making any non-essential purchase over $50.' },
  { title: 'Cash Envelope System', content: 'Use cash for categories where you tend to overspend.' },
  { title: 'Meal Prep', content: 'Cook meals at home and bring lunch to save hundreds monthly.' },
  { title: 'Student Discounts', content: 'Always ask for student discounts - many places offer 10-20% off.' },
  { title: 'Free Alternatives', content: 'Look for free alternatives to paid subscriptions and services.' },
] as const;
