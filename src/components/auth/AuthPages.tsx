import { useState, useEffect } from 'react';
import { Lock, PiggyBank, User } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';

export function AuthScreen() {
  const { login, register, checkPinExists, isLoading, error: authError } = useAuth();
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const checkExistence = async () => {
      const exists = await checkPinExists();
      setIsSetup(!exists);
    };
    checkExistence();
  }, [checkPinExists]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(pin);
    if (!success) {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    const success = await register(name.trim(), pin);
    if (!success) {
      setError('Failed to create account');
    }
  };

  if (isLoading || isSetup === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        {authError && (
          <p className="mt-4 text-red-500 text-sm">{authError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <PiggyBank className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FinanceFlow</h1>
          <p className="text-gray-500 dark:text-gray-400">Student Finance Manager</p>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-xl">
          {isSetup ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Your Account
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set up your secure PIN to get started
                </p>
              </div>

              <div>
                <Input
                  label="Your Name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <Input
                  label="Create PIN"
                  type={showPin ? 'text' : 'password'}
                  placeholder="Enter a 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <Input
                  label="Confirm PIN"
                  type={showPin ? 'text' : 'password'}
                  placeholder="Confirm your PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  icon={<Lock className="w-4 h-4" />}
                  error={error}
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={showPin}
                  onChange={(e) => setShowPin(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show PIN
              </label>

              <Button type="submit" variant="primary" fullWidth>
                Create Account
              </Button>

              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                Your data is stored locally on this device
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome Back</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enter your PIN to continue</p>
              </div>

              <div>
                <Input
                  label="PIN"
                  type={showPin ? 'text' : 'password'}
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  icon={<Lock className="w-4 h-4" />}
                  error={error}
                  autoFocus
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={showPin}
                  onChange={(e) => setShowPin(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show PIN
              </label>

              <Button type="submit" variant="primary" fullWidth>
                Unlock
              </Button>
            </form>
          )}
        </Card>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6">
          All your data stays on this device. No cloud sync.
        </p>
      </div>
    </div>
  );
}
