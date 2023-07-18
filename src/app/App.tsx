import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { GlobalStyles } from '@mui/material';
import React, { useEffect } from 'react';

import { MainPage } from '#pages/main';
import { initApp } from '#shared/model';

import * as S from './styled';

export function App() {
  useEffect(() => {
    initApp();
  }, []);

  return (
    <>
      <GlobalStyles styles={S.baseStyles} />
      <MainPage />
    </>
  );
}
