export const INCOME_CATEGORIES = [
  { id: 'allowance', label: 'Allowance', icon: 'Wallet' },
  { id: 'job', label: 'Part-time Job', icon: 'Briefcase' },
  { id: 'gifts', label: 'Gifts', icon: 'Gift' },
  { id: 'scholarship', label: 'Scholarship', icon: 'GraduationCap' },
  { id: 'freelance', label: 'Freelance', icon: 'Laptop' },
  { id: 'other', label: 'Other', icon: 'MoreHorizontal' },
] as const;

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: 'Utensils' },
  { id: 'transport', label: 'Transport', icon: 'Car' },
  { id: 'rent', label: 'Rent & Housing', icon: 'Home' },
  { id: 'school_fees', label: 'School Fees', icon: 'GraduationCap' },
  { id: 'books', label: 'Books & Supplies', icon: 'BookOpen' },
  { id: 'entertainment', label: 'Entertainment', icon: 'Gamepad2' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { id: 'health', label: 'Health', icon: 'Heart' },
  { id: 'phone', label: 'Phone & Data', icon: 'Smartphone' },
  { id: 'utilities', label: 'Utilities', icon: 'Zap' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'Repeat' },
  { id: 'other', label: 'Other', icon: 'MoreHorizontal' },
] as const;

export const RECURRING_FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
] as const;

export const SAVINGS_ICONS = [
  { id: 'laptop', label: 'Laptop', icon: 'Laptop' },
  { id: 'phone', label: 'Phone', icon: 'Smartphone' },
  { id: 'car', label: 'Car', icon: 'Car' },
  { id: 'home', label: 'Home', icon: 'Home' },
  { id: 'education', label: 'Education', icon: 'GraduationCap' },
  { id: 'travel', label: 'Travel', icon: 'Plane' },
  { id: 'gift', label: 'Gift', icon: 'Gift' },
  { id: 'emergency', label: 'Emergency Fund', icon: 'Shield' },
  { id: 'other', label: 'Other', icon: 'PiggyBank' },
] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getMonthYearString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getCategoryLabel(
  categories: readonly { id: string; label: string }[],
  categoryId: string
): string {
  const category = categories.find((c) => c.id === categoryId);
  return category?.label || categoryId;
}
