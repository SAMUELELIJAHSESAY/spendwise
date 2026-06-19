import { useEffect, useState } from 'react';
import { Zap, Plus, Trash2, TrendingUp, TrendingDown, History } from 'lucide-react';
import { storage, Template } from '../../lib/storage';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatCurrency, generateId } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await storage.getAllTemplates();
      setTemplates(data.sort((a, b) => b.frequency - a.frequency));
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      type: 'expense',
      amount: '',
      category: formData.type === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || !formData.name || !formData.category) return;

    const newTemplate: Template = {
      id: generateId(),
      name: formData.name,
      type: formData.type,
      amount,
      category: formData.category,
      description: formData.description || undefined,
      frequency: 0,
      createdAt: new Date(),
    };

    await storage.addTemplate(newTemplate);
    setTemplates([...templates, newTemplate]);
    setIsModalOpen(false);
  };

  const handleUseTemplate = async (template: Template) => {
    if (template.type === 'income') {
      await storage.addIncome({
        id: generateId(),
        amount: template.amount,
        category: template.category,
        description: template.description || template.name,
        date: new Date().toISOString().split('T')[0],
        recurring: false,
        tags: [],
        notes: `Created from template: ${template.name}`,
        createdAt: new Date(),
      });
    } else {
      await storage.addExpense({
        id: generateId(),
        amount: template.amount,
        category: template.category,
        description: template.description || template.name,
        date: new Date().toISOString().split('T')[0],
        recurring: false,
        tags: [],
        notes: `Created from template: ${template.name}`,
        isPaid: true,
        createdAt: new Date(),
      });
    }

    // Update frequency
    const updated = { ...template, frequency: template.frequency + 1 };
    await storage.updateTemplate(updated);
    setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDelete = async (id: string) => {
    await storage.deleteTemplate(id);
    setTemplates(templates.filter((t) => t.id !== id));
    setDeleteConfirm(null);
  };

  const incomeTemplates = templates.filter((t) => t.type === 'income');
  const expenseTemplates = templates.filter((t) => t.type === 'expense');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h1>
          <p className="text-gray-500 dark:text-gray-400">Pre-defined templates for fast entry</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Zap className="w-6 h-6" />}
            title="No quick actions yet"
            description="Create templates for transactions you make frequently"
            action={
              <Button variant="primary" onClick={openAddModal}>
                Create Your First Template
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Expense Templates */}
          {expenseTemplates.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Expense Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {expenseTemplates.map((template) => {
                  const category = EXPENSE_CATEGORIES.find((c) => c.id === template.category);
                  return (
                    <Card
                      key={template.id}
                      hover
                      className="group cursor-pointer"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{template.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{category?.label}</p>
                        </div>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          -{formatCurrency(template.amount)}
                        </p>
                      </div>
                      {template.frequency > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:textgray-500">
                          <History className="w-3 h-3" />
                          Used {template.frequency}x
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(template.id);
                        }}
                        className="hidden group-hover:block absolute top-2 right-2 p-1 rounded bg-red-50 dark:bg-red-900/20 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Income Templates */}
          {incomeTemplates.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Income Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {incomeTemplates.map((template) => {
                  const category = INCOME_CATEGORIES.find((c) => c.id === template.category);
                  return (
                    <Card
                      key={template.id}
                      hover
                      className="group cursor-pointer"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{template.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{category?.label}</p>
                        </div>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          +{formatCurrency(template.amount)}
                        </p>
                      </div>
                      {template.frequency > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <History className="w-3 h-3" />
                          Used {template.frequency}x
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(template.id);
                        }}
                        className="hidden group-hover:block absolute top-2 right-2 p-1 rounded bg-red-50 dark:bg-red-900/20 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Quick Action" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value as 'income' | 'expense';
              setFormData({
                ...formData,
                type: newType,
                category: newType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id,
              });
            }}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
          />
          <Input
            label="Name"
            placeholder="E.g., Morning Coffee, Daily Lunch"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
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
            options={
              formData.type === 'income'
                ? INCOME_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))
                : EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))
            }
          />
          <Input
            label="Description (optional)"
            placeholder="Additional details"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Template"
        message="Are you sure you want to delete this quick action?"
        confirmText="Delete"
      />
    </div>
  );
}
