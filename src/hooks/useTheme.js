import { useEffect } from 'react';

const themes = {
  default: {
    '--primary': '168 70% 38%',
    '--accent': '35 92% 60%',
    '--background': '210 20% 98%',
  },
  ocean: {
    '--primary': '210 80% 45%',
    '--accent': '185 75% 45%',
    '--background': '210 30% 98%',
  },
  sunset: {
    '--primary': '20 85% 50%',
    '--accent': '45 95% 55%',
    '--background': '30 25% 98%',
  },
  forest: {
    '--primary': '140 60% 32%',
    '--accent': '80 65% 42%',
    '--background': '130 15% 97%',
  },
  midnight: {
    '--primary': '260 70% 60%',
    '--accent': '300 60% 55%',
    '--background': '240 20% 10%',
    '--foreground': '240 10% 95%',
    '--card': '240 18% 13%',
    '--border': '240 15% 20%',
    '--muted': '240 15% 18%',
    '--muted-foreground': '240 10% 60%',
  },
  rose: {
    '--primary': '340 75% 50%',
    '--accent': '15 90% 58%',
    '--background': '340 20% 98%',
  },
};

export function useTheme(theme = 'default') {
  useEffect(() => {
    const root = document.documentElement;
    const vars = themes[theme] || themes.default;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Reset non-theme variables to default if switching away from midnight
    if (theme !== 'midnight') {
      const midnightOnly = ['--foreground', '--card', '--border', '--muted', '--muted-foreground'];
      midnightOnly.forEach(key => root.style.removeProperty(key));
    }

    return () => {
      Object.keys(vars).forEach(key => root.style.removeProperty(key));
    };
  }, [theme]);
}

export const THEMES = [
  { id: 'default', label: 'Emerald', color: '#2d9b6f' },
  { id: 'ocean', label: 'Ocean', color: '#2e86c1' },
  { id: 'sunset', label: 'Sunset', color: '#e67e22' },
  { id: 'forest', label: 'Forest', color: '#27ae60' },
  { id: 'midnight', label: 'Midnight', color: '#8e44ad' },
  { id: 'rose', label: 'Rose', color: '#c0392b' },
];