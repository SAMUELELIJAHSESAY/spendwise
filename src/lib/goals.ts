// Financial goals tracking and management

export interface FinancialGoal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'short-term' | 'medium-term' | 'long-term';
  priority: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  monthlyContributionNeeded: number;
  daysRemaining: number;
  onTrack: boolean;
}

/**
 * Calculate goal progress and metrics
 */
export function calculateGoalProgress(goal: FinancialGoal): GoalProgress {
  const progressPercentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  
  const deadline = new Date(goal.deadline);
  const today = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
  const monthlyContributionNeeded = remainingAmount / monthsRemaining;
  
  const onTrack = goal.currentAmount >= (goal.targetAmount * (1 - daysRemaining / (monthsRemaining * 30)));

  return {
    goalId: goal.id,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    progressPercentage: Math.round(progressPercentage),
    remainingAmount: Math.round(remainingAmount * 100) / 100,
    monthlyContributionNeeded: Math.round(monthlyContributionNeeded * 100) / 100,
    daysRemaining: Math.max(0, daysRemaining),
    onTrack,
  };
}

/**
 * Get goals sorted by priority and deadline
 */
export function prioritizeGoals(goals: FinancialGoal[]): FinancialGoal[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  return [...goals].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    const deadlineA = new Date(a.deadline).getTime();
    const deadlineB = new Date(b.deadline).getTime();
    return deadlineA - deadlineB;
  });
}

/**
 * Suggest monthly contributions for all goals
 */
export function suggestContributions(
  goals: FinancialGoal[],
  availableMonthlyAmount: number
): Record<string, number> {
  const progresses = goals.map(goal => calculateGoalProgress(goal));
  const totalMonthlyNeeded = progresses.reduce((sum, p) => sum + p.monthlyContributionNeeded, 0);
  
  const contributions: Record<string, number> = {};
  
  if (totalMonthlyNeeded <= availableMonthlyAmount) {
    // Can fund all goals
    progresses.forEach(p => {
      contributions[p.goalId] = p.monthlyContributionNeeded;
    });
  } else {
    // Must prioritize
    const prioritized = goals.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    let remaining = availableMonthlyAmount;
    for (const goal of prioritized) {
      const progress = calculateGoalProgress(goal);
      const allocation = Math.min(remaining, progress.monthlyContributionNeeded);
      contributions[goal.id] = allocation;
      remaining -= allocation;
    }
  }
  
  return contributions;
}

/**
 * Generate goal recommendations based on income and expenses
 */
export function recommendGoals(
  monthlyIncome: number,
  monthlyExpenses: number
): Partial<FinancialGoal>[] {
  const surplus = monthlyIncome - monthlyExpenses;
  const recommendations: Partial<FinancialGoal>[] = [];

  if (surplus > 0) {
    // Emergency fund
    const recommendedEmergency = monthlyExpenses * 3;
    recommendations.push({
      name: 'Emergency Fund',
      description: 'Build an emergency fund to cover 3 months of expenses',
      targetAmount: recommendedEmergency,
      category: 'short-term',
      priority: 'high',
      icon: 'Shield',
      color: 'red',
    });

    // Short-term goals
    if (surplus >= 500) {
      recommendations.push({
        name: 'Travel Fund',
        description: 'Save for a vacation or trip',
        targetAmount: 2000,
        category: 'short-term',
        priority: 'medium',
        icon: 'Plane',
        color: 'blue',
      });
    }

    // Medium-term goals
    if (surplus >= 1000) {
      recommendations.push({
        name: 'Tech Equipment',
        description: 'Save for a laptop or tech upgrade',
        targetAmount: 1500,
        category: 'medium-term',
        priority: 'medium',
        icon: 'Laptop',
        color: 'purple',
      });
    }

    // Long-term goals
    recommendations.push({
      name: 'Student Debt',
      description: 'Pay off student loans early',
      targetAmount: monthlyIncome * 36, // 3 years
      category: 'long-term',
      priority: 'high',
      icon: 'Target',
      color: 'green',
    });
  }

  return recommendations;
}

/**
 * Calculate days until goal deadline
 */
export function daysUntilDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if goal is overdue
 */
export function isGoalOverdue(goal: FinancialGoal): boolean {
  return daysUntilDeadline(goal.deadline) < 0 && goal.status !== 'completed';
}

/**
 * Calculate goal completion percentage
 */
export function getGoalCompletionPercentage(goal: FinancialGoal): number {
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}
