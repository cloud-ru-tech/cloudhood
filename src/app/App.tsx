import './styles.css';

import { useEffect } from 'react';

import { Sprite, SpriteSVG } from '@snack-uikit/icons';

import { MainPage } from '#pages/main';
import { initApp } from '#shared/model';

import { useSetTheme } from './hooks';

export function App() {
  useEffect(() => {
    initApp();
  }, []);

  useSetTheme();

  return (
    <>
      <Sprite content={SpriteSVG} />
      <MainPage />
    </>
  );
}
