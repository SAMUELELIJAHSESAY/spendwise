import { useEffect, useState } from 'react';
import { CreditCard, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, Trash2, Pencil, Play, Pause, ExternalLink, TrendingUp, DollarSign } from 'lucide-react';
import { storage, Subscription, CURRENCIES } from '../../lib/storage';
import { formatCurrency, formatDate, generateId } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select, Checkbox } from '../common/Input';
import { Modal, ConfirmDialog } from '../common/Modal';
import { EmptyState, Badge } from '../common/EmptyState';

const BILLING_CYCLES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming', label: 'Streaming', icon: '🎬' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'software', label: 'Software', icon: '💻' },
  { id: 'cloud', label: 'Cloud Storage', icon: '☁️' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'news', label: 'News & Magazines', icon: '📰' },
  { id: 'vpn', label: 'VPN', icon: '🔒' },
  { id: 'other', label: 'Other', icon: '📦' },
];

const POPULAR_SERVICES: Record<string, { name: string; color: string; icon: string }> = {
  netflix: { name: 'Netflix', color: '#E50914', icon: '🎬' },
  spotify: { name: 'Spotify', color: '#1DB954', icon: '🎵' },
  youtube: { name: 'YouTube Premium', color: '#FF0000', icon: '▶️' },
  disney: { name: 'Disney+', color: '#113CCF', icon: '✨' },
  hbo: { name: 'HBO Max', color: '#5822B4', icon: '🎭' },
  apple_music: { name: 'Apple Music', color: '#FA243C', icon: '🎶' },
  icloud: { name: 'iCloud', color: '#007AFF', icon: '☁️' },
  google_one: { name: 'Google One', color: '#4285F4', icon: '🔷' },
  dropbox: { name: 'Dropbox', color: '#0061FF', icon: '📦' },
  notion: { name: 'Notion', color: '#000000', icon: '📝' },
  figma: { name: 'Figma', color: '#F24E1E', icon: '🎨' },
  canva: { name: 'Canva', color: '#00C4CC', icon: '🖼️' },
  adobe: { name: 'Adobe CC', color: '#FF0000', icon: '🔴' },
  microsoft: { name: 'Microsoft 365', color: '#D83B01', icon: '📑' },
  playstation: { name: 'PlayStation Plus', color: '#00D4BB', icon: '🎮' },
  xbox: { name: 'Xbox Game Pass', color: '#107C10', icon: '🟢' },
  audible: { name: 'Audible', color: '#F7991B', icon: '🎧' },
  kindle: { name: 'Kindle Unlimited', color: '#FF9900', icon: '📖' },
  coursera: { name: 'Coursera', color: '#0056D2', icon: '🎓' },
  masterclass: { name: 'Masterclass', color: '#E3003B', icon: '🎤' },
};

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES.find(c => c.default)?.code || 'SLE');

  const [formData, setFormData] = useState({
    name: '',
    service: '',
    amount: '',
    currency: 'SLE',
    billingCycle: 'monthly' as Subscription['billingCycle'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    category: 'streaming',
    isActive: true,
    notes: '',
    reminderDays: '3',
    customServiceName: '',
  });

  const [showCustomService, setShowCustomService] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await storage.getAllSubscriptions();
      setSubscriptions(data.sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()));
      const activeSubs = data.filter(s => s.isActive);
      if (activeSubs.length > 0) {
        setSelectedCurrency(activeSubs[0].currency);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNextBillingDate = (startDate: string, billingCycle: Subscription['billingCycle']): string => {
    const start = new Date(startDate);
    const now = new Date();
    let next = new Date(start);

    while (next <= now) {
      switch (billingCycle) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + 1);
          break;
      }
    }
    return next.toISOString().split('T')[0];
  };

  const openAddModal = () => {
    setEditingSubscription(null);
    setFormData({
      name: '',
      service: '',
      amount: '',
      currency: selectedCurrency,
      billingCycle: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      category: 'streaming',
      isActive: true,
      notes: '',
      reminderDays: '3',
      customServiceName: '',
    });
    setShowCustomService(false);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSubscription(sub);
    const isCustomService = !POPULAR_SERVICES[sub.service];
    setFormData({
      name: sub.name,
      service: sub.service,
      amount: sub.amount.toString(),
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      startDate: sub.startDate,
      endDate: sub.endDate || '',
      category: sub.category,
      isActive: sub.isActive,
      notes: sub.notes || '',
      reminderDays: sub.reminderDays.toString(),
      customServiceName: isCustomService ? sub.name : '',
    });
    setShowCustomService(isCustomService);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || (!formData.service && !formData.customServiceName)) return;

    const serviceName = showCustomService ? 'custom' : formData.service;
    const name = showCustomService ? formData.customServiceName : (POPULAR_SERVICES[formData.service]?.name || formData.name);
    const nextBilling = calculateNextBillingDate(formData.startDate, formData.billingCycle);
    const serviceInfo = POPULAR_SERVICES[serviceName];

    if (editingSubscription) {
      const updated: Subscription = {
        ...editingSubscription,
        name,
        service: serviceName,
        amount,
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        nextBillingDate: nextBilling,
        endDate: formData.endDate || undefined,
        category: formData.category,
        isActive: formData.isActive,
        notes: formData.notes || undefined,
        reminderDays: parseInt(formData.reminderDays) || 3,
        color: serviceInfo?.color,
      };
      await storage.updateSubscription(updated);
      setSubscriptions(subscriptions.map((s) => (s.id === updated.id ? updated : s)));
    } else {
      const newSubscription: Subscription = {
        id: generateId(),
        name,
        service: serviceName,
        amount,
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        nextBillingDate: nextBilling,
        endDate: formData.endDate || undefined,
        category: formData.category,
        isActive: formData.isActive,
        notes: formData.notes || undefined,
        reminderDays: parseInt(formData.reminderDays) || 3,
        color: serviceInfo?.color,
        createdAt: new Date(),
      };
      await storage.addSubscription(newSubscription);
      setSubscriptions([...subscriptions, newSubscription]);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = async (sub: Subscription) => {
    const updated: Subscription = {
      ...sub,
      isActive: !sub.isActive,
    };
    await storage.updateSubscription(updated);
    setSubscriptions(subscriptions.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDelete = async (id: string) => {
    await storage.deleteSubscription(id);
    setSubscriptions(subscriptions.filter((s) => s.id !== id));
    setDeleteConfirm(null);
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (sub.endDate && sub.endDate < today) return filter === 'expired' || filter === 'all';
    if (!sub.isActive) return filter === 'paused' || filter === 'all';
    return filter === 'active' || filter === 'all';
  });

  const activeSubscriptions = subscriptions.filter(s => s.isActive && (!s.endDate || s.endDate >= today));
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
    const currency = CURRENCIES.find(c => c.code === sub.currency);
    const symbol = currency?.symbol || 'NLe';
    let monthlyAmount = sub.amount;
    switch (sub.billingCycle) {
      case 'daily': monthlyAmount *= 30; break;
      case 'weekly': monthlyAmount *= 4; break;
      case 'yearly': monthlyAmount /= 12; break;
    }
    return sum + monthlyAmount;
  }, 0);

  const yearlyTotal = activeSubscriptions.reduce((sum, sub) => {
    let yearlyAmount = sub.amount;
    switch (sub.billingCycle) {
      case 'daily': yearlyAmount *= 365; break;
      case 'weekly': yearlyAmount *= 52; break;
      case 'monthly': yearlyAmount *= 12; break;
    }
    return sum + yearlyAmount;
  }, 0);

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || 'NLe';
  };

  const formatSubCurrency = (amount: number, code: string) => {
    const symbol = getCurrencySymbol(code);
    return `${symbol}${amount.toLocaleString()}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage your recurring subscriptions</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Subscription
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Monthly Cost</p>
              <p className="text-2xl font-bold">{formatSubCurrency(monthlyTotal, selectedCurrency)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-emerald-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Yearly Cost</p>
              <p className="text-2xl font-bold">{formatSubCurrency(yearlyTotal, selectedCurrency)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeSubscriptions.length}</p>
            </div>
            <Play className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subscriptions.filter(s => !s.isActive).length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'paused', 'expired'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No subscriptions found"
            description={subscriptions.length === 0 ? "Add your first subscription to start tracking" : "No subscriptions match your filter"}
            action={
              subscriptions.length === 0 && (
                <Button variant="primary" onClick={openAddModal}>
                  Add Your First Subscription
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubscriptions.map((sub) => {
            const isExpired = sub.endDate && sub.endDate < today;
            const daysUntilBilling = Math.ceil((new Date(sub.nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const category = SUBSCRIPTION_CATEGORIES.find((c) => c.id === sub.category);
            const serviceInfo = POPULAR_SERVICES[sub.service];

            return (
              <Card
                key={sub.id}
                className={`group relative overflow-hidden ${!sub.isActive ? 'opacity-60' : ''} ${isExpired ? 'border-red-300 dark:border-red-800' : ''}`}
              >
                {/* Color accent */}
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: sub.color || '#10B981' }}
                />

                <div className="pl-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${sub.color || '#10B981'}20` }}
                      >
                        {serviceInfo?.icon || category?.icon || '📦'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{sub.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{category?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(sub)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          sub.isActive
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {sub.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(sub.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatSubCurrency(sub.amount, sub.currency)}
                      </span>
                      <Badge variant={sub.isActive ? 'success' : 'default'} size="sm">
                        {sub.billingCycle}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {isExpired ? (
                        <span className="text-red-500">Expired on {formatDate(sub.endDate!)}</span>
                      ) : daysUntilBilling <= 0 ? (
                        <span className="text-orange-500">Due today</span>
                      ) : daysUntilBilling <= 3 ? (
                        <span className="text-orange-500">{formatDate(sub.nextBillingDate)} ({daysUntilBilling} days)</span>
                      ) : (
                        <span>{formatDate(sub.nextBillingDate)}</span>
                      )}
                    </div>

                    {sub.endDate && !isExpired && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="w-3 h-3" />
                        Ends {formatDate(sub.endDate)}
                      </div>
                    )}

                    {sub.notes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{sub.notes}</p>
                    )}
                  </div>

                  {!sub.isActive && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Badge variant="default" size="sm">Paused</Badge>
                    </div>
                  )}
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
        title={editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          {!showCustomService ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Service
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {Object.entries(POPULAR_SERVICES).map(([key, service]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, service: key })}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      formData.service === key
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-xl">{service.icon}</span>
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate">{service.name}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowCustomService(true)}
                className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                + Add custom service
              </button>
            </div>
          ) : (
            <div>
              <Input
                label="Service Name"
                placeholder="Enter service name"
                value={formData.customServiceName}
                onChange={(e) => setFormData({ ...formData, customServiceName: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowCustomService(false)}
                className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                Or select from popular services
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Billing Cycle"
              value={formData.billingCycle}
              onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as Subscription['billingCycle'] })}
              options={BILLING_CYCLES}
            />
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={SUBSCRIPTION_CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="Add any notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <Input
            label="Remind me (days before billing)"
            type="number"
            min="0"
            max="30"
            value={formData.reminderDays}
            onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
          />

          <Checkbox
            label="Active subscription"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              {editingSubscription ? 'Update' : 'Add'} Subscription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription?"
        confirmText="Delete"
      />
    </div>
  );
}
