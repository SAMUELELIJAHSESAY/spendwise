// Data export and import functionality for backup and recovery

export interface ExportData {
  version: string;
  exportDate: string;
  data: {
    users: any[];
    expenses: any[];
    income: any[];
    budgets: any[];
    savings: any[];
    debts: any[];
    bills: any[];
    financialGoals: any[];
    budgetAlerts: any[];
  };
}

/**
 * Export all application data as JSON
 */
export async function exportAllData(db: any): Promise<ExportData> {
  try {
    const tx = db.transaction([
      'users',
      'expenses',
      'income',
      'budgets',
      'savings',
      'debts',
      'bills',
      'financialGoals',
      'budgetAlerts',
    ], 'readonly');

    const data = {
      users: await tx.objectStore('users').getAll().catch(() => []),
      expenses: await tx.objectStore('expenses').getAll().catch(() => []),
      income: await tx.objectStore('income').getAll().catch(() => []),
      budgets: await tx.objectStore('budgets').getAll().catch(() => []),
      savings: await tx.objectStore('savings').getAll().catch(() => []),
      debts: await tx.objectStore('debts').getAll().catch(() => []),
      bills: await tx.objectStore('bills').getAll().catch(() => []),
      financialGoals: await tx.objectStore('financialGoals').getAll().catch(() => []),
      budgetAlerts: await tx.objectStore('budgetAlerts').getAll().catch(() => []),
    };

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data,
    };
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Import data from JSON export
 */
export async function importData(db: any, exportData: ExportData): Promise<void> {
  try {
    // Validate version
    if (exportData.version !== '1.0') {
      throw new Error('Incompatible export version');
    }

    const tx = db.transaction([
      'users',
      'expenses',
      'income',
      'budgets',
      'savings',
      'debts',
      'bills',
      'financialGoals',
      'budgetAlerts',
    ], 'readwrite');

    // Clear existing data
    for (const storeName of tx.store.names) {
      await tx.objectStore(storeName as string).clear();
    }

    // Import data
    for (const [key, items] of Object.entries(exportData.data)) {
      if (items && items.length > 0) {
        const store = tx.objectStore(key);
        for (const item of items) {
          await store.put(item);
        }
      }
    }

    await tx.done;
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('Failed to import data');
  }
}

/**
 * Export specific category data as CSV
 */
export function exportAsCSV(
  data: any[],
  filename: string,
  columns: string[]
): void {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = columns.join(',');
  const rows = data
    .map(item =>
      columns
        .map(col => {
          const value = item[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',')
    )
    .join('\n');

  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download JSON backup
 */
export function downloadJSONBackup(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse JSON file from upload
 */
export function parseJSONFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Generate financial report as PDF-ready HTML
 */
export function generateFinancialReport(
  period: string,
  totalIncome: number,
  totalExpenses: number,
  savings: number,
  budgetStatus: any[],
  topCategories: any[]
): string {
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : '0';
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 20px; }
          h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
          h2 { color: #059669; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background-color: #f0fdf4; color: #059669; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
          .summary { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
          .summary-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #059669; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; color: #059669; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Financial Report - ${period}</h1>
        <p>Generated on ${date}</p>
        
        <div class="summary">
          <div class="summary-box">
            <div class="summary-label">Total Income</div>
            <div class="summary-value">$${totalIncome.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Total Expenses</div>
            <div class="summary-value">$${totalExpenses.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Net Savings</div>
            <div class="summary-value">$${savings.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Savings Rate</div>
            <div class="summary-value">${savingsRate}%</div>
          </div>
        </div>

        <h2>Budget Status</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Budget</th>
              <th>Spent</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${budgetStatus
              .map(
                b => `
              <tr>
                <td>${b.category}</td>
                <td>$${b.limit?.toFixed(2) || 'N/A'}</td>
                <td>$${b.spent?.toFixed(2) || '0'}</td>
                <td>${b.status || 'N/A'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <h2>Top Expense Categories</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${topCategories
              .map(
                c => `
              <tr>
                <td>${c.category}</td>
                <td>$${c.amount.toFixed(2)}</td>
                <td>${c.percentage}%</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report is automatically generated by FinanceFlow Student Finance Tracker</p>
        </div>
      </body>
    </html>
  `;
}
