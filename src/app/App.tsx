import './styles.css';

import { useEffect } from 'react';

import { MainPage } from '#pages/main';
import { SpriteLoader } from '#shared/components/SpriteLoader';
import { initApp } from '#shared/model';

export function App() {
  useEffect(() => {
    initApp();
  }, []);

  return (
    <>
      <SpriteLoader />
      <MainPage />
    </>
  );
}
