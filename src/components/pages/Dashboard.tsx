import { useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, ArrowRight, Calendar, Bell,
  CreditCard, AlertTriangle, Flame, Target, BarChart3, Zap, RefreshCw,
  Receipt, Trophy, Lightbulb, ChevronRight, X
} from 'lucide-react';
import type { Page } from '../common/Navigation';
import { storage, Income, Expense, SavingsGoal, Bill } from '../../lib/storage';
import {
  formatCurrency, formatDate, getMonthYearString, EXPENSE_CATEGORIES, INCOME_CATEGORIES,
  generateId
} from '../../lib/types';
import { useFinancialHealth, useStreaks, useSpendingAlerts, FINANCIAL_TIPS } from '../../lib/hooks';
import { Card, StatCard } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyState, Badge } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

type QuickAddType = 'income' | 'expense';

export function Dashboard({ onNavigate }: DashboardProps) {
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('expense');
  const [quickAddData, setQuickAddData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);

  const { score: healthScore, factors } = useFinancialHealth();
  const streaks = useStreaks();
  const alerts = useSpendingAlerts();

  const currentDate = new Date();
  const currentMonth = getMonthYearString(currentDate);
  const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
  const previousMonth = getMonthYearString(previousDate);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % FINANCIAL_TIPS.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [allIncome, allExpenses, allSavings, allBills] = await Promise.all([
        storage.getAllIncome(),
        storage.getAllExpenses(),
        storage.getAllSavingsGoals(),
        storage.getAllBills(),
      ]);
      setIncome(allIncome);
      setExpenses(allExpenses);
      setSavings(allSavings);
      setBills(allBills);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMonthIncome = income.filter((i) => getMonthYearString(new Date(i.date)) === currentMonth);
  const currentMonthExpenses = expenses.filter((e) => getMonthYearString(new Date(e.date)) === currentMonth);
  const previousMonthIncome = income.filter((i) => getMonthYearString(new Date(i.date)) === previousMonth);
  const previousMonthExpenses = expenses.filter((e) => getMonthYearString(new Date(e.date)) === previousMonth);

  const totalIncome = currentMonthIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;
  const totalSavingsAmount = savings.reduce((sum, s) => sum + s.currentAmount, 0);

  const prevTotalIncome = previousMonthIncome.reduce((sum, i) => sum + i.amount, 0);
  const prevTotalExpenses = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const incomeTrend = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;
  const expenseTrend = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;

  const recentTransactions = [...currentMonthIncome, ...currentMonthExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const upcomingBills = bills
    .filter((b) => !b.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const topSavings = savings.sort((a, b) => b.currentAmount - a.currentAmount).slice(0, 3);

  // Spending by category for mini breakdown
  const categorySpending = new Map<string, number>();
  currentMonthExpenses.forEach((e) => {
    categorySpending.set(e.category, (categorySpending.get(e.category) || 0) + e.amount);
  });
  const topCategories = Array.from(categorySpending.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(quickAddData.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (quickAddType === 'income') {
      await storage.addIncome({
        id: generateId(),
        amount,
        category: quickAddData.category || 'other',
        description: quickAddData.description,
        date: quickAddData.date,
        recurring: false,
        tags: [],
        createdAt: new Date(),
      });
    } else {
      await storage.addExpense({
        id: generateId(),
        amount,
        category: quickAddData.category || 'other',
        description: quickAddData.description,
        date: quickAddData.date,
        recurring: false,
        tags: [],
        isPaid: true,
        createdAt: new Date(),
      });
    }

    setQuickAddData({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowQuickAdd(false);
    loadData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 relative">
      {/* Header */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" onClick={() => setShowQuickAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Streak Banner */}
      {(streaks.login > 0 || streaks.saving > 0) && (
        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6" />
              <div>
                <p className="font-medium">
                  {streaks.login > 0 && `${streaks.login} day streak!`}
                  {streaks.login > 0 && streaks.saving > 0 && ' • '}
                  {streaks.saving > 0 && `${streaks.saving} days saving`}
                </p>
                <p className="text-sm text-orange-100">Keep it up!</p>
              </div>
            </div>
            <Trophy className="w-8 h-8 text-orange-200" />
          </div>
        </Card>
      )}

      {/* Financial Tip */}
      {showTip && (
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 relative">
          <button
            onClick={() => setShowTip(false)}
            className="absolute top-2 right-2 p-1 rounded hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">{FINANCIAL_TIPS[currentTipIndex].title}</p>
              <p className="text-sm text-blue-100">{FINANCIAL_TIPS[currentTipIndex].content}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions (Mobile) */}
      <div className="lg:hidden flex gap-3">
        <Button variant="primary" fullWidth icon={<Plus className="w-4 h-4" />} onClick={() => onNavigate('income')}>
          Income
        </Button>
        <Button variant="secondary" fullWidth icon={<Plus className="w-4 h-4" />} onClick={() => onNavigate('expenses')}>
          Expense
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(balance)}
          icon={<Wallet className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={incomeTrend !== 0 ? { value: Math.abs(incomeTrend), isPositive: incomeTrend > 0 } : undefined}
          color="green"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown className="w-5 h-5" />}
          trend={expenseTrend !== 0 ? { value: Math.abs(expenseTrend), isPositive: expenseTrend < 0 } : undefined}
          color="red"
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(totalSavingsAmount)}
          icon={<PiggyBank className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Financial Health Score */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Financial Health Score
          </h2>
          <span className={`text-3xl font-bold ${getScoreColor(healthScore)}`}>{healthScore}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              healthScore >= 80 ? 'bg-green-500' :
              healthScore >= 60 ? 'bg-yellow-500' :
              healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {factors.map((factor) => (
            <div key={factor.label} className="text-center">
              <p className="font-medium text-gray-900 dark:text-white">{factor.score}</p>
              <p className="text-gray-500 dark:text-gray-400">{factor.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Spending Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-orange-900 dark:text-orange-100">Spending Alerts</p>
              <div className="mt-2 space-y-1">
                {alerts.map((alert) => (
                  <p key={alert.category} className="text-sm text-orange-700 dark:text-orange-300">
                    {EXPENSE_CATEGORIES.find((c) => c.id === alert.category)?.label}: {alert.percentage}% of budget used
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('expenses')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Calendar className="w-6 h-6" />}
                title="No transactions yet"
                description="Add your first income or expense"
                action={
                  <Button variant="primary" size="sm" onClick={() => setShowQuickAdd(true)}>
                    Add Transaction
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentTransactions.map((item) => {
                const isIncome = 'recurring' in item && !('isPaid' in item);
                const transaction = item as Income | Expense;
                const category = isIncome
                  ? INCOME_CATEGORIES.find((c) => c.id === transaction.category)
                  : EXPENSE_CATEGORIES.find((c) => c.id === transaction.category);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isIncome
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {transaction.description || category?.label || 'Transaction'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        {formatDate(transaction.date)}
                        <Badge size="sm">{category?.label}</Badge>
                      </p>
                    </div>
                    <p
                      className={`font-semibold ${
                        isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Bills */}
          {upcomingBills.length > 0 && (
            <Card padding="none">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  Bills Due
                </h3>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('bills')}>
                  View
                </Button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {upcomingBills.map((bill) => {
                  const daysUntil = Math.ceil(
                    (new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={bill.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{bill.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {daysUntil <= 0 ? 'Overdue!' : `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(bill.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Savings Goals */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-purple-500" />
                Savings Goals
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('savings')}>
                View
              </Button>
            </div>
            {topSavings.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No savings goals yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topSavings.map((goal) => {
                  const percentage = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
                  return (
                    <div key={goal.id} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{goal.name}</p>
                        <Badge variant={percentage >= 100 ? 'success' : 'default'} size="sm">{percentage}%</Badge>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Quick Actions
              </h3>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => onNavigate('templates')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              >
                <Receipt className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Saved Templates</span>
              </button>
              <button
                onClick={() => onNavigate('bills')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              >
                <Receipt className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bill Reminders</span>
              </button>
              <button
                onClick={() => onNavigate('debts')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              >
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Debts & Loans</span>
              </button>
              <button
                onClick={() => onNavigate('analytics')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
              >
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Analytics</span>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Spending by Category Mini Chart */}
      {topCategories.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Spending Categories</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('analytics')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {topCategories.map(([catId, amount]) => {
              const category = EXPENSE_CATEGORIES.find((c) => c.id === catId);
              const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
              return (
                <div key={catId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{category?.label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Floating Action Button - Mobile */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="lg:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center z-40 hover:bg-emerald-600 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Add Modal */}
      <Modal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        title="Add Transaction"
        size="md"
      >
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setQuickAddType('income')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              quickAddType === 'income'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setQuickAddType('expense')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              quickAddType === 'expense'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Expense
          </button>
        </div>
        <form onSubmit={handleQuickAdd} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={quickAddData.amount}
            onChange={(e) => setQuickAddData({ ...quickAddData, amount: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={quickAddData.category}
            onChange={(e) => setQuickAddData({ ...quickAddData, category: e.target.value })}
            options={
              quickAddType === 'income'
                ? INCOME_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))
                : EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))
            }
          />
          <Input
            label="Description"
            placeholder="What's this for?"
            value={quickAddData.description}
            onChange={(e) => setQuickAddData({ ...quickAddData, description: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            value={quickAddData.date}
            onChange={(e) => setQuickAddData({ ...quickAddData, date: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowQuickAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Add {quickAddType === 'income' ? 'Income' : 'Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
