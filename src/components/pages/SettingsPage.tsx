import { useState, useRef } from 'react';
import { Settings, User, Download, Upload, Trash2, Shield, Info, Moon, Sun, Key, FileText, Database, DollarSign, Volume2, Globe, Bell, Eye, Lock } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { storage, CURRENCIES } from '../../lib/storage';
import { Button } from '../common/Button';
import { Input, Select } from '../common/Input';
import { Card } from '../common/Card';
import { Modal, ConfirmDialog } from '../common/Modal';

export function SettingsPage() {
  const { user, updatePin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const stored = localStorage.getItem('selectedCurrency');
    return stored || 'SLE';
  });
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings toggles
  const [settings, setSettings] = useState({
    notifications: JSON.parse(localStorage.getItem('settings_notifications') || 'true'),
    soundEnabled: JSON.parse(localStorage.getItem('settings_sound') || 'true'),
    autoBackup: JSON.parse(localStorage.getItem('settings_autoBackup') || 'true'),
    dataEncryption: JSON.parse(localStorage.getItem('settings_encryption') || 'false'),
  });

  const handleToggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem(`settings_${key}`, JSON.stringify(!settings[key]));
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess(false);

    if (pinForm.newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PINs do not match');
      return;
    }

    const success = await updatePin(pinForm.oldPin, pinForm.newPin);
    if (success) {
      setPinSuccess(true);
      setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
      setTimeout(() => {
        setIsPinModalOpen(false);
        setPinSuccess(false);
      }, 1500);
    } else {
      setPinError('Current PIN is incorrect');
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    localStorage.setItem('selectedCurrency', currencyCode);
    setIsCurrencyModalOpen(false);
  };

  const handleExport = async () => {
    try {
      const data = await storage.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportCSV = async (type: 'income' | 'expenses') => {
    try {
      const data = type === 'income' ? await storage.getAllIncome() : await storage.getAllExpenses();
      if (data.length === 0) {
        alert(`No ${type} data to export`);
        return;
      }

      const headers = ['Date', 'Amount', 'Category', 'Description'];
      const rows = data.map((item) => [
        item.date,
        item.amount.toString(),
        item.category,
        item.description || '',
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeflow-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await storage.importAllData(data);
      alert('Data imported successfully! The page will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await storage.clearAllData();
      logout();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getCurrentCurrency = () => {
    return CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Student Account</p>
            </div>
          </div>
          <Button
            variant="secondary"
            icon={<User className="w-4 h-4" />}
            onClick={() => setIsProfileModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Currency Selection */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Currency</h2>
        </div>
        <button
          onClick={() => setIsCurrencyModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{getCurrentCurrency().symbol}</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">{getCurrentCurrency().name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Code: {getCurrentCurrency().code}</p>
            </div>
          </div>
          <div className="text-gray-400">&gt;</div>
        </button>
      </Card>

      {/* Appearance Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-gray-400" />}
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Currently using {theme === 'dark' ? 'dark' : 'light'} mode
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <span
              className={`px-2 py-1 rounded text-sm ${
                theme === 'light' ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Light
            </span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                theme === 'dark' ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Dark
            </span>
          </div>
        </button>
      </Card>

      {/* Preferences Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Preferences</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get alerts for budget warnings</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={() => handleToggleSetting('notifications')}
              className="w-5 h-5 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Sound Effects</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable notification sounds</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={() => handleToggleSetting('soundEnabled')}
              className="w-5 h-5 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Auto-Backup</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Weekly backup of your data</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={() => handleToggleSetting('autoBackup')}
              className="w-5 h-5 rounded"
            />
          </label>
        </div>
      </Card>

      {/* Security Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Security</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Change PIN</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your login PIN</p>
              </div>
            </div>
            <div className="text-gray-400">&gt;</div>
          </button>

          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Encryption</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">End-to-end encryption (Beta)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.dataEncryption}
              onChange={() => handleToggleSetting('dataEncryption')}
              className="w-5 h-5 rounded"
              disabled
            />
          </label>
        </div>
      </Card>

      {/* Data Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Data Management</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Export Full Backup</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download all data as JSON</p>
              </div>
            </div>
            <div className="text-gray-400">&gt;</div>
          </button>

          <button
            onClick={() => handleExportCSV('income')}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Export Income CSV</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download income data as spreadsheet</p>
              </div>
            </div>
            <div className="text-gray-400">&gt;</div>
          </button>

          <button
            onClick={() => handleExportCSV('expenses')}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Export Expenses CSV</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download expense data as spreadsheet</p>
              </div>
            </div>
            <div className="text-gray-400">&gt;</div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Import Data</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Restore from a backup file</p>
              </div>
            </div>
            <div className="text-gray-400">&gt;</div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="font-medium text-red-600 dark:text-red-400">Delete All Data</p>
                <p className="text-sm text-red-500 dark:text-red-300">Permanently delete all your data</p>
              </div>
            </div>
            <div className="text-red-400">&gt;</div>
          </button>
        </div>
      </Card>

      {/* App Info */}
      <Card className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">FinanceFlow</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Student Finance Manager</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Version 2.0.0</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">All data stored locally on your device</p>
      </Card>

      {/* Change PIN Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinError('');
          setPinSuccess(false);
          setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
        }}
        title="Change PIN"
        size="sm"
      >
        <form onSubmit={handleChangePin} className="space-y-4">
          <Input
            label="Current PIN"
            type="password"
            value={pinForm.oldPin}
            onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value })}
            required
          />
          <Input
            label="New PIN"
            type="password"
            value={pinForm.newPin}
            onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
            required
          />
          <Input
            label="Confirm New PIN"
            type="password"
            value={pinForm.confirmPin}
            onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
            error={pinError}
            required
          />
          {pinSuccess && (
            <p className="text-green-600 dark:text-green-400 text-sm">PIN updated successfully!</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsPinModalOpen(false);
                setPinError('');
                setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Update PIN
            </Button>
          </div>
        </form>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        title="Select Currency"
        size="md"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                selectedCurrency === currency.code
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <p className="font-bold text-lg">{currency.symbol}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{currency.code}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{currency.name}</p>
              {currency.default && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Default</p>}
            </button>
          ))}
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Edit Profile"
        size="sm"
      >
        <form className="space-y-4">
          <Input
            label="Name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setIsProfileModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={() => setIsProfileModalOpen(false)}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete All Data"
        message="Are you sure you want to delete all your data? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteAllData}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
}
