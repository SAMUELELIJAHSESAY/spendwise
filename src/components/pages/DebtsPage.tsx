import { useEffect, useState } from 'react';
import { CreditCard, Plus, TrendingUp, TrendingDown, Calendar, Trash2, Pencil, DollarSign, Percent, User } from 'lucide-react';
import { storage, Debt } from '../../lib/storage';
import { formatCurrency, formatDate, generateId } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select, Textarea } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState, Badge, ProgressBar } from '../common/EmptyState';

export function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModal, setIsPaymentModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'owed' | 'owes'>('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'owed' as 'owed' | 'owes',
    person: '',
    totalAmount: '',
    dueDate: '',
    interestRate: '',
    notes: '',
  });

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const data = await storage.getAllDebts();
      setDebts(data);
    } catch (error) {
      console.error('Failed to load debts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingDebt(null);
    setFormData({
      name: '',
      type: 'owed',
      person: '',
      totalAmount: '',
      dueDate: '',
      interestRate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      type: debt.type,
      person: debt.person,
      totalAmount: debt.totalAmount.toString(),
      dueDate: debt.dueDate || '',
      interestRate: debt.interestRate?.toString() || '',
      notes: debt.notes || '',
    });
    setIsModalOpen(true);
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setPaymentNotes('');
    setIsPaymentModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0 || !formData.name || !formData.person) return;

    if (editingDebt) {
      const updated: Debt = {
        ...editingDebt,
        name: formData.name,
        type: formData.type,
        person: formData.person,
        totalAmount,
        dueDate: formData.dueDate || undefined,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        notes: formData.notes || undefined,
      };
      await storage.updateDebt(updated);
      setDebts(debts.map((d) => (d.id === updated.id ? updated : d)));
    } else {
      const newDebt: Debt = {
        id: generateId(),
        name: formData.name,
        type: formData.type,
        person: formData.person,
        totalAmount,
        paidAmount: 0,
        dueDate: formData.dueDate || undefined,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        notes: formData.notes || undefined,
        payments: [],
        createdAt: new Date(),
      };
      await storage.addDebt(newDebt);
      setDebts([...debts, newDebt]);
    }

    setIsModalOpen(false);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || !selectedDebt) return;

    const payment = {
      amount,
      date: new Date().toISOString().split('T')[0],
      notes: paymentNotes || undefined,
    };

    const updated: Debt = {
      ...selectedDebt,
      paidAmount: selectedDebt.paidAmount + amount,
      payments: [...selectedDebt.payments, payment],
    };

    await storage.updateDebt(updated);
    setDebts(debts.map((d) => (d.id === updated.id ? updated : d)));
    setIsPaymentModal(false);

    // Check if debt is fully paid
    if (updated.paidAmount >= updated.totalAmount) {
      await storage.addNotification({
        id: generateId(),
        type: 'goal_complete',
        title: 'Debt Paid Off!',
        message: `You've fully paid off "${updated.name}"${updated.type === 'owes' ? ' to ' : ' from '}${updated.person}!`,
        read: false,
        createdAt: new Date(),
      });
    }
  };

  const handleDelete = async (id: string) => {
    await storage.deleteDebt(id);
    setDebts(debts.filter((d) => d.id !== id));
    setDeleteConfirm(null);
  };

  const filteredDebts = debts.filter((d) => filter === 'all' || d.type === filter);

  const totalOwed = debts
    .filter((d) => d.type === 'owes')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const totalOwedToYou = debts
    .filter((d) => d.type === 'owed')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const netPosition = totalOwedToYou - totalOwed;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debts & Loans</h1>
          <p className="text-gray-500 dark:text-gray-400">Track what you owe and what's owed to you</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Debt/Loan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">You Owe</p>
              <p className="text-2xl font-bold">{formatCurrency(totalOwed)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Owed to You</p>
              <p className="text-2xl font-bold">{formatCurrency(totalOwedToYou)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </Card>
        <Card className={`bg-gradient-to-br ${netPosition >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-amber-600'} text-white border-0`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${netPosition >= 0 ? 'text-blue-100' : 'text-orange-100'} text-sm`}>Net Position</p>
              <p className="text-2xl font-bold">{netPosition >= 0 ? '+' : ''}{formatCurrency(netPosition)}</p>
            </div>
            <CreditCard className={`w-8 h-8 ${netPosition >= 0 ? 'text-blue-200' : 'text-orange-200'}`} />
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {(['all', 'owed', 'owes'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'owed' ? 'Owed to Me' : 'I Owe'}
            </button>
          ))}
        </div>
      </Card>

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No debts tracked"
            description={debts.length === 0 ? "Start tracking debts and loans" : "No debts match your filter"}
            action={
              debts.length === 0 && (
                <Button variant="primary" onClick={openAddModal}>
                  Add Your First Debt
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDebts.map((debt) => {
            const remaining = debt.totalAmount - debt.paidAmount;
            const percentage = Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100));
            const isFullyPaid = remaining <= 0;

            return (
              <Card key={debt.id} className={`group ${isFullyPaid ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        debt.type === 'owes'
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      }`}
                    >
                      {debt.type === 'owes' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{debt.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {debt.type === 'owes' ? 'Owe to' : 'From'} {debt.person}
                      </p>
                    </div>
                  </div>
                  {isFullyPaid && <Badge variant="success">Paid</Badge>}
                </div>

                <div className="mb-3">
                  <ProgressBar
                    value={debt.paidAmount}
                    max={debt.totalAmount}
                    color={debt.type === 'owes' ? 'red' : 'green'}
                  />
                </div>

                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatCurrency(debt.paidAmount)} paid ({percentage}%)
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(remaining)} left
                  </span>
                </div>

                {debt.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Calendar className="w-3 h-3" />
                    Due: {formatDate(debt.dueDate)}
                  </div>
                )}

                {debt.interestRate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Percent className="w-3 h-3" />
                    Interest: {debt.interestRate}%
                  </div>
                )}

                <div className="flex gap-2 mb-3">
                  {!isFullyPaid && (
                    <Button
                      size="sm"
                      variant="primary"
                      fullWidth
                      onClick={() => openPaymentModal(debt)}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Add Payment
                    </Button>
                  )}
                </div>

                {debt.payments.length > 0 && (
                  <details className="group/details">
                    <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                      {debt.payments.length} payment{debt.payments.length > 1 ? 's' : ''}
                    </summary>
                    <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {debt.payments.slice(-3).reverse().map((p, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{formatDate(p.date)}</span>
                          <span className="font-medium">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <div className="hidden group-hover:flex items-center justify-end gap-1 pt-2 border-t border-gray-200 dark:border-gray-700 mt-3">
                  <button
                    onClick={() => openEditModal(debt)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(debt.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
        title={editingDebt ? 'Edit Debt/Loan' : 'Add Debt/Loan'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description"
            placeholder="E.g., Personal loan, Lunch money"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
            options={[
              { value: 'owes', label: 'I owe money' },
              { value: 'owed', label: 'Money owed to me' },
            ]}
          />
          <Input
            label="Person Name"
            placeholder="Who?"
            value={formData.person}
            onChange={(e) => setFormData({ ...formData, person: e.target.value })}
            icon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Total Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            required
          />
          <Input
            label="Due Date (optional)"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <Input
            label="Interest Rate % (optional)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="0"
            value={formData.interestRate}
            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Additional details..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              {editingDebt ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModal}
        onClose={() => setIsPaymentModal(false)}
        title="Add Payment"
        size="sm"
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Recording payment for</p>
            <p className="font-semibold text-gray-900 dark:text-white">{selectedDebt?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remaining: {selectedDebt && formatCurrency(selectedDebt.totalAmount - selectedDebt.paidAmount)}
            </p>
          </div>
          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />
          <Input
            label="Notes (optional)"
            placeholder="E.g., Partial payment"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Debt/Loan"
        message="Are you sure you want to delete this? All payment history will be lost."
        confirmText="Delete"
      />
    </div>
  );
}
