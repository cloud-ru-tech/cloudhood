import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';

const root = createRoot(window.document.getElementById('app-container') as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
