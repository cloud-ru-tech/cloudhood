import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import './styles.css';

import BrandClassnames from '@snack-uikit/figma-tokens/build/css/brand.module.css';
import { Sprite, SpriteSVG } from '@snack-uikit/icons';
import React, { useEffect } from 'react';

import { MainPage } from '#pages/main';
import { initApp } from '#shared/model';

export function App() {
  useEffect(() => {
    initApp();
  }, []);

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

  return (
    <>
      <Sprite content={SpriteSVG} />
      <MainPage />
    </>
  );
}
