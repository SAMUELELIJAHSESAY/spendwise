import { useEffect, useState } from 'react';
import { Plus, Utensils, Car, Home, GraduationCap, BookOpen, Gamepad2, ShoppingBag, Heart, Smartphone, Zap, Repeat, MoreHorizontal, Pencil, Trash2, Search, Calendar } from 'lucide-react';
import { storage, Expense } from '../../lib/storage';
import { EXPENSE_CATEGORIES, RECURRING_FREQUENCIES, formatCurrency, formatDate, generateId, getMonthYearString, MONTHS } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select, Checkbox } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState, Badge } from '../common/EmptyState';

const iconMap: Record<string, typeof Utensils> = {
  Utensils,
  Car,
  Home,
  GraduationCap,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  Heart,
  Smartphone,
  Zap,
  Repeat,
  MoreHorizontal,
};

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false,
    recurringFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchQuery, filterMonth, filterCategory]);

  const loadExpenses = async () => {
    try {
      const data = await storage.getAllExpenses();
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    if (filterMonth) {
      filtered = filtered.filter((item) => getMonthYearString(new Date(item.date)) === filterMonth);
    }

    if (filterCategory) {
      filtered = filtered.filter((item) => item.category === filterCategory);
    }

    setFilteredExpenses(filtered);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      amount: '',
      category: 'food',
      description: '',
      date: new Date().toISOString().split('T')[0],
      recurring: false,
      recurringFrequency: 'monthly',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Expense) => {
    setEditingExpense(item);
    setFormData({
      amount: item.amount.toString(),
      category: item.category,
      description: item.description,
      date: item.date,
      recurring: item.recurring,
      recurringFrequency: item.recurringFrequency || 'monthly',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (editingExpense) {
      const updated: Expense = {
        ...editingExpense,
        amount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        recurring: formData.recurring,
        recurringFrequency: formData.recurring ? formData.recurringFrequency : undefined,
      };
      await storage.updateExpense(updated);
      setExpenses(expenses.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      const newExpense: Expense = {
        id: generateId(),
        amount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        recurring: formData.recurring,
        recurringFrequency: formData.recurring ? formData.recurringFrequency : undefined,
        createdAt: new Date(),
      };
      await storage.addExpense(newExpense);
      setExpenses([newExpense, ...expenses]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteExpense(id);
    setExpenses(expenses.filter((e) => e.id !== id));
    setDeleteConfirm(null);
  };

  const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const recurringTotal = filteredExpenses
    .filter((e) => e.recurring)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = getMonthYearString(d);
    return {
      value: monthStr,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    };
  });

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your spending</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Expenses</p>
              <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
              <p className="text-red-100 text-sm mt-1">{filteredExpenses.length} entries</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Recurring Expenses</p>
              <p className="text-3xl font-bold">{formatCurrency(recurringTotal)}</p>
              <p className="text-orange-100 text-sm mt-1">
                {filteredExpenses.filter((e) => e.recurring).length} recurring
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Repeat className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            options={[{ value: '', label: 'All Months' }, ...monthOptions]}
          />
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
            ]}
          />
        </div>
      </Card>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title="No expenses found"
            description={expenses.length === 0 ? "You haven't added any expenses yet" : 'Try adjusting your filters'}
            action={
              expenses.length === 0 ? (
                <Button variant="primary" onClick={openAddModal}>
                  Add Your First Expense
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((item) => {
            const category = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
            const Icon = category ? iconMap[category.icon] || ShoppingBag : ShoppingBag;
            return (
              <Card key={item.id} hover className="group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.description || category?.label || 'Expense'}
                      </h3>
                      {item.recurring && (
                        <Badge variant="warning" size="sm">
                          {item.recurringFrequency}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.date)}
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      {category?.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      -{formatCurrency(item.amount)}
                    </p>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          />
          <Input
            label="Description"
            placeholder="E.g., Lunch at cafeteria"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Checkbox
            label="This is a recurring expense"
            checked={formData.recurring}
            onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
          />
          {formData.recurring && (
            <Select
              label="Frequency"
              value={formData.recurringFrequency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recurringFrequency: e.target.value as typeof formData.recurringFrequency,
                })
              }
              options={RECURRING_FREQUENCIES.map((f) => ({ value: f.id, label: f.label }))}
            />
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              {editingExpense ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
