import React, { StrictMode } from 'react';
import { render } from 'react-dom';

import { App } from './app/App';

render(
  <StrictMode>
    <App />
  </StrictMode>,
  window.document.getElementById('app-container'),
);
