import { useEffect, useState } from 'react';
import { Target, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { storage, Budget, Expense } from '../../lib/storage';
import { EXPENSE_CATEGORIES, formatCurrency, generateId, getMonthYearString, MONTHS } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState, ProgressBar, Badge } from '../common/EmptyState';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthYearString(new Date()));

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadBudgetsForMonth();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const allExpenses = await storage.getAllExpenses();
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBudgetsForMonth = async () => {
    try {
      const monthBudgets = await storage.getBudgetsByMonth(selectedMonth);
      setBudgets(monthBudgets);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  };

  const currentMonthExpenses = expenses.filter(
    (e) => getMonthYearString(new Date(e.date)) === selectedMonth
  );

  const getSpentForCategory = (category: string): number => {
    return currentMonthExpenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const openAddModal = () => {
    const usedCategories = budgets.map((b) => b.category);
    const availableCategories = EXPENSE_CATEGORIES.filter(
      (c) => !usedCategories.includes(c.id)
    );
    setEditingBudget(null);
    setFormData({
      category: availableCategories[0]?.id || '',
      amount: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || !formData.category) return;

    if (editingBudget) {
      const updated: Budget = {
        ...editingBudget,
        amount,
      };
      await storage.updateBudget(updated);
      setBudgets(budgets.map((b) => (b.id === updated.id ? updated : b)));
    } else {
      const newBudget: Budget = {
        id: generateId(),
        category: formData.category,
        amount,
        month: selectedMonth,
        createdAt: new Date(),
      };
      await storage.addBudget(newBudget);
      setBudgets([...budgets, newBudget]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteBudget(id);
    setBudgets(budgets.filter((b) => b.id !== id));
    setDeleteConfirm(null);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getSpentForCategory(b.category), 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = getMonthYearString(d);
    return {
      value: monthStr,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    };
  });

  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !budgets.map((b) => b.category).includes(c.id)
  );

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-gray-500 dark:text-gray-400">Set spending limits per category</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            options={monthOptions}
          />
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
            disabled={availableCategories.length === 0}
          >
            Add Budget
          </Button>
        </div>
      </div>

      {/* Overall Summary */}
      <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm">Overall Budget</p>
            <p className="text-3xl font-bold">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage >= 100
                ? 'bg-red-400'
                : overallPercentage >= 80
                ? 'bg-yellow-400'
                : 'bg-white'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-blue-100">
          <span>{overallPercentage}% used</span>
          <span>{formatCurrency(totalBudget - totalSpent)} remaining</span>
        </div>
      </Card>

      {/* Budget Categories */}
      {budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target className="w-6 h-6" />}
            title="No budgets set"
            description="Set budgets for expense categories to track your spending"
            action={
              <Button variant="primary" onClick={openAddModal}>
                Create Your First Budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const category = EXPENSE_CATEGORIES.find((c) => c.id === budget.category);
            const spent = getSpentForCategory(budget.category);
            const percentage = Math.round((spent / budget.amount) * 100);
            const isOver = spent > budget.amount;
            const isNearLimit = percentage >= 80 && !isOver;

            return (
              <Card key={budget.id} className="group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {category?.label || budget.category}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(spent)} of {formatCurrency(budget.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver ? (
                      <Badge variant="danger">Over budget</Badge>
                    ) : isNearLimit ? (
                      <Badge variant="warning">Near limit</Badge>
                    ) : (
                      <Badge variant="success">On track</Badge>
                    )}
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(budget)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(budget.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <ProgressBar
                  value={spent}
                  max={budget.amount}
                  color={isOver ? 'red' : isNearLimit ? 'yellow' : 'emerald'}
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatCurrency(budget.amount - spent)} remaining
                  </span>
                  <span className={`font-medium ${isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {percentage}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Warnings */}
      {budgets.some((b) => getSpentForCategory(b.category) > b.amount) && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-100">Overspending Alert</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                You've exceeded your budget in some categories. Consider adjusting your spending or budgets.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget' : 'Add Budget'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={
              editingBudget
                ? EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))
                : availableCategories.map((c) => ({ value: c.id, label: c.label }))
            }
            disabled={!!editingBudget}
            required
          />
          <Input
            label="Budget Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              {editingBudget ? 'Update' : 'Add'} Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
