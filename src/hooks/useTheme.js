import { useEffect } from 'react';

const ACCENT_VARS = {
  purple: {
    '--primary': '262 80% 58%',
    '--accent': '290 70% 60%',
    '--ring': '262 80% 58%',
    '--sidebar-primary': '262 80% 58%',
    '--sidebar-ring': '262 80% 58%',
    '--chart-1': '262 80% 58%',
  },
  blue: {
    '--primary': '221 85% 58%',
    '--accent': '199 85% 55%',
    '--ring': '221 85% 58%',
    '--sidebar-primary': '221 85% 58%',
    '--sidebar-ring': '221 85% 58%',
    '--chart-1': '221 85% 58%',
  },
  orange: {
    '--primary': '22 90% 52%',
    '--accent': '45 95% 55%',
    '--ring': '22 90% 52%',
    '--sidebar-primary': '22 90% 52%',
    '--sidebar-ring': '22 90% 52%',
    '--chart-1': '22 90% 52%',
  },
  teal: {
    '--primary': '175 75% 42%',
    '--accent': '195 80% 50%',
    '--ring': '175 75% 42%',
    '--sidebar-primary': '175 75% 42%',
    '--sidebar-ring': '175 75% 42%',
    '--chart-1': '175 75% 42%',
  },
  rose: {
    '--primary': '340 80% 55%',
    '--accent': '15 90% 58%',
    '--ring': '340 80% 55%',
    '--sidebar-primary': '340 80% 55%',
    '--sidebar-ring': '340 80% 55%',
    '--chart-1': '340 80% 55%',
  },
  lime: {
    '--primary': '84 80% 45%',
    '--accent': '60 85% 50%',
    '--ring': '84 80% 45%',
    '--sidebar-primary': '84 80% 45%',
    '--sidebar-ring': '84 80% 45%',
    '--chart-1': '84 80% 45%',
  },
};

const DARK_VARS = {
  '--background': '224 25% 6%',
  '--foreground': '220 15% 92%',
  '--card': '224 22% 10%',
  '--card-foreground': '220 15% 92%',
  '--popover': '224 22% 10%',
  '--popover-foreground': '220 15% 92%',
  '--secondary': '224 20% 14%',
  '--secondary-foreground': '220 15% 85%',
  '--muted': '224 18% 14%',
  '--muted-foreground': '220 10% 52%',
  '--border': '224 18% 16%',
  '--input': '224 18% 16%',
  '--sidebar-background': '224 25% 6%',
  '--sidebar-foreground': '220 15% 92%',
  '--sidebar-accent': '224 20% 14%',
  '--sidebar-accent-foreground': '220 15% 85%',
  '--sidebar-border': '224 18% 16%',
};

const LIGHT_VARS = {
  '--background': '220 20% 97%',
  '--foreground': '220 25% 8%',
  '--card': '0 0% 100%',
  '--card-foreground': '220 25% 8%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '220 25% 8%',
  '--secondary': '220 15% 94%',
  '--secondary-foreground': '220 20% 15%',
  '--muted': '220 12% 92%',
  '--muted-foreground': '220 10% 50%',
  '--border': '220 15% 88%',
  '--input': '220 15% 88%',
  '--sidebar-background': '0 0% 98%',
  '--sidebar-foreground': '240 5.3% 26.1%',
  '--sidebar-accent': '220 15% 94%',
  '--sidebar-accent-foreground': '220 20% 15%',
  '--sidebar-border': '220 15% 88%',
};

export function useTheme(accent = 'purple', darkMode = false) {
  useEffect(() => {
    const root = document.documentElement;
    const accentVars = ACCENT_VARS[accent] || ACCENT_VARS.purple;
    const modeVars = darkMode ? DARK_VARS : LIGHT_VARS;

    // Apply mode vars
    Object.entries(modeVars).forEach(([key, value]) => root.style.setProperty(key, value));
    // Apply accent vars
    Object.entries(accentVars).forEach(([key, value]) => root.style.setProperty(key, value));

    // Toggle dark class for CSS layer
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return () => {
      [...Object.keys(modeVars), ...Object.keys(accentVars)].forEach(k => root.style.removeProperty(k));
      root.classList.remove('dark');
    };
  }, [accent, darkMode]);
}

export const ACCENT_OPTIONS = [
  { id: 'purple', label: 'Purple', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-600' },
  { id: 'blue', label: 'Blue', color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'teal', label: 'Teal', color: '#14b8a6', gradient: 'from-teal-500 to-cyan-600' },
  { id: 'orange', label: 'Orange', color: '#f97316', gradient: 'from-orange-500 to-red-500' },
  { id: 'rose', label: 'Rose', color: '#f43f5e', gradient: 'from-rose-500 to-pink-600' },
  { id: 'lime', label: 'Lime', color: '#84cc16', gradient: 'from-lime-500 to-green-500' },
];

// Keep THEMES export for any legacy usage
export const THEMES = ACCENT_OPTIONS.map(a => ({ id: a.id, label: a.label, color: a.color }));