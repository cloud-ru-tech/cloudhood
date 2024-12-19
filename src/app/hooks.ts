import { useEffect } from 'react';

import BrandClassnames from '@snack-uikit/figma-tokens/build/css/brand.module.css';

export function useSetTheme() {
  useEffect(() => {
    const setTheme = (colorSchemeEvent: MediaQueryList | MediaQueryListEvent) => {
      const { classList } = document.body;

      if (colorSchemeEvent.matches) {
        classList.remove(BrandClassnames.light);
        classList.add(BrandClassnames.dark);
      } else {
        classList.remove(BrandClassnames.dark);
        classList.add(BrandClassnames.light);
      }
    };

    const matchMedia = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

    setTheme(matchMedia);

    matchMedia.addEventListener('change', setTheme);

    return () => matchMedia.removeEventListener('change', setTheme);
  }, []);
}
