import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { Navigation } from './components/common/Navigation';
import type { Page } from './components/common/Navigation';
import { Dashboard } from './components/pages/Dashboard';
import { IncomePage } from './components/pages/IncomePage';
import { ExpensesPage } from './components/pages/ExpensesPage';
import { BudgetsPage } from './components/pages/BudgetsPage';
import { SavingsPage } from './components/pages/SavingsPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { BillsPage } from './components/pages/BillsPage';
import { DebtsPage } from './components/pages/DebtsPage';
import { TemplatesPage } from './components/pages/TemplatesPage';
import { CalendarPage } from './components/pages/CalendarPage';
import { AchievementsPage } from './components/pages/AchievementsPage';
import { SubscriptionsPage } from './components/pages/SubscriptionsPage';
import { LibraryPage } from './components/pages/LibraryPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { InsightsPage } from './components/pages/InsightsPage';
import { FinancialGoalsPage } from './components/pages/GoalsPage';
import { CalculatorsPage } from './components/pages/CalculatorsPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { AuthScreen } from './components/auth/AuthPages';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setCurrentPage(page as Page)} />;
      case 'income':
        return <IncomePage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'savings':
        return <SavingsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'insights':
        return <InsightsPage />;
      case 'goals':
        return <FinancialGoalsPage />;
      case 'calculators':
        return <CalculatorsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'bills':
        return <BillsPage />;
      case 'debts':
        return <DebtsPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'subscriptions':
        return <SubscriptionsPage />;
      case 'library':
        return <LibraryPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard onNavigate={(page) => setCurrentPage(page as Page)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={setSidebarOpen}
      />

      <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">
        <div className="pt-16 lg:pt-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">{renderPage()}</div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
