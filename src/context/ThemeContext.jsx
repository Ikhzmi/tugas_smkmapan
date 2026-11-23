/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ThemeContext = createContext(undefined);

const STORAGE_KEY = 'smk-mapan-theme-preference';
const LEGACY_STORAGE_KEY = 'smk-mapan-theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

function readStoredTheme() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light';
}

function getInitialTheme() {
  return readStoredTheme() ?? getSystemTheme();
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousThemeRef = useRef(theme);
  const themePreferenceRef = useRef(readStoredTheme());
  const systemThemeRef = useRef(getSystemTheme());

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;

    // Catat preferensi hanya jika memang eksplisit dipilih pengguna.
    // Tema otomatis mengikuti sistem dan tidak menjadi override permanen.
    try {
      if (themePreferenceRef.current) {
        window.localStorage.setItem(STORAGE_KEY, themePreferenceRef.current);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      // Versi lama menulis tema otomatis ke key ini; abaikan agar tidak
      // mengubah preferensi sistem menjadi pilihan permanen saat upgrade.
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Tema tetap berfungsi untuk sesi ini jika storage browser diblokir.
    }

    // Jangan animasikan tema awal (termasuk setup ulang React StrictMode).
    if (previousThemeRef.current === theme) return;
    previousThemeRef.current = theme;

    root.classList.add('theme-transitioning');
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const handleChange = (event) => {
      systemThemeRef.current = event.matches ? 'dark' : 'light';
      if (!themePreferenceRef.current) {
        setThemeState(systemThemeRef.current);
      }
    };

    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      themePreferenceRef.current = newTheme;
      setThemeState(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((previous) => {
      const nextTheme = previous === 'dark' ? 'light' : 'dark';
      themePreferenceRef.current = nextTheme;
      return nextTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
