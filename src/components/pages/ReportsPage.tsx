import { Download, Upload, FileJson, FileText, BarChart3, Share2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useAuth } from '../../lib/auth';
import { storage } from '../../lib/storage';
import { exportAllData, downloadJSONBackup, importData, exportAsCSV, generateFinancialReport } from '../../lib/export-import';

export function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportPeriod, setReportPeriod] = useState('current-month');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportJSON = async () => {
    try {
      setLoading(true);
      const data = await exportAllData(storage);
      downloadJSONBackup(data);
      showSuccess('Data exported successfully!');
    } catch (error) {
      alert('Failed to export data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExpenses = async () => {
    try {
      setLoading(true);
      const expenses = (await storage.getAll('expenses')) || [];
      
      if (expenses.length === 0) {
        alert('No expenses to export');
        return;
      }

      exportAsCSV(
        expenses.map((e: any) => ({
          Date: e.date,
          Category: e.category,
          Amount: e.amount,
          Description: e.description,
          Notes: e.notes || '',
          Recurring: e.recurring ? 'Yes' : 'No',
        })),
        'expenses',
        ['Date', 'Category', 'Amount', 'Description', 'Notes', 'Recurring']
      );
      showSuccess('Expenses exported as CSV!');
    } catch (error) {
      alert('Failed to export expenses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportIncome = async () => {
    try {
      setLoading(true);
      const income = (await storage.getAll('income')) || [];
      
      if (income.length === 0) {
        alert('No income records to export');
        return;
      }

      exportAsCSV(
        income.map((i: any) => ({
          Date: i.date,
          Category: i.category,
          Amount: i.amount,
          Description: i.description,
          Notes: i.notes || '',
          Recurring: i.recurring ? 'Yes' : 'No',
        })),
        'income',
        ['Date', 'Category', 'Amount', 'Description', 'Notes', 'Recurring']
      );
      showSuccess('Income exported as CSV!');
    } catch (error) {
      alert('Failed to export income');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const expenses = (await storage.getAll('expenses')) || [];
      const income = (await storage.getAll('income')) || [];
      const budgets = (await storage.getAll('budgets')) || [];

      const now = new Date();
      let startDate: Date;
      let periodLabel = '';

      if (reportPeriod === 'current-month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
      } else if (reportPeriod === 'last-quarter') {
        startDate = new Date(now.getFullYear(), Math.max(0, now.getMonth() - 3), 1);
        periodLabel = `Last 3 Months`;
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        periodLabel = `${now.getFullYear()}`;
      }

      const periodExpenses = expenses.filter(
        (e: any) => new Date(e.date) >= startDate
      );
      const periodIncome = income.filter((i: any) => new Date(i.date) >= startDate);

      const totalExpenses = periodExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalIncome = periodIncome.reduce((sum: number, i: any) => sum + i.amount, 0);
      const savings = totalIncome - totalExpenses;

      const budgetStatus = budgets.map((b: any) => {
        const spent = periodExpenses
          .filter((e: any) => e.category === b.category)
          .reduce((sum: number, e: any) => sum + e.amount, 0);
        return {
          category: b.category,
          limit: b.limit,
          spent,
          status: spent > b.limit ? 'Over Budget' : spent > b.limit * 0.8 ? 'Near Limit' : 'On Track',
        };
      });

      const topCategories = periodExpenses
        .reduce((acc: Record<string, number>, e: any) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {})
        .sort((a, b) => b - a)
        .slice(0, 5)
        .map(([cat, amt], idx) => {
          const percentage = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
          return { category: cat, amount: amt, percentage };
        });

      const html = generateFinancialReport(periodLabel, totalIncome, totalExpenses, savings, budgetStatus, topCategories);

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Report generated successfully!');
    } catch (error) {
      alert('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importedData = JSON.parse(content);

          if (!importedData.version || !importedData.data) {
            alert('Invalid backup file format');
            return;
          }

          await importData(storage, importedData);
          showSuccess('Data imported successfully! Please refresh the page.');
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          alert('Failed to parse backup file');
          console.error(error);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      alert('Failed to import data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Data</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Export data, generate reports, and manage backups</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-emerald-800 dark:text-emerald-200">
          ✓ {successMessage}
        </div>
      )}

      {/* Export Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Export Data</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FileJson className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Full Backup (JSON)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Export all your data as a JSON file. Perfect for backup and transfer.
                </p>
                <Button
                  onClick={handleExportJSON}
                  disabled={loading}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Expenses (CSV)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Export all expenses in CSV format for analysis in spreadsheets.
                </p>
                <Button
                  onClick={handleExportExpenses}
                  disabled={loading}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Income (CSV)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Export all income records in CSV format.
                </p>
                <Button
                  onClick={handleExportIncome}
                  disabled={loading}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Generate Report</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Create a comprehensive HTML financial report.
                </p>
                <div className="mt-3">
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded mb-2 dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="current-month">Current Month</option>
                    <option value="last-quarter">Last 3 Months</option>
                    <option value="year">This Year</option>
                  </select>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Import Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Import Data</h2>
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
          <div className="text-center py-8">
            <Upload className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Restore from Backup</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a previously exported JSON backup file to restore your data
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={loading}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-4">
          <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Data Privacy & Security</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              All your financial data is stored locally on your device. Exports and backups are saved to your downloads folder and are never shared with external servers. You have complete control over your data.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
