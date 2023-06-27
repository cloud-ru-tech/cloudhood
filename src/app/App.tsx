import React, { useEffect } from 'react';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { MainPage } from '../pages/main/Main';
import { initApp } from '../shared/model';

export function App() {
  useEffect(() => {
    initApp()
  }, [])

  return <MainPage />;
}
