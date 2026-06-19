import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Activity, Target, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { useAuth } from '../../lib/auth';
import { storage } from '../../lib/storage';
import { 
  getSpendingPatterns, 
  generateFinancialInsights, 
  calculateFinancialHealth,
  forecastCashFlow
} from '../../lib/analytics';

export function InsightsPage() {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    try {
      setLoading(true);

      const expenses = (await storage.getAll('expenses')) || [];
      const income = (await storage.getAll('income')) || [];
      const budgets = (await storage.getAll('budgets')) || [];
      const savingsGoals = (await storage.getAll('savings')) || [];

      const spendingPatterns = getSpendingPatterns(expenses, 3);
      setPatterns(spendingPatterns);

      const financialInsights = generateFinancialInsights(
        expenses,
        income,
        budgets,
        savingsGoals
      );
      setInsights(financialInsights);

      const health = calculateFinancialHealth(
        expenses,
        income,
        budgets,
        savingsGoals
      );
      setHealthScore(health);

      const cashFlow = forecastCashFlow(
        user?.balance || 0,
        expenses,
        income,
        3
      );
      setForecast(cashFlow);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Insights</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Your spending patterns and financial health</p>
      </div>

      {/* Financial Health Score */}
      {healthScore && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Financial Health Score
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                  {healthScore.score}
                </span>
                <span className={`text-2xl font-semibold ${
                  healthScore.rating === 'Excellent' ? 'text-emerald-600 dark:text-emerald-400' :
                  healthScore.rating === 'Good' ? 'text-blue-600 dark:text-blue-400' :
                  healthScore.rating === 'Fair' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {healthScore.rating}
                </span>
              </div>
            </div>
            <Activity className="w-16 h-16 text-emerald-500 opacity-50" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-emerald-200 dark:border-emerald-800">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {healthScore.breakdown.savingsRate}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Budget Adherence</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {healthScore.breakdown.budgetAdherence}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expense Stability</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {healthScore.breakdown.expenseVariance}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Income Stability</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {healthScore.breakdown.incomeStability}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Insights */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Key Insights</h2>
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, idx) => (
              <Card key={idx} className={`border-l-4 ${
                insight.type === 'warning' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                insight.type === 'success' ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-start gap-3">
                  {insight.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />}
                  {insight.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />}
                  {insight.type === 'info' && <Zap className="w-5 h-5 text-blue-600 mt-0.5" />}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                    {insight.action && (
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">
                        💡 {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-gray-600 dark:text-gray-400">No insights available yet. Add income and expenses to get started.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Spending Patterns */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Spending Patterns (Last 3 Months)</h2>
        <div className="space-y-3">
          {patterns.length > 0 ? (
            patterns.map((pattern, idx) => (
              <Card key={idx}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {pattern.category}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pattern.percentage}% of total spending
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">${pattern.amount.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      {pattern.trend === 'up' && (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      )}
                      {pattern.trend === 'down' && (
                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                      )}
                      <span className={pattern.trend === 'up' ? 'text-red-600' : pattern.trend === 'down' ? 'text-emerald-600' : 'text-gray-600'}>
                        {Math.abs(pattern.trend_percentage)}% {pattern.trend}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${pattern.percentage}%` }}
                  />
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-gray-600 dark:text-gray-400">No spending data available.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3-Month Cash Flow Forecast</h2>
        <div className="space-y-3">
          {forecast.length > 0 ? (
            forecast.map((month, idx) => (
              <Card key={idx}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{month.month}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Confidence: {Math.round(month.confidence * 100)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${month.projectedBalance.toFixed(2)}
                    </p>
                    <Target className="w-4 h-4 text-emerald-500 mt-1" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-gray-600 dark:text-gray-400">No forecast available. Add transaction history for better predictions.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
