import { useEffect, useState } from 'react';
import { PiggyBank, Plus, Laptop, Smartphone, Car, Home, GraduationCap, Plane, Gift, Shield, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { storage, SavingsGoal, Contribution } from '../../lib/storage';
import { SAVINGS_ICONS, formatCurrency, formatDate, generateId } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState, ProgressBar, Badge } from '../common/EmptyState';

const iconMap: Record<string, typeof Laptop> = {
  laptop: Laptop,
  phone: Smartphone,
  car: Car,
  home: Home,
  education: GraduationCap,
  travel: Plane,
  gift: Gift,
  emergency: Shield,
  other: PiggyBank,
};

export function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributeModal, setIsContributeModal] = useState(false);
  const [isHistoryModal, setIsHistoryModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    icon: 'other',
  });

  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await storage.getAllSavingsGoals();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load savings goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContributions = async (goalId: string) => {
    try {
      const data = await storage.getContributionsForGoal(goalId);
      setContributions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to load contributions:', error);
    }
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      deadline: '',
      icon: 'other',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline || '',
      icon: goal.icon || 'other',
    });
    setIsModalOpen(true);
  };

  const openContributeModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributeAmount('');
    setIsContributeModal(true);
  };

  const openHistoryModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    loadContributions(goal.id);
    setIsHistoryModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0 || !formData.name) return;

    if (editingGoal) {
      const updated: SavingsGoal = {
        ...editingGoal,
        name: formData.name,
        targetAmount,
        deadline: formData.deadline || undefined,
        icon: formData.icon,
      };
      await storage.updateSavingsGoal(updated);
      setGoals(goals.map((g) => (g.id === updated.id ? updated : g)));
    } else {
      const newGoal: SavingsGoal = {
        id: generateId(),
        name: formData.name,
        targetAmount,
        currentAmount: 0,
        deadline: formData.deadline || undefined,
        icon: formData.icon,
        createdAt: new Date(),
      };
      await storage.addSavingsGoal(newGoal);
      setGoals([...goals, newGoal]);
    }

    setIsModalOpen(false);
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0 || !selectedGoal) return;

    const contribution: Contribution = {
      id: generateId(),
      goalId: selectedGoal.id,
      amount,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
    };

    await storage.addContribution(contribution);

    const updatedGoal = {
      ...selectedGoal,
      currentAmount: selectedGoal.currentAmount + amount,
    };
    await storage.updateSavingsGoal(updatedGoal);

    setGoals(goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
    setIsContributeModal(false);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteSavingsGoal(id);
    setGoals(goals.filter((g) => g.id !== id));
    setDeleteConfirm(null);
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your progress towards your goals</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          New Goal
        </Button>
      </div>

      {/* Overall Summary */}
      <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-100 text-sm">Total Saved</p>
            <p className="text-3xl font-bold">{formatCurrency(totalSaved)}</p>
            <p className="text-purple-100 text-sm mt-1">
              {totalTarget > 0 ? `${Math.round((totalSaved / totalTarget) * 100)}% of total goals` : 'No goals set'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
          />
        </div>
      </Card>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiggyBank className="w-6 h-6" />}
            title="No savings goals"
            description="Set a savings goal to start tracking your progress"
            action={
              <Button variant="primary" onClick={openAddModal}>
                Create Your First Goal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const Icon = iconMap[goal.icon || 'other'] || PiggyBank;
            const percentage = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <Card key={goal.id} hover className="group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {goal.deadline ? `Due ${formatDate(goal.deadline)}` : 'No deadline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                    <Badge variant={isCompleted ? 'success' : 'default'}>{percentage}%</Badge>
                  </div>
                  <ProgressBar
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    color={isCompleted ? 'green' : 'purple'}
                  />
                </div>

                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatCurrency(goal.currentAmount)} saved
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(goal.targetAmount)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => openContributeModal(goal)}
                  >
                    Add Funds
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openHistoryModal(goal)}
                  >
                    History
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Goal' : 'New Savings Goal'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="E.g., New Laptop, Emergency Fund"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Target Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
            required
          />
          <Input
            label="Deadline (optional)"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
          <Select
            label="Icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            options={SAVINGS_ICONS.map((i) => ({ value: i.id, label: i.label }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              {editingGoal ? 'Update' : 'Create'} Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={isContributeModal}
        onClose={() => setIsContributeModal(false)}
        title="Add Contribution"
        size="sm"
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Contributing to</p>
            <p className="font-semibold text-gray-900 dark:text-white">{selectedGoal?.name}</p>
          </div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsContributeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Add Contribution
            </Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModal}
        onClose={() => setIsHistoryModal(false)}
        title="Contribution History"
        size="md"
      >
        {contributions.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="w-6 h-6" />}
            title="No contributions yet"
            description="Start saving towards your goal"
          />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {contributions.map((contrib) => (
              <div
                key={contrib.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    +{formatCurrency(contrib.amount)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(contrib.date)}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Goal"
        message="Are you sure you want to delete this savings goal? All contribution history will be lost."
        confirmText="Delete"
      />
    </div>
  );
}
