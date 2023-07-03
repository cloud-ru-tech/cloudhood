import React, { StrictMode } from 'react';
import { render } from 'react-dom';

import { App } from './app/App';

render(
  <StrictMode>
    <App />
  </StrictMode>,
  window.document.getElementById('app-container'),
);

// TODO: add typings
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (module.hot) module.hot.accept();
