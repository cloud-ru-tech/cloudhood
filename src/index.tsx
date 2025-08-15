import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { getStyleNonce } from './shared/utils/csp';
import { enableExtensionReload } from './utils/extension-reload';

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

// Включаем автоперезагрузку в dev режиме
if (process.env.NODE_ENV === 'development') {
  enableExtensionReload();
  // eslint-disable-next-line no-console
  console.log('🔄 Extension auto-reload initialized for popup - TEST VERSION');
}

const root = createRoot(window.document.getElementById('app-container') as HTMLElement);

root.render(
  <StrictMode>
    <CacheProvider value={emotionCache}>
      <App />
    </CacheProvider>
  </StrictMode>,
);
