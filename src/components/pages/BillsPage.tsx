import { useEffect, useState } from 'react';
import { Bell, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, Trash2, Pencil, Repeat, DollarSign } from 'lucide-react';
import { storage, Bill } from '../../lib/storage';
import { EXPENSE_CATEGORIES, formatCurrency, formatDate, generateId } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select, Checkbox } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState, Badge } from '../common/EmptyState';

const BILL_FREQUENCIES = [
  { value: '', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'paid' | 'overdue'>('all');

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'utilities',
    isRecurring: false,
    recurringFrequency: 'monthly',
    reminderDays: '3',
  });

  useEffect(() => {
    loadBills();
    checkBillReminders();
  }, []);

  const loadBills = async () => {
    try {
      const data = await storage.getAllBills();
      setBills(data.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    } catch (error) {
      console.error('Failed to load bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBillReminders = async () => {
    const upcoming = await storage.getUpcomingBills(7);
    for (const bill of upcoming) {
      const existingNotifs = await storage.getAllNotifications();
      const alreadyNotified = existingNotifs.some(
        (n) => n.type === 'bill_reminder' && n.title.includes(bill.name)
      );
      if (!alreadyNotified) {
        const daysUntil = Math.ceil(
          (new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        await storage.addNotification({
          id: generateId(),
          type: 'bill_reminder',
          title: `Bill Reminder: ${bill.name}`,
          message: `Due in ${daysUntil} days - ${formatCurrency(bill.amount)}`,
          read: false,
          createdAt: new Date(),
        });
      }
    }
  };

  const openAddModal = () => {
    setEditingBill(null);
    setFormData({
      name: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'utilities',
      isRecurring: false,
      recurringFrequency: 'monthly',
      reminderDays: '3',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate,
      category: bill.category,
      isRecurring: bill.isRecurring,
      recurringFrequency: bill.recurringFrequency || 'monthly',
      reminderDays: bill.reminderDays.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || !formData.name) return;

    if (editingBill) {
      const updated: Bill = {
        ...editingBill,
        name: formData.name,
        amount,
        dueDate: formData.dueDate,
        category: formData.category,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency as Bill['recurringFrequency'] : undefined,
        reminderDays: parseInt(formData.reminderDays) || 3,
      };
      await storage.updateBill(updated);
      setBills(bills.map((b) => (b.id === updated.id ? updated : b)));
    } else {
      const newBill: Bill = {
        id: generateId(),
        name: formData.name,
        amount,
        dueDate: formData.dueDate,
        category: formData.category,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency as Bill['recurringFrequency'] : undefined,
        isPaid: false,
        reminderDays: parseInt(formData.reminderDays) || 3,
        createdAt: new Date(),
      };
      await storage.addBill(newBill);
      setBills([...bills, newBill]);
    }

    setIsModalOpen(false);
  };

  const handleMarkPaid = async (bill: Bill) => {
    let newDueDate = bill.dueDate;

    if (bill.isRecurring && bill.recurringFrequency) {
      const current = new Date(bill.dueDate);
      switch (bill.recurringFrequency) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
      newDueDate = current.toISOString().split('T')[0];

      const updated: Bill = {
        ...bill,
        dueDate: newDueDate,
        isPaid: false,
      };
      await storage.updateBill(updated);
      setBills(bills.map((b) => (b.id === updated.id ? updated : b)));
    } else {
      const updated: Bill = { ...bill, isPaid: true };
      await storage.updateBill(updated);
      setBills(bills.map((b) => (b.id === updated.id ? updated : b)));
    }
  };

  const handleDelete = async (id: string) => {
    await storage.deleteBill(id);
    setBills(bills.filter((b) => b.id !== id));
    setDeleteConfirm(null);
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const filteredBills = bills.filter((bill) => {
    if (bill.isPaid) return filter === 'paid' || filter === 'all';
    const isOverdue = bill.dueDate < today;
    if (isOverdue) return filter === 'overdue' || filter === 'all';
    const daysUntil = Math.ceil((new Date(bill.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) return filter === 'upcoming' || filter === 'all';
    return filter === 'all';
  });

  const totalUpcoming = bills
    .filter((b) => !b.isPaid && b.dueDate >= today)
    .reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = bills
    .filter((b) => !b.isPaid && b.dueDate < today)
    .reduce((sum, b) => sum + b.amount, 0);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bill Reminders</h1>
          <p className="text-gray-500 dark:text-gray-400">Never miss a payment deadline</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Upcoming Bills</p>
              <p className="text-2xl font-bold">{formatCurrency(totalUpcoming)}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </Card>
        <Card className={totalOverdue > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-0' : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0'}>
          <div className="flex items-center justify-between">
            <div>
              <p className={totalOverdue > 0 ? 'text-red-100 text-sm' : 'text-green-100 text-sm'}>
                {totalOverdue > 0 ? 'Overdue' : 'No Overdue'}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(totalOverdue)}</p>
            </div>
            {totalOverdue > 0 ? <AlertTriangle className="w-8 h-8 text-red-200" /> : <CheckCircle2 className="w-8 h-8 text-green-200" />}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Bills</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{bills.length}</p>
            </div>
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {(['all', 'upcoming', 'overdue', 'paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell className="w-6 h-6" />}
            title="No bills found"
            description={bills.length === 0 ? "Add your first bill to get reminders" : "No bills match your filter"}
            action={
              bills.length === 0 && (
                <Button variant="primary" onClick={openAddModal}>
                  Add Your First Bill
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => {
            const isOverdue = !bill.isPaid && bill.dueDate < today;
            const isUpcoming = !bill.isPaid && !isOverdue;
            const daysUntil = Math.ceil((new Date(bill.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const category = EXPENSE_CATEGORIES.find((c) => c.id === bill.category);

            return (
              <Card
                key={bill.id}
                className={`group ${isOverdue ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      bill.isPaid
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : isOverdue
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    {bill.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 dark:text-white">{bill.name}</h3>
                      {bill.isRecurring && (
                        <Badge variant="info" size="sm">
                          <Repeat className="w-3 h-3 mr-1" />
                          {bill.recurringFrequency}
                        </Badge>
                      )}
                      {bill.isPaid && <Badge variant="success" size="sm">Paid</Badge>}
                      {isOverdue && <Badge variant="danger" size="sm">Overdue</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      <Calendar className="w-3 h-3" />
                      {formatDate(bill.dueDate)}
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      {category?.label}
                      {isUpcoming && daysUntil <= 7 && (
                        <span className={`text-xs font-medium ${daysUntil <= 1 ? 'text-red-500' : 'text-orange-500'}`}>
                          {daysUntil === 0 ? 'Due today!' : `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(bill.amount)}
                    </p>
                    {!bill.isPaid && (
                      <Button size="sm" variant="primary" onClick={() => handleMarkPaid(bill)}>
                        <DollarSign className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(bill)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(bill.id)}
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
        title={editingBill ? 'Edit Bill' : 'Add Bill'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bill Name"
            placeholder="E.g., Netflix Subscription, Phone Bill"
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
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          />
          <Checkbox
            label="This is a recurring bill"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
          />
          {formData.isRecurring && (
            <Select
              label="Frequency"
              value={formData.recurringFrequency}
              onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
              options={BILL_FREQUENCIES.filter((f) => f.value).map((f) => ({ value: f.value, label: f.label }))}
            />
          )}
          <Input
            label="Remind me (days before)"
            type="number"
            min="0"
            max="30"
            value={formData.reminderDays}
            onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              {editingBill ? 'Update' : 'Add'} Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Bill"
        message="Are you sure you want to delete this bill reminder?"
        confirmText="Delete"
      />
    </div>
  );
}
