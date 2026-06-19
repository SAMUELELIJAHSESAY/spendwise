import { useEffect, useState } from 'react';
import { Trophy, Star, Target, Flame, TrendingUp, PiggyBank, Calendar, DollarSign, Award, Medal, Lock } from 'lucide-react';
import { storage } from '../../lib/storage';
import { formatDate } from '../../lib/types';
import { Card } from '../common/Card';

interface Achievement {
  id: string;
  type: string;
  unlockedAt: Date;
  metadata?: Record<string, unknown>;
}

const ACHIEVEMENT_DETAILS = [
  { id: 'first_transaction', name: 'First Step', description: 'Add your first transaction', icon: Target, points: 10 },
  { id: 'budget_master', name: 'Budget Master', description: 'Stay under budget for 3 months', icon: Medal, points: 50 },
  { id: 'savings_starter', name: 'Savings Starter', description: 'Create your first savings goal', icon: PiggyBank, points: 15 },
  { id: 'savings_pro', name: 'Savings Pro', description: 'Complete a savings goal', icon: Trophy, points: 30 },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day login streak', icon: Flame, points: 20 },
  { id: 'streak_30', name: 'Month Master', description: '30 day login streak', icon: Star, points: 50 },
  { id: 'debt_free', name: 'Debt Free', description: 'Pay off all debts', icon: Award, points: 40 },
  { id: 'track_100', name: 'Super Tracker', description: 'Track 100 transactions', icon: Target, points: 30 },
  { id: 'early_bird', name: 'Early Bird', description: 'Add transaction before 7 AM', icon: Calendar, points: 15 },
  { id: 'budget_5_categories', name: 'Category King', description: 'Set budgets for 5 categories', icon: Medal, points: 25 },
  { id: 'savings_1000', name: 'Thousandaire', description: 'Save $1,000 total', icon: DollarSign, points: 35 },
  { id: 'negative_balance', name: 'Comeback Kid', description: 'Recover from negative balance', icon: TrendingUp, points: 30 },
];

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000];

export function AchievementsPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await storage.getAllAchievements();
      setUnlockedAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPoints = unlockedAchievements.reduce((sum, a) => {
    const details = ACHIEVEMENT_DETAILS.find((d) => d.id === a.type);
    return sum + (details?.points || 0);
  }, 0);

  const currentLevel = LEVEL_THRESHOLDS.findIndex((_, i) => {
    const nextThreshold = LEVEL_THRESHOLDS[i + 1];
    return nextThreshold === undefined || totalPoints < nextThreshold;
  });

  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel + 1];
  const progressToNext = nextLevelThreshold
    ? ((totalPoints - LEVEL_THRESHOLDS[currentLevel]) / (nextLevelThreshold - LEVEL_THRESHOLDS[currentLevel])) * 100
    : 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your financial milestones</p>
      </div>

      {/* Level Progress */}
      <Card className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-yellow-100 text-sm">Current Level</p>
            <p className="text-4xl font-bold">Level {currentLevel + 1}</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-100 text-sm">Total Points</p>
            <p className="text-3xl font-bold">{totalPoints}</p>
          </div>
        </div>
        {nextLevelThreshold && (
          <>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <p className="text-sm text-yellow-100">
              {totalPoints} / {nextLevelThreshold} points to Level {currentLevel + 2}
            </p>
          </>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{unlockedAchievements.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Unlocked</p>
        </Card>
        <Card className="text-center">
          <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{ACHIEVEMENT_DETAILS.length - unlockedAchievements.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Locked</p>
        </Card>
        <Card className="text-center">
          <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round((unlockedAchievements.length / ACHIEVEMENT_DETAILS.length) * 100)}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Complete</p>
        </Card>
      </div>

      {/* Achievement List */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">All Achievements</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {ACHIEVEMENT_DETAILS.map((achievement) => {
            const unlocked = unlockedAchievements.find((a) => a.type === achievement.id);
            const Icon = achievement.icon || Trophy;
            const isLocked = !unlocked;

            return (
              <div
                key={achievement.id}
                className={`flex items-center gap-4 p-4 ${isLocked ? 'opacity-50' : ''}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isLocked
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      : 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                  }`}
                >
                  {isLocked ? <Lock className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                  {unlocked && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Unlocked {formatDate(unlocked.unlockedAt.toString())}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
                      isLocked
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    {achievement.points}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
