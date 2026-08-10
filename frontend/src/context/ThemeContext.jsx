import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  effectiveTheme: 'dark',
  setTheme: () => {},
});

const STORAGE_KEY = 'doseTrackerTheme';

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      /* ignore */
    }
    return 'system';
  });

  const getEffectiveTheme = (currentTheme) => {
    if (currentTheme === 'light') return 'light';
    if (currentTheme === 'dark') return 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  const [effectiveTheme, setEffectiveTheme] = useState(() => getEffectiveTheme(theme));

  const applyThemeToDOM = (effTheme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', effTheme);
    if (effTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const eff = getEffectiveTheme(theme);
    setEffectiveTheme(eff);
    applyThemeToDOM(eff);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const newEff = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newEff);
        applyThemeToDOM(newEff);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
