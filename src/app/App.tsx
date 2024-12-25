import './styles.css';

import { useEffect } from 'react';

import { Sprite, SpriteSVG } from '@snack-uikit/icons';

import { MainPage } from '#pages/main';
import { initApp } from '#shared/model';

export function App() {
  useEffect(() => {
    initApp();
  }, []);

  return (
    <>
      <Sprite content={SpriteSVG} />
      <MainPage />
    </>
  );
}
