import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { storage, Income, Expense, Bill } from '../../lib/storage';
import { formatCurrency, formatDate, generateId, getMonthYearString, MONTHS } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../lib/types';

interface DayData {
  date: Date;
  income: number;
  expenses: number;
  bills: Bill[];
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<DayData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');
  const [addData, setAddData] = useState({ amount: '', category: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incomeData, expenseData, billData] = await Promise.all([
        storage.getAllIncome(),
        storage.getAllExpenses(),
        storage.getAllBills(),
      ]);
      setIncome(incomeData);
      setExpenses(expenseData);
      setBills(billData);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayData = (day: number): DayData => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];

    const dayIncome = income.filter((i) => i.date === dateStr).reduce((s, i) => s + i.amount, 0);
    const dayExpenses = expenses.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
    const dayBills = bills.filter((b) => b.dueDate === dateStr);

    return { date, income: dayIncome, expenses: dayExpenses, bills: dayBills };
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(getDayData(day));
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addData.amount);
    if (isNaN(amount) || amount <= 0 || !selectedDate) return;

    const dateStr = selectedDate.date.toISOString().split('T')[0];

    if (addType === 'income') {
      await storage.addIncome({
        id: generateId(),
        amount,
        category: addData.category || 'other',
        description: addData.description,
        date: dateStr,
        recurring: false,
        tags: [],
        createdAt: new Date(),
      });
    } else {
      await storage.addExpense({
        id: generateId(),
        amount,
        category: addData.category || 'other',
        description: addData.description,
        date: dateStr,
        recurring: false,
        tags: [],
        isPaid: true,
        createdAt: new Date(),
      });
    }

    setAddData({ amount: '', category: '', description: '' });
    setIsAddModalOpen(false);
    loadData();
  };

  const totalMonthIncome = income
    .filter((i) => getMonthYearString(new Date(i.date)) === getMonthYearString(currentDate))
    .reduce((s, i) => s + i.amount, 0);
  const totalMonthExpenses = expenses
    .filter((e) => getMonthYearString(new Date(e.date)) === getMonthYearString(currentDate))
    .reduce((s, e) => s + e.amount, 0);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400">View and plan your finances</p>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <p className="text-green-100 text-sm">Income</p>
          <p className="text-2xl font-bold">{formatCurrency(totalMonthIncome)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
          <p className="text-red-100 text-sm">Expenses</p>
          <p className="text-2xl font-bold">{formatCurrency(totalMonthExpenses)}</p>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for first week */}
          {Array.from({ length: startPadding }, (_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayData = getDayData(day);
            const today = new Date();
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasActivity = dayData.income > 0 || dayData.expenses > 0 || dayData.bills.length > 0;
            const isSelected = selectedDate && day === selectedDate.date.getDate();

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                  transition-colors relative
                  ${isToday ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${isSelected ? 'ring-2 ring-emerald-500' : ''}
                `}
              >
                <span className="font-medium">{day}</span>
                {hasActivity && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayData.income > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    {dayData.expenses > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                    {dayData.bills.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              {formatDate(selectedDate.date.toISOString().split('T')[0])}
            </h3>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {/* Income */}
            {income
              .filter((i) => i.date === selectedDate.date.toISOString().split('T')[0])
              .map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.description || 'Income'}</p>
                    <Badge size="sm">{INCOME_CATEGORIES.find((c) => c.id === item.category)?.label}</Badge>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">+{formatCurrency(item.amount)}</p>
                </div>
              ))}

            {/* Expenses */}
            {expenses
              .filter((e) => e.date === selectedDate.date.toISOString().split('T')[0])
              .map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.description || 'Expense'}</p>
                    <Badge size="sm">{EXPENSE_CATEGORIES.find((c) => c.id === item.category)?.label}</Badge>
                  </div>
                  <p className="font-semibold text-red-600 dark:text-red-400">-{formatCurrency(item.amount)}</p>
                </div>
              ))}

            {/* Bills */}
            {selectedDate.bills.map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{bill.name}</p>
                  <Badge size="sm" variant="warning">Bill Due</Badge>
                </div>
                <p className="font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(bill.amount)}</p>
              </div>
            ))}

            {/* No Activity */}
            {selectedDate.income === 0 && selectedDate.expenses === 0 && selectedDate.bills.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No activity on this day
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Transaction for ${selectedDate ? formatDate(selectedDate.date.toISOString().split('T')[0]) : ''}`}
        size="md"
      >
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAddType('income')}
            className={`flex-1 py-2 rounded-lg font-medium ${
              addType === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setAddType('expense')}
            className={`flex-1 py-2 rounded-lg font-medium ${
              addType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
            }`}
          >
            Expense
          </button>
        </div>
        <form onSubmit={handleQuickAdd} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={addData.amount}
            onChange={(e) => setAddData({ ...addData, amount: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={addData.category}
            onChange={(e) => setAddData({ ...addData, category: e.target.value })}
            options={
              addType === 'income'
                ? INCOME_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))
                : EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))
            }
          />
          <Input
            label="Description"
            placeholder="What's this for?"
            value={addData.description}
            onChange={(e) => setAddData({ ...addData, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
