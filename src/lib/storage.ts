import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'StudentFinanceDB';
const DB_VERSION = 3;

// Currencies with Sierra Leone NLe as default
export const CURRENCIES = [
  { code: 'SLE', symbol: 'NLe', name: 'Sierra Leonean Leone', default: true },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

interface User {
  id: string;
  name: string;
  email?: string;
  pinHash: string;
  avatar?: string;
  bio?: string;
  currency: string;
  timezone?: string;
  notificationsEnabled: boolean;
  createdAt: Date;
}

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile_money' | 'credit_card';
  balance: number;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
}

interface Income {
  id: string;
  accountId?: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  recurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
  notes?: string;
  attachmentData?: string;
  createdAt: Date;
}

interface Expense {
  id: string;
  accountId?: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  recurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
  notes?: string;
  attachmentData?: string;
  splitWith?: { name: string; amount: number }[];
  isPaid?: boolean;
  createdAt: Date;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string;
  alerts?: { at: number; triggered: boolean }[];
  createdAt: Date;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  autoSaveAmount?: number;
  autoSaveFrequency?: 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
}

interface Contribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  createdAt: Date;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isPaid: boolean;
  reminderDays: number;
  accountToPay?: string;
  createdAt: Date;
}

interface Subscription {
  id: string;
  name: string;
  service: string;
  amount: number;
  currency: string;
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextBillingDate: string;
  endDate?: string;
  category: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  notes?: string;
  reminderDays: number;
  createdAt: Date;
}

interface Debt {
  id: string;
  name: string;
  type: 'owed' | 'owes';
  person: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  interestRate?: number;
  notes?: string;
  payments: { amount: number; date: string; notes?: string }[];
  createdAt: Date;
}

interface Template {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  tags?: string[];
  accountId?: string;
  frequency: number;
  createdAt: Date;
}

interface CustomCategory {
  id: string;
  type: 'income' | 'expense';
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
}

interface Achievement {
  id: string;
  type: string;
  unlockedAt: Date;
  metadata?: Record<string, unknown>;
}

interface StreakData {
  id: string;
  type: 'login' | 'saving' | 'budget';
  currentStreak: number;
  longestStreak: number;
  lastDate: string;
}

interface Session {
  userId: string;
  lastActive: Date;
}

interface Notification {
  id: string;
  type: 'bill_reminder' | 'budget_alert' | 'goal_complete' | 'streak' | 'tip' | 'subscription';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

interface Preferences {
  id: string;
  defaultAccount?: string;
  currency: string;
  dateFormat: string;
  firstDayOfWeek: number;
  showBalanceInTitle: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  budgetAlertThresholds: number[];
  customColors?: Record<string, string>;
}

interface Book {
  id: string;
  title: string;
  author: string;
  category: 'budgeting' | 'saving' | 'investing' | 'mindset' | 'debt' | 'general';
  description: string;
  chapters: { title: string; content: string }[];
  totalPages: number;
  coverColor: string;
  isRead: boolean;
  currentPage: number;
  bookmarkedPages: number[];
  notes: { page: number; note: string }[];
  createdAt: Date;
}

interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatarData?: string;
  coverImageData?: string;
  favoriteQuote?: string;
  goals?: string[];
  socialLinks?: { platform: string; url: string }[];
  theme: { primaryColor: string; accentColor: string };
  createdAt: Date;
}

type TransactionType = Income | Expense;

class StorageService {
  private db: IDBPDatabase | null = null;
  private dbPromise: Promise<IDBPDatabase> | null = null;

