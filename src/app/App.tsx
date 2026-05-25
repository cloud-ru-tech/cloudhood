import './styles.css';

import { useUnit } from 'effector-react';
import { useEffect } from 'react';

import { MainPage } from '#pages/main';
import { SpriteLoader } from '#shared/components/SpriteLoader';
import { initApp } from '#shared/model';

export function App() {
  const handleInitApp = useUnit(initApp);

  useEffect(() => {
    handleInitApp();
  }, [handleInitApp]);

  return (
    <>
      <SpriteLoader />
      <MainPage />
    </>
  );
}
