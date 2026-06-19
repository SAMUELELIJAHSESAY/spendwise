import { Plus, Target, Trash2, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { useAuth } from '../../lib/auth';
import { storage, FinancialGoal } from '../../lib/storage';
import { calculateGoalProgress, prioritizeGoals, daysUntilDeadline, isGoalOverdue } from '../../lib/goals';

export function FinancialGoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'medium-term' as const,
    priority: 'medium' as const,
  });

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      setLoading(true);
      const storedGoals = (await storage.getAll('financialGoals')) || [];
      setGoals(storedGoals);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addGoal() {
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newGoal: FinancialGoal = {
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        deadline: formData.deadline,
        category: formData.category,
        priority: formData.priority,
        icon: '🎯',
        color: 'emerald',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.add('financialGoals', newGoal);
      setGoals([...goals, newGoal]);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        category: 'medium-term',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Failed to add goal:', error);
      alert('Failed to create goal');
    }
  }

  async function deleteGoal(goalId: string) {
    try {
      await storage.delete('financialGoals', goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete goal');
    }
  }

  async function updateGoalProgress(goalId: string, newAmount: number) {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        goal.currentAmount = Math.min(newAmount, goal.targetAmount);
        if (newAmount >= goal.targetAmount) {
          goal.status = 'completed';
        }
        goal.updatedAt = new Date();
        await storage.update('financialGoals', goal);
        setGoals(goals.map(g => g.id === goalId ? goal : g));
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const prioritized = prioritizeGoals(goals);
  const totalProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + calculateGoalProgress(g).progressPercentage, 0) / goals.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Goals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and achieve your financial milestones</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Overall Progress</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalProgress}%</span>
          </div>
        </Card>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {prioritized.length > 0 ? (
          prioritized.map(goal => {
            const progress = calculateGoalProgress(goal);
            const overdue = isGoalOverdue(goal);

            return (
              <Card key={goal.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{goal.name}</h3>
                      {goal.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      )}
                      {overdue && goal.status !== 'completed' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ${progress.currentAmount.toFixed(2)} / ${progress.targetAmount.toFixed(2)}
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {progress.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">Monthly Target</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${progress.monthlyContributionNeeded.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">Days Left</p>
                      <p className={`font-semibold ${
                        progress.daysRemaining > 30 ? 'text-emerald-600 dark:text-emerald-400' :
                        progress.daysRemaining > 0 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {progress.daysRemaining} days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {progress.onTrack ? (
                      <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                        On track to achieve this goal
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        Behind schedule - increase contributions
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card>
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No financial goals yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create your first goal to get started!</p>
            </div>
          </Card>
        )}
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <Modal title="Create Financial Goal" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input
              label="Goal Name"
              placeholder="e.g., Buy a Laptop"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Description"
              placeholder="Why is this goal important?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              label="Target Amount"
              type="number"
              placeholder="0.00"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
            />
            <Input
              label="Current Amount (Optional)"
              type="number"
              placeholder="0.00"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
            />
            <Input
              label="Target Date"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="short-term">Short-term (0-6 months)</option>
                  <option value="medium-term">Medium-term (6-24 months)</option>
                  <option value="long-term">Long-term (24+ months)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={addGoal} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Create Goal
              </Button>
              <Button onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
