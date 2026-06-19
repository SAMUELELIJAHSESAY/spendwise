import { useEffect, useState } from 'react';
import { Plus, Wallet, Briefcase, Gift, GraduationCap, Laptop, MoreHorizontal, Pencil, Trash2, Search, Calendar } from 'lucide-react';
import { storage, Income } from '../../lib/storage';
import { INCOME_CATEGORIES, formatCurrency, formatDate, generateId, getMonthYearString, MONTHS } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

const iconMap: Record<string, typeof Wallet> = {
  Wallet,
  Briefcase,
  Gift,
  GraduationCap,
  Laptop,
  MoreHorizontal,
};

export function IncomePage() {
  const [income, setIncome] = useState<Income[]>([]);
  const [filteredIncome, setFilteredIncome] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'allowance',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadIncome();
  }, []);

  useEffect(() => {
    filterIncome();
  }, [income, searchQuery, filterMonth, filterCategory]);

  const loadIncome = async () => {
    try {
      const data = await storage.getAllIncome();
      setIncome(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to load income:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterIncome = () => {
    let filtered = [...income];

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

    setFilteredIncome(filtered);
  };

  const openAddModal = () => {
    setEditingIncome(null);
    setFormData({
      amount: '',
      category: 'allowance',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Income) => {
    setEditingIncome(item);
    setFormData({
      amount: item.amount.toString(),
      category: item.category,
      description: item.description,
      date: item.date,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (editingIncome) {
      const updated: Income = {
        ...editingIncome,
        amount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
      };
      await storage.updateIncome(updated);
      setIncome(income.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const newIncome: Income = {
        id: generateId(),
        amount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        recurring: false,
        tags: [],
        createdAt: new Date(),
      };
      await storage.addIncome(newIncome);
      setIncome([newIncome, ...income]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteIncome(id);
    setIncome(income.filter((i) => i.id !== id));
    setDeleteConfirm(null);
  };

  const totalAmount = filteredIncome.reduce((sum, item) => sum + item.amount, 0);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Income</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your income sources</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Income
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">Total Income</p>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
            <p className="text-emerald-100 text-sm mt-1">{filteredIncome.length} entries</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search income..."
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
              ...INCOME_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
            ]}
          />
        </div>
      </Card>

      {/* Income List */}
      {filteredIncome.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="w-6 h-6" />}
            title="No income found"
            description={income.length === 0 ? "You haven't added any income yet" : 'Try adjusting your filters'}
            action={
              income.length === 0 ? (
                <Button variant="primary" onClick={openAddModal}>
                  Add Your First Income
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIncome.map((item) => {
            const category = INCOME_CATEGORIES.find((c) => c.id === item.category);
            const Icon = category ? iconMap[category.icon] || Wallet : Wallet;
            return (
              <Card key={item.id} hover className="group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.description || category?.label || 'Income'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.date)}
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      {category?.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(item.amount)}
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
        title={editingIncome ? 'Edit Income' : 'Add Income'}
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
            options={INCOME_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          />
          <Input
            label="Description"
            placeholder="E.g., Monthly allowance"
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
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              {editingIncome ? 'Update' : 'Add'} Income
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Income"
        message="Are you sure you want to delete this income entry? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