  async init(): Promise<IDBPDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('income')) {
            const incomeStore = db.createObjectStore('income', { keyPath: 'id' });
            incomeStore.createIndex('date', 'date');
            incomeStore.createIndex('category', 'category');
          }
          if (!db.objectStoreNames.contains('expenses')) {
            const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
            expenseStore.createIndex('date', 'date');
            expenseStore.createIndex('category', 'category');
          }
          if (!db.objectStoreNames.contains('budgets')) {
            const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
            budgetStore.createIndex('month', 'month');
            budgetStore.createIndex('category', 'category');
          }
          if (!db.objectStoreNames.contains('savings')) {
            db.createObjectStore('savings', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('contributions')) {
            const contributionStore = db.createObjectStore('contributions', { keyPath: 'id' });
            contributionStore.createIndex('goalId', 'goalId');
          }
          if (!db.objectStoreNames.contains('session')) {
            db.createObjectStore('session', { keyPath: 'id' });
          }
        }

        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('accounts')) {
            db.createObjectStore('accounts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('bills')) {
            const billStore = db.createObjectStore('bills', { keyPath: 'id' });
            billStore.createIndex('dueDate', 'dueDate');
            billStore.createIndex('isPaid', 'isPaid');
          }
          if (!db.objectStoreNames.contains('debts')) {
            db.createObjectStore('debts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('templates')) {
            const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
            templateStore.createIndex('type', 'type');
          }
          if (!db.objectStoreNames.contains('categories')) {
            const catStore = db.createObjectStore('categories', { keyPath: 'id' });
            catStore.createIndex('type', 'type');
          }
          if (!db.objectStoreNames.contains('achievements')) {
            db.createObjectStore('achievements', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('streaks')) {
            db.createObjectStore('streaks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('notifications')) {
            const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
            notifStore.createIndex('read', 'read');
          }
          if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences', { keyPath: 'id' });
          }
        }

        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('subscriptions')) {
            const subStore = db.createObjectStore('subscriptions', { keyPath: 'id' });
            subStore.createIndex('isActive', 'isActive');
            subStore.createIndex('nextBillingDate', 'nextBillingDate');
          }
          if (!db.objectStoreNames.contains('books')) {
            const bookStore = db.createObjectStore('books', { keyPath: 'id' });
            bookStore.createIndex('category', 'category');
          }
          if (!db.objectStoreNames.contains('userProfile')) {
            db.createObjectStore('userProfile', { keyPath: 'id' });
          }
        }
      },
    });

    this.db = await this.dbPromise;
    return this.db;
  }

  async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.init();
    return db.add(storeName, item);
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.init();
    return db.get(storeName, id);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return db.getAll(storeName);
  }

  async update<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.init();
    return db.put(storeName, item);
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return db.delete(storeName, id);
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return db.clear(storeName);
  }

  async getAllByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    const db = await this.init();
    return db.getAllFromIndex(storeName, indexName, value);
  }

  // User operations
  async createUser(user: User): Promise<void> {
    await this.add('users', user);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.get<User>('users', id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.getAll<User>('users');
  }

  async updateUser(user: User): Promise<void> {
    await this.update('users', user);
  }

  // Profile operations
  async createUserProfile(profile: UserProfile): Promise<void> {
    await this.add('userProfile', profile);
  }

  async getUserProfile(): Promise<UserProfile | undefined> {
    const profiles = await this.getAll<UserProfile>('userProfile');
    return profiles[0];
  }

  async updateUserProfile(profile: UserProfile): Promise<void> {
    await this.update('userProfile', profile);
  }

  // Session operations
  async setSession(session: Session): Promise<void> {
    await this.clear('session');
    await this.add('session', { ...session, id: 'current' });
  }

  async getSession(): Promise<Session | undefined> {
    return this.get<Session & { id: string }>('session', 'current');
  }

  async clearSession(): Promise<void> {
    await this.clear('session');
  }

  // Account operations
  async addAccount(account: Account): Promise<void> {
    await this.add('accounts', account);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return this.get<Account>('accounts', id);
  }

  async getAllAccounts(): Promise<Account[]> {
    return this.getAll<Account>('accounts');
  }

  async updateAccount(account: Account): Promise<void> {
    await this.update('accounts', account);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.delete('accounts', id);
  }

  // Income operations
  async addIncome(income: Income): Promise<void> {
    await this.add('income', income);
  }

  async getIncome(id: string): Promise<Income | undefined> {
    return this.get<Income>('income', id);
  }

  async getAllIncome(): Promise<Income[]> {
    return this.getAll<Income>('income');
  }

  async updateIncome(income: Income): Promise<void> {
    await this.update('income', income);
  }

  async deleteIncome(id: string): Promise<void> {
    await this.delete('income', id);
  }

  async getIncomeByMonth(year: number, month: number): Promise<Income[]> {
    const allIncome = await this.getAllIncome();
    return allIncome.filter((income) => {
      const incomeDate = new Date(income.date);
      return incomeDate.getFullYear() === year && incomeDate.getMonth() === month;
    });
  }

  // Expense operations
  async addExpense(expense: Expense): Promise<void> {
    await this.add('expenses', expense);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.get<Expense>('expenses', id);
  }

  async getAllExpenses(): Promise<Expense[]> {
    return this.getAll<Expense>('expenses');
  }

  async updateExpense(expense: Expense): Promise<void> {
    await this.update('expenses', expense);
  }

  async deleteExpense(id: string): Promise<void> {
    await this.delete('expenses', id);
  }

  async getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
    const allExpenses = await this.getAllExpenses();
    return allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });
  }

  // Budget operations
  async addBudget(budget: Budget): Promise<void> {
    await this.add('budgets', budget);
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    return this.get<Budget>('budgets', id);
  }

  async getAllBudgets(): Promise<Budget[]> {
    return this.getAll<Budget>('budgets');
  }

  async updateBudget(budget: Budget): Promise<void> {
    await this.update('budgets', budget);
  }

  async deleteBudget(id: string): Promise<void> {
    await this.delete('budgets', id);
  }

  async getBudgetsByMonth(month: string): Promise<Budget[]> {
    return this.getAllByIndex<Budget>('budgets', 'month', month);
  }

  // Savings operations
  async addSavingsGoal(goal: SavingsGoal): Promise<void> {
    await this.add('savings', goal);
  }

  async getSavingsGoal(id: string): Promise<SavingsGoal | undefined> {
    return this.get<SavingsGoal>('savings', id);
  }

  async getAllSavingsGoals(): Promise<SavingsGoal[]> {
    return this.getAll<SavingsGoal>('savings');
  }

  async updateSavingsGoal(goal: SavingsGoal): Promise<void> {
    await this.update('savings', goal);
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    await this.delete('savings', id);
  }

  // Contribution operations
  async addContribution(contribution: Contribution): Promise<void> {
    await this.add('contributions', contribution);
  }

  async getContributionsForGoal(goalId: string): Promise<Contribution[]> {
    return this.getAllByIndex<Contribution>('contributions', 'goalId', goalId);
  }

  async getAllContributions(): Promise<Contribution[]> {
    return this.getAll<Contribution>('contributions');
  }

  // Bill operations
  async addBill(bill: Bill): Promise<void> {
    await this.add('bills', bill);
  }

  async getBill(id: string): Promise<Bill | undefined> {
    return this.get<Bill>('bills', id);
  }

  async getAllBills(): Promise<Bill[]> {
    return this.getAll<Bill>('bills');
  }

  async updateBill(bill: Bill): Promise<void> {
    await this.update('bills', bill);
  }

  async deleteBill(id: string): Promise<void> {
    await this.delete('bills', id);
  }

  async getUpcomingBills(days: number): Promise<Bill[]> {
    const allBills = await this.getAllBills();
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return allBills.filter((bill) => {
      const dueDate = new Date(bill.dueDate);
      return !bill.isPaid && dueDate >= now && dueDate <= futureDate;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  // Subscription operations
  async addSubscription(sub: Subscription): Promise<void> {
    await this.add('subscriptions', sub);
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.get<Subscription>('subscriptions', id);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.getAll<Subscription>('subscriptions');
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return this.getAllByIndex<Subscription>('subscriptions', 'isActive', 'true');
  }

  async updateSubscription(sub: Subscription): Promise<void> {
    await this.update('subscriptions', sub);
  }

  async deleteSubscription(id: string): Promise<void> {
    await this.delete('subscriptions', id);
  }

  // Debt operations
  async addDebt(debt: Debt): Promise<void> {
    await this.add('debts', debt);
  }

  async getDebt(id: string): Promise<Debt | undefined> {
    return this.get<Debt>('debts', id);
  }

  async getAllDebts(): Promise<Debt[]> {
    return this.getAll<Debt>('debts');
  }

  async updateDebt(debt: Debt): Promise<void> {
    await this.update('debts', debt);
  }

  async deleteDebt(id: string): Promise<void> {
    await this.delete('debts', id);
  }

  // Template operations
  async addTemplate(template: Template): Promise<void> {
    await this.add('templates', template);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.get<Template>('templates', id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return this.getAll<Template>('templates');
  }

  async getAllTemplatesByType(type: 'income' | 'expense'): Promise<Template[]> {
    return this.getAllByIndex<Template>('templates', 'type', type);
  }

  async updateTemplate(template: Template): Promise<void> {
    await this.update('templates', template);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.delete('templates', id);
  }

  // Custom Category operations
  async addCustomCategory(category: CustomCategory): Promise<void> {
    await this.add('categories', category);
  }

  async getAllCustomCategories(): Promise<CustomCategory[]> {
    return this.getAll<CustomCategory>('categories');
  }

  async getCustomCategoriesByType(type: 'income' | 'expense'): Promise<CustomCategory[]> {
    return this.getAllByIndex<CustomCategory>('categories', 'type', type);
  }

  async updateCustomCategory(category: CustomCategory): Promise<void> {
    await this.update('categories', category);
  }

  async deleteCustomCategory(id: string): Promise<void> {
    await this.delete('categories', id);
  }

  // Achievement operations
  async addAchievement(achievement: Achievement): Promise<void> {
    await this.add('achievements', achievement);
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return this.getAll<Achievement>('achievements');
  }

  async hasAchievement(type: string): Promise<boolean> {
    const achievements = await this.getAllAchievements();
    return achievements.some((a) => a.type === type);
  }

  // Streak operations
  async getStreak(type: string): Promise<StreakData | undefined> {
    const streaks = await this.getAll<StreakData>('streaks');
    return streaks.find((s) => s.type === type);
  }

  async updateStreak(streak: StreakData): Promise<void> {
    const existing = await this.getStreak(streak.type);
    if (existing) {
      await this.update('streaks', streak);
    } else {
      await this.add('streaks', streak);
    }
  }

  // Notification operations
  async addNotification(notification: Notification): Promise<void> {
    await this.add('notifications', notification);
  }

  async getAllNotifications(): Promise<Notification[]> {
    return this.getAll<Notification>('notifications');
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return this.getAllByIndex<Notification>('notifications', 'read', 'false');
  }

  async markNotificationRead(id: string): Promise<void> {
    const notif = await this.get<Notification>('notifications', id);
    if (notif) {
      notif.read = true;
      await this.update('notifications', notif);
    }
  }

  async clearAllNotifications(): Promise<void> {
    await this.clear('notifications');
  }

  // Preferences operations
  async getPreferences(): Promise<Preferences | undefined> {
    return this.get<Preferences>('preferences', 'main');
  }

  async savePreferences(prefs: Preferences): Promise<void> {
    await this.update('preferences', { ...prefs, id: 'main' });
  }

  // Book operations
  async addBook(book: Book): Promise<void> {
    await this.add('books', book);
  }

  async getBook(id: string): Promise<Book | undefined> {
    return this.get<Book>('books', id);
  }

  async getAllBooks(): Promise<Book[]> {
    return this.getAll<Book>('books');
  }

  async getBooksByCategory(category: string): Promise<Book[]> {
    return this.getAllByIndex<Book>('books', 'category', category);
  }

  async updateBook(book: Book): Promise<void> {
    await this.update('books', book);
  }

  async deleteBook(id: string): Promise<void> {
    await this.delete('books', id);
  }

  async initializeDefaultBooks(): Promise<void> {
    const existing = await this.getAllBooks();
    if (existing.length > 0) return;

    const defaultBooks: Omit<Book, 'id' | 'createdAt'>[] = [
      // Budgeting Books
      {
        title: "The Total Money Makeover",
        author: "Dave Ramsey",
        category: "budgeting",
        description: "A proven plan for financial fitness. Learn the baby steps to building wealth and getting out of debt.",
        chapters: [
          { title: "The Total Money Makeover Challenge", content: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make so you can give money back and have money to invest. You can't win until you do this..." },
          { title: "The Myths About Money and Debt", content: "Debt is normal. But normal is broke. The Average American makes $50,000 a year and retires with $50,000. That's not a plan..." },
          { title: "Baby Step 1: Save $1,000", content: "An emergency fund turns a crisis into an inconvenience. Start with just $1,000 in a savings account..." },
        ],
        totalPages: 288,
        coverColor: '#2D5A27',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Your Money or Your Life",
        author: "Vicki Robin & Joe Dominguez",
        category: "budgeting",
        description: "Transform your relationship with money and achieve financial independence through mindful spending and conscious choices.",
        chapters: [
          { title: "The Money Trap", content: "We get our money by trading our life energy for it. Every dollar we spend represents time we worked to earn it..." },
          { title: "Tracking Your Money", content: "Awareness is the first step to transformation. Track every cent that comes in and goes out..." },
        ],
        totalPages: 352,
        coverColor: '#1A4D8C',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The 9-Step Millionaire",
        author: "David Bach",
        category: "budgeting",
        description: "A simple plan to build wealth automatically by paying yourself first and living on what's left.",
        chapters: [
          { title: "Pay Yourself First", content: "The secret to building wealth is simple: pay yourself first. Automatically deduct 10% of your income before you see it..." },
        ],
        totalPages: 256,
        coverColor: '#8B4513',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Budgeting 101",
        author: "Michele Cagan",
        category: "budgeting",
        description: "A practical guide to creating and sticking to a budget that works for your lifestyle.",
        chapters: [
          { title: "Why Budget?", content: "A budget is not a constraint - it's a tool that gives you permission to spend. It tells your money where to go instead of wondering where it went..." },
        ],
        totalPages: 224,
        coverColor: '#4A7C59',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Budgeting Habit",
        author: "S.J. Scott",
        category: "budgeting",
        description: "Build a sustainable budgeting habit that sticks using habit-stacking techniques.",
        chapters: [
          { title: "Habit Stacking for Your Finances", content: "The best budget is one you actually follow. Learn to stack financial habits onto existing routines..." },
        ],
        totalPages: 180,
        coverColor: '#6B4423',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      // Saving Books
      {
        title: "The Richest Man in Babylon",
        author: "George S. Clason",
        category: "saving",
        description: "Timeless parables about wealth building. Learn the basic rules of money: save 10%, live below your means, invest wisely.",
        chapters: [
          { title: "The Man Who Desired Gold", content: "In ancient Babylon lived a man named Bansir who had a large income but an empty purse. He wondered why some had gold while others had none..." },
          { title: "The Seven Cures", content: "Start thy purse to fattening. Control thy expenditures. Make thy gold multiply. Guard thy treasures from loss..." },
          { title: "The Five Laws of Gold", content: "Gold cometh gladly and in increasing quantity to any man who will not keep more than one-tenth of his earnings..." },
        ],
        totalPages: 176,
        coverColor: '#D4AF37',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Little Book of Common Sense Investing",
        author: "John C. Bogle",
        category: "saving",
        description: "Simple strategies for building wealth through low-cost index funds and compound interest.",
        chapters: [
          { title: "The Magic of Compounding", content: "The greatest mathematical discovery of all time is compound interest. Let your money work for you over time..." },
        ],
        totalPages: 288,
        coverColor: '#36454F',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Automatic Millionaire",
        author: "David Bach",
        category: "saving",
        description: "Build wealth automatically by setting up systems that save and invest for you.",
        chapters: [
          { title: "The Latte Factor", content: "Small daily expenses add up to hundreds of thousands over a lifetime. The latte factor teaches us about the hidden fortune in our small purchases..." },
        ],
        totalPages: 256,
        coverColor: '#FFD700',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "I Will Teach You To Be Rich",
        author: "Ramit Sethi",
        category: "saving",
        description: "A practical guide to automating finances, investing, and living a rich life without being a penny-pincher.",
        chapters: [
          { title: "Optimize Your Credit Cards", content: "Credit cards can be your best friend if used wisely. Get rewards, build credit, and never pay interest..." },
          { title: "Automate Your Savings", content: "The key to wealth is automation. Set it up once, benefit forever. Every month, money should automatically flow to savings..." },
        ],
        totalPages: 352,
        coverColor: '#228B22',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Smart Women Finish Rich",
        author: "David Bach",
        category: "saving",
        description: "A guide specifically for women to take control of their finances and secure their future.",
        chapters: [
          { title: "Take Action Today", content: "The best time to start investing was 20 years ago. The second best time is today..." },
        ],
        totalPages: 288,
        coverColor: '#9B30FF',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      // Investing Books
      {
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        category: "investing",
        description: "Learn the difference between assets and liabilities, and how the rich make money work for them.",
        chapters: [
          { title: "Lesson 1: The Rich Don't Work for Money", content: "The poor and middle class work for money. The rich have money work for them. Most people never see this distinction..." },
          { title: "Lesson 2: Why Teach Financial Literacy?", content: "Intelligence solves problems and produces money. Money without financial intelligence is money soon gone..." },
        ],
        totalPages: 336,
        coverColor: '#B22222',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Intelligent Investor",
        author: "Benjamin Graham",
        category: "investing",
        description: "Warren Buffett's favorite investing book. Learn the principles of value investing.",
        chapters: [
          { title: "The Investor and Market Fluctuations", content: "The market is a pendulum that swings between optimism and pessimism. The intelligent investor profits from the swings..." },
        ],
        totalPages: 640,
        coverColor: '#191970',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Millionaire Next Door",
        author: "Thomas J. Stanley",
        category: "investing",
        description: "Discover the surprising habits of America's wealthy - they're often not who you'd expect.",
        chapters: [
          { title: "Who Are the Wealthy?", content: "Most wealthy Americans are not flashy spenders. They live below their means, save aggressively, and invest wisely..." },
        ],
        totalPages: 258,
        coverColor: '#3D5AFE',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "A Random Walk Down Wall Street",
        author: "Burton G. Malkiel",
        category: "investing",
        description: "Understand market efficiency and why index funds beat most active strategies.",
        chapters: [
          { title: "The Firm-Foundation Theory", content: "Stocks have intrinsic value based on future earnings. Long-term, prices reflect fundamentals..." },
        ],
        totalPages: 464,
        coverColor: '#000080',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "One Up On Wall Street",
        author: "Peter Lynch",
        category: "investing",
        description: "Learn to identify great investments in everyday life before Wall Street catches on.",
        chapters: [
          { title: "The Power of Common Knowledge", content: "Invest in what you know. Your everyday experiences can lead to investment insights professionals miss..." },
        ],
        totalPages: 320,
        coverColor: '#006400',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      // Mindset Books
      {
        title: "Think and Grow Rich",
        author: "Napoleon Hill",
        category: "mindset",
        description: "Study the success habits of wealthy individuals and learn the principles of achievement.",
        chapters: [
          { title: "Desire: The Starting Point", content: "Every achievement begins with a definite purpose. What do you want? When will you have it? Write it down..." },
          { title: "Faith: Visualization of and Belief", content: "Faith is the head chemist of the mind. When faith is blended with thought, it becomes a powerful force..." },
          { title: "The Subconscious Mind", content: "The subconscious mind works day and night. Feed it positive thoughts, and it will find ways to achieve your goals..." },
        ],
        totalPages: 320,
        coverColor: '#8B0000',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Secrets of the Millionaire Mind",
        author: "T. Harv Eker",
        category: "mindset",
        description: "Master the inner game of wealth and transform your money blueprint.",
        chapters: [
          { title: "Your Money Blueprint", content: "We all have a personal money blueprint ingrained in our subconscious. It determines your financial life..." },
          { title: "The Wealth Files", content: "Rich people think differently. They believe they create their life, they play the money game to win..." },
        ],
        totalPages: 224,
        coverColor: '#FF4500',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Money: Master the Game",
        author: "Tony Robbins",
        category: "mindset",
        description: "Learn from the world's best investors and create financial freedom.",
        chapters: [
          { title: "Unlock the Money Machine", content: "Financial freedom is available to everyone. It starts with a decision and requires a system..." },
        ],
        totalPages: 688,
        coverColor: '#1E90FF',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        category: "mindset",
        description: "Timeless lessons on wealth, greed, and happiness with money.",
        chapters: [
          { title: "No One's Crazy", content: "People make financial decisions based on their own unique experiences. What seems crazy to you makes perfect sense to them..." },
          { title: "Luck and Risk", content: "Success is not always from skill. Failure is not always from poor decisions. Acknowledge the role of luck..." },
        ],
        totalPages: 256,
        coverColor: '#4169E1',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Unshakeable",
        author: "Tony Robbins",
        category: "mindset",
        description: "Steps to achieving financial freedom and peace of mind.",
        chapters: [
          { title: "The Power of Financial Freedom", content: "True wealth is not just money - it's the freedom to live life on your terms. Financial freedom gives you options..." },
        ],
        totalPages: 288,
        coverColor: '#2E8B57',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      // Debt Books
      {
        title: "The Total Money Makeover",
        author: "Dave Ramsey",
        category: "debt",
        description: "A step-by-step plan to eliminate debt and build lasting wealth.",
        chapters: [
          { title: "The Debt Snowball", content: "List your debts smallest to largest. Pay minimums on everything, attack the smallest with fury. Each paid debt snowballs motivation..." },
          { title: "Baby Step 2: The Debt Snowball", content: "Focus on one debt at a time. The psychological wins from paying off small debts fuel the journey..." },
        ],
        totalPages: 288,
        coverColor: '#B8860B',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Debt-Free Degree",
        author: "Anthony ONeal",
        category: "debt",
        description: "Complete college without student loans by making smart decisions.",
        chapters: [
          { title: "The Student Loan Myth", content: "You don't need student loans to get a degree. There are better ways - scholarships, work, choosing the right school..." },
        ],
        totalPages: 212,
        coverColor: '#6A5ACD',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "How to Get Out of Debt, Stay Out of Debt, and Live Prosperously",
        author: "Jerrold Mundis",
        category: "debt",
        description: "A practical program for becoming debt-free using proven techniques.",
        chapters: [
          { title: "Facing Your Debt", content: "The first step to freedom is knowing exactly where you stand. List every debt, every creditor, every amount..." },
        ],
        totalPages: 304,
        coverColor: '#CD853F',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Zero Down Your Debt",
        author: "Holly Porter Johnson & Greg Johnson",
        category: "debt",
        description: "A practical guide to becoming debt-free and building wealth.",
        chapters: [
          { title: "The Debt-Free Mindset", content: "Debt is not normal. Financial freedom starts with the decision to no longer be a slave to payments..." },
        ],
        totalPages: 192,
        coverColor: '#DC143C',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Debt Escape Plan",
        author: "Becky Beach",
        category: "debt",
        description: "A realistic approach to paying off debt while living your life.",
        chapters: [
          { title: "Your Escape Route", content: "Freedom from debt requires a plan. Assess, attack, accelerate - your three-step escape route..." },
        ],
        totalPages: 176,
        coverColor: '#FF6347',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      // General Finance Books
      {
        title: "Personal Finance for Dummies",
        author: "Eric Tyson",
        category: "general",
        description: "A comprehensive guide covering all aspects of personal finance.",
        chapters: [
          { title: "Money and You", content: "Your relationship with money reflects your values and goals. Personal finance is PERSONAL..." },
        ],
        totalPages: 480,
        coverColor: '#FFD700',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Financial Peace Revisited",
        author: "Dave Ramsey",
        category: "general",
        description: "Achieve financial peace through proven principles and practical steps.",
        chapters: [
          { title: "Financial Peace is Possible", content: "Money fights are the #1 cause of divorce in America. Financial peace in the home brings peace to every area of life..." },
        ],
        totalPages: 320,
        coverColor: '#20B2AA',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Simple Path to Wealth",
        author: "J.L. Collins",
        category: "general",
        description: "A straightforward approach to investing and building wealth.",
        chapters: [
          { title: "The First Rule of Wealth", content: "Spend less than you earn and invest the difference. It sounds simple because it is..." },
        ],
        totalPages: 286,
        coverColor: '#8B4513',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Broke Millennial",
        author: "Erin Lowry",
        category: "general",
        description: "A guide for young adults to stop scraping by and get their financial life together.",
        chapters: [
          { title: "Stop Living Paycheck to Paycheck", content: "It's time to get real about your finances. No more excuses. Here's how to break the cycle..." },
        ],
        totalPages: 304,
        coverColor: '#FF1493',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Get a Financial Life",
        author: "Beth Kobliner",
        category: "general",
        description: "Personal finance in your twenties and thirties explained clearly.",
        chapters: [
          { title: "Starting Out Right", content: "Your twenties and thirties are the most critical time for building wealth. Time is your greatest asset..." },
        ],
        totalPages: 352,
        coverColor: '#32CD32',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Money Book for the Young, Fabulous & Broke",
        author: "Suze Orman",
        category: "general",
        description: "Financial advice specifically for young people starting their journey.",
        chapters: [
          { title: "You're Not Alone", content: "Being young and broke is normal. What's not normal is staying that way. Here's your roadmap to financial stability..." },
        ],
        totalPages: 384,
        coverColor: '#FF69B4',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Why Didn't They Teach Me This in School?",
        author: "Cary Siegel",
        category: "general",
        description: "99 personal money management principles to live by.",
        chapters: [
          { title: "Life's Money Principles", content: "School teaches us algebra but not how to balance a checkbook. Here are the 99 money rules you should have learned..." },
        ],
        totalPages: 182,
        coverColor: '#4B0082',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Your Money Life: The 'Make-It-Work' Plan",
        author: "Peter Dunn",
        category: "general",
        description: "Navigate life's major financial decisions at every stage.",
        chapters: [
          { title: "Your Financial Life Stages", content: "Life happens in stages - college, career, family, retirement. Each stage has unique financial challenges and opportunities..." },
        ],
        totalPages: 256,
        coverColor: '#2F4F4F',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Financial Diet",
        author: "Chelsea Fagan",
        category: "general",
        description: "A total beginner's guide to getting good with money.",
        chapters: [
          { title: "Starting Your Financial Diet", content: "Good financial health is like physical health - it requires knowledge, discipline, and consistency. Start your diet today..." },
        ],
        totalPages: 256,
        coverColor: '#E6E6FA',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Get Good with Money",
        author: "Tiffany Aliche",
        category: "general",
        description: "Ten simple habits to achieve financial wholeness.",
        chapters: [
          { title: "Your Financial Wholeness", content: "Financial wholeness isn't about being rich. It's about having all pieces of your financial life working together..." },
        ],
        totalPages: 320,
        coverColor: '#FA8072',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Soul of Money",
        author: "Lynne Twist",
        category: "general",
        description: "Transform your relationship with money and life.",
        chapters: [
          { title: "Money and Soul", content: "Money is not just currency. It carries our hopes, fears, and dreams. Transform your relationship with money to transform your life..." },
        ],
        totalPages: 288,
        coverColor: '#DDA0DD',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Index Card",
        author: "Harold Pollack & Helaine Olen",
        category: "general",
        description: "All you need to know about money fits on an index card.",
        chapters: [
          { title: "Simple Rules for Complex Finances", content: "Financial advice has become complicated for profit. Real wealth building follows simple rules that fit on an index card..." },
        ],
        totalPages: 256,
        coverColor: '#87CEEB',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "Wealth Made Easy",
        author: "Gregg Stebben",
        category: "general",
        description: "18 successful entrepreneurs share their wealth-building secrets.",
        chapters: [
          { title: "Learn from Those Who've Done It", content: "Why reinvent the wheel? Learn directly from entrepreneurs who built wealth. Their insights can accelerate your journey..." },
        ],
        totalPages: 304,
        coverColor: '#F0E68C',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
      {
        title: "The Squirrel Manifesto",
        author: "Ric Edelman",
        category: "saving",
        description: "Why saving and planning for retirement matter at any age.",
        chapters: [
          { title: "Be a Squirrel", content: "Squirrels prepare for winter by gathering nuts all year. They don't wait until it's cold. Prepare for your financial winter now..." },
        ],
        totalPages: 240,
        coverColor: '#CD853F',
        isRead: false,
        currentPage: 0,
        bookmarkedPages: [],
        notes: [],
      },
    ];

    for (const book of defaultBooks) {
      const fullBook: Book = {
        ...book,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      await this.addBook(fullBook);
    }
  }

  // Backup & Restore
  async exportAllData(): Promise<Record<string, unknown>> {
    return {
      users: await this.getAllUsers(),
      userProfile: await this.getUserProfile(),
      accounts: await this.getAllAccounts(),
      income: await this.getAllIncome(),
      expenses: await this.getAllExpenses(),
      budgets: await this.getAllBudgets(),
      savings: await this.getAllSavingsGoals(),
      contributions: await this.getAllContributions(),
      bills: await this.getAllBills(),
      subscriptions: await this.getAllSubscriptions(),
      debts: await this.getAllDebts(),
      templates: await this.getAllTemplates(),
      categories: await this.getAllCustomCategories(),
      achievements: await this.getAllAchievements(),
      notifications: await this.getAllNotifications(),
      preferences: await this.getPreferences(),
      exportedAt: new Date().toISOString(),
      version: DB_VERSION,
    };
  }

  async importAllData(data: Record<string, unknown>): Promise<void> {
    const stores = [
      'users', 'accounts', 'income', 'expenses', 'budgets', 'savings',
      'contributions', 'bills', 'debts', 'templates', 'categories',
      'achievements', 'notifications', 'subscriptions'
    ];

    for (const store of stores) {
      if (data[store] && Array.isArray(data[store])) {
        await this.clear(store);
        for (const item of data[store]) {
          await this.add(store, item);
        }
      }
    }

    if (data.preferences) {
      await this.clear('preferences');
      await this.add('preferences', { ...data.preferences, id: 'main' });
    }

    if (data.userProfile) {
      await this.clear('userProfile');
      await this.add('userProfile', data.userProfile);
    }
  }

  async clearAllData(): Promise<void> {
    const stores = [
      'users', 'accounts', 'income', 'expenses', 'budgets', 'savings',
      'contributions', 'bills', 'debts', 'templates', 'categories',
      'achievements', 'streaks', 'notifications', 'preferences', 'session',
      'subscriptions', 'books', 'userProfile'
    ];
    for (const store of stores) {
      await this.clear(store);
    }
  }

  // Combined transactions
  async getAllTransactions(): Promise<{ income: Income[]; expenses: Expense[] }> {
    return {
      income: await this.getAllIncome(),
      expenses: await this.getAllExpenses(),
    };
  }

  async getRecentTransactions(limit: number): Promise<TransactionType[]> {
    const { income, expenses } = await this.getAllTransactions();
    const all = [...income, ...expenses] as TransactionType[];
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  }
}

export const storage = new StorageService();
export type {
  User, Account, Income, Expense, Budget, SavingsGoal, Contribution,
  Bill, Debt, Template, CustomCategory, Achievement, StreakData,
  Session, Notification, Preferences, TransactionType, Subscription, Book, UserProfile
};
