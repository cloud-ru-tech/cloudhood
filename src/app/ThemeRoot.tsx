import { useUnit } from 'effector-react';
import { ReactNode, useEffect, useRef } from 'react';

import { BRAND, DENSITY, PLATFORM, RootThemeProvider } from '@cloud-ru/ds-theme';

import { $colorScheme } from '#entities/themeMode/model';
import { initApp } from '#shared/model';

type ThemeRootProps = {
  children: ReactNode;
};

export function ThemeRoot({ children }: ThemeRootProps) {
  const [handleInitApp, colorScheme] = useUnit([initApp, $colorScheme]);
  const bodyRef = useRef<HTMLElement>(document.body);

  useEffect(() => {
    handleInitApp();
  }, [handleInitApp]);

  return (
    <RootThemeProvider
      rootRef={bodyRef}
      value={{ colorScheme, brand: BRAND.SnackUI, platform: PLATFORM.WebDesktop, density: DENSITY.Compact }}
    >
      {children}
    </RootThemeProvider>
  );
}
