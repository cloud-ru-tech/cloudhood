import { useUnit } from 'effector-react';
import { useEffect } from 'react';

import BrandClassnames from '@snack-uikit/figma-tokens/build/css/brand.module.css';

import { $selectedThemeMode, initThemeMode } from '#entities/themeMode/model';
import { ThemeMode } from '#shared/constants';

export function useSetTheme() {
  const [themeMode] = useUnit([$selectedThemeMode]);

  useEffect(() => {
    initThemeMode();
  }, []);

  useEffect(() => {
    const setTheme = (mode: 'dark' | 'light') => {
      if (mode === 'dark') {
        document.body.classList.remove(BrandClassnames.light);
        document.body.classList.add(BrandClassnames.dark);
      } else {
        document.body.classList.remove(BrandClassnames.dark);
        document.body.classList.add(BrandClassnames.light);
      }
    };

    switch (themeMode) {
      case ThemeMode.Light:
        setTheme('light');
        break;
      case ThemeMode.Dark:
        setTheme('dark');
        break;
      case ThemeMode.System:
      default:
        const toggleThemeMode = (colorSchemeEvent: MediaQueryList | MediaQueryListEvent) => {
          setTheme(colorSchemeEvent.matches ? 'dark' : 'light');
        };

        const matchMedia = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

        toggleThemeMode(matchMedia);

        matchMedia.addEventListener('change', toggleThemeMode);

        return () => matchMedia.removeEventListener('change', toggleThemeMode);
    }
  }, [themeMode]);
}
