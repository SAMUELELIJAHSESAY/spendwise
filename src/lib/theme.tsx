import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from './storage';

type Theme = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  accent: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setColors: (colors: ThemeColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const DEFAULT_COLORS: ThemeColors = { primary: '#10B981', accent: '#059669' };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [colors, setColorsState] = useState<ThemeColors>(DEFAULT_COLORS);

  // Load custom colors from profile on mount
  useEffect(() => {
    const loadColors = async () => {
      try {
        const profile = await storage.getUserProfile();
        if (profile?.theme) {
          setColorsState({
            primary: profile.theme.primaryColor,
            accent: profile.theme.accentColor,
          });
        }
      } catch (error) {
        console.error('Failed to load theme colors:', error);
      }
    };
    loadColors();
  }, []);

  // Apply theme and colors to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Apply custom colors as CSS variables
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-accent', colors.accent);
  }, [theme, colors]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColors = (newColors: ThemeColors) => {
    setColorsState(newColors);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme, setColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
