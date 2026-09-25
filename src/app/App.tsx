import '@cloud-ru/ds-figma-variables/build/css/tokens.css';

import './styles.css';

import { useUnit } from 'effector-react';
import { useEffect, useRef } from 'react';

import { BRAND, BRAND_ROLE, DENSITY, RootThemeProvider } from '@cloud-ru/ds-theme';

import { $colorScheme } from '#entities/themeMode/model';
import { MainPage } from '#pages/main';
import { initApp } from '#shared/model';

export function App() {
  const [handleInitApp, colorScheme] = useUnit([initApp, $colorScheme]);
  const bodyRef = useRef<HTMLElement>(document.body);

  useEffect(() => {
    handleInitApp();
  }, [handleInitApp]);

  return (
    <RootThemeProvider
      rootRef={bodyRef}
      value={{ colorScheme, brand: BRAND.B, brandRole: BRAND_ROLE.Main, density: DENSITY.Compact }}
    >
      <MainPage />
    </RootThemeProvider>
  );
}
