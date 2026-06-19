// Budget alerts and spending categorization with AI

export interface BudgetAlert {
  id: string;
  category: string;
  threshold: number;
  alertType: 'spending' | 'budget' | 'income';
  severity: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: Date;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

export interface CategorizationRule {
  id: string;
  keywords: string[];
  category: string;
  priority: number;
  active: boolean;
}

/**
 * Smart expense categorization based on description
 */
export function suggestCategory(
  description: string,
  rules: CategorizationRule[] = DEFAULT_RULES
): CategorySuggestion | null {
  const lowerDesc = description.toLowerCase();
  
  // Sort by priority
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedRules) {
    if (!rule.active) continue;
    
    for (const keyword of rule.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return {
          category: rule.category,
          confidence: Math.min(100, 80 + rule.priority * 5),
          reason: `Matched keyword: "${keyword}"`,
        };
      }
    }
  }

  // Fallback to keyword matching with scoring
  return matchCategoryByKeywords(description);
}

/**
 * Match category using keyword scoring
 */
function matchCategoryByKeywords(description: string): CategorySuggestion | null {
  const lowerDesc = description.toLowerCase();
  const scores: Record<string, number> = {};
  
  const patterns: Record<string, string[]> = {
    food: ['restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'grocery', 'supermarket'],
    transport: ['uber', 'lyft', 'taxi', 'bus', 'train', 'gas', 'parking', 'transit', 'fuel', 'car'],
    entertainment: ['movie', 'cinema', 'game', 'concert', 'show', 'netflix', 'spotify', 'gaming', 'streaming'],
    shopping: ['mall', 'store', 'amazon', 'ebay', 'shop', 'boutique', 'purchase'],
    health: ['hospital', 'doctor', 'pharmacy', 'medicine', 'clinic', 'gym', 'fitness'],
    utilities: ['electricity', 'water', 'gas', 'internet', 'phone', 'bill', 'utility'],
    rent: ['rent', 'landlord', 'property', 'lease', 'apartment', 'housing'],
    books: ['book', 'library', 'publisher', 'textbook', 'study', 'course'],
  };

  for (const [category, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        scores[category] = (scores[category] || 0) + 1;
      }
    }
  }

  const bestCategory = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  
  if (bestCategory) {
    const [category, score] = bestCategory;
    const confidence = Math.min(95, 60 + score * 10);
    return {
      category,
      confidence,
      reason: `Matched ${score} keyword(s)`,
    };
  }

  return null;
}

/**
 * Check if current spending triggers alert
 */
export function checkBudgetAlert(
  categoryName: string,
  spent: number,
  budget: number,
  alerts: BudgetAlert[]
): BudgetAlert | null {
  const relevantAlert = alerts.find(a => 
    a.category === categoryName && 
    a.alertType === 'spending' && 
    a.isActive
  );

  if (!relevantAlert) return null;

  const percentageSpent = (spent / budget) * 100;
  
  if (percentageSpent >= relevantAlert.threshold) {
    return relevantAlert;
  }

  return null;
}

/**
 * Generate alerts based on spending patterns
 */
export function generateSpendingAlerts(
  expenses: any[],
  budgets: any[]
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const monthlyExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date >= monthStart && date < monthEnd;
  });

  for (const budget of budgets) {
    const categoryExpenses = monthlyExpenses
      .filter(e => e.category === budget.category)
      .reduce((sum, e) => sum + e.amount, 0);

    const percentageSpent = (categoryExpenses / budget.limit) * 100;

    if (percentageSpent >= 100) {
      alerts.push({
        id: `alert-${budget.id}-over`,
        category: budget.category,
        threshold: 100,
        alertType: 'budget',
        severity: 'high',
        isActive: true,
        createdAt: new Date(),
      });
    } else if (percentageSpent >= 80) {
      alerts.push({
        id: `alert-${budget.id}-80`,
        category: budget.category,
        threshold: 80,
        alertType: 'budget',
        severity: 'medium',
        isActive: true,
        createdAt: new Date(),
      });
    } else if (percentageSpent >= 60) {
      alerts.push({
        id: `alert-${budget.id}-60`,
        category: budget.category,
        threshold: 60,
        alertType: 'spending',
        severity: 'low',
        isActive: true,
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Create default categorization rules
 */
export const DEFAULT_RULES: CategorizationRule[] = [
  {
    id: 'rule-food-1',
    keywords: ['mcdonald', 'kfc', 'pizza hut', 'domino', 'subway', 'burger king'],
    category: 'food',
    priority: 10,
    active: true,
  },
  {
    id: 'rule-transport-1',
    keywords: ['uber', 'lyft', 'taxi', 'shell', 'exxon', 'petrol'],
    category: 'transport',
    priority: 10,
    active: true,
  },
  {
    id: 'rule-shopping-1',
    keywords: ['amazon', 'ebay', 'walmart', 'target', 'mall'],
    category: 'shopping',
    priority: 10,
    active: true,
  },
  {
    id: 'rule-entertainment-1',
    keywords: ['netflix', 'spotify', 'hulu', 'disney', 'cinema', 'movie'],
    category: 'entertainment',
    priority: 9,
    active: true,
  },
  {
    id: 'rule-health-1',
    keywords: ['pharmacy', 'hospital', 'doctor', 'clinic', 'dental', 'gym'],
    category: 'health',
    priority: 9,
    active: true,
  },
  {
    id: 'rule-books-1',
    keywords: ['bookstore', 'amazon', 'educational', 'course', 'udemy'],
    category: 'books',
    priority: 8,
    active: true,
  },
];

/**
 * Add custom categorization rule
 */
export function addCategorizationRule(
  keywords: string[],
  category: string,
  priority: number = 5
): CategorizationRule {
  return {
    id: `rule-custom-${Date.now()}`,
    keywords,
    category,
    priority,
    active: true,
  };
}

/**
 * Get category emoji/icon for suggestion display
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: '🍔',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    health: '🏥',
    utilities: '⚡',
    rent: '🏠',
    books: '📚',
    school_fees: '🎓',
    subscriptions: '🔄',
    other: '📝',
  };
  return icons[category] || '💰';
}
