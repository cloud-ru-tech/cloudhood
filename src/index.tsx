import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { getStyleNonce } from './shared/utils/csp';

const nonce = getStyleNonce();

const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

const emotionCache = createCache({
  key: 'cloudhood-css',
  nonce,
  prepend: true,
  container: document.head,
  speedy: !isFirefox,
  ...(isFirefox && {
    insertionPoint: document.head.firstChild as HTMLElement,
  }),
});

const root = createRoot(window.document.getElementById('app-container') as HTMLElement);

root.render(
  <StrictMode>
    <CacheProvider value={emotionCache}>
      <App />
    </CacheProvider>
  </StrictMode>,
);
