import { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { BarChart3, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { storage, Income, Expense } from '../../lib/storage';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatCurrency, MONTHS, getMonthYearString } from '../../lib/types';
import { Card } from '../common/Card';
import { Select } from '../common/Input';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AnalyticsPage() {
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12'>('6');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incomeData, expenseData] = await Promise.all([
        storage.getAllIncome(),
        storage.getAllExpenses(),
      ]);
      setIncome(incomeData);
      setExpenses(expenseData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const months = parseInt(timeRange);
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = getMonthYearString(date);
      labels.push(MONTHS[date.getMonth()]);

      const monthIncome = income
        .filter((inc) => getMonthYearString(new Date(inc.date)) === monthKey)
        .reduce((sum, inc) => sum + inc.amount, 0);
      incomeData.push(monthIncome);

      const monthExpenses = expenses
        .filter((exp) => getMonthYearString(new Date(exp.date)) === monthKey)
        .reduce((sum, exp) => sum + exp.amount, 0);
      expenseData.push(monthExpenses);
    }

    return { labels, incomeData, expenseData, months };
  }, [income, expenses, timeRange]);

  const expenseByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => {
      const category = EXPENSE_CATEGORIES.find((c) => c.id === cat);
      return category?.label || cat;
    });
    const data = sorted.map(([, amount]) => amount);
    return { labels, data, categories: sorted.map(([cat]) => cat) };
  }, [expenses]);

  const incomeByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    income.forEach((inc) => {
      categoryTotals[inc.category] = (categoryTotals[inc.category] || 0) + inc.amount;
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    return sorted;
  }, [income]);

  const totals = useMemo(() => {
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balance = totalIncome - totalExpenses;
    const avgMonthlyIncome = totalIncome / chartData.months;
    const avgMonthlyExpense = totalExpenses / chartData.months;
    return { totalIncome, totalExpenses, balance, avgMonthlyIncome, avgMonthlyExpense };
  }, [income, expenses, chartData.months]);

  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Income',
        data: chartData.incomeData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: chartData.expenseData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Income',
        data: chartData.incomeData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: chartData.expenseData,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const doughnutChartData = {
    labels: expenseByCategory.labels,
    datasets: [
      {
        data: expenseByCategory.data,
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#eab308',
          '#22c55e',
          '#06b6d4',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
          '#6366f1',
          '#14b8a6',
          '#f43f5e',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
    cutout: '60%',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Insights into your finances</p>
        </div>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          options={[
            { value: '3', label: 'Last 3 months' },
            { value: '6', label: 'Last 6 months' },
            { value: '12', label: 'Last 12 months' },
          ]}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Income</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(totals.totalIncome)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(totals.totalExpenses)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Net Balance</p>
              <p
                className={`text-lg font-bold ${
                  totals.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(totals.balance)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Monthly</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(totals.avgMonthlyExpense)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expenses Trend
          </h3>
          <div className="h-72">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </Card>

        {/* Bar Chart */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Comparison
          </h3>
          <div className="h-72">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Expense Breakdown
          </h3>
          {expenseByCategory.data.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No expense data available
            </div>
          ) : (
            <>
              <div className="h-64">
                <Doughnut data={doughnutChartData} options={doughnutOptions} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {expenseByCategory.labels.slice(0, 6).map((label, i) => {
                  const percentage = totals.totalExpenses > 0
                    ? Math.round((expenseByCategory.data[i] / totals.totalExpenses) * 100)
                    : 0;
                  return (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: doughnutChartData.datasets[0].backgroundColor[i],
                        }}
                      />
                      <span className="text-gray-600 dark:text-gray-400 truncate">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-auto">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Income Sources */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Income Sources</h3>
          {incomeByCategory.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No income data available
            </div>
          ) : (
            <div className="space-y-3">
              {incomeByCategory.map(([cat, amount]) => {
                const category = INCOME_CATEGORIES.find((c) => c.id === cat);
                const percentage = totals.totalIncome > 0 ? Math.round((amount / totals.totalIncome) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category?.label || cat}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Spending Insights */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Spending Insights</h3>
        {expenses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Add some expenses to see insights</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Highest Category</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {expenseByCategory.labels[0] || 'N/A'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {expenseByCategory.data[0] ? formatCurrency(expenseByCategory.data[0]) : '$0'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Daily Spend</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(totals.totalExpenses / (parseInt(timeRange) * 30))}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Based on selected period</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Savings Rate</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {totals.totalIncome > 0
                  ? Math.round(((totals.totalIncome - totals.totalExpenses) / totals.totalIncome) * 100)
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Of total income</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
