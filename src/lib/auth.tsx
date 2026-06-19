import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage, User } from './storage';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, pin: string) => Promise<boolean>;
  updatePin: (oldPin: string, newPin: string) => Promise<boolean>;
  checkPinExists: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Initialize storage first
        await storage.init();
        const session = await storage.getSession();
        if (session && session.userId) {
          const storedUser = await storage.getUser(session.userId);
          if (storedUser) {
            setUser(storedUser);
          } else {
            await storage.clearSession();
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setError('Failed to initialize. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const checkPinExists = async (): Promise<boolean> => {
    const users = await storage.getAllUsers();
    return users.length > 0;
  };

  const register = async (name: string, pin: string): Promise<boolean> => {
    try {
      const users = await storage.getAllUsers();
      if (users.length > 0) {
        return false;
      }

      const pinHash = await hashPin(pin);
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        pinHash,
        currency: 'SLE',
        notificationsEnabled: true,
        createdAt: new Date(),
      };

      await storage.createUser(newUser);
      await storage.setSession({ userId: newUser.id, lastActive: new Date() });
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const login = async (pin: string): Promise<boolean> => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return false;
      }

      const pinHash = await hashPin(pin);
      const matchedUser = users.find((u) => u.pinHash === pinHash);

      if (matchedUser) {
        await storage.setSession({ userId: matchedUser.id, lastActive: new Date() });
        setUser(matchedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    await storage.clearSession();
    setUser(null);
  };

  const updatePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      if (!user) return false;

      const oldPinHash = await hashPin(oldPin);
      if (user.pinHash !== oldPinHash) {
        return false;
      }

      const newPinHash = await hashPin(newPin);
      const updatedUser: User = {
        ...user,
        pinHash: newPinHash,
      };

      await storage.update('users', updatedUser);
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('PIN update failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        register,
        updatePin,
        checkPinExists,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
